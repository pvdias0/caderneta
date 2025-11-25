import pool from "../config/database.js";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "../types/cliente.js";

export class ClienteService {
  /**
   * Listar todos os clientes do usuário
   */
  async getAllClientes(usuarioId: number): Promise<Cliente[]> {
    const query = `
      SELECT 
        c.ID_Cliente,
        c.Nome,
        c.Email,
        c.Telefone,
        c.DataCriacao,
        c.UltimaAtualizacao,
        COALESCE(ct.Saldo_Devedor, 0) as saldo_devedor
      FROM cliente c
      LEFT JOIN conta ct ON c.ID_Cliente = ct.ID_Cliente
      WHERE c.ID_Usuario = $1
      ORDER BY c.Nome ASC
    `;

    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows;
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      throw new Error("Falha ao listar clientes");
    }
  }

  /**
   * Obter um cliente específico
   */
  async getClienteById(
    clienteId: number,
    usuarioId: number
  ): Promise<Cliente | null> {
    const query = `
      SELECT 
        c.ID_Cliente,
        c.Nome,
        c.Email,
        c.Telefone,
        c.DataCriacao,
        c.UltimaAtualizacao,
        COALESCE(ct.Saldo_Devedor, 0) as saldo_devedor
      FROM cliente c
      LEFT JOIN conta ct ON c.ID_Cliente = ct.ID_Cliente
      WHERE c.ID_Cliente = $1 AND c.ID_Usuario = $2
    `;

    try {
      const result = await pool.query(query, [clienteId, usuarioId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      throw new Error("Falha ao buscar cliente");
    }
  }

  /**
   * Criar um novo cliente
   */
  async createCliente(
    usuarioId: number,
    data: CreateClienteDTO
  ): Promise<Cliente> {
    const { nome, email, telefone } = data;

    // Validações
    if (!nome || nome.trim().length === 0) {
      throw new Error("Nome do cliente é obrigatório");
    }

    if (nome.length > 120) {
      throw new Error("Nome do cliente não pode exceder 120 caracteres");
    }

    // Validar email se fornecido
    if (email) {
      if (!this.isValidEmail(email)) {
        throw new Error("Email inválido");
      }

      if (email.length > 150) {
        throw new Error("Email não pode exceder 150 caracteres");
      }

      // Verificar se email já existe para este usuário
      const emailExists = await this.emailExistsForUser(email, usuarioId);
      if (emailExists) {
        throw new Error("Email já cadastrado para este usuário");
      }
    }

    // Validar telefone se fornecido
    if (telefone && telefone.length > 20) {
      throw new Error("Telefone não pode exceder 20 caracteres");
    }

    const query = `
      INSERT INTO cliente (ID_Usuario, Nome, Email, Telefone, DataCriacao, UltimaAtualizacao)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING 
        ID_Cliente,
        Nome,
        Email,
        Telefone,
        DataCriacao,
        UltimaAtualizacao,
        0 as saldo_devedor
    `;

    try {
      const result = await pool.query(query, [
        usuarioId,
        nome.trim(),
        email || null,
        telefone || null,
      ]);

      return result.rows[0];
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      throw new Error("Falha ao criar cliente");
    }
  }

  /**
   * Atualizar um cliente
   */
  async updateCliente(
    clienteId: number,
    usuarioId: number,
    data: UpdateClienteDTO
  ): Promise<Cliente> {
    // Verificar se cliente existe e pertence ao usuário
    const cliente = await this.getClienteById(clienteId, usuarioId);
    if (!cliente) {
      throw new Error("Cliente não encontrado");
    }

    // Validações
    if (data.nome !== undefined) {
      if (!data.nome || data.nome.trim().length === 0) {
        throw new Error("Nome do cliente não pode estar vazio");
      }
      if (data.nome.length > 120) {
        throw new Error("Nome do cliente não pode exceder 120 caracteres");
      }
    }

    if (data.email !== undefined && data.email !== null) {
      if (!this.isValidEmail(data.email)) {
        throw new Error("Email inválido");
      }
      if (data.email.length > 150) {
        throw new Error("Email não pode exceder 150 caracteres");
      }

      // Verificar se email já existe para outro cliente deste usuário
      const emailExists = await pool.query(
        "SELECT ID_Cliente FROM cliente WHERE Email = $1 AND ID_Usuario = $2 AND ID_Cliente != $3",
        [data.email, usuarioId, clienteId]
      );
      if (emailExists.rows.length > 0) {
        throw new Error("Email já cadastrado para outro cliente");
      }
    }

    if (
      data.telefone !== undefined &&
      data.telefone !== null &&
      data.telefone.length > 20
    ) {
      throw new Error("Telefone não pode exceder 20 caracteres");
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    if (data.nome !== undefined) {
      updateFields.push(`Nome = $${paramCount}`);
      updateValues.push(data.nome.trim());
      paramCount++;
    }

    if (data.email !== undefined) {
      updateFields.push(`Email = $${paramCount}`);
      updateValues.push(data.email || null);
      paramCount++;
    }

    if (data.telefone !== undefined) {
      updateFields.push(`Telefone = $${paramCount}`);
      updateValues.push(data.telefone || null);
      paramCount++;
    }

    updateFields.push(`UltimaAtualizacao = NOW()`);

    const query = `
      UPDATE cliente
      SET ${updateFields.join(", ")}
      WHERE ID_Cliente = $${paramCount} AND ID_Usuario = $${paramCount + 1}
      RETURNING 
        ID_Cliente,
        Nome,
        Email,
        Telefone,
        DataCriacao,
        UltimaAtualizacao,
        (SELECT COALESCE(Saldo_Devedor, 0) FROM conta WHERE ID_Cliente = $${paramCount}) as saldo_devedor
    `;

    try {
      const result = await pool.query(query, [
        ...updateValues,
        clienteId,
        usuarioId,
      ]);

      if (result.rows.length === 0) {
        throw new Error("Cliente não encontrado ou falha na atualização");
      }

      return result.rows[0];
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      throw new Error("Falha ao atualizar cliente");
    }
  }

  /**
   * Deletar um cliente
   */
  async deleteCliente(clienteId: number, usuarioId: number): Promise<void> {
    // Verificar se cliente existe e pertence ao usuário
    const cliente = await this.getClienteById(clienteId, usuarioId);
    if (!cliente) {
      throw new Error("Cliente não encontrado");
    }

    const query = `
      DELETE FROM cliente
      WHERE ID_Cliente = $1 AND ID_Usuario = $2
    `;

    try {
      await pool.query(query, [clienteId, usuarioId]);
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      throw new Error("Falha ao deletar cliente");
    }
  }

  /**
   * Deletar múltiplos clientes
   */
  async deleteClientes(clienteIds: number[], usuarioId: number): Promise<void> {
    if (!Array.isArray(clienteIds) || clienteIds.length === 0) {
      throw new Error("Lista de clientes inválida");
    }

    const client = await pool.connect();
    try {
      // Iniciar transação
      await client.query("BEGIN");

      console.log("   [0] Desabilitando triggers...");
      // Desabilitar triggers para evitar problemas com nomes de colunas
      await client.query("ALTER TABLE compra DISABLE TRIGGER trg_compra_ad");
      await client.query("ALTER TABLE compra DISABLE TRIGGER trg_compra_ai");
      await client.query("ALTER TABLE compra DISABLE TRIGGER trg_compra_au");
      await client.query("ALTER TABLE pagamento DISABLE TRIGGER trg_pagamento_ad");
      await client.query("ALTER TABLE pagamento DISABLE TRIGGER trg_pagamento_ai");
      await client.query("ALTER TABLE pagamento DISABLE TRIGGER trg_pagamento_au");
      console.log("   ✅ Triggers desabilitados");

      // 1. Deletar compras (sem triggers)
      const deleteComprasQuery = `
        DELETE FROM compra
        WHERE ID_Cliente = ANY($1)
      `;
      console.log("   [1] Deletando compras...");
      await client.query(deleteComprasQuery, [clienteIds]);
      console.log("   ✅ Compras deletadas");

      // 2. Deletar pagamentos (sem triggers)
      const deletePagementosQuery = `
        DELETE FROM pagamento
        WHERE ID_Conta IN (
          SELECT ID_Conta FROM conta WHERE ID_Cliente = ANY($1)
        )
      `;
      console.log("   [2] Deletando pagamentos...");
      await client.query(deletePagementosQuery, [clienteIds]);
      console.log("   ✅ Pagamentos deletados");

      // 3. Deletar contas do cliente
      const deleteContasQuery = `
        DELETE FROM conta
        WHERE ID_Cliente = ANY($1)
      `;
      console.log("   [3] Deletando contas...");
      await client.query(deleteContasQuery, [clienteIds]);
      console.log("   ✅ Contas deletadas");

      // 4. Deletar cliente
      const deleteClienteQuery = `
        DELETE FROM cliente
        WHERE ID_Cliente = ANY($1) AND ID_Usuario = $2
      `;
      console.log("   [4] Deletando cliente...");
      await client.query(deleteClienteQuery, [clienteIds, usuarioId]);
      console.log("   ✅ Cliente deletado");

      // Reabilitar triggers
      console.log("   [5] Reabilitando triggers...");
      await client.query("ALTER TABLE compra ENABLE TRIGGER trg_compra_ad");
      await client.query("ALTER TABLE compra ENABLE TRIGGER trg_compra_ai");
      await client.query("ALTER TABLE compra ENABLE TRIGGER trg_compra_au");
      await client.query("ALTER TABLE pagamento ENABLE TRIGGER trg_pagamento_ad");
      await client.query("ALTER TABLE pagamento ENABLE TRIGGER trg_pagamento_ai");
      await client.query("ALTER TABLE pagamento ENABLE TRIGGER trg_pagamento_au");
      console.log("   ✅ Triggers reabilitados");

      // Confirmar transação
      await client.query("COMMIT");
      console.log("   ✅ Transação confirmada");
    } catch (error) {
      // Reverter transação em caso de erro
      console.error("   ❌ Erro na transação, fazendo ROLLBACK");
      await client.query("ROLLBACK");
      console.error("Erro ao deletar clientes:", error);
      throw new Error("Falha ao deletar clientes");
    } finally {
      client.release();
    }
  }

  /**
   * Obter total a receber de um cliente
   */
  async getTotalAReceber(
    clienteId: number,
    usuarioId: number
  ): Promise<number> {
    // Primeiro, verificar se cliente pertence ao usuário
    const cliente = await this.getClienteById(clienteId, usuarioId);
    if (!cliente) {
      throw new Error("Cliente não encontrado");
    }

    const query = `
      SELECT COALESCE(c.Saldo_Devedor, 0) as total
      FROM conta c
      WHERE c.ID_Cliente = $1
    `;

    try {
      const result = await pool.query(query, [clienteId]);
      return result.rows.length > 0 ? parseFloat(result.rows[0].total) : 0;
    } catch (error) {
      console.error("Erro ao obter total a receber:", error);
      throw new Error("Falha ao obter total a receber");
    }
  }

  /**
   * Obter total a receber de todos os clientes do usuário
   */
  async getTotalAReceberGeral(usuarioId: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(c.Saldo_Devedor), 0) as total
      FROM conta c
      INNER JOIN cliente cli ON c.ID_Cliente = cli.ID_Cliente
      WHERE cli.ID_Usuario = $1
    `;

    try {
      const result = await pool.query(query, [usuarioId]);
      return result.rows.length > 0 ? parseFloat(result.rows[0].total) : 0;
    } catch (error) {
      console.error("Erro ao obter total geral a receber:", error);
      throw new Error("Falha ao obter total a receber");
    }
  }

  /**
   * Validar formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Verificar se email já existe para um usuário
   */
  private async emailExistsForUser(
    email: string,
    usuarioId: number
  ): Promise<boolean> {
    const query = `
      SELECT ID_Cliente FROM cliente
      WHERE Email = $1 AND ID_Usuario = $2
    `;

    try {
      const result = await pool.query(query, [email, usuarioId]);
      return result.rows.length > 0;
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      return false;
    }
  }
}

export default new ClienteService();
