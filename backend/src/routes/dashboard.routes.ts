import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * Rotas de Dashboard
 * GET /api/v1/dashboard/stats - Obter estatísticas do dashboard
 */

// Todas as rotas de dashboard requerem autenticação
router.get("/stats", authMiddleware, getDashboard);

export default router;
