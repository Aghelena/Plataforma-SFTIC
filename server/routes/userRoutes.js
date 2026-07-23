// server/routes/userRoutes.js
import { Router } from "express";
import { pool } from "../db.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: Login de usuário (cria se não existir)
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário logado ou criado
 *       400:
 *         description: Nome é obrigatório
 *       500:
 *         description: Erro interno
 */
router.post("/login", async (req, res) => {
  const name = (req.body?.name || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Nome é obrigatório." });
  }

  try {
    const found = await pool.query(
      `SELECT id, name, created_at FROM users WHERE name = $1 LIMIT 1`,
      [name]
    );

    const user = found.rows[0];

    // se não encontrou, não cria — exige pré-cadastro
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado. Solicite o cadastro à sua terapeuta." });
    }

    // registra evento de login
    try {
      await pool.query(
        `INSERT INTO user_events (user_id, event_type) VALUES ($1, 'login')`,
        [user.id]
      );
    } catch (eventErr) {
      console.warn("Aviso: não foi possível registrar evento de login:", eventErr.message);
    }

    return res.json(user);
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ error: "Erro ao fazer login.", details: err.message });
  }
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Lista todos os usuários (Admin)
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get("/", verifyToken, requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, created_at FROM users ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao listar usuários.", details: err.message });
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Cria usuário pelo Admin
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado
 *       400:
 *         description: Name é obrigatório
 *       409:
 *         description: Nome ou email já existe
 */
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const name  = (req.body?.name  || "").trim();
    const email = (req.body?.email || "").trim() || null;

    if (!name) {
      return res.status(400).json({ error: "Name é obrigatório." });
    }

    const { rows } = await pool.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       RETURNING id, name, email, created_at`,
      [name, email]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Nome ou email já existe." });
    }
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ error: "Erro ao criar usuário.", details: err.message });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Remove usuário (Admin)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Removido com sucesso
 *       400:
 *         description: ID inválido
 */
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "ID inválido." });

    const { rowCount } = await pool.query(
      `DELETE FROM users WHERE id = $1`,
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao remover usuário:", err);
    res.status(500).json({ error: "Erro ao remover usuário.", details: err.message });
  }
});

export default router;