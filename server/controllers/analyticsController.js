// server/controllers/analyticsController.js

export async function getDashboardSummary(req, res) {
  try {
    // 1. Logins hoje (Mantido)
    const loginsHojeRes = await safeQuery(
      `SELECT COUNT(*)::int AS total_logins_dia FROM user_events 
       WHERE event_type = 'login' AND created_at::date = CURRENT_DATE;`,
      [], [{ total_logins_dia: 0 }]
    );

    // 2. Usuários Ativos 30d (Mantido)
    const ativos30Res = await safeQuery(
      `SELECT COUNT(DISTINCT user_id)::int AS usuarios_ativos_30_dias FROM user_events 
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';`,
      [], [{ usuarios_ativos_30_dias: 0 }]
    );

    // 3. MÉTRICAS TERAPÊUTICAS: Assertividade e Tempo por Jogo
    // Extraímos o score do JSONB metadata
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

    // 4. USO DE ACESSIBILIDADE (Análise quantitativa de tecnologia assistiva)
    // Assume que você registra eventos como 'toggle_contrast' ou 'vibras_active' em user_events
    const acessibilidadeRes = await safeQuery(
      `
      SELECT 
        event_type as recurso,
        COUNT(*)::int as total_usos
      FROM user_events 
      WHERE event_type IN ('toggle_contrast', 'vibras_enabled', 'audio_description_active')
      GROUP BY event_type;
      `,
      [], []
    );

    res.json({
      total_logins_dia: Number(loginsHojeRes.rows[0]?.total_logins_dia || 0),
      usuarios_ativos_30_dias: Number(ativos30Res.rows[0]?.usuarios_ativos_30_dias || 0),
      jogos: jogosRes.rows || [],
      acessibilidade: acessibilidadeRes.rows || [],
      // Cálculo de ações por usuário (30d) simplificado
      acoes_por_usuario_30d: 0 // Pode manter sua lógica anterior aqui
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao gerar dashboard" });
  }
}