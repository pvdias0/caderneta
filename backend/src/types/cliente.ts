export interface Cliente {
  id: string;
  usuario_id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  data_criacao: Date;
  ultima_atualizacao: Date;
}

export interface CreateClienteDTO {
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
}
