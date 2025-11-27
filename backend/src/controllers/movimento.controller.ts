import { Request, Response } from "express";
import movimentoService from "../services/movimento.service.js";
import {
  notificarSaldoClienteAtualizado,
  notificarTotalAReceberAtualizado,
} from "../index.js";
import clienteService from "../services/cliente.service.js";

/**
 * Helper para obter usuarioId do request
 */
function getUsuarioId(req: Request): number | null {
  const usuarioId = (req as any).user?.id || (req as any).usuarioId;
  return usuarioId ? Number(usuarioId) : null;
}

export class MovimentoController {
  /**
   * Listar movimentos de um cliente
   */
  async listarMovimentos(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      const movimentos = await movimentoService.getMovimentosByCliente(
        Number(clienteId),
        usuarioId
      );

      res.status(200).json({
        success: true,
        data: movimentos,
        total: movimentos.length,
      });
    } catch (error) {
      console.error("Erro ao listar movimentos:", error);
      res.status(500).json({
        error: "Falha ao listar movimentos",
        message: (error as any).message,
      });
    }
  }

  /**
   * Criar uma compra com itens (carrinho de compras)
   * POST /api/v1/clientes/:clienteId/movimentos/compra-com-itens
   */
  async criarCompraComItens(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId } = req.params;
      const { data_compra, itens } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!data_compra || typeof data_compra !== "string") {
        res.status(400).json({ error: "Data da compra é obrigatória" });
        return;
      }

      if (!Array.isArray(itens) || itens.length === 0) {
        res.status(400).json({ error: "Pelo menos um item é obrigatório" });
        return;
      }

      // Validar cada item
      for (const item of itens) {
        if (!item.id_produto || !item.quantidade || !item.valor_unitario) {
          res.status(400).json({
            error: "Cada item deve ter id_produto, quantidade e valor_unitario",
          });
          return;
        }

        if (item.quantidade <= 0 || item.valor_unitario <= 0) {
          res.status(400).json({
            error: "Quantidade e valor_unitario devem ser maiores que 0",
          });
          return;
        }
      }

      // Obter ID da conta do cliente
      const contaId = await movimentoService.getContaByClienteId(
        Number(clienteId),
        usuarioId
      );

      if (!contaId) {
        res.status(404).json({ error: "Conta do cliente não encontrada" });
        return;
      }

      const compra = await movimentoService.createCompraComItens(
        contaId,
        data_compra,
        itens,
        usuarioId
      );

      res.status(201).json({
        success: true,
        data: compra,
        message: "Compra com itens criada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar compra com itens:", error);
      res.status(400).json({
        error: "Falha ao criar compra com itens",
        message: (error as any).message,
      });
    }
  }

  /**
   * Criar uma compra
   */
  async criarCompra(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId } = req.params;
      const { valor_compra } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!valor_compra || valor_compra <= 0) {
        res.status(400).json({ error: "Valor da compra deve ser maior que 0" });
        return;
      }

      // Obter ID da conta do cliente
      const contaId = await movimentoService.getContaByClienteId(
        Number(clienteId),
        usuarioId
      );

      if (!contaId) {
        res.status(404).json({ error: "Conta do cliente não encontrada" });
        return;
      }

      const compra = await movimentoService.createCompra(
        contaId,
        valor_compra,
        usuarioId
      );

      // Buscar saldo atualizado do cliente
      const clienteAtualizado = await clienteService.getClienteById(
        Number(clienteId),
        usuarioId
      );

      // Notificar sobre atualização de saldo
      if (clienteAtualizado) {
        const saldoDevedor = (clienteAtualizado as any).saldo_devedor || 0;
        notificarSaldoClienteAtualizado(
          usuarioId,
          Number(clienteId),
          parseFloat(saldoDevedor)
        );
      }

      // Notificar sobre atualização do total a receber
      const totalAReceber = await clienteService.getTotalAReceberGeral(
        usuarioId
      );
      notificarTotalAReceberAtualizado(usuarioId, totalAReceber);

      res.status(201).json({
        success: true,
        data: compra,
        message: "Compra criada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar compra:", error);
      res.status(400).json({
        error: "Falha ao criar compra",
        message: (error as any).message,
      });
    }
  }

  /**
   * Criar um pagamento
   */
  async criarPagamento(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId } = req.params;
      const { valor_pagamento, data_pagamento } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!valor_pagamento || valor_pagamento <= 0) {
        res
          .status(400)
          .json({ error: "Valor do pagamento deve ser maior que 0" });
        return;
      }

      // Obter ID da conta do cliente
      const contaId = await movimentoService.getContaByClienteId(
        Number(clienteId),
        usuarioId
      );

      if (!contaId) {
        res.status(404).json({ error: "Conta do cliente não encontrada" });
        return;
      }

      const pagamento = await movimentoService.createPagamento(
        contaId,
        valor_pagamento,
        data_pagamento || null,
        usuarioId
      );

      // Buscar saldo atualizado do cliente
      const clienteAtualizado = await clienteService.getClienteById(
        Number(clienteId),
        usuarioId
      );

      // Notificar sobre atualização de saldo
      if (clienteAtualizado) {
        const saldoDevedor = (clienteAtualizado as any).saldo_devedor || 0;
        notificarSaldoClienteAtualizado(
          usuarioId,
          Number(clienteId),
          parseFloat(saldoDevedor)
        );
      }

      // Notificar sobre atualização do total a receber
      const totalAReceber = await clienteService.getTotalAReceberGeral(
        usuarioId
      );
      notificarTotalAReceberAtualizado(usuarioId, totalAReceber);

      res.status(201).json({
        success: true,
        data: pagamento,
        message: "Pagamento criado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      res.status(400).json({
        error: "Falha ao criar pagamento",
        message: (error as any).message,
      });
    }
  }

  /**
   * Atualizar uma compra com itens
   */
  async atualizarCompraComItens(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId, compraId } = req.params;
      const { data_compra, itens } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!compraId || isNaN(Number(compraId))) {
        res.status(400).json({ error: "ID da compra inválido" });
        return;
      }

      if (!data_compra || typeof data_compra !== "string") {
        res.status(400).json({ error: "Data da compra é obrigatória" });
        return;
      }

      if (!Array.isArray(itens) || itens.length === 0) {
        res.status(400).json({ error: "Pelo menos um item é obrigatório" });
        return;
      }

      // Validar cada item
      for (const item of itens) {
        if (!item.id_produto || !item.quantidade || !item.valor_unitario) {
          res.status(400).json({
            error: "Cada item deve ter id_produto, quantidade e valor_unitario",
          });
          return;
        }

        if (item.quantidade <= 0 || item.valor_unitario <= 0) {
          res.status(400).json({
            error: "Quantidade e valor_unitario devem ser maiores que 0",
          });
          return;
        }
      }

      const compra = await movimentoService.updateCompraComItens(
        Number(compraId),
        data_compra,
        itens,
        usuarioId
      );

      res.status(200).json({
        success: true,
        data: compra,
        message: "Compra com itens atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar compra com itens:", error);
      res.status(400).json({
        error: "Falha ao atualizar compra com itens",
        message: (error as any).message,
      });
    }
  }

  /**
   * Atualizar uma compra
   */
  async atualizarCompra(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId, compraId } = req.params;
      const { valor_compra, data_compra } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!compraId || isNaN(Number(compraId))) {
        res.status(400).json({ error: "ID da compra inválido" });
        return;
      }

      if (!valor_compra || valor_compra <= 0) {
        res.status(400).json({ error: "Valor da compra deve ser maior que 0" });
        return;
      }

      const compra = await movimentoService.updateCompra(
        Number(compraId),
        valor_compra,
        data_compra || null,
        usuarioId
      );

      res.status(200).json({
        success: true,
        data: compra,
        message: "Compra atualizada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar compra:", error);
      res.status(400).json({
        error: "Falha ao atualizar compra",
        message: (error as any).message,
      });
    }
  }

  /**
   * Atualizar um pagamento
   */
  async atualizarPagamento(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId, pagamentoId } = req.params;
      const { valor_pagamento, data_pagamento } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!pagamentoId || isNaN(Number(pagamentoId))) {
        res.status(400).json({ error: "ID do pagamento inválido" });
        return;
      }

      if (!valor_pagamento || valor_pagamento <= 0) {
        res
          .status(400)
          .json({ error: "Valor do pagamento deve ser maior que 0" });
        return;
      }

      const pagamento = await movimentoService.updatePagamento(
        Number(pagamentoId),
        valor_pagamento,
        data_pagamento || null,
        usuarioId
      );

      res.status(200).json({
        success: true,
        data: pagamento,
        message: "Pagamento atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar pagamento:", error);
      res.status(400).json({
        error: "Falha ao atualizar pagamento",
        message: (error as any).message,
      });
    }
  }

  /**
   * Deletar uma compra
   */
  async deletarCompra(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId, compraId } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!compraId || isNaN(Number(compraId))) {
        res.status(400).json({ error: "ID da compra inválido" });
        return;
      }

      await movimentoService.deleteCompra(Number(compraId), usuarioId);

      res.status(200).json({
        success: true,
        message: "Compra deletada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar compra:", error);
      res.status(400).json({
        error: "Falha ao deletar compra",
        message: (error as any).message,
      });
    }
  }

  /**
   * Deletar um pagamento
   */
  async deletarPagamento(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { clienteId, pagamentoId } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!clienteId || isNaN(Number(clienteId))) {
        res.status(400).json({ error: "ID do cliente inválido" });
        return;
      }

      if (!pagamentoId || isNaN(Number(pagamentoId))) {
        res.status(400).json({ error: "ID do pagamento inválido" });
        return;
      }

      await movimentoService.deletePagamento(Number(pagamentoId), usuarioId);

      res.status(200).json({
        success: true,
        message: "Pagamento deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar pagamento:", error);
      res.status(400).json({
        error: "Falha ao deletar pagamento",
        message: (error as any).message,
      });
    }
  }
}

export default new MovimentoController();
