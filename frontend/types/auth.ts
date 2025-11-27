/**
 * Tipos para autenticação
 */

export interface IUser {
  id: number;
  email: string;
  nome_usuario: string;
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

export interface ILoginResponse {
  message: string;
  user: IUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface IRegisterResponse {
  message: string;
  user: IUser;
}

export interface ITokenPayload {
  id: number;
  email: string;
  nome_usuario: string;
}

export interface IAuthContext {
  user: IUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<void>;
  register: (
    nome_usuario: string,
    email: string,
    senha: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
