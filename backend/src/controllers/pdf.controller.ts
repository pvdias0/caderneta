import { Request, Response } from "express";
import pdfService from "../services/pdf.service.js";

/**
 * Helper para obter usuarioId do request
 */
function getUsuarioId(req: Request): number | null {
  const usuarioId = (req as any).user?.id || (req as any).usuarioId;
  return usuarioId ? Number(usuarioId) : null;
}

export class PdfController {
  /**
   * Gerar extrato em PDF do cliente
   * GET /api/v1/clientes/:clienteId/extrato
   */
  async gerarExtratoCliente(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      const pdfStream = await pdfService.gerarExtratoCliente(
        Number(clienteId),
        usuarioId
      );

      // Configurar headers para download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="extrato-cliente-${clienteId}.pdf"`
      );

      // Enviar stream
      pdfStream.pipe(res);
    } catch (error) {
      console.error("Erro ao gerar extrato:", error);
      res.status(400).json({
        error: "Falha ao gerar extrato",
        message: (error as any).message,
      });
    }
  }
}

export default new PdfController();
