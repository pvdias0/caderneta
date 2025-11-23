import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import movimentoController from "../controllers/movimento.controller.js";

const router = Router({ mergeParams: true });

/**
 * Middleware para extrair usuarioId do token
 */
const extractUserId = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  if (user && user.id) {
    (req as any).usuarioId = user.id;
  }
  next();
};

// Aplicar autenticação e extração de usuarioId em todas as rotas
router.use(authMiddleware);
router.use(extractUserId);

/**
 * @route   GET /api/v1/clientes/:clienteId/movimentos
 * @desc    Listar movimentos de um cliente
 * @access  Private
 */
router.get("/", movimentoController.listarMovimentos.bind(movimentoController));

/**
 * @route   POST /api/v1/clientes/:clienteId/movimentos/compra
 * @desc    Criar uma compra
 * @access  Private
 */
router.post(
  "/compra",
  movimentoController.criarCompra.bind(movimentoController)
);

/**
 * @route   POST /api/v1/clientes/:clienteId/movimentos/compra-com-itens
 * @desc    Criar uma compra com múltiplos itens (carrinho)
 * @access  Private
 */
router.post(
  "/compra-com-itens",
  movimentoController.criarCompraComItens.bind(movimentoController)
);

/**
 * @route   POST /api/v1/clientes/:clienteId/movimentos/pagamento
 * @desc    Criar um pagamento
 * @access  Private
 */
router.post(
  "/pagamento",
  movimentoController.criarPagamento.bind(movimentoController)
);

/**
 * @route   PUT /api/v1/clientes/:clienteId/movimentos/compra/:compraId
 * @desc    Atualizar uma compra
 * @access  Private
 */
router.put(
  "/compra/:compraId",
  movimentoController.atualizarCompra.bind(movimentoController)
);

/**
 * @route   PUT /api/v1/clientes/:clienteId/movimentos/compra/:compraId/com-itens
 * @desc    Atualizar uma compra com itens
 * @access  Private
 */
router.put(
  "/compra/:compraId/com-itens",
  movimentoController.atualizarCompraComItens.bind(movimentoController)
);

/**
 * @route   PUT /api/v1/clientes/:clienteId/movimentos/pagamento/:pagamentoId
 * @desc    Atualizar um pagamento
 * @access  Private
 */
router.put(
  "/pagamento/:pagamentoId",
  movimentoController.atualizarPagamento.bind(movimentoController)
);

/**
 * @route   DELETE /api/v1/clientes/:clienteId/movimentos/compra/:compraId
 * @desc    Deletar uma compra
 * @access  Private
 */
router.delete(
  "/compra/:compraId",
  movimentoController.deletarCompra.bind(movimentoController)
);

/**
 * @route   DELETE /api/v1/clientes/:clienteId/movimentos/pagamento/:pagamentoId
 * @desc    Deletar um pagamento
 * @access  Private
 */
router.delete(
  "/pagamento/:pagamentoId",
  movimentoController.deletarPagamento.bind(movimentoController)
);

export default router;
