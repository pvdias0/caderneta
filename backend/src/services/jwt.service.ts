import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import config from '../config/index.js';
import { ITokenPayload, ITokenResponse, IDecodedToken } from '../types/auth.js';

/**
 * Serviço de JWT - Gera, valida e faz refresh de tokens
 */

/**
 * Gera um novo access token
 */
export function generateAccessToken(payload: ITokenPayload): string {
  return jwt.sign(payload, config.jwt.secret as string, {
    expiresIn: config.jwt.expire,
  } as any);
}

/**
 * Gera um novo refresh token
 */
export function generateRefreshToken(payload: ITokenPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret as string, {
    expiresIn: config.jwt.refreshExpire,
  } as any);
}

/**
 * Gera ambos os tokens (access e refresh)
 */
export function generateTokens(payload: ITokenPayload): ITokenResponse {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.expire,
  };
}

/**
 * Valida um access token
 */
export function verifyAccessToken(token: string): IDecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as IDecodedToken;
    return decoded;
  } catch (error) {
    console.error('❌ Erro ao validar access token:', error);
    return null;
  }
}

/**
 * Valida um refresh token
 */
export function verifyRefreshToken(token: string): IDecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as IDecodedToken;
    return decoded;
  } catch (error) {
    console.error('❌ Erro ao validar refresh token:', error);
    return null;
  }
}

/**
 * Decodifica um token sem validar a assinatura (usar com cuidado)
 */
export function decodeToken(token: string): IDecodedToken | null {
  try {
    const decoded = jwt.decode(token) as IDecodedToken;
    return decoded;
  } catch (error) {
    console.error('❌ Erro ao decodificar token:', error);
    return null;
  }
}
