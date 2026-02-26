// server/controllers/analyticsController.js
import { pool } from "../db.js";

/**
 * Executa query com fallback quando tabela/coluna não existe (Postgres):
 * 42P01 = tabela não existe
 * 42703 = coluna não existe
 */
async function safeQuery(sql, params = [], fallbackRows = []) {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    if (err?.code === "42P01" || err?.code === "42703") {
      return { rows: fallbackRows };
    }
    throw err;
  }
}

/**
 * ADMIN SUMMARY
 * GET /api/dashboard/admin-summary
 */
export async function getDashboardSummary(req, res) {
  try {
    // logins hoje
    const loginsHojeRes = await safeQuery(
      `
      SELECT COUNT(*)::int AS total_logins_dia
      FROM user_events
      WHERE event_type = 'login'
        AND created_at::date = CURRENT_DATE;
      `,
      [],
      [{ total_logins_dia: 0 }]
    );
    const total_logins_dia = Number(loginsHojeRes.rows[0]?.total_logins_dia || 0);

    // ações e usuários 30d
    const acoes30Res = await safeQuery(
      `
      SELECT
        COUNT(*)::int AS total_acoes,
        COUNT(DISTINCT user_id)::int AS usuarios
      FROM user_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
      `,
      [],
      [{ total_acoes: 0, usuarios: 0 }]
    );
    const total_acoes = Number(acoes30Res.rows[0]?.total_acoes || 0);
    const usuarios = Number(acoes30Res.rows[0]?.usuarios || 0);
    const acoes_por_usuario_30d = usuarios > 0 ? total_acoes / usuarios : 0;

    // ativos 30d
    const ativos30Res = await safeQuery(
      `
      SELECT COUNT(DISTINCT user_id)::int AS usuarios_ativos_30_dias
      FROM user_events
      WHERE event_type = 'login'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days';
      `,
      [],
      [{ usuarios_ativos_30_dias: 0 }]
    );
    const usuarios_ativos_30_dias = Number(ativos30Res.rows[0]?.usuarios_ativos_30_dias || 0);

    // jogos agregados (schema atual: game_type, started_at)
    const jogosRes = await safeQuery(
      `
      SELECT
        game_type AS game,
        COUNT(*)::int AS total_sessoes,
        COUNT(DISTINCT user_id)::int AS usuarios_unicos,
        COALESCE(AVG(duration_seconds), 0)::int AS tempo_medio_segundos
      FROM game_sessions
      GROUP BY game_type
      ORDER BY game_type;
      `,
      [],
      []
    );

    // top ativos 30d
    const topAtivosRes = await safeQuery(
      `
      SELECT
        u.id,
        u.name,
        COUNT(*)::int AS logins_30d
      FROM users u
      JOIN user_events e ON e.user_id = u.id
      WHERE e.event_type = 'login'
        AND e.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id, u.name
      ORDER BY logins_30d DESC, u.name
      LIMIT 5;
      `,
      [],
      []
    );

    // tempo médio por usuário (com base em game_sessions)
    const tempoUserRes = await safeQuery(
      `
      SELECT COALESCE(AVG(user_total),0)::int AS tempo_medio_user_segundos
      FROM (
        SELECT user_id, COALESCE(SUM(duration_seconds),0) AS user_total
        FROM game_sessions
        GROUP BY user_id
      ) t;
      `,
      [],
      [{ tempo_medio_user_segundos: 0 }]
    );
    const tempo_medio_user_segundos = Number(tempoUserRes.rows[0]?.tempo_medio_user_segundos || 0);

    res.json({
      total_logins_dia,
      acoes_por_usuario_30d,
      usuarios_ativos_30_dias,
      jogos: jogosRes.rows || [],
      top_ativos: topAtivosRes.rows || [],
      tempo_medio_user_segundos,
    });
  } catch (err) {
    console.error("Erro ao gerar dashboard admin:", err);
    res.status(500).json({ error: "Erro ao gerar dashboard admin", details: err.message });
  }
}

/**
 * SALVAR SESSÃO DO JOGO
 * POST /api/dashboard/session
 * body: { userId, game, score, total, duration_seconds }
 */
export async function postGameSession(req, res) {
  try {
    const { userId, game, score = 0, total = null, duration_seconds = 0 } = req.body || {};
    if (!userId || !game) {
      return res.status(400).json({ error: "userId e game são obrigatórios." });
    }

    await pool.query(
      `
      INSERT INTO game_sessions (user_id, game_type, started_at, duration_seconds, metadata)
      VALUES ($1, $2, NOW(), $3, $4::jsonb)
      `,
      [
        Number(userId),
        String(game),
        Number(duration_seconds) || 0,
        JSON.stringify({
          score: Number(score) || 0,
          total: total === null ? null : Number(total),
        }),
      ]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao salvar sessão:", err);
    res.status(500).json({ error: "Erro ao salvar sessão", details: err.message });
  }
}

/**
 * DASHBOARD PESSOAL
 * GET /api/dashboard/summary?userId=...
 */
export async function getUserSummary(req, res) {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.status(400).json({ error: "userId é obrigatório." });

    const userRes = await pool.query(
      `SELECT id, name, role, created_at FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const loginsHojeRes = await pool.query(
      `
      SELECT COUNT(*)::int AS total_logins_dia
      FROM user_events
      WHERE user_id = $1
        AND event_type = 'login'
        AND created_at::date = CURRENT_DATE
      `,
      [userId]
    );

    const jogosRes = await pool.query(
      `
      SELECT
        game_type AS game,
        COUNT(*)::int AS total_sessoes,
        COALESCE(AVG(duration_seconds),0)::int AS tempo_medio_segundos,
        COALESCE(AVG( (metadata->>'score')::int ),0)::int AS score_medio,
        COALESCE(MAX( (metadata->>'score')::int ),0)::int AS melhor_score
      FROM game_sessions
      WHERE user_id = $1
      GROUP BY game_type
      ORDER BY game_type
      `,
      [userId]
    );

    res.json({
      user,
      total_logins_dia: Number(loginsHojeRes.rows[0]?.total_logins_dia || 0),
      jogos: jogosRes.rows || [],
    });
  } catch (err) {
    console.error("Erro dashboard usuário:", err);
    res.status(500).json({ error: "Erro ao gerar dashboard do usuário", details: err.message });
  }
}