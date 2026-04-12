/**
 * Tipos para Dashboard e Estatísticas
 */

export interface IDashboardStats {
  totalAReceber: number;
  clientesAtivos: number;
  vendasMes: number;
  vendasDia: number;
  ticketMedio: number;
  variacao: {
    totalAReceber: number; // percentual
    clientesAtivos: number;
    vendasMes: number;
    vendasDia: number;
    ticketMedio: number;
  };
}

export interface IRelatorioVendaItem {
  id_compra: number;
  cliente_nome: string;
  data_compra: string;
  valor_bruto: number;
  desconto: number;
  valor_liquido: number;
}

export interface IRelatorioVendas {
  periodo: {
    mode: "month" | "day";
    label: string;
    referenceDate: string;
    month?: number;
    year?: number;
  };
  resumo: {
    totalVendas: number;
    totalDescontos: number;
    quantidadeVendas: number;
  };
  vendas: IRelatorioVendaItem[];
}

export interface IChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
}

export interface IChangePasswordResponse {
  message: string;
}
