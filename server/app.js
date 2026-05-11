// server/app.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./swagger.js";

import usersRoutes from './routes/userRoutes.js';
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://plataforma-sftic.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.json({
    message: "API Plataforma SFTIC rodando",
  });
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rotas da API
app.use("/api/users", usersRoutes);
app.use("/api/dashboard", analyticsRoutes);

// 404 precisa ficar por último
app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    path: req.originalUrl,
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Swagger disponível em http://localhost:${PORT}/api-docs`);
});