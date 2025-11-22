import pool from "../config/database.js";
import {
  Produto,
  CreateProdutoDTO,
  UpdateProdutoDTO,
} from "../types/produto.js";

export class ProdutoService {
  /**
   * Listar todos os produtos do usuário
   */
  async getAllProdutos(usuarioId: number): Promise<Produto[]> {
    const query = `
      SELECT 
        id_produto,
        nome,
        valor_produto,
        quantidade_estoque,
        id_usuario,
        datacriacao,
        ultimaatualizacao
      FROM produto
      WHERE id_usuario = $1
      ORDER BY nome ASC
    `;

    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      throw new Error("Falha ao listar produtos");
    }
  }

  /**
   * Obter um produto específico
   */
  async getProdutoById(
    produtoId: number,
    usuarioId: number
  ): Promise<Produto | null> {
    const query = `
      SELECT 
        id_produto,
        nome,
        valor_produto,
        quantidade_estoque,
        id_usuario,
        datacriacao,
        ultimaatualizacao
      FROM produto
      WHERE id_produto = $1 AND id_usuario = $2
    `;

    try {
      const result = await pool.query(query, [produtoId, usuarioId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Erro ao obter produto:", error);
      throw new Error("Falha ao obter produto");
    }
  }

  /**
   * Criar um novo produto
   */
  async createProduto(
    usuarioId: number,
    data: CreateProdutoDTO
  ): Promise<Produto> {
    const { nome, valor_produto, quantidade_estoque } = data;

    // Validar entrada
    if (!nome || typeof nome !== "string" || nome.trim() === "") {
      throw new Error("Nome do produto é obrigatório");
    }

    if (typeof valor_produto !== "number" || valor_produto < 0) {
      throw new Error("Valor do produto deve ser um número não-negativo");
    }

    if (typeof quantidade_estoque !== "number" || quantidade_estoque < 0) {
      throw new Error("Quantidade em estoque deve ser um número não-negativo");
    }

    const query = `
      INSERT INTO produto (nome, valor_produto, quantidade_estoque, id_usuario)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id_produto,
        nome,
        valor_produto,
        quantidade_estoque,
        id_usuario,
        datacriacao,
        ultimaatualizacao
    `;

    try {
      const result = await pool.query(query, [
        nome.trim(),
        valor_produto,
        quantidade_estoque,
        usuarioId,
      ]);
      return result.rows[0];
    } catch (error: any) {
      console.error("Erro ao criar produto:", error);
      if (error.code === "23505") {
        throw new Error("Um produto com este nome já existe");
      }
      throw new Error("Falha ao criar produto");
    }
  }

  /**
   * Atualizar um produto
   */
  async updateProduto(
    produtoId: number,
    usuarioId: number,
    data: UpdateProdutoDTO
  ): Promise<Produto> {
    const { nome, valor_produto, quantidade_estoque } = data;

    // Montar a query dinamicamente com os campos fornecidos
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (nome !== undefined) {
      if (typeof nome !== "string" || nome.trim() === "") {
        throw new Error("Nome do produto deve ser uma string não-vazia");
      }
      updates.push(`nome = $${paramCount}`);
      values.push(nome.trim());
      paramCount++;
    }

    if (valor_produto !== undefined) {
      if (typeof valor_produto !== "number" || valor_produto < 0) {
        throw new Error("Valor do produto deve ser um número não-negativo");
      }
      updates.push(`valor_produto = $${paramCount}`);
      values.push(valor_produto);
      paramCount++;
    }

    if (quantidade_estoque !== undefined) {
      if (typeof quantidade_estoque !== "number" || quantidade_estoque < 0) {
        throw new Error(
          "Quantidade em estoque deve ser um número não-negativo"
        );
      }
      updates.push(`quantidade_estoque = $${paramCount}`);
      values.push(quantidade_estoque);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new Error("Nenhum campo fornecido para atualizar");
    }

    updates.push(`ultimaatualizacao = NOW()`);
    values.push(produtoId);
    values.push(usuarioId);

    const query = `
      UPDATE produto
      SET ${updates.join(", ")}
      WHERE id_produto = $${paramCount} AND id_usuario = $${paramCount + 1}
      RETURNING 
        id_produto,
        nome,
        valor_produto,
        quantidade_estoque,
        id_usuario,
        datacriacao,
        ultimaatualizacao
    `;

    try {
      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        throw new Error("Produto não encontrado");
      }
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      throw new Error("Falha ao atualizar produto");
    }
  }

  /**
   * Deletar um produto
   */
  async deleteProduto(produtoId: number, usuarioId: number): Promise<void> {
    const query = `
      DELETE FROM produto
      WHERE id_produto = $1 AND id_usuario = $2
    `;

    try {
      const result = await pool.query(query, [produtoId, usuarioId]);
      if (result.rowCount === 0) {
        throw new Error("Produto não encontrado");
      }
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      throw new Error("Falha ao deletar produto");
    }
  }

  /**
   * Deletar múltiplos produtos
   */
  async deleteProdutos(produtoIds: number[], usuarioId: number): Promise<void> {
    if (produtoIds.length === 0) {
      throw new Error("Nenhum produto para deletar");
    }

    const placeholders = produtoIds.map((_, i) => `$${i + 1}`).join(", ");
    const query = `
      DELETE FROM produto
      WHERE id_produto IN (${placeholders}) AND id_usuario = $${
      produtoIds.length + 1
    }
    `;

    try {
      await pool.query(query, [...produtoIds, usuarioId]);
    } catch (error) {
      console.error("Erro ao deletar produtos:", error);
      throw new Error("Falha ao deletar produtos");
    }
  }

  /**
   * Buscar produtos por nome
   */
  async searchProdutos(
    usuarioId: number,
    searchTerm: string
  ): Promise<Produto[]> {
    const query = `
      SELECT 
        id_produto,
        nome,
        valor_produto,
        quantidade_estoque,
        id_usuario,
        datacriacao,
        ultimaatualizacao
      FROM produto
      WHERE id_usuario = $1 AND nome ILIKE $2
      ORDER BY nome ASC
    `;

    try {
      const result = await pool.query(query, [usuarioId, `%${searchTerm}%`]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      throw new Error("Falha ao buscar produtos");
    }
  }
}

const produtoService = new ProdutoService();
export default produtoService;
