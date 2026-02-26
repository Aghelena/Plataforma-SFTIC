import { Router } from "express";
import { getDashboardSummary, postGameSession, getUserSummary } from "../controllers/analyticsController.js";

const router = Router();

router.get("/admin-summary", getDashboardSummary);
router.get("/summary", getUserSummary);
router.post("/session", postGameSession);

export default router;