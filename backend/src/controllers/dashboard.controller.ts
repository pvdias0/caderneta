import { Request, Response } from "express";
import { getDashboardStats, getSalesReport } from "../services/dashboard.service.js";

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

export async function getDashboardSalesReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Não autenticado",
      });
      return;
    }

    const mode = req.query.mode === "day" ? "day" : "month";
    const year =
      req.query.year !== undefined ? Number(req.query.year) : undefined;
    const month =
      req.query.month !== undefined ? Number(req.query.month) : undefined;
    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const report = await getSalesReport(req.user.id, {
      mode,
      year,
      month,
      date,
    });

    res.status(200).json({
      data: report,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Erro ao obter relatório de vendas:", error);
    res.status(400).json({
      error: error?.message || "Erro ao obter relatório de vendas",
    });
  }
}
