// server/controllers/userController.js
import { pool } from "../db.js";

export async function listUsers(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, created_at FROM users ORDER BY id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao listar usuários.", details: err.message });
  }
}

export async function createUser(req, res) {
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
}

export async function deleteUser(req, res) {
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
}