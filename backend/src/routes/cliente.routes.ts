import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import clienteController from "../controllers/cliente.controller.js";

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
 * @route   GET /api/v1/clientes
 * @desc    Listar todos os clientes do usuário
 * @access  Private
 */
router.get("/", clienteController.listarClientes.bind(clienteController));

/**
 * @route   GET /api/v1/clientes/total-a-receber
 * @desc    Obter total geral a receber
 * @access  Private
 */
router.get(
  "/total-a-receber",
  clienteController.getTotalAReceberGeral.bind(clienteController)
);

/**
 * @route   POST /api/v1/clientes
 * @desc    Criar um novo cliente
 * @access  Private
 */
router.post("/", clienteController.criarCliente.bind(clienteController));

/**
 * @route   POST /api/v1/clientes/deletar-multiplos
 * @desc    Deletar múltiplos clientes
 * @access  Private
 */
router.post(
  "/deletar-multiplos",
  clienteController.deletarClientes.bind(clienteController)
);

/**
 * @route   GET /api/v1/clientes/:id
 * @desc    Obter um cliente específico
 * @access  Private
 */
router.get("/:id", clienteController.obterCliente.bind(clienteController));

/**
 * @route   GET /api/v1/clientes/:id/total-a-receber
 * @desc    Obter total a receber de um cliente
 * @access  Private
 */
router.get(
  "/:id/total-a-receber",
  clienteController.getTotalAReceber.bind(clienteController)
);

/**
 * @route   PUT /api/v1/clientes/:id
 * @desc    Atualizar um cliente
 * @access  Private
 */
router.put("/:id", clienteController.atualizarCliente.bind(clienteController));

/**
 * @route   DELETE /api/v1/clientes/:id
 * @desc    Deletar um cliente
 * @access  Private
 */
router.delete("/:id", clienteController.deletarCliente.bind(clienteController));

export default router;
