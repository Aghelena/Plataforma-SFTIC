// server/controllers/usersController.js
import { pool } from "../db.js";

export async function listUsers(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        id,
        COALESCE(email, '') AS username,
        COALESCE(name, '')  AS name,
        'Estudante'         AS role,
        COALESCE(email, '') AS email,
        created_at
      FROM users
      ORDER BY id DESC;
    `);

    res.json(rows);
  } catch (err) {
    console.error("Erro ao listar usuários:", err);
    res.status(500).json({ error: "Erro ao listar usuários", details: err.message });
  }
}

export async function createUser(req, res) {
  try {
    const { username, name, role } = req.body;

    // Como seu schema não tem username/role, vamos usar:
    // - username como email
    // - role ignorado por enquanto
    if (!username || !name) {
      return res.status(400).json({ error: "username (email) e name são obrigatórios" });
    }

    const { rows } = await pool.query(
      `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING
        id,
        email AS username,
        name,
        'Estudante' AS role,
        email,
        created_at;
      `,
      [name, username]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).json({ error: "Erro ao criar usuário", details: err.message });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    res.status(500).json({ error: "Erro ao deletar usuário", details: err.message });
  }
}