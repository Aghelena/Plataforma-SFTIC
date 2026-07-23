// server/routes/analyticsRoutes.js
import { Router } from "express";
import {
  getDashboardSummary,
  getUserSummary,
  postGameSession,
} from "../controllers/analyticsController.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = Router();

/**
 * @openapi
 * /api/dashboard/admin-summary:
 *   get:
 *     summary: Resumo geral para o painel Admin
 *     tags:
 *       - Dashboard
 *     responses:
 *       200:
 *         description: Dados consolidados do dashboard
 */
router.get("/admin-summary", verifyToken, requireAdmin, getDashboardSummary);

/**
 * @openapi
 * /api/dashboard/users/{userId}/summary:
 *   get:
 *     summary: Resumo de desempenho de um usuário
 *     tags:
 *       - Dashboard
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       400:
 *         description: userId obrigatório
 *       404:
 *         description: Usuário não encontrado
 */
router.get("/users/:userId/summary", verifyToken, requireAdmin, getUserSummary);

/**
 * @openapi
 * /api/dashboard/session:
 *   post:
 *     summary: Registra sessão de jogo
 *     tags:
 *       - Dashboard
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [user_id, game_type]
 *             properties:
 *               user_id:
 *                 type: integer
 *               game_type:
 *                 type: string
 *               duration_seconds:
 *                 type: integer
 *               score:
 *                 type: number
 *               total:
 *                 type: number
 *     responses:
 *       201:
 *         description: Sessão registrada
 *       400:
 *         description: Campos obrigatórios ausentes
 *       503:
 *         description: Banco ainda não disponível
 */
router.post("/session", postGameSession);

export default router;