/**
 * Tipos para gerenciamento de movimentos (compras/pagamentos)
 */

export interface IItemCompra {
  id_item_compra: number;
  id_compra: number;
  id_produto: number;
  quantidade: number;
  valor_unitario: number;
  datacriacao?: string;
  ultimaatualizacao?: string;
  nome_produto?: string; // Nome do produto para exibição
}

export interface IMovimento {
  id_movimento: number;
  id_conta: number;
  tipo: "COMPRA" | "PAGAMENTO" | "AJUSTE";
  valor: number;
  data_movimento: string;
  id_compra?: number;
  id_pagamento?: number;
  itens?: IItemCompra[];
}

export interface ICreateCompraDTO {
  data_compra: string;
  itens: Array<{
    id_produto: number;
    quantidade: number;
    valor_unitario: number;
  }>;
}

export interface ICreatePagamentoDTO {
  valor_pagamento: number;
  data_pagamento?: string;
}

export interface IUpdatePagamentoDTO {
  valor_pagamento?: number;
  data_pagamento?: string;
}
