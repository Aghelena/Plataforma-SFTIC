// server/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import usersRoutes from "./routes/userRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js"; // ✅ default import

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Rotas
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", analyticsRoutes); // ✅ agora existe

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada", path: req.path });
});

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});