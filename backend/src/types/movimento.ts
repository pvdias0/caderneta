export interface Movimento {
  id_movimento: number;
  id_conta: number;
  tipo: "COMPRA" | "PAGAMENTO" | "AJUSTE";
  id_compra?: number;
  id_pagamento?: number;
  valor?: number;
  data_movimento?: string;
}

export interface CreateMovimentoDTO {
  tipo: "COMPRA" | "PAGAMENTO";
  valor: number;
}

export interface UpdateMovimentoDTO {
  tipo?: "COMPRA" | "PAGAMENTO";
  valor?: number;
}

export interface MovimentoCompleto {
  id_movimento: number;
  id_conta: number;
  tipo: "COMPRA" | "PAGAMENTO" | "AJUSTE";
  valor: number;
  data_movimento: string;
  id_compra?: number;
  id_pagamento?: number;
}
