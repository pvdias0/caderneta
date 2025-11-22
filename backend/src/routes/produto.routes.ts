import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import produtoController from "../controllers/produto.controller.js";

const router = Router();

/**
 * Estender interface Request para incluir usuarioId
 */
declare global {
  namespace Express {
    interface Request {
      usuarioId?: number;
    }
  }
}

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
 * @route   GET /api/v1/produtos
 * @desc    Listar todos os produtos do usuário
 * @access  Private
 */
router.get("/", produtoController.listarProdutos.bind(produtoController));

/**
 * @route   GET /api/v1/produtos/busca
 * @desc    Buscar produtos por nome
 * @access  Private
 */
router.get("/busca", produtoController.buscarProdutos.bind(produtoController));

/**
 * @route   POST /api/v1/produtos
 * @desc    Criar um novo produto
 * @access  Private
 */
router.post("/", produtoController.criarProduto.bind(produtoController));

/**
 * @route   DELETE /api/v1/produtos/bulk/delete
 * @desc    Deletar múltiplos produtos
 * @access  Private
 */
router.delete(
  "/bulk/delete",
  produtoController.deletarProdutos.bind(produtoController)
);

/**
 * @route   GET /api/v1/produtos/:id
 * @desc    Obter um produto específico
 * @access  Private
 */
router.get("/:id", produtoController.obterProduto.bind(produtoController));

/**
 * @route   PUT /api/v1/produtos/:id
 * @desc    Atualizar um produto
 * @access  Private
 */
router.put("/:id", produtoController.atualizarProduto.bind(produtoController));

/**
 * @route   DELETE /api/v1/produtos/:id
 * @desc    Deletar um produto
 * @access  Private
 */
router.delete("/:id", produtoController.deletarProduto.bind(produtoController));

export default router;
