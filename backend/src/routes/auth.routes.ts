import { Router } from 'express';
import {
  login,
  register,
  refresh,
  logout,
  me,
} from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * Rotas de autenticação
 * POST /api/v1/auth/login - Login
 * POST /api/v1/auth/register - Registro
 * POST /api/v1/auth/refresh - Renovar token
 * POST /api/v1/auth/logout - Logout
 * GET /api/v1/auth/me - Dados do usuário autenticado
 */

// Rotas públicas
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Rotas protegidas
router.get('/me', authMiddleware, me);

export default router;
