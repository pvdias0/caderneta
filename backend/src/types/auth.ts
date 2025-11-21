/**
 * Tipos de autenticação
 */

export interface IUser {
  id: number;
  nome_usuario: string;
  email: string;
  datacriacao: Date;
  ultimaatualizacao: Date;
}

export interface ITokenPayload {
  id: number;
  email: string;
  nome_usuario: string;
}

export interface ITokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface IAuthRequest {
  email?: string;
  nome_usuario?: string;
  senha: string;
}

export interface ILoginRequest {
  email: string;
  senha: string;
}

export interface IRegisterRequest {
  nome_usuario: string;
  email: string;
  senha: string;
}

export interface IRefreshTokenRequest {
  refreshToken: string;
}

export interface IDecodedToken {
  id: number;
  email: string;
  nome_usuario: string;
  iat: number;
  exp: number;
}
