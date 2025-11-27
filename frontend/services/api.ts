/**
 * Serviço de API client para comunicação com backend
 */

import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:8080";

// Tipos para respostas da API
export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

class ApiService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  /**
   * Inicializa o serviço carregando tokens armazenados
   */
  async initialize(): Promise<void> {
    try {
      this.accessToken = await SecureStore.getItemAsync("accessToken");
      this.refreshToken = await SecureStore.getItemAsync("refreshToken");
    } catch (error) {
      console.error("Erro ao carregar tokens:", error);
    }
  }

  /**
   * Define os tokens (após login/register)
   */
  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    try {
      await SecureStore.setItemAsync("accessToken", accessToken);
      await SecureStore.setItemAsync("refreshToken", refreshToken);
    } catch (error) {
      console.error("Erro ao armazenar tokens:", error);
      throw error;
    }
  }

  /**
   * Remove os tokens
   */
  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;

    try {
      await SecureStore.deleteItemAsync("accessToken");
      await SecureStore.deleteItemAsync("refreshToken");
    } catch (error) {
      console.error("Erro ao deletar tokens:", error);
    }
  }

  /**
   * Retorna o access token atual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Retorna o refresh token atual
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Realiza uma requisição genérica (pública para uso em outros pontos)
   */
  async request<T>(
    method: string,
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    return this.privateRequest(method, endpoint, data, includeAuth);
  }

  /**
   * Realiza uma requisição genérica (privada - implementação real)
   */
  private async privateRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (includeAuth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      // Se token expirou, tenta renovar
      if (response.status === 401 && includeAuth && this.refreshToken) {
        console.log("Token expirado, tentando renovar...");
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Tenta novamente com novo token
          return this.privateRequest(method, endpoint, data, includeAuth);
        }
      }

      if (!response.ok) {
        throw new Error(responseData.error || "Erro na requisição");
      }

      return responseData;
    } catch (error) {
      console.error(`Erro em ${method} ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Login - POST /api/v1/auth/login
   */
  async login(email: string, senha: string): Promise<any> {
    return this.request("POST", "/api/v1/auth/login", { email, senha }, false);
  }

  /**
   * Registro - POST /api/v1/auth/register
   */
  async register(
    nome_usuario: string,
    email: string,
    senha: string
  ): Promise<any> {
    return this.request(
      "POST",
      "/api/v1/auth/register",
      { nome_usuario, email, senha },
      false
    );
  }

  /**
   * Obter dados do usuário autenticado - GET /api/v1/auth/me
   */
  async getMe(): Promise<any> {
    return this.request("GET", "/api/v1/auth/me");
  }

  /**
   * Renovar access token - POST /api/v1/auth/refresh
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.request<any>(
        "POST",
        "/api/v1/auth/refresh",
        { refreshToken: this.refreshToken },
        false
      );

      if (response.accessToken) {
        this.accessToken = response.accessToken;
        await SecureStore.setItemAsync("accessToken", response.accessToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Erro ao renovar token:", error);
      return false;
    }
  }

  /**
   * Logout - POST /api/v1/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await this.request("POST", "/api/v1/auth/logout");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      await this.clearTokens();
    }
  }

  /**
   * Listar clientes - GET /api/v1/clientes
   */
  async getClientes(): Promise<any> {
    const response = (await this.request("GET", "/api/v1/clientes")) as any;
    return response?.data || [];
  }

  /**
   * Listar clientes - Alias para getClientes
   */
  async getAllClientes(): Promise<any> {
    return this.getClientes();
  }

  /**
   * Obter cliente - GET /api/v1/clientes/:id
   */
  async getClienteById(id: number): Promise<any> {
    return this.request("GET", `/api/v1/clientes/${id}`);
  }

  /**
   * Criar cliente - POST /api/v1/clientes
   */
  async createCliente(data: any): Promise<any> {
    return this.request("POST", "/api/v1/clientes", data);
  }

  /**
   * Atualizar cliente - PUT /api/v1/clientes/:id
   */
  async updateCliente(id: number, data: any): Promise<any> {
    return this.request("PUT", `/api/v1/clientes/${id}`, data);
  }

  /**
   * Deletar cliente - DELETE /api/v1/clientes/:id
   */
  async deleteCliente(id: number): Promise<any> {
    return this.request("DELETE", `/api/v1/clientes/${id}`);
  }

  /**
   * Deletar múltiplos clientes - POST /api/v1/clientes/bulk/delete
   */
  async deleteClientes(ids: number[]): Promise<any> {
    return this.request("DELETE", "/api/v1/clientes/bulk/delete", { ids });
  }

  /**
   * Listar produtos - GET /api/v1/produtos
   */
  async getProdutos(): Promise<any> {
    return this.request("GET", "/api/v1/produtos");
  }

  /**
   * Obter produto - GET /api/v1/produtos/:id
   */
  async getProdutoById(id: number): Promise<any> {
    return this.request("GET", `/api/v1/produtos/${id}`);
  }

  /**
   * Criar produto - POST /api/v1/produtos
   */
  async createProduto(data: any): Promise<any> {
    return this.request("POST", "/api/v1/produtos", data);
  }

  /**
   * Atualizar produto - PUT /api/v1/produtos/:id
   */
  async updateProduto(id: number, data: any): Promise<any> {
    return this.request("PUT", `/api/v1/produtos/${id}`, data);
  }

  /**
   * Deletar produto - DELETE /api/v1/produtos/:id
   */
  async deleteProduto(id: number): Promise<any> {
    return this.request("DELETE", `/api/v1/produtos/${id}`);
  }

  /**
   * Deletar múltiplos produtos - DELETE /api/v1/produtos/bulk/delete
   */
  async deleteProdutos(ids: number[]): Promise<any> {
    return this.request("DELETE", "/api/v1/produtos/bulk/delete", { ids });
  }

  /**
   * Listar movimentos de um cliente - GET /api/v1/clientes/:clienteId/movimentos
   */
  async getMovimentosByCliente(clienteId: number): Promise<any> {
    return this.request("GET", `/api/v1/clientes/${clienteId}/movimentos`);
  }

  /**
   * Criar compra com itens - POST /api/v1/clientes/:clienteId/movimentos/compra-com-itens
   */
  async createCompraComItens(clienteId: number, data: any): Promise<any> {
    return this.request(
      "POST",
      `/api/v1/clientes/${clienteId}/movimentos/compra-com-itens`,
      data
    );
  }

  /**
   * Criar pagamento - POST /api/v1/clientes/:clienteId/movimentos/pagamento
   */
  async createPagamento(clienteId: number, data: any): Promise<any> {
    return this.request(
      "POST",
      `/api/v1/clientes/${clienteId}/movimentos/pagamento`,
      data
    );
  }

  /**
   * Obter total a receber de um cliente - GET /api/v1/clientes/:id/total-a-receber
   */
  async getTotalAReceber(clienteId: number): Promise<any> {
    return this.request("GET", `/api/v1/clientes/${clienteId}/total-a-receber`);
  }

  /**
   * Obter total a receber geral - GET /api/v1/clientes/total-a-receber/geral
   */
  async getTotalAReceberGeral(): Promise<any> {
    return this.request("GET", "/api/v1/clientes/total-a-receber/geral");
  }

  /**
   * Obter dashboard stats - GET /api/v1/dashboard/stats
   */
  async getDashboardStats(): Promise<any> {
    const response = (await this.request(
      "GET",
      "/api/v1/dashboard/stats"
    )) as any;
    return (
      response?.data || {
        totalAReceber: 0,
        clientesAtivos: 0,
        vendasMes: 0,
        ticketMedio: 0,
        variacao: {
          totalAReceber: 0,
          clientesAtivos: 0,
          vendasMes: 0,
          ticketMedio: 0,
        },
      }
    );
  }

  /**
   * Gerar extrato em PDF - GET /api/v1/clientes/:clienteId/extrato
   * Retorna o blob do PDF para download
   */
  async gerarExtratoCliente(clienteId: number): Promise<Blob> {
    const url = `${API_URL}/api/v1/clientes/${clienteId}/extrato`;
    const headers: Record<string, string> = {};

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Falha ao gerar extrato");
      }

      return await response.blob();
    } catch (error) {
      console.error("Erro ao gerar extrato:", error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
export const apiService = new ApiService();
