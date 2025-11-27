/**
 * Tipos para gerenciamento de clientes
 */

export interface ICliente {
  id_cliente: number;
  nome: string;
  email: string;
  telefone: string;
  datacriacao: string;
  ultimaatualizacao: string;
  saldo_devedor: number;
}

export interface ICreateClienteDTO {
  nome: string;
  email: string;
  telefone: string;
}

export interface IUpdateClienteDTO {
  nome?: string;
  email?: string;
  telefone?: string;
}
