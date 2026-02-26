// server/routes/userRoutes.js
import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * POST /api/users/login
 * body: { name: string }
 * - cria/recupera usuário por "name"
 * - registra evento de login
 */
router.post("/login", async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "Nome é obrigatório." });

    // 1) procura pelo nome
    const found = await pool.query(
      `SELECT id, name, role, created_at FROM users WHERE name = $1 LIMIT 1`,
      [name]
    );

    let user = found.rows[0];

    // 2) se não existe, cria (só name; role tem default)
    if (!user) {
      const created = await pool.query(
        `INSERT INTO users (name) VALUES ($1) RETURNING id, name, role, created_at`,
        [name]
      );
      user = created.rows[0];
    }

    // 3) registra evento de login
    await pool.query(
      `INSERT INTO user_events (user_id, event_type) VALUES ($1, 'login')`,
      [user.id]
    );

    return res.json(user);
  } catch (err) {
    // se name for UNIQUE e alguém logar ao mesmo tempo
    if (err.code === "23505") {
      const name = (req.body?.name || "").trim();
      const found = await pool.query(
        `SELECT id, name, role, created_at FROM users WHERE name = $1 LIMIT 1`,
        [name]
      );
      return res.json(found.rows[0]);
    }

    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro ao fazer login", details: err.message });
  }
});

/**
 * GET /api/users
 * - lista usuários do banco para o Admin
 */
router.get("/", async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, username, name, role, email, created_at
       FROM users
       ORDER BY id DESC`
    );
    res.json(r.rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res
      .status(500)
      .json({ error: "Erro ao listar usuários", details: err.message });
  }
});

/**
 * POST /api/users
 * body: { username, name, role, email }
 * - cria usuário no banco para o Admin
 */
router.post("/", async (req, res) => {
  try {
    const username = (req.body?.username || "").trim();
    const name = (req.body?.name || "").trim();
    const role = (req.body?.role || "Estudante").trim();
    const emailRaw = (req.body?.email || "").trim();
    const email = emailRaw ? emailRaw : null;

    if (!username) {
      return res.status(400).json({ error: "Username é obrigatório." });
    }

    const created = await pool.query(
      `INSERT INTO users (username, name, role, email)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, name, role, email, created_at`,
      [username, name || username, role, email]
    );

    res.status(201).json(created.rows[0]);
  } catch (err) {
    // unique violation (users_username_key / users_email_key)
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username ou email já existe." });
    }

    console.error("Erro ao criar usuário:", err);
    res
      .status(500)
      .json({ error: "Erro ao criar usuário", details: err.message });
  }
});

/**
 * DELETE /api/users/:id
 * - remove usuário do banco (Admin)
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido." });

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao remover usuário:", err);
    res
      .status(500)
      .json({ error: "Erro ao remover usuário", details: err.message });
  }
});

export default router;