/**
 * Tipos para Produto (Estoque)
 */

export interface Produto {
  id_produto: number;
  nome: string;
  valor_produto: number;
  quantidade_estoque: number;
  id_usuario: number;
  datacriacao: string;
  ultimaatualizacao: string;
}

export interface CreateProdutoDTO {
  nome: string;
  valor_produto: number;
  quantidade_estoque: number;
}

export interface UpdateProdutoDTO {
  nome?: string;
  valor_produto?: number;
  quantidade_estoque?: number;
}
