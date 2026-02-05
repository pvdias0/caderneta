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
import passwordRecoveryService from "../services/password-recovery.service.js";
import emailService from "../services/email.service.js";
import config from "../config/index.js";
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

/**
 * Solicitar recuperação de senha
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        error: "Email é obrigatório",
      });
      return;
    }

    // Buscar usuário
    const user = await passwordRecoveryService.findUserByEmail(email);

    if (!user) {
      // Não revelar se o email existe ou não (segurança)
      res.status(200).json({
        message: "Se o email estiver registrado, você receberá um link para redefinir sua senha.",
      });
      return;
    }

    // Gerar token de reset
    const resetToken = await passwordRecoveryService.createResetToken(user.id, email);

    // Criar link de reset
    const resetLink = `${config.server.apiUrl}/reset-password?email=${encodeURIComponent(email)}&token=${resetToken}`;

    // Enviar email
    const emailSent = await emailService.sendPasswordResetEmail(
      email,
      user.nome_usuario,
      resetToken,
      resetLink
    );

    if (!emailSent) {
      console.warn("⚠️ Falha ao enviar email de recuperação");
      // Ainda assim retorna sucesso para não revelar problemas de email
    }

    console.log(`📧 Email de recuperação enviado para: ${email}`);

    res.status(200).json({
      message: "Se o email estiver registrado, você receberá um link para redefinir sua senha.",
    });
  } catch (error) {
    console.error("❌ Erro ao solicitar recuperação de senha:", error);
    res.status(500).json({
      error: "Erro ao processar solicitação de recuperação",
    });
  }
}

/**
 * Validar token de recuperação
 * GET /api/v1/auth/validate-reset-token
 */
export async function validateResetToken(req: Request, res: Response): Promise<void> {
  try {
    const { email, token } = req.query;

    if (!email || !token) {
      res.status(400).json({
        error: "Email e token são obrigatórios",
      });
      return;
    }

    const userId = await passwordRecoveryService.validateResetToken(
      email as string,
      token as string
    );

    if (!userId) {
      res.status(400).json({
        error: "Token inválido ou expirado",
      });
      return;
    }

    res.status(200).json({
      message: "Token válido",
      valid: true,
    });
  } catch (error) {
    console.error("❌ Erro ao validar token:", error);
    res.status(500).json({
      error: "Erro ao validar token",
    });
  }
}

/**
 * Redefinir senha com token
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email, token, newPassword, confirmPassword } = req.body;

    if (!email || !token || !newPassword || !confirmPassword) {
      res.status(400).json({
        error: "Email, token, nova senha e confirmação são obrigatórios",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        error: "As senhas não correspondem",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        error: "A senha deve ter no mínimo 6 caracteres",
      });
      return;
    }

    const success = await passwordRecoveryService.resetPassword(email, token, newPassword);

    if (!success) {
      res.status(400).json({
        error: "Não foi possível redefinir a senha. Verifique o email, token e tente novamente.",
      });
      return;
    }

    // Buscar usuário para enviar email de confirmação
    const user = await passwordRecoveryService.findUserByEmail(email);
    if (user) {
      await emailService.sendPasswordChangedEmail(email, user.nome_usuario);
    }

    console.log(`✅ Senha redefinida com sucesso para: ${email}`);

    res.status(200).json({
      message: "Senha redefinida com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro ao redefinir senha:", error);
    res.status(500).json({
      error: "Erro ao redefinir senha",
    });
  }
}

/**
 * Alterar senha (usuário autenticado)
 * POST /api/v1/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        error: "Usuário não autenticado",
      });
      return;
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        error: "Senha antiga, nova senha e confirmação são obrigatórias",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({
        error: "As novas senhas não correspondem",
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        error: "A senha deve ter no mínimo 6 caracteres",
      });
      return;
    }

    if (oldPassword === newPassword) {
      res.status(400).json({
        error: "A nova senha deve ser diferente da senha antiga",
      });
      return;
    }

    const success = await passwordRecoveryService.changePassword(userId, oldPassword, newPassword);

    if (!success) {
      res.status(400).json({
        error: "Senha antiga incorreta",
      });
      return;
    }

    // Buscar usuário para enviar email de confirmação
    const user = await findUserById(userId);
    if (user) {
      await emailService.sendPasswordChangedEmail(user.email, user.nome_usuario);
    }

    console.log(`✅ Senha alterada com sucesso para usuário: ${userId}`);

    res.status(200).json({
      message: "Senha alterada com sucesso!",
    });
  } catch (error) {
    console.error("❌ Erro ao alterar senha:", error);
    res.status(500).json({
      error: "Erro ao alterar senha",
    });
  }
}
