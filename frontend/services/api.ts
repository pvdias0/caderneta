import { config } from "../config";

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
 * Interface para cliente
 */
export interface Cliente {
  id_cliente: number;
  nome: string;
  email?: string;
  telefone?: string;
  datacriacao: string;
  ultimaatualizacao: string;
  saldo_devedor?: number;
}

export interface CreateClienteRequest {
  nome: string;
  email?: string;
  telefone?: string;
}

export interface ClientesListResponse {
  success?: boolean;
  data?: Cliente[];
  clientes?: Cliente[];
  total?: number;
}

/**
 * Interface para Produto (Estoque)
 */
export interface Produto {
  id_produto: number;
  nome: string;
  valor_produto: number;
  quantidade_estoque: number;
  datacriacao: string;
  ultimaatualizacao: string;
}

export interface CreateProdutoRequest {
  nome: string;
  valor_produto: number;
  quantidade_estoque: number;
}

export interface ProdutosListResponse {
  success?: boolean;
  data?: Produto[];
  produtos?: Produto[];
  total?: number;
}

/**
 * Interface para Movimento
 */
export interface Movimento {
  id_movimento: number;
  id_conta: number;
  tipo: "COMPRA" | "PAGAMENTO" | "AJUSTE";
  valor: number;
  data_movimento: string;
  id_compra?: number;
  id_pagamento?: number;
}

export interface CreateMovimentoRequest {
  valor_compra?: number;
  valor_pagamento?: number;
}

export interface MovimentosListResponse {
  success?: boolean;
  data?: Movimento[];
  movimentos?: Movimento[];
  total?: number;
}

/**
 * Serviço de API com fetch
 */
class ApiService {
  private baseUrl: string = config.apiUrl;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onUnauthorized: (() => void) | null = null;

  /**
   * Registrar callback para quando houver erro de autenticação
   */
  setUnauthorizedCallback(callback: () => void): void {
    this.onUnauthorized = callback;
  }

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
        "Content-Type": "application/json",
        ...options.headers,
      };

      // Adicionar token se houver
      if (this.accessToken) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
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
        } else {
          // Refresh falhou, fazer logout
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
      }

      // Se for 401 sem refresh token, fazer logout
      if (response.status === 401) {
        if (this.onUnauthorized) {
          this.onUnauthorized();
        }
      }

      const contentType = response.headers.get("content-type");
      let data: any;

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        data: response.ok ? data : undefined,
        error: !response.ok ? data?.error || "Erro na requisição" : undefined,
        message: data?.message,
      };
    } catch (error) {
      console.error("❌ Erro na requisição:", error);
      return {
        status: 0,
        error: String(error),
      };
    }
  }

  /**
   * Login
   */
  async login(
    email: string,
    senha: string
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>("/api/v1/auth/login", {
      method: "POST",
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
    return this.request<RegisterResponse>("/api/v1/auth/register", {
      method: "POST",
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
        "/api/v1/auth/refresh",
        {
          method: "POST",
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
      console.error("❌ Erro ao renovar token:", error);
      return false;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<ApiResponse> {
    const response = await this.request("/api/v1/auth/logout", {
      method: "POST",
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
    return this.request("/api/v1/auth/me", {
      method: "GET",
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

  /**
   * Listar clientes do usuário
   */
  async getClientes(): Promise<ApiResponse<ClientesListResponse>> {
    return this.request<ClientesListResponse>("/api/v1/clientes", {
      method: "GET",
    });
  }

  /**
   * Obter um cliente específico
   */
  async getClienteById(id: number): Promise<ApiResponse<Cliente>> {
    return this.request<Cliente>(`/api/v1/clientes/${id}`, {
      method: "GET",
    });
  }

  /**
   * Criar novo cliente
   */
  async createCliente(
    data: CreateClienteRequest
  ): Promise<ApiResponse<Cliente>> {
    return this.request<Cliente>("/api/v1/clientes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Atualizar cliente
   */
  async updateCliente(
    id: number,
    data: Partial<CreateClienteRequest>
  ): Promise<ApiResponse<Cliente>> {
    return this.request<Cliente>(`/api/v1/clientes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletar cliente
   */
  async deleteCliente(id: number): Promise<ApiResponse> {
    return this.request(`/api/v1/clientes/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Deletar múltiplos clientes
   */
  async deleteClientes(ids: number[]): Promise<ApiResponse> {
    return this.request("/api/v1/clientes/bulk/delete", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  /**
   * Listar produtos do usuário
   */
  async getProdutos(): Promise<ApiResponse<ProdutosListResponse>> {
    return this.request<ProdutosListResponse>("/api/v1/produtos", {
      method: "GET",
    });
  }

  /**
   * Criar novo produto
   */
  async createProduto(
    data: CreateProdutoRequest
  ): Promise<ApiResponse<Produto>> {
    return this.request<Produto>("/api/v1/produtos", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Atualizar produto
   */
  async updateProduto(
    id: number,
    data: Partial<CreateProdutoRequest>
  ): Promise<ApiResponse<Produto>> {
    return this.request<Produto>(`/api/v1/produtos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Deletar produto
   */
  async deleteProduto(id: number): Promise<ApiResponse> {
    return this.request(`/api/v1/produtos/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Deletar múltiplos produtos
   */
  async deleteProdutos(ids: number[]): Promise<ApiResponse> {
    return this.request("/api/v1/produtos/bulk/delete", {
      method: "DELETE",
      body: JSON.stringify({ ids }),
    });
  }

  /**
   * Buscar produtos por nome
   */
  async searchProdutos(q: string): Promise<ApiResponse<ProdutosListResponse>> {
    return this.request<ProdutosListResponse>(
      `/api/v1/produtos/busca?q=${encodeURIComponent(q)}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Listar movimentos de um cliente
   */
  async getMovimentos(
    clienteId: number
  ): Promise<ApiResponse<MovimentosListResponse>> {
    return this.request<MovimentosListResponse>(
      `/api/v1/clientes/${clienteId}/movimentos`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Criar uma compra
   */
  async createCompra(
    clienteId: number,
    valorCompra: number
  ): Promise<ApiResponse<Movimento>> {
    return this.request<Movimento>(
      `/api/v1/clientes/${clienteId}/movimentos/compra`,
      {
        method: "POST",
        body: JSON.stringify({ valor_compra: valorCompra }),
      }
    );
  }

  /**
   * Criar um pagamento
   */
  async createPagamento(
    clienteId: number,
    valorPagamento: number
  ): Promise<ApiResponse<Movimento>> {
    return this.request<Movimento>(
      `/api/v1/clientes/${clienteId}/movimentos/pagamento`,
      {
        method: "POST",
        body: JSON.stringify({ valor_pagamento: valorPagamento }),
      }
    );
  }

  /**
   * Atualizar uma compra
   */
  async updateCompra(
    clienteId: number,
    compraId: number,
    valorCompra: number
  ): Promise<ApiResponse<Movimento>> {
    return this.request<Movimento>(
      `/api/v1/clientes/${clienteId}/movimentos/compra/${compraId}`,
      {
        method: "PUT",
        body: JSON.stringify({ valor_compra: valorCompra }),
      }
    );
  }

  /**
   * Atualizar um pagamento
   */
  async updatePagamento(
    clienteId: number,
    pagamentoId: number,
    valorPagamento: number
  ): Promise<ApiResponse<Movimento>> {
    return this.request<Movimento>(
      `/api/v1/clientes/${clienteId}/movimentos/pagamento/${pagamentoId}`,
      {
        method: "PUT",
        body: JSON.stringify({ valor_pagamento: valorPagamento }),
      }
    );
  }

  /**
   * Deletar uma compra
   */
  async deleteCompra(
    clienteId: number,
    compraId: number
  ): Promise<ApiResponse> {
    return this.request(
      `/api/v1/clientes/${clienteId}/movimentos/compra/${compraId}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Deletar um pagamento
   */
  async deletePagamento(
    clienteId: number,
    pagamentoId: number
  ): Promise<ApiResponse> {
    return this.request(
      `/api/v1/clientes/${clienteId}/movimentos/pagamento/${pagamentoId}`,
      {
        method: "DELETE",
      }
    );
  }
}

// Instância global do serviço
export const apiService = new ApiService();

export default apiService;
