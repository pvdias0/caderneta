import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import pdfController from "../controllers/pdf.controller.js";

const router = Router({ mergeParams: true });

/**
 * Middleware para extrair usuarioId do token
 */
const extractUserId = (req: any, res: any, next: any) => {
  const user = req.user;
  if (user && user.id) {
    req.usuarioId = user.id;
  }
  next();
};

// Aplicar autenticação e extração de usuarioId em todas as rotas
router.use(authMiddleware);
router.use(extractUserId);

/**
 * @route   GET /api/v1/clientes/:clienteId/extrato
 * @desc    Gerar extrato em PDF do cliente
 * @access  Private
 */
router.get("/extrato", pdfController.gerarExtratoCliente.bind(pdfController));

export default router;
