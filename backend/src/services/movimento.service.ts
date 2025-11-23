import pool from "../config/database.js";
import { MovimentoCompleto } from "../types/movimento.js";

export class MovimentoService {
  /**
   * Obter conta do cliente
   */
  async getContaByClienteId(
    clienteId: number,
    usuarioId: number
  ): Promise<number | null> {
    const query = `
      SELECT c.id_conta
      FROM conta c
      JOIN cliente cl ON c.id_cliente = cl.id_cliente
      WHERE cl.id_cliente = $1 AND cl.id_usuario = $2
    `;

    try {
      const result = await pool.query(query, [clienteId, usuarioId]);
      return result.rows[0]?.id_conta || null;
    } catch (error) {
      console.error("Erro ao obter conta:", error);
      throw new Error("Falha ao obter conta");
    }
  }

  /**
   * Listar movimentos de um cliente
   */
  async getMovimentosByCliente(
    clienteId: number,
    usuarioId: number
  ): Promise<MovimentoCompleto[]> {
    const query = `
      SELECT 
        m.id_movimento,
        m.id_conta,
        m.tipo,
        COALESCE(c.valor_compra, p.valor_pagamento) AS valor,
        COALESCE(c.data_compra, p.data_pagamento) AS data_movimento,
        m.id_compra,
        m.id_pagamento
      FROM movimento m
      JOIN conta ct ON m.id_conta = ct.id_conta
      JOIN cliente cl ON ct.id_cliente = cl.id_cliente
      LEFT JOIN compra c ON m.id_compra = c.id_compra
      LEFT JOIN pagamento p ON m.id_pagamento = p.id_pagamento
      WHERE cl.id_cliente = $1 AND cl.id_usuario = $2
      ORDER BY data_movimento DESC
    `;

    try {
      const result = await pool.query(query, [clienteId, usuarioId]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao listar movimentos:", error);
      throw new Error("Falha ao listar movimentos");
    }
  }

  /**
   * Criar uma compra (cria movimento automaticamente via trigger)
   */
  async createCompra(
    contaId: number,
    valorCompra: number,
    usuarioId: number
  ): Promise<any> {
    // Validar que a conta pertence ao usuário
    const validationQuery = `
      SELECT c.id_conta
      FROM conta c
      JOIN cliente cl ON c.id_cliente = cl.id_cliente
      WHERE c.id_conta = $1 AND cl.id_usuario = $2
    `;

    try {
      const validation = await pool.query(validationQuery, [
        contaId,
        usuarioId,
      ]);
      if (validation.rows.length === 0) {
        throw new Error("Conta não encontrada ou não pertence ao usuário");
      }

      const query = `
        INSERT INTO compra (id_conta, valor_compra)
        VALUES ($1, $2)
        RETURNING 
          id_compra,
          id_conta,
          valor_compra,
          data_compra,
          datacriacao,
          ultimaatualizacao
      `;

      const result = await pool.query(query, [contaId, valorCompra]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao criar compra:", error);
      throw new Error("Falha ao criar compra");
    }
  }

  /**
   * Criar um pagamento (cria movimento automaticamente via trigger)
   */
  async createPagamento(
    contaId: number,
    valorPagamento: number,
    usuarioId: number
  ): Promise<any> {
    // Validar que a conta pertence ao usuário
    const validationQuery = `
      SELECT c.id_conta
      FROM conta c
      JOIN cliente cl ON c.id_cliente = cl.id_cliente
      WHERE c.id_conta = $1 AND cl.id_usuario = $2
    `;

    try {
      const validation = await pool.query(validationQuery, [
        contaId,
        usuarioId,
      ]);
      if (validation.rows.length === 0) {
        throw new Error("Conta não encontrada ou não pertence ao usuário");
      }

      const query = `
        INSERT INTO pagamento (id_conta, valor_pagamento)
        VALUES ($1, $2)
        RETURNING 
          id_pagamento,
          id_conta,
          valor_pagamento,
          data_pagamento,
          datacriacao,
          ultimaatualizacao
      `;

      const result = await pool.query(query, [contaId, valorPagamento]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      throw new Error("Falha ao criar pagamento");
    }
  }

  /**
   * Atualizar uma compra
   */
  async updateCompra(
    compraId: number,
    valorCompra: number,
    usuarioId: number
  ): Promise<any> {
    // Validar que a compra pertence ao usuário
    const validationQuery = `
      SELECT c.id_compra
      FROM compra c
      JOIN conta ct ON c.id_conta = ct.id_conta
      JOIN cliente cl ON ct.id_cliente = cl.id_cliente
      WHERE c.id_compra = $1 AND cl.id_usuario = $2
    `;

    try {
      const validation = await pool.query(validationQuery, [
        compraId,
        usuarioId,
      ]);
      if (validation.rows.length === 0) {
        throw new Error("Compra não encontrada ou não pertence ao usuário");
      }

      const query = `
        UPDATE compra
        SET valor_compra = $1, ultimaatualizacao = NOW()
        WHERE id_compra = $2
        RETURNING 
          id_compra,
          id_conta,
          valor_compra,
          data_compra,
          datacriacao,
          ultimaatualizacao
      `;

      const result = await pool.query(query, [valorCompra, compraId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao atualizar compra:", error);
      throw new Error("Falha ao atualizar compra");
    }
  }

  /**
   * Atualizar um pagamento
   */
  async updatePagamento(
    pagamentoId: number,
    valorPagamento: number,
    usuarioId: number
  ): Promise<any> {
    // Validar que o pagamento pertence ao usuário
    const validationQuery = `
      SELECT p.id_pagamento
      FROM pagamento p
      JOIN conta ct ON p.id_conta = ct.id_conta
      JOIN cliente cl ON ct.id_cliente = cl.id_cliente
      WHERE p.id_pagamento = $1 AND cl.id_usuario = $2
    `;

    try {
      const validation = await pool.query(validationQuery, [
        pagamentoId,
        usuarioId,
      ]);
      if (validation.rows.length === 0) {
        throw new Error("Pagamento não encontrado ou não pertence ao usuário");
      }

      const query = `
        UPDATE pagamento
        SET valor_pagamento = $1, ultimaatualizacao = NOW()
        WHERE id_pagamento = $2
        RETURNING 
          id_pagamento,
          id_conta,
          valor_pagamento,
          data_pagamento,
          datacriacao,
          ultimaatualizacao
      `;

      const result = await pool.query(query, [valorPagamento, pagamentoId]);
      return result.rows[0];
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      throw new Error("Falha ao atualizar pagamento");
    }
  }

  /**
   * Deletar uma compra
   */
  async deleteCompra(compraId: number, usuarioId: number): Promise<void> {
    // Validar que a compra pertence ao usuário
    const validationQuery = `
      SELECT c.id_compra
      FROM compra c
      JOIN conta ct ON c.id_conta = ct.id_conta
      JOIN cliente cl ON ct.id_cliente = cl.id_cliente
      WHERE c.id_compra = $1 AND cl.id_usuario = $2
    `;

    try {
      const validation = await pool.query(validationQuery, [
        compraId,
        usuarioId,
      ]);
      if (validation.rows.length === 0) {
        throw new Error("Compra não encontrada ou não pertence ao usuário");
      }

      const query = `
        DELETE FROM compra
        WHERE id_compra = $1
      `;

      await pool.query(query, [compraId]);
    } catch (error) {
      console.error("Erro ao deletar compra:", error);
      throw new Error("Falha ao deletar compra");
    }
  }

  /**
   * Deletar um pagamento
   */
  async deletePagamento(pagamentoId: number, usuarioId: number): Promise<void> {
    // Validar que o pagamento pertence ao usuário
    const validationQuery = `
      SELECT p.id_pagamento
      FROM pagamento p
      JOIN conta ct ON p.id_conta = ct.id_conta
      JOIN cliente cl ON ct.id_cliente = cl.id_cliente
      WHERE p.id_pagamento = $1 AND cl.id_usuario = $2
    `;

    try {
      const validation = await pool.query(validationQuery, [
        pagamentoId,
        usuarioId,
      ]);
      if (validation.rows.length === 0) {
        throw new Error("Pagamento não encontrado ou não pertence ao usuário");
      }

      const query = `
        DELETE FROM pagamento
        WHERE id_pagamento = $1
      `;

      await pool.query(query, [pagamentoId]);
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error);
      throw new Error("Falha ao deletar pagamento");
    }
  }
}

const movimentoService = new MovimentoService();
export default movimentoService;
