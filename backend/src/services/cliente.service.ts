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
        c.id_cliente,
        c.nome,
        c.email,
        c.telefone,
        c.datacriacao,
        c.ultimaatualizacao,
        COALESCE(ct.saldo_devedor, 0) as saldo_devedor
      FROM cliente c
      LEFT JOIN conta ct ON c.id_cliente = ct.id_cliente
      WHERE c.id_usuario = $1
      ORDER BY c.nome ASC
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
        c.id_cliente,
        c.nome,
        c.email,
        c.telefone,
        c.datacriacao,
        c.ultimaatualizacao,
        COALESCE(ct.saldo_devedor, 0) as saldo_devedor
      FROM cliente c
      LEFT JOIN conta ct ON c.id_cliente = ct.id_cliente
      WHERE c.id_cliente = $1 AND c.id_usuario = $2
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
      INSERT INTO cliente (id_usuario, nome, email, telefone, datacriacao, ultimaatualizacao)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING 
        id_cliente,
        nome,
        email,
        telefone,
        datacriacao,
        ultimaatualizacao,
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
        "SELECT id_cliente FROM cliente WHERE email = $1 AND id_usuario = $2 AND id_cliente != $3",
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
      updateFields.push(`nome = $${paramCount}`);
      updateValues.push(data.nome.trim());
      paramCount++;
    }

    if (data.email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      updateValues.push(data.email || null);
      paramCount++;
    }

    if (data.telefone !== undefined) {
      updateFields.push(`telefone = $${paramCount}`);
      updateValues.push(data.telefone || null);
      paramCount++;
    }

    updateFields.push(`ultimaatualizacao = NOW()`);

    const query = `
      UPDATE cliente
      SET ${updateFields.join(", ")}
      WHERE id_cliente = $${paramCount} AND id_usuario = $${paramCount + 1}
      RETURNING 
        id_cliente,
        nome,
        email,
        telefone,
        datacriacao,
        ultimaatualizacao,
        (SELECT COALESCE(saldo_devedor, 0) FROM conta WHERE id_cliente = $${paramCount}) as saldo_devedor
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
      WHERE id_cliente = $1 AND id_usuario = $2
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

      // 1. Deletar compras (que acionam triggers de ajuste de conta)
      const deleteComprasQuery = `
        DELETE FROM compra
        WHERE ID_Cliente = ANY($1)
      `;
      await client.query(deleteComprasQuery, [clienteIds]);

      // 2. Deletar contas do cliente
      const deleteContasQuery = `
        DELETE FROM conta
        WHERE ID_Cliente = ANY($1)
      `;
      await client.query(deleteContasQuery, [clienteIds]);

      // 3. Deletar cliente
      const deleteClienteQuery = `
        DELETE FROM cliente
        WHERE ID_Cliente = ANY($1) AND ID_Usuario = $2
      `;
      await client.query(deleteClienteQuery, [clienteIds, usuarioId]);

      // Confirmar transação
      await client.query("COMMIT");
    } catch (error) {
      // Reverter transação em caso de erro
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
      SELECT COALESCE(c.saldo_devedor, 0) as total
      FROM conta c
      WHERE c.id_cliente = $1
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
      SELECT COALESCE(SUM(c.saldo_devedor), 0) as total
      FROM conta c
      INNER JOIN cliente cli ON c.id_cliente = cli.id_cliente
      WHERE cli.id_usuario = $1
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
      SELECT id_cliente FROM cliente
      WHERE email = $1 AND id_usuario = $2
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
