import PDFDocument from "pdfkit";
import { Readable } from "stream";
import pool from "../config/database.js";

type PDFDocType = InstanceType<typeof PDFDocument>;

export class PdfService {
  /**
   * Gerar PDF de extrato de cliente
   */
  async gerarExtratoCliente(
    clienteId: number,
    usuarioId: number
  ): Promise<Readable> {
    // Buscar dados do cliente
    const clienteQuery = `
      SELECT 
        c.id_cliente,
        c.nome,
        c.email,
        c.telefone,
        c.datacriacao,
        ct.saldo_devedor
      FROM cliente c
      LEFT JOIN conta ct ON c.id_cliente = ct.id_cliente
      WHERE c.id_cliente = $1 AND c.id_usuario = $2
    `;

    try {
      const clienteResult = await pool.query(clienteQuery, [
        clienteId,
        usuarioId,
      ]);

      if (clienteResult.rows.length === 0) {
        throw new Error("Cliente não encontrado");
      }

      const cliente = clienteResult.rows[0];

      // Buscar movimentos do cliente
      const movimentosQuery = `
        SELECT 
          m.id_movimento,
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

      const movimentosResult = await pool.query(movimentosQuery, [
        clienteId,
        usuarioId,
      ]);

      let movimentos = movimentosResult.rows;

      // Buscar itens de cada compra
      for (const movimento of movimentos) {
        if (movimento.tipo === "COMPRA" && movimento.id_compra) {
          const itensQuery = `
            SELECT 
              ic.id_item_compra,
              ic.quantidade,
              ic.valor_unitario,
              p.nome as nome_produto
            FROM item_compra ic
            JOIN produto p ON ic.id_produto = p.id_produto
            WHERE ic.id_compra = $1
            ORDER BY ic.id_item_compra
          `;

          const itensResult = await pool.query(itensQuery, [
            movimento.id_compra,
          ]);
          movimento.itens = itensResult.rows;
        } else {
          movimento.itens = [];
        }
      }

      // Criar documento PDF
      const doc = new PDFDocument({
        bufferPages: true,
        margin: 50,
      });

      // Converter para stream
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      // Configurar página
      this.adicionarCabecalho(doc, cliente);
      this.adicionarSecaoCliente(doc, cliente);
      this.adicionarSecaoMovimentos(doc, movimentos);
      this.adicionarRodape(doc);

      doc.end();

      return Readable.from(chunks);
    } catch (error) {
      console.error("Erro ao gerar extrato PDF:", error);
      throw new Error("Falha ao gerar extrato PDF");
    }
  }

  private adicionarCabecalho(doc: PDFDocType, cliente: any): void {
    // Título
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("EXTRATO DE CLIENTE", { align: "center" })
      .moveDown(0.5);

    // Data e hora de geração
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR");
    const horaFormatada = agora.toLocaleTimeString("pt-BR");

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Gerado em: ${dataFormatada} às ${horaFormatada}`, {
        align: "center",
      })
      .moveDown(1);
  }

  private adicionarSecaoCliente(doc: PDFDocType, cliente: any): void {
    // Título da seção
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("DADOS DO CLIENTE")
      .moveDown(0.3);

    // Linha separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.5);

    // Dados
    const dados = [
      { label: "Nome:", value: cliente.nome },
      { label: "Email:", value: cliente.email || "Não informado" },
      { label: "Telefone:", value: cliente.telefone || "Não informado" },
      {
        label: "Data de Cadastro:",
        value: new Date(cliente.datacriacao).toLocaleDateString("pt-BR"),
      },
      {
        label: "Saldo Devedor:",
        value: `R$ ${parseFloat(cliente.saldo_devedor || 0)
          .toFixed(2)
          .replace(".", ",")}`,
      },
    ];

    doc.fontSize(11).font("Helvetica");

    dados.forEach((dado) => {
      doc
        .font("Helvetica-Bold")
        .text(dado.label, { width: 150, continued: true })
        .font("Helvetica")
        .text(dado.value);
    });

    doc.moveDown(1);
  }

  private adicionarSecaoMovimentos(doc: PDFDocType, movimentos: any[]): void {
    // Título da seção
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("HISTÓRICO DE MOVIMENTOS")
      .moveDown(0.3);

    // Linha separadora
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.5);

    if (movimentos.length === 0) {
      doc
        .fontSize(11)
        .font("Helvetica")
        .text("Nenhum movimento registrado")
        .moveDown(1);
      return;
    }

    // Cabeçalho da tabela
    const startX = 50;
    const colWidths = { data: 70, tipo: 70, valor: 80, itens: 275 };
    const y = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text("Data", startX, y, { width: colWidths.data })
      .text("Tipo", startX + colWidths.data, y, { width: colWidths.tipo })
      .text("Valor", startX + colWidths.data + colWidths.tipo, y, {
        width: colWidths.valor,
      })
      .text(
        "Itens",
        startX + colWidths.data + colWidths.tipo + colWidths.valor,
        y,
        {
          width: colWidths.itens,
        }
      );

    doc.moveDown(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke().moveDown(0.5);

    // Linhas da tabela
    doc.fontSize(8).font("Helvetica");

    movimentos.forEach((movimento, index) => {
      const data = new Date(movimento.data_movimento).toLocaleDateString(
        "pt-BR"
      );
      const tipo = movimento.tipo === "COMPRA" ? "Compra" : "Pagamento";
      const valor = parseFloat(movimento.valor || 0);

      const y = doc.y;

      // Data
      doc.text(data, startX, y, { width: colWidths.data });

      // Tipo
      doc.text(tipo, startX + colWidths.data, y, { width: colWidths.tipo });

      // Valor
      doc.text(
        `R$ ${valor.toFixed(2).replace(".", ",")}`,
        startX + colWidths.data + colWidths.tipo,
        y,
        { width: colWidths.valor }
      );

      // Itens
      let itensText = "";
      if (
        movimento.tipo === "COMPRA" &&
        movimento.itens &&
        movimento.itens.length > 0
      ) {
        itensText = movimento.itens
          .map((item: any) => {
            const quantidade = parseInt(item.quantidade) || 0;
            const valorUnitario = parseFloat(item.valor_unitario || 0);
            const nomeProduto = item.nome_produto || "Produto desconhecido";
            return `${nomeProduto} (${quantidade}x R$ ${valorUnitario
              .toFixed(2)
              .replace(".", ",")})`;
          })
          .join("; ");
      }

      if (itensText) {
        doc.text(
          itensText,
          startX + colWidths.data + colWidths.tipo + colWidths.valor,
          y,
          { width: colWidths.itens }
        );
      }

      doc.moveDown(1);

      if (doc.y > 700) {
        doc.addPage();
      }
    });

    doc.moveDown(1);
  }

  private adicionarRodape(doc: PDFDocType): void {
    doc.fontSize(9).font("Helvetica").text("Caderneta - Sistema de Fiado", {
      align: "center",
    });
  }
}

export default new PdfService();
