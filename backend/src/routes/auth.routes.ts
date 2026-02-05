import { Router } from "express";
import {
  login,
  register,
  refresh,
  logout,
  me,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * Rotas de autenticação
 * POST /api/v1/auth/login - Login
 * POST /api/v1/auth/register - Registro
 * POST /api/v1/auth/refresh - Renovar token
 * POST /api/v1/auth/logout - Logout
 * GET /api/v1/auth/me - Dados do usuário autenticado
 * POST /api/v1/auth/forgot-password - Solicitar recuperação de senha
 * GET /api/v1/auth/validate-reset-token - Validar token de reset
 * POST /api/v1/auth/reset-password - Redefinir senha
 * POST /api/v1/auth/change-password - Alterar senha (autenticado)
 */

// Rotas públicas
router.post("/login", login);
router.post("/register", register);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.get("/validate-reset-token", validateResetToken);
router.post("/reset-password", resetPassword);

// Rotas protegidas
router.get("/me", authMiddleware, me);
router.post("/change-password", authMiddleware, changePassword);

export default router;
