/**
 * Serviço de Recuperação de Senha
 * Gerencia tokens de reset de senha e alterações de senha
 */

import crypto from 'crypto';
import pool from '../config/database.js';
import { hashPassword, comparePassword } from './usuario.service.js';

interface PasswordResetToken {
  id: string;
  id_usuario: number;
  token_hash: string;
  email: string;
  expirado: boolean;
  datacriacao: Date;
}

class PasswordRecoveryService {
  /**
   * Gerar código de recuperação de 5 caracteres (letras + números)
   */
  generateResetToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Hash do código para armazenar com segurança
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Salvar token de reset no banco de dados
   */
  async createResetToken(id_usuario: number, email: string): Promise<string> {
    try {
      // Invalidar tokens anteriores
      await pool.query(
        'UPDATE usuarios SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
        [id_usuario]
      );

      const token = this.generateResetToken();
      const tokenHash = this.hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token hash no banco
      await pool.query(
        'UPDATE usuarios SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [tokenHash, expiresAt, id_usuario]
      );

      console.log(`🔐 Token de reset criado para usuário ${id_usuario}`);
      return token;
    } catch (error) {
      console.error('Erro ao criar token de reset:', error);
      throw error;
    }
  }

  /**
   * Validar token de recuperação
   */
  async validateResetToken(email: string, token: string): Promise<number | null> {
    try {
      const tokenHash = this.hashToken(token);

      const result = await pool.query(
        `SELECT id, reset_token, reset_token_expires 
         FROM usuarios 
         WHERE email = $1 AND reset_token = $2`,
        [email, tokenHash]
      );

      if (result.rows.length === 0) {
        console.warn(`❌ Token inválido para email: ${email}`);
        return null;
      }

      const user = result.rows[0];
      const now = new Date();
      const expiresAt = new Date(user.reset_token_expires);

      if (now > expiresAt) {
        console.warn(`⏰ Token expirado para email: ${email}`);
        return null;
      }

      return user.id;
    } catch (error) {
      console.error('Erro ao validar token de reset:', error);
      return null;
    }
  }

  /**
   * Redefinir senha usando token
   */
  async resetPassword(email: string, token: string, newPassword: string): Promise<boolean> {
    try {
      // Validar token
      const id_usuario = await this.validateResetToken(email, token);

      if (!id_usuario) {
        return false;
      }

      // Hash da nova senha
      const passwordHash = await hashPassword(newPassword);

      // Atualizar senha e limpar token
      const result = await pool.query(
        `UPDATE usuarios 
         SET senha = $1, reset_token = NULL, reset_token_expires = NULL, ultimaatualizacao = NOW()
         WHERE id = $2 AND email = $3
         RETURNING id`,
        [passwordHash, id_usuario, email]
      );

      if (result.rows.length === 0) {
        return false;
      }

      console.log(`✅ Senha alterada com sucesso para usuário: ${email}`);
      return true;
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return false;
    }
  }

  /**
   * Alterar senha (requer senha antiga)
   */
  async changePassword(
    id_usuario: number,
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Buscar usuário
      const userResult = await pool.query(
        'SELECT id, senha FROM usuarios WHERE id = $1',
        [id_usuario]
      );

      if (userResult.rows.length === 0) {
        return false;
      }

      const user = userResult.rows[0];

      // Validar senha antiga
      const isValidPassword = await comparePassword(oldPassword, user.senha);

      if (!isValidPassword) {
        console.warn(`❌ Senha antiga incorreta para usuário: ${id_usuario}`);
        return false;
      }

      // Hash da nova senha
      const passwordHash = await hashPassword(newPassword);

      // Atualizar senha
      await pool.query(
        'UPDATE usuarios SET senha = $1, ultimaatualizacao = NOW() WHERE id = $2',
        [passwordHash, id_usuario]
      );

      console.log(`✅ Senha alterada com sucesso para usuário: ${id_usuario}`);
      return true;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  }

  /**
   * Buscar usuário por email
   */
  async findUserByEmail(email: string): Promise<{ id: number; nome_usuario: string } | null> {
    try {
      const result = await pool.query(
        'SELECT id, nome_usuario FROM usuarios WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  }
}

export default new PasswordRecoveryService();
