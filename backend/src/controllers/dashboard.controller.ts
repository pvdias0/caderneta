import { Request, Response } from "express";
import { getDashboardStats } from "../services/dashboard.service.js";

/**
 * Controller de Dashboard - Obtém estatísticas do usuário
 */

/**
 * Obter estatísticas do dashboard
 * GET /api/v1/dashboard/stats
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Não autenticado",
      });
      return;
    }

    const stats = await getDashboardStats(req.user.id);

    res.status(200).json({
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Erro ao obter dashboard:", error);
    res.status(500).json({
      error: "Erro ao obter dados do dashboard",
    });
  }
}
