import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, generateAccessToken } from '../services/jwt.service.js';
import { IDecodedToken } from '../types/auth.js';

/**
 * Interface estendida do Express Request com dados de autenticação
 */
declare global {
  namespace Express {
    interface Request {
      user?: IDecodedToken;
      accessToken?: string;
      refreshToken?: string;
    }
  }
}

/**
 * Middleware para verificar access token
 * Busca o token em:
 * 1. Header Authorization: "Bearer token"
 * 2. Cookie HTTP-only
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Tentar pegar o token do header Authorization
    let token = req.headers.authorization?.split(' ')[1];

    // Se não encontrar no header, tentar buscar do cookie
    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (!token) {
      res.status(401).json({
        error: 'Token não fornecido',
        message: 'Autenticação necessária',
      });
      return;
    }

    // Validar o token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      res.status(401).json({
        error: 'Token inválido ou expirado',
      });
      return;
    }

    // Adicionar dados do usuário ao request
    req.user = decoded;
    req.accessToken = token;

    next();
  } catch (error) {
    console.error('❌ Erro no middleware de autenticação:', error);
    res.status(500).json({
      error: 'Erro ao processar autenticação',
    });
  }
}

/**
 * Middleware para refresh token automático
 * Se o access token expirou mas o refresh token é válido,
 * gera um novo access token automaticamente
 */
export async function autoRefreshMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let accessToken = req.headers.authorization?.split(' ')[1];
    let refreshToken = req.cookies?.refreshToken;

    // Se access token é inválido mas refresh token existe
    if (!accessToken || !verifyAccessToken(accessToken)) {
      if (!refreshToken) {
        res.status(401).json({
          error: 'Sessão expirada',
          message: 'Faça login novamente',
        });
        return;
      }

      // Validar refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        res.status(401).json({
          error: 'Refresh token inválido',
        });
        return;
      }

      // Gerar novo access token
      const newAccessToken = generateAccessToken({
        id: decoded.id,
        email: decoded.email,
        nome_usuario: decoded.nome_usuario,
      });

      // Adicionar novo token ao response header
      res.setHeader('X-New-Access-Token', newAccessToken);

      // Atualizar cookie se existir
      if (req.cookies?.accessToken) {
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60 * 1000, // 24 horas
        });
      }

      // Adicionar ao request
      req.user = decoded;
      req.accessToken = newAccessToken;
    } else {
      // Token válido, adicionar ao request
      const decoded = verifyAccessToken(accessToken);
      if (decoded) {
        req.user = decoded;
        req.accessToken = accessToken;
      }
    }

    next();
  } catch (error) {
    console.error('❌ Erro no auto refresh middleware:', error);
    next(); // Continuar mesmo com erro
  }
}

/**
 * Middleware opcional de autenticação
 * Não bloqueia a requisição se sem token, mas adiciona dados se tiver
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      token = req.cookies?.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = decoded;
        req.accessToken = token;
      }
    }

    next();
  } catch (error) {
    // Ignorar erros em autenticação opcional
    next();
  }
}
