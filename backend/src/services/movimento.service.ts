import pool from "../config/database.js";
import { MovimentoCompleto } from "../types/movimento.js";
import { notificarTotalAReceberAtualizado } from "../index.js";
import ClienteService from "./cliente.service.js";

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
      const movimentos = await pool.query(query, [clienteId, usuarioId]);

      // Para cada compra, buscar seus itens
      const movimentosComItens = await Promise.all(
        movimentos.rows.map(async (movimento) => {
          if (movimento.tipo === "COMPRA" && movimento.id_compra) {
            const itensQuery = `
              SELECT 
                ic.id_item_compra,
                ic.id_compra,
                ic.id_produto,
                ic.quantidade,
                ic.valor_unitario
              FROM item_compra ic
              WHERE ic.id_compra = $1
              ORDER BY ic.id_item_compra
            `;

            try {
              const itensResult = await pool.query(itensQuery, [
                movimento.id_compra,
              ]);
              return {
                ...movimento,
                itens: itensResult.rows,
              };
            } catch (itensError) {
              console.error("Erro ao buscar itens da compra:", itensError);
              return movimento;
            }
          }
          return movimento;
        })
      );

      return movimentosComItens;
    } catch (error) {
      console.error("Erro ao listar movimentos:", error);
      throw new Error("Falha ao listar movimentos");
    }
  }

  /**
   * Criar uma compra com itens (carrinho)
   */
  async createCompraComItens(
    contaId: number,
    dataCompra: string,
    itens: Array<{
      id_produto: number;
      quantidade: number;
      valor_unitario: number;
    }>,
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

      // Calcular valor total da compra
      const valorTotal = itens.reduce(
        (sum, item) => sum + item.quantidade * item.valor_unitario,
        0
      );

      // Criar a compra (com data especificada)
      const compraQuery = `
        INSERT INTO compra (id_conta, valor_compra, data_compra)
        VALUES ($1, $2, $3)
        RETURNING 
          id_compra,
          id_conta,
          valor_compra,
          data_compra,
          datacriacao,
          ultimaatualizacao
      `;

      const compraResult = await pool.query(compraQuery, [
        contaId,
        valorTotal,
        dataCompra,
      ]);
      const compra = compraResult.rows[0];

      // Inserir itens da compra
      const itemsInsertidos = [];
      for (const item of itens) {
        const itemQuery = `
          INSERT INTO item_compra (id_compra, id_produto, quantidade, valor_unitario)
          VALUES ($1, $2, $3, $4)
          RETURNING 
            id_item_compra,
            id_compra,
            id_produto,
            quantidade,
            valor_unitario,
            datacriacao,
            ultimaatualizacao
        `;

        const itemResult = await pool.query(itemQuery, [
          compra.id_compra,
          item.id_produto,
          item.quantidade,
          item.valor_unitario,
        ]);

        itemsInsertidos.push(itemResult.rows[0]);

        // Subtrair quantidade do estoque após inserir item da compra
        const updateEstoqueQuery = `
          UPDATE produto
          SET quantidade_estoque = quantidade_estoque - $1,
              ultimaatualizacao = NOW()
          WHERE id_produto = $2
        `;

        await pool.query(updateEstoqueQuery, [
          item.quantidade,
          item.id_produto,
        ]);
      }

      // Retornar compra com itens
      const resultado = {
        ...compra,
        itens: itemsInsertidos,
      };

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);

      return resultado;
    } catch (error) {
      console.error("Erro ao criar compra com itens:", error);
      throw new Error("Falha ao criar compra com itens");
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
      const compra = result.rows[0];

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);

      return compra;
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
    dataPagamento: string | null,
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

      // Se data não informada, usar NOW()
      const dataSql = dataPagamento ? `'${dataPagamento}'::timestamp` : "NOW()";

      const query = `
        INSERT INTO pagamento (id_conta, valor_pagamento, data_pagamento)
        VALUES ($1, $2, ${dataSql})
        RETURNING 
          id_pagamento,
          id_conta,
          valor_pagamento,
          data_pagamento,
          datacriacao,
          ultimaatualizacao
      `;

      const result = await pool.query(query, [contaId, valorPagamento]);
      const pagamento = result.rows[0];

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);

      return pagamento;
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
    dataCompra: string | null,
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

      // Se data_compra for fornecida, usar; caso contrário, manter a data atual
      let query: string;
      let params: any[];

      if (dataCompra) {
        query = `
          UPDATE compra
          SET valor_compra = $1, data_compra = $2, ultimaatualizacao = NOW()
          WHERE id_compra = $3
          RETURNING 
            id_compra,
            id_conta,
            valor_compra,
            data_compra,
            datacriacao,
            ultimaatualizacao
        `;
        params = [valorCompra, dataCompra, compraId];
      } else {
        query = `
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
        params = [valorCompra, compraId];
      }

      const result = await pool.query(query, params);
      const compra = result.rows[0];

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);

      return compra;
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
    dataPagamento: string | null,
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

      // Se data_pagamento for fornecida, usar; caso contrário, manter a data atual
      let query: string;
      let params: any[];

      if (dataPagamento) {
        query = `
          UPDATE pagamento
          SET valor_pagamento = $1, data_pagamento = $2, ultimaatualizacao = NOW()
          WHERE id_pagamento = $3
          RETURNING 
            id_pagamento,
            id_conta,
            valor_pagamento,
            data_pagamento,
            datacriacao,
            ultimaatualizacao
        `;
        params = [valorPagamento, dataPagamento, pagamentoId];
      } else {
        query = `
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
        params = [valorPagamento, pagamentoId];
      }

      const result = await pool.query(query, params);
      const pagamento = result.rows[0];

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);

      return pagamento;
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

      // Buscar itens da compra para devolver ao estoque
      const itensQuery = `
        SELECT id_produto, quantidade
        FROM item_compra
        WHERE id_compra = $1
      `;

      const itensResult = await pool.query(itensQuery, [compraId]);

      // Devolver quantidade ao estoque para cada item
      for (const item of itensResult.rows) {
        const updateEstoqueQuery = `
          UPDATE produto
          SET quantidade_estoque = quantidade_estoque + $1,
              ultimaatualizacao = NOW()
          WHERE id_produto = $2
        `;

        await pool.query(updateEstoqueQuery, [
          item.quantidade,
          item.id_produto,
        ]);
      }

      // Deletar itens da compra
      await pool.query(`DELETE FROM item_compra WHERE id_compra = $1`, [
        compraId,
      ]);

      // Deletar movimento associado
      await pool.query(`DELETE FROM movimento WHERE id_compra = $1`, [
        compraId,
      ]);

      // Deletar a compra
      const query = `
        DELETE FROM compra
        WHERE id_compra = $1
      `;

      await pool.query(query, [compraId]);

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);
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

      // Deletar movimento associado
      await pool.query(`DELETE FROM movimento WHERE id_pagamento = $1`, [
        pagamentoId,
      ]);

      // Deletar o pagamento
      const query = `
        DELETE FROM pagamento
        WHERE id_pagamento = $1
      `;

      await pool.query(query, [pagamentoId]);

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error);
      throw new Error("Falha ao deletar pagamento");
    }
  }

  /**
   * Atualizar uma compra com itens
   */
  async updateCompraComItens(
    compraId: number,
    dataCompra: string,
    itens: Array<{
      id_produto: number;
      quantidade: number;
      valor_unitario: number;
    }>,
    usuarioId: number
  ): Promise<any> {
    // Validar que a compra pertence ao usuário
    const validationQuery = `
      SELECT c.id_compra, c.id_conta
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

      const contaId = validation.rows[0].id_conta;

      // Calcular o valor total da compra
      const valorTotal = itens.reduce((total, item) => {
        return total + item.quantidade * item.valor_unitario;
      }, 0);

      // Obter os itens antigos para devolução de estoque
      const oldItensQuery = `
        SELECT ic.id_produto, ic.quantidade
        FROM item_compra ic
        WHERE ic.id_compra = $1
      `;
      const oldItensResult = await pool.query(oldItensQuery, [compraId]);

      // Retornar estoque dos itens antigos
      for (const oldItem of oldItensResult.rows) {
        await pool.query(
          `UPDATE produto SET quantidade_estoque = quantidade_estoque + $1 WHERE id_produto = $2`,
          [oldItem.quantidade, oldItem.id_produto]
        );
      }

      // Atualizar a compra
      const updateCompraQuery = `
        UPDATE compra
        SET valor_compra = $1, data_compra = $2, ultimaatualizacao = NOW()
        WHERE id_compra = $3
        RETURNING 
          id_compra,
          id_conta,
          valor_compra,
          data_compra,
          datacriacao,
          ultimaatualizacao
      `;

      const compraResult = await pool.query(updateCompraQuery, [
        valorTotal,
        dataCompra,
        compraId,
      ]);

      // Deletar itens antigos
      await pool.query(`DELETE FROM item_compra WHERE id_compra = $1`, [
        compraId,
      ]);

      // Inserir novos itens
      for (const item of itens) {
        const insertItemQuery = `
          INSERT INTO item_compra (id_compra, id_produto, quantidade, valor_unitario, datacriacao, ultimaatualizacao)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id_item_compra
        `;

        await pool.query(insertItemQuery, [
          compraId,
          item.id_produto,
          item.quantidade,
          item.valor_unitario,
        ]);

        // Descontar estoque
        await pool.query(
          `UPDATE produto SET quantidade_estoque = quantidade_estoque - $1 WHERE id_produto = $2`,
          [item.quantidade, item.id_produto]
        );
      }

      const compra = compraResult.rows[0];

      // Notificar atualização do total
      const novoTotal = await ClienteService.getTotalAReceberGeral(usuarioId);
      notificarTotalAReceberAtualizado(usuarioId, novoTotal);

      return compra;
    } catch (error) {
      console.error("Erro ao atualizar compra com itens:", error);
      throw new Error("Falha ao atualizar compra com itens");
    }
  }
}

const movimentoService = new MovimentoService();
export default movimentoService;
