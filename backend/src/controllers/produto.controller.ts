import { Request, Response } from "express";
import produtoService from "../services/produto.service.js";

/**
 * Helper para obter usuarioId do request
 */
function getUsuarioId(req: Request): number | null {
  const usuarioId = (req as any).user?.id || (req as any).usuarioId;
  return usuarioId ? Number(usuarioId) : null;
}

export class ProdutoController {
  /**
   * Listar todos os produtos do usuário autenticado
   */
  async listarProdutos(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      const produtos = await produtoService.getAllProdutos(usuarioId);

      // Converter tipos para números
      const produtosConvertidos = produtos.map((produto) => ({
        ...produto,
        id_produto: Number(produto.id_produto),
        valor_produto: Number(produto.valor_produto) || 0,
        quantidade_estoque: Number(produto.quantidade_estoque) || 0,
      }));

      res.status(200).json({
        success: true,
        data: produtosConvertidos,
        total: produtosConvertidos.length,
      });
    } catch (error) {
      console.error("Erro ao listar produtos:", error);
      res.status(500).json({
        error: "Falha ao listar produtos",
        message: (error as any).message,
      });
    }
  }

  /**
   * Obter um produto específico
   */
  async obterProduto(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do produto inválido" });
        return;
      }

      const produto = await produtoService.getProdutoById(
        Number(id),
        usuarioId
      );

      if (!produto) {
        res.status(404).json({ error: "Produto não encontrado" });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...produto,
          id_produto: Number(produto.id_produto),
          valor_produto: Number(produto.valor_produto) || 0,
          quantidade_estoque: Number(produto.quantidade_estoque) || 0,
        },
      });
    } catch (error) {
      console.error("Erro ao obter produto:", error);
      res.status(500).json({
        error: "Falha ao obter produto",
        message: (error as any).message,
      });
    }
  }

  /**
   * Criar um novo produto
   */
  async criarProduto(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { nome, valor_produto, quantidade_estoque } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!nome || typeof nome !== "string") {
        res.status(400).json({ error: "Nome do produto é obrigatório" });
        return;
      }

      if (
        valor_produto === undefined ||
        valor_produto === null ||
        valor_produto === ""
      ) {
        res.status(400).json({ error: "Valor do produto é obrigatório" });
        return;
      }

      if (
        quantidade_estoque === undefined ||
        quantidade_estoque === null ||
        quantidade_estoque === ""
      ) {
        res.status(400).json({ error: "Quantidade em estoque é obrigatória" });
        return;
      }

      const valor = Number(valor_produto);
      const quantidade = Number(quantidade_estoque);

      if (isNaN(valor) || valor <= 0) {
        res.status(400).json({ error: "Valor deve ser um número maior que 0" });
        return;
      }

      if (isNaN(quantidade) || quantidade <= 0) {
        res
          .status(400)
          .json({ error: "Quantidade deve ser um número maior que 0" });
        return;
      }

      const novoProduto = await produtoService.createProduto(usuarioId, {
        nome,
        valor_produto: valor,
        quantidade_estoque: quantidade,
      });

      // Converter tipos para números
      const produtoConvertido = {
        ...novoProduto,
        id_produto: Number(novoProduto.id_produto),
        valor_produto: Number(novoProduto.valor_produto) || 0,
        quantidade_estoque: Number(novoProduto.quantidade_estoque) || 0,
      };

      res.status(201).json({
        success: true,
        data: produtoConvertido,
        message: "Produto criado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      res.status(400).json({
        error: "Falha ao criar produto",
        message: (error as any).message,
      });
    }
  }

  /**
   * Atualizar um produto
   */
  async atualizarProduto(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;
      const { nome, valor_produto, quantidade_estoque } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do produto inválido" });
        return;
      }

      if (Object.keys(req.body).length === 0) {
        res
          .status(400)
          .json({ error: "Nenhum campo para atualizar fornecido" });
        return;
      }

      const produtoAtualizado = await produtoService.updateProduto(
        Number(id),
        usuarioId,
        {
          nome,
          valor_produto,
          quantidade_estoque,
        }
      );

      res.status(200).json({
        success: true,
        data: {
          ...produtoAtualizado,
          id_produto: Number(produtoAtualizado.id_produto),
          valor_produto: Number(produtoAtualizado.valor_produto) || 0,
          quantidade_estoque: Number(produtoAtualizado.quantidade_estoque) || 0,
        },
        message: "Produto atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      res.status(400).json({
        error: "Falha ao atualizar produto",
        message: (error as any).message,
      });
    }
  }

  /**
   * Deletar um produto
   */
  async deletarProduto(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { id } = req.params;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!id || isNaN(Number(id))) {
        res.status(400).json({ error: "ID do produto inválido" });
        return;
      }

      await produtoService.deleteProduto(Number(id), usuarioId);

      res.status(200).json({
        success: true,
        message: "Produto deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      res.status(400).json({
        error: "Falha ao deletar produto",
        message: (error as any).message,
      });
    }
  }

  /**
   * Deletar múltiplos produtos
   */
  async deletarProdutos(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { ids } = req.body;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: "Lista de IDs inválida" });
        return;
      }

      // Validar que todos os IDs são números
      if (!ids.every((id) => typeof id === "number")) {
        res.status(400).json({ error: "Todos os IDs devem ser números" });
        return;
      }

      await produtoService.deleteProdutos(ids, usuarioId);

      res.status(200).json({
        success: true,
        message: `${ids.length} produto(s) deletado(s) com sucesso`,
      });
    } catch (error) {
      console.error("Erro ao deletar produtos:", error);
      res.status(400).json({
        error: "Falha ao deletar produtos",
        message: (error as any).message,
      });
    }
  }

  /**
   * Buscar produtos por nome
   */
  async buscarProdutos(req: Request, res: Response): Promise<void> {
    try {
      const usuarioId = getUsuarioId(req);
      const { q } = req.query;

      if (!usuarioId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      if (!q || typeof q !== "string") {
        res.status(400).json({ error: "Termo de busca inválido" });
        return;
      }

      const produtos = await produtoService.searchProdutos(usuarioId, q);

      // Converter tipos para números
      const produtosConvertidos = produtos.map((produto) => ({
        ...produto,
        id_produto: Number(produto.id_produto),
        valor_produto: Number(produto.valor_produto) || 0,
        quantidade_estoque: Number(produto.quantidade_estoque) || 0,
      }));

      res.status(200).json({
        success: true,
        data: produtosConvertidos,
        total: produtosConvertidos.length,
      });
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      res.status(500).json({
        error: "Falha ao buscar produtos",
        message: (error as any).message,
      });
    }
  }
}

const produtoController = new ProdutoController();
export default produtoController;
