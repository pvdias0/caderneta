import { Request, Response } from "express";
import clienteService from "../services/cliente.service.js";

/**
 * Helper para obter usuarioId do request
 */
function getUsuarioId(req: Request): number | null {
  const usuarioId = (req as any).user?.id || (req as any).usuarioId;
  return usuarioId ? Number(usuarioId) : null;
}

export class ClienteController {
  /**
   * Listar todos os clientes do usuário autenticado
   */
  async listarClientes(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const clientes = await clienteService.getAllClientes(usuarioId);

      // Converter id_cliente para número
      const clientesConvertidos = clientes.map((cliente) => ({
        ...cliente,
        id_cliente: Number(cliente.id_cliente),
      }));

      res.status(200).json({
        success: true,
        data: clientesConvertidos,
        total: clientesConvertidos.length,
      });
    } catch (error) {
      console.error("Erro ao listar clientes:", error);
      res.status(500).json({
        error: "Falha ao listar clientes",
        message: (error as any).message,
      });
    }
  }

  /**
   * Obter um cliente específico
   */
  async obterCliente(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      const cliente = await clienteService.getClienteById(
        Number(id),
        usuarioId
      );

      if (!cliente) {
        res.status(404).json({ error: "Cliente não encontrado" });
        return;
      }

      res.status(200).json({
        success: true,
        data: cliente,
      });
    } catch (error) {
      console.error("Erro ao obter cliente:", error);
      res.status(500).json({
        error: "Falha ao obter cliente",
        message: (error as any).message,
      });
    }
  }

  /**
   * Criar um novo cliente
   */
  async criarCliente(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { nome, email, telefone } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!nome || typeof nome !== "string") {
        res.status(400).json({ error: "Nome do cliente é obrigatório" });
        return;
      }

      const novoCliente = await clienteService.createCliente(usuarioId, {
        nome,
        email: email || undefined,
        telefone: telefone || undefined,
      });

      // Converter id_cliente para número
      const clienteConvertido = {
        ...novoCliente,
        id_cliente: Number(novoCliente.id_cliente),
      };

      res.status(201).json({
        success: true,
        data: clienteConvertido,
        message: "Cliente criado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar cliente:", error);
      res.status(400).json({
        error: "Falha ao criar cliente",
        message: (error as any).message,
      });
    }
  }

  /**
   * Atualizar um cliente
   */
  async atualizarCliente(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;
      const { nome, email, telefone } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (Object.keys(req.body).length === 0) {
        res
          .status(400)
          .json({ error: "Nenhum campo para atualizar fornecido" });
        return;
      }

      const clienteAtualizado = await clienteService.updateCliente(
        Number(id),
        usuarioId,
        {
          nome,
          email,
          telefone,
        }
      );

      res.status(200).json({
        success: true,
        data: clienteAtualizado,
        message: "Cliente atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      res.status(400).json({
        error: "Falha ao atualizar cliente",
        message: (error as any).message,
      });
    }
  }

  /**
   * Deletar um cliente
   */
  async deletarCliente(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      await clienteService.deleteCliente(Number(id), usuarioId);

      res.status(200).json({
        success: true,
        message: "Cliente deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      res.status(400).json({
        error: "Falha ao deletar cliente",
        message: (error as any).message,
      });
    }
  }

  /**
   * Deletar múltiplos clientes
   */
  async deletarClientes(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      let { ids } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "Lista de IDs inválida" });
        return;
      }

      // Converter strings para números se necessário
      ids = ids.map((id: any) => {
        if (typeof id === "string") {
          return parseInt(id, 10);
        }
        return id;
      });

      // Validar que todos os IDs são números válidos
      if (!ids.every((id: any) => typeof id === "number" && !isNaN(id))) {
        res.status(400).json({ error: "Todos os IDs devem ser números válidos" });
        return;
      }

      await clienteService.deleteClientes(ids, usuarioId);

      res.status(200).json({
        success: true,
        message: `${ids.length} cliente(s) deletado(s) com sucesso`,
      });
    } catch (error) {
      console.error("❌ Erro ao deletar clientes:", error);
      res.status(400).json({
        error: "Falha ao deletar clientes",
        message: (error as any).message,
      });
    }
  }

  /**
   * Obter total a receber de um cliente
   */
  async getTotalAReceber(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      const total = await clienteService.getTotalAReceber(
        Number(id),
        usuarioId
      );

      res.status(200).json({
        success: true,
        data: {
          cliente_id: id,
          total_a_receber: total,
        },
      });
    } catch (error) {
      console.error("Erro ao obter total a receber:", error);
      res.status(400).json({
        error: "Falha ao obter total a receber",
        message: (error as any).message,
      });
    }
  }

  /**
   * Obter total geral a receber
   */
  async getTotalAReceberGeral(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const total = await clienteService.getTotalAReceberGeral(usuarioId);

      res.status(200).json({
        success: true,
        data: {
          total_a_receber: total,
        },
      });
    } catch (error) {
      console.error("Erro ao obter total geral a receber:", error);
      res.status(400).json({
        error: "Falha ao obter total a receber",
        message: (error as any).message,
      });
    }
  }
}

export default new ClienteController();
