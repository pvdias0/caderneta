/**
 * Tipos para Dashboard e Estatísticas
 */

export interface IDashboardStats {
  totalAReceber: number;
  clientesAtivos: number;
  vendasMes: number;
  ticketMedio: number;
  variacao: {
    totalAReceber: number; // percentual
    clientesAtivos: number;
    vendasMes: number;
    ticketMedio: number;
  };
}

export interface IChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
}

export interface IChangePasswordResponse {
  message: string;
}
