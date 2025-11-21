import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { IUser, ITokenPayload } from '../types/auth.js';

/**
 * Serviço de usuários - Gerencia login, registro e operações de usuário
 */

/**
 * Hash de senha usando bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compara senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Buscar usuário por email
 */
export async function findUserByEmail(email: string): Promise<IUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, nome_usuario, email, datacriacao, ultimaatualizacao FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por email:', error);
    throw error;
  }
}

/**
 * Buscar usuário por nome de usuário
 */
export async function findUserByUsername(nome_usuario: string): Promise<IUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, nome_usuario, email, datacriacao, ultimaatualizacao FROM usuarios WHERE nome_usuario = $1',
      [nome_usuario]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por nome:', error);
    throw error;
  }
}

/**
 * Buscar usuário por ID
 */
export async function findUserById(id: number): Promise<IUser | null> {
  try {
    const result = await pool.query(
      'SELECT id, nome_usuario, email, datacriacao, ultimaatualizacao FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro ao buscar usuário por ID:', error);
    throw error;
  }
}

/**
 * Buscar usuário com senha (para login)
 */
export async function findUserWithPassword(email: string): Promise<any | null> {
  try {
    const result = await pool.query(
      'SELECT id, nome_usuario, email, senha, datacriacao, ultimaatualizacao FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro ao buscar usuário com senha:', error);
    throw error;
  }
}

/**
 * Criar novo usuário (registrar)
 */
export async function createUser(
  nome_usuario: string,
  email: string,
  senha: string
): Promise<IUser> {
  try {
    // Validar se usuário já existe
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    const existingUsername = await findUserByUsername(nome_usuario);
    if (existingUsername) {
      throw new Error('Nome de usuário já existe');
    }

    // Hash da senha
    const senhaHash = await hashPassword(senha);

    // Inserir no banco
    const result = await pool.query(
      `INSERT INTO usuarios (nome_usuario, email, senha, datacriacao, ultimaatualizacao)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, nome_usuario, email, datacriacao, ultimaatualizacao`,
      [nome_usuario, email, senhaHash]
    );

    return result.rows[0];
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Validar login (email + senha)
 */
export async function validateLogin(
  email: string,
  senha: string
): Promise<ITokenPayload | null> {
  try {
    const user = await findUserWithPassword(email);

    if (!user) {
      return null;
    }

    // Validar senha
    const senhaValida = await comparePassword(senha, user.senha);

    if (!senhaValida) {
      return null;
    }

    // Retornar payload para token
    return {
      id: user.id,
      email: user.email,
      nome_usuario: user.nome_usuario,
    };
  } catch (error) {
    console.error('❌ Erro ao validar login:', error);
    throw error;
  }
}

/**
 * Atualizar último acesso do usuário
 */
export async function updateLastLogin(id: number): Promise<void> {
  try {
    await pool.query(
      'UPDATE usuarios SET ultimaatualizacao = NOW() WHERE id = $1',
      [id]
    );
  } catch (error) {
    console.error('❌ Erro ao atualizar último acesso:', error);
  }
}
