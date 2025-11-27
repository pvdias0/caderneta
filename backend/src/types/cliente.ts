export interface Cliente {
  id_cliente: string;
  nome: string;
  email?: string;
  telefone?: string;
  datacriacao: Date;
  ultimaatualizacao: Date;
  saldo_devedor?: number;
}

export interface CreateClienteDTO {
  nome: string;
  email?: string;
  telefone?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  email?: string;
  telefone?: string;
}
