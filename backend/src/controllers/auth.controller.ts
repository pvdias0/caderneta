import { Request, Response } from "express";
import {
  validateLogin,
  createUser,
  findUserById,
  updateLastLogin,
} from "../services/usuario.service.js";
import {
  generateTokens,
  verifyRefreshToken,
  generateAccessToken,
} from "../services/jwt.service.js";
import { ILoginRequest, IRegisterRequest } from "../types/auth.js";

/**
 * Controller de autenticação - Login, registro, refresh token, logout
 */

/**
 * Login de usuário
 * POST /api/v1/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, senha } = req.body as ILoginRequest;

    // Validar entrada
    if (!email || !senha) {
      res.status(400).json({
        error: "Email e senha são obrigatórios",
      });
      return;
    }

    // Validar login
    const tokenPayload = await validateLogin(email, senha);

    if (!tokenPayload) {
      res.status(401).json({
        error: "Email ou senha incorretos",
      });
      return;
    }

    // Gerar tokens
    const { accessToken, refreshToken, expiresIn } =
      generateTokens(tokenPayload);

    // Atualizar último acesso
    await updateLastLogin(tokenPayload.id);

    console.log(`✅ Login bem-sucedido: ${email}`);

    res.status(200).json({
      message: "Login realizado com sucesso",
      user: {
        id: tokenPayload.id,
        email: tokenPayload.email,
        nome_usuario: tokenPayload.nome_usuario,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao fazer login:", error);
    res.status(500).json({
      error: "Erro ao processar login",
    });
  }
}

/**
 * Registro de novo usuário
 * POST /api/v1/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { nome_usuario, email, senha } = req.body as IRegisterRequest;

    // Validar entrada
    if (!nome_usuario || !email || !senha) {
      res.status(400).json({
        error: "Nome de usuário, email e senha são obrigatórios",
      });
      return;
    }

    // Criar usuário
    const user = await createUser(nome_usuario, email, senha);

    console.log(`✅ Novo usuário registrado: ${email}`);

    res.status(201).json({
      message: "Usuário registrado com sucesso",
      user: {
        id: user.id,
        email: user.email,
        nome_usuario: user.nome_usuario,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("já cadastrado") ||
        error.message.includes("já existe")
      ) {
        res.status(409).json({
          error: error.message,
        });
        return;
      }
    }

    console.error("❌ Erro ao registrar usuário:", error);
    res.status(500).json({
      error: "Erro ao processar registro",
    });
  }
}

/**
 * Refresh token - Gerar novo access token usando refresh token
 * POST /api/v1/auth/refresh
 *
 * Para aplicações mobile (React Native), os tokens são enviados no corpo da requisição
 * e não em cookies HTTP-only
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        error: "Refresh token não fornecido",
      });
      return;
    }

    // Validar refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      res.status(401).json({
        error: "Refresh token inválido ou expirado",
      });
      return;
    }

    // Gerar novo access token
    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
      nome_usuario: decoded.nome_usuario,
    });

    console.log(`✅ Token renovado para usuário: ${decoded.email}`);

    res.status(200).json({
      message: "Access token renovado com sucesso",
      accessToken: newAccessToken,
      expiresIn: "24h",
    });
  } catch (error) {
    console.error("❌ Erro ao renovar token:", error);
    res.status(500).json({
      error: "Erro ao renovar token",
    });
  }
}

/**
 * Logout - Limpar tokens (apenas informativo para mobile)
 * POST /api/v1/auth/logout
 *
 * Para aplicações mobile, o logout é feito removendo os tokens do AsyncStorage no cliente
 * Esta rota é informativa apenas
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    console.log(`✅ Logout realizado`);

    res.status(200).json({
      message: "Logout realizado com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao fazer logout:", error);
    res.status(500).json({
      error: "Erro ao processar logout",
    });
  }
}

/**
 * Obter dados do usuário autenticado
 * GET /api/v1/auth/me
 */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: "Não autenticado",
      });
      return;
    }

    const user = await findUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        error: "Usuário não encontrado",
      });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        nome_usuario: user.nome_usuario,
        datacriacao: user.datacriacao,
        ultimaatualizacao: user.ultimaatualizacao,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao obter dados do usuário:", error);
    res.status(500).json({
      error: "Erro ao obter dados do usuário",
    });
  }
}
