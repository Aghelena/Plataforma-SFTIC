// server/db.js

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("PostgreSQL conectado");
});

pool.on("error", (err) => {
  console.error("Erro inesperado no PostgreSQL:", err);
});

export const query = (text, params) => {
  return pool.query(text, params);
};

export { pool };

export default pool;