import config from '../config';

/**
 * Interface para respostas da API
 */
export interface ApiResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Interface para login
 */
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
    nome_usuario: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

/**
 * Interface para registro
 */
export interface RegisterRequest {
  nome_usuario: string;
  email: string;
  senha: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    email: string;
    nome_usuario: string;
  };
}

/**
 * Serviço de API com fetch
 */
class ApiService {
  private baseUrl: string = config.apiUrl;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Fazer uma requisição genérica
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // Headers padrão
      const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Adicionar token se houver
      if (this.accessToken) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Se for 401 e tiver refresh token, tentar renovar
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retentar requisição original
          return this.request<T>(endpoint, options);
        }
      }

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        data: response.ok ? data : undefined,
        error: !response.ok ? data?.error || 'Erro na requisição' : undefined,
        message: data?.message,
      };
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      return {
        status: 0,
        error: String(error),
      };
    }
  }

  /**
   * Login
   */
  async login(email: string, senha: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    // Armazenar tokens se login foi bem-sucedido
    if (response.status === 200 && response.data?.tokens) {
      this.accessToken = response.data.tokens.accessToken;
      this.refreshToken = response.data.tokens.refreshToken;
    }

    return response;
  }

  /**
   * Registro
   */
  async register(
    nome_usuario: string,
    email: string,
    senha: string
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nome_usuario,
        email,
        senha,
      }),
    });
  }

  /**
   * Renovar token de acesso
   */
  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await this.request<{ accessToken: string }>(
        '/api/v1/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        }
      );

      if (response.status === 200 && response.data?.accessToken) {
        this.accessToken = response.data.accessToken;
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao renovar token:', error);
      return false;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse> {
    const response = await this.request('/api/v1/auth/logout', {
      method: 'POST',
    });

    // Limpar tokens
    this.accessToken = null;
    this.refreshToken = null;

    return response;
  }

  /**
   * Obter dados do usuário autenticado
   */
  async getMe(): Promise<ApiResponse<{ user: any }>> {
    return this.request('/api/v1/auth/me', {
      method: 'GET',
    });
  }

  /**
   * Definir tokens (para restaurar sessão)
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Obter access token atual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Obter refresh token atual
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Limpar tokens
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }
}

// Instância global do serviço
export const apiService = new ApiService();

export default apiService;
