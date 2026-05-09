// server/routes/analyticsRoutes.js

import { Router } from "express";

import {
  getDashboardSummary,
  getUserSummary,
  postGameSession,
} from "../controllers/analyticsController.js";

const router = Router();

router.get("/admin-summary", getDashboardSummary);
router.get("/summary", getDashboardSummary);

router.get("/users/:userId/summary", getUserSummary);

router.post("/session", postGameSession);

export default router;