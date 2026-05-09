// server/controllers/analyticsController.js

import pool from "../db.js";

/**
 * Executa queries com fallback para evitar quebrar o dashboard
 * caso alguma tabela/coluna ainda não exista.
 */
async function safeQuery(sql, params = [], fallbackRows = []) {
  try {
    return await pool.query(sql, params);
  } catch (err) {
    const ignorableErrors = [
      "42P01", // relation does not exist
      "42703", // column does not exist
      "42883", // function does not exist
      "22P02", // invalid text representation
    ];

    if (ignorableErrors.includes(err.code)) {
      console.warn("Query ignorada no dashboard:", err.message);
      return { rows: fallbackRows };
    }

    throw err;
  }
}

export async function getDashboardSummary(req, res) {
  try {
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

    const ativos30Res = await safeQuery(
      `
      SELECT COUNT(DISTINCT user_id)::int AS usuarios_ativos_30_dias
      FROM user_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
      `,
      [],
      [{ usuarios_ativos_30_dias: 0 }]
    );

    const acoesPorUsuarioRes = await safeQuery(
      `
      SELECT 
        COALESCE(
          ROUND(
            COUNT(*)::numeric / NULLIF(COUNT(DISTINCT user_id), 0),
            2
          ),
          0
        )::numeric AS acoes_por_usuario_30d
      FROM user_events
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
      `,
      [],
      [{ acoes_por_usuario_30d: 0 }]
    );

    const jogosRes = await safeQuery(
      `
      SELECT
        game_type AS game,
        COUNT(*)::int AS total_sessoes,
        COUNT(DISTINCT user_id)::int AS usuarios_unicos,
        COALESCE(AVG(duration_seconds), 0)::int AS tempo_medio_segundos,
        COALESCE(AVG((metadata->>'score')::numeric), 0)::numeric AS assertividade_media
      FROM game_sessions
      GROUP BY game_type
      ORDER BY assertividade_media DESC;
      `,
      [],
      []
    );

    const acessibilidadeRes = await safeQuery(
      `
      SELECT 
        event_type AS recurso,
        COUNT(*)::int AS total_usos
      FROM user_events
      WHERE event_type IN (
        'toggle_contrast',
        'vibras_enabled',
        'audio_description_active'
      )
      GROUP BY event_type
      ORDER BY total_usos DESC;
      `,
      [],
      []
    );

    return res.json({
      total_logins_dia: Number(loginsHojeRes.rows[0]?.total_logins_dia || 0),
      usuarios_ativos_30_dias: Number(
        ativos30Res.rows[0]?.usuarios_ativos_30_dias || 0
      ),
      acoes_por_usuario_30d: Number(
        acoesPorUsuarioRes.rows[0]?.acoes_por_usuario_30d || 0
      ),
      jogos: jogosRes.rows || [],
      acessibilidade: acessibilidadeRes.rows || [],
    });
  } catch (err) {
    console.error("Erro ao gerar dashboard:", err);

    return res.status(500).json({
      error: "Erro ao gerar dashboard",
    });
  }
}

export async function getUserSummary(req, res) {
  try {
    const userId = req.params.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({
        error: "userId é obrigatório",
      });
    }

    const usuarioRes = await safeQuery(
      `
      SELECT 
        id,
        name,
        created_at
      FROM users
      WHERE id = $1;
      `,
      [userId],
      []
    );

    const sessoesRes = await safeQuery(
      `
      SELECT
        COUNT(*)::int AS total_sessoes,
        COALESCE(AVG(duration_seconds), 0)::int AS tempo_medio_segundos,
        COALESCE(AVG((metadata->>'score')::numeric), 0)::numeric AS assertividade_media
      FROM game_sessions
      WHERE user_id = $1;
      `,
      [userId],
      [
        {
          total_sessoes: 0,
          tempo_medio_segundos: 0,
          assertividade_media: 0,
        },
      ]
    );

    const jogosRes = await safeQuery(
      `
      SELECT
        game_type AS game,
        COUNT(*)::int AS total_sessoes,
        COALESCE(AVG(duration_seconds), 0)::int AS tempo_medio_segundos,
        COALESCE(AVG((metadata->>'score')::numeric), 0)::numeric AS assertividade_media
      FROM game_sessions
      WHERE user_id = $1
      GROUP BY game_type
      ORDER BY total_sessoes DESC;
      `,
      [userId],
      []
    );

    return res.json({
      usuario: usuarioRes.rows[0] || null,
      resumo: {
        total_sessoes: Number(sessoesRes.rows[0]?.total_sessoes || 0),
        tempo_medio_segundos: Number(
          sessoesRes.rows[0]?.tempo_medio_segundos || 0
        ),
        assertividade_media: Number(
          sessoesRes.rows[0]?.assertividade_media || 0
        ),
      },
      jogos: jogosRes.rows || [],
    });
  } catch (err) {
    console.error("Erro ao gerar resumo do usuário:", err);

    return res.status(500).json({
      error: "Erro ao gerar resumo do usuário",
    });
  }
}

export async function postGameSession(req, res) {
  try {
    const {
      user_id,
      userId,
      game_type,
      gameType,
      game,
      score,
      total,
      duration_seconds,
      durationSeconds,
      metadata = {},
    } = req.body;

    const finalUserId = user_id || userId;
    const finalGameType = game_type || gameType || game;
    const finalDuration = duration_seconds || durationSeconds || 0;

    if (!finalUserId) {
      return res.status(400).json({
        error: "user_id é obrigatório",
      });
    }

    if (!finalGameType) {
      return res.status(400).json({
        error: "game_type é obrigatório",
      });
    }

    const finalMetadata = {
      ...metadata,
      score: score ?? metadata.score ?? 0,
      total: total ?? metadata.total ?? 0,
    };

    const insertRes = await pool.query(
      `
      INSERT INTO game_sessions (
        user_id,
        game_type,
        duration_seconds,
        metadata
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
      `,
      [finalUserId, finalGameType, finalDuration, finalMetadata]
    );

    return res.status(201).json({
      message: "Sessão registrada com sucesso",
      session: insertRes.rows[0],
    });
  } catch (err) {
    console.error("Erro ao registrar sessão:", err);

    return res.status(500).json({
      error: "Erro ao registrar sessão",
    });
  }
}