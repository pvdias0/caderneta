import pool from "../config/database.js";

/**
 * Serviço de Dashboard - Calcula estatísticas para o usuário
 */

export interface DashboardStats {
  totalAReceber: number;
  clientesAtivos: number;
  vendasMes: number;
  vendasDia: number;
  ticketMedio: number;
  variacao: {
    totalAReceber: number;
    clientesAtivos: number;
    vendasMes: number;
    vendasDia: number;
    ticketMedio: number;
  };
}

export interface VendaRelatorioItem {
  id_compra: number;
  cliente_nome: string;
  data_compra: string;
  valor_bruto: number;
  desconto: number;
  valor_liquido: number;
}

export interface VendasReport {
  periodo: {
    mode: "month" | "day";
    label: string;
    referenceDate: string;
    month?: number;
    year?: number;
  };
  resumo: {
    totalVendas: number;
    totalDescontos: number;
    quantidadeVendas: number;
  };
  vendas: VendaRelatorioItem[];
}

/**
 * Obter estatísticas do dashboard para um usuário
 */
export async function getDashboardStats(
  usuarioId: number
): Promise<DashboardStats> {
  try {
    // Obter o mês atual e mês anterior
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    const mesPassado = mesAtual === 1 ? 12 : mesAtual - 1;
    const anoPassado = mesAtual === 1 ? anoAtual - 1 : anoAtual;
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);
    const hojeISO = hoje.toISOString().slice(0, 10);
    const amanhaISO = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)
      .toISOString()
      .slice(0, 10);
    const ontemISO = ontem.toISOString().slice(0, 10);

    // 1. Total a Receber (soma de todos os saldos devedores)
    const totalAReceberResult = await pool.query(
      `SELECT COALESCE(SUM(ct.saldo_devedor), 0) as total
       FROM conta ct
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1`,
      [usuarioId]
    );

    const totalAReceber = parseFloat(totalAReceberResult.rows[0].total || "0");

    // 2. Total a Receber do mês passado (para calcular variação)
    const totalAReceberPassadoResult = await pool.query(
      `SELECT COALESCE(SUM(cp.valor_compra), 0) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND EXTRACT(MONTH FROM cp.data_compra) = $2
       AND EXTRACT(YEAR FROM cp.data_compra) = $3`,
      [usuarioId, mesPassado, anoPassado]
    );

    const totalAReceberPassado = parseFloat(
      totalAReceberPassadoResult.rows[0].total || "0"
    );

    const variacaoTotalAReceber =
      totalAReceberPassado > 0
        ? Math.round(
            ((totalAReceber - totalAReceberPassado) / totalAReceberPassado) *
              100
          )
        : 0;

    // 3. Clientes Ativos (todos os clientes cadastrados = clientes ativos)
    const clientesAtivosResult = await pool.query(
      `SELECT COUNT(DISTINCT c.id_cliente) as total
       FROM cliente c
       WHERE c.id_usuario = $1`,
      [usuarioId]
    );

    const clientesAtivos = parseInt(clientesAtivosResult.rows[0].total || "0");

    // 4. Clientes Ativos do mês passado (para calcular variação)
    // Contar clientes que existiam no mês passado (aproximação usando criação)
    const clientesAtivosPassadoResult = await pool.query(
      `SELECT COUNT(DISTINCT c.id_cliente) as total
       FROM cliente c
       WHERE c.id_usuario = $1
       AND EXTRACT(MONTH FROM c.datacriacao) = $2
       AND EXTRACT(YEAR FROM c.datacriacao) = $3`,
      [usuarioId, mesPassado, anoPassado]
    );

    const clientesAtivosPassado = parseInt(
      clientesAtivosPassadoResult.rows[0].total || "0"
    );

    const variacaoClientesAtivos =
      clientesAtivosPassado > 0
        ? clientesAtivos - clientesAtivosPassado
        : clientesAtivos;

    // 5. Vendas no Mês (total de créditos do mês atual)
    const vendasMesResult = await pool.query(
      `SELECT COALESCE(SUM(cp.valor_compra), 0) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND EXTRACT(MONTH FROM cp.data_compra) = $2
       AND EXTRACT(YEAR FROM cp.data_compra) = $3`,
      [usuarioId, mesAtual, anoAtual]
    );

    const vendasMes = parseFloat(vendasMesResult.rows[0].total || "0");

    // 6. Vendas no Mês Passado (para calcular variação)
    const vendasMesPassadoResult = await pool.query(
      `SELECT COALESCE(SUM(cp.valor_compra), 0) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND EXTRACT(MONTH FROM cp.data_compra) = $2
       AND EXTRACT(YEAR FROM cp.data_compra) = $3`,
      [usuarioId, mesPassado, anoPassado]
    );

    const vendasMesPassado = parseFloat(
      vendasMesPassadoResult.rows[0].total || "0"
    );

    const variacaoVendasMes =
      vendasMesPassado > 0
        ? Math.round(((vendasMes - vendasMesPassado) / vendasMesPassado) * 100)
        : 0;

    const vendasDiaResult = await pool.query(
      `SELECT COALESCE(SUM(cp.valor_compra), 0) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND cp.data_compra >= $2::date
       AND cp.data_compra < $3::date`,
      [usuarioId, hojeISO, amanhaISO]
    );

    const vendasDia = parseFloat(vendasDiaResult.rows[0].total || "0");

    const vendasOntemResult = await pool.query(
      `SELECT COALESCE(SUM(cp.valor_compra), 0) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND cp.data_compra >= $2::date
       AND cp.data_compra < $3::date`,
      [usuarioId, ontemISO, hojeISO]
    );

    const vendasOntem = parseFloat(vendasOntemResult.rows[0].total || "0");

    const variacaoVendasDia =
      vendasOntem > 0
        ? Math.round(((vendasDia - vendasOntem) / vendasOntem) * 100)
        : vendasDia > 0
          ? 100
          : 0;

    // 7. Ticket Médio (vendas do mês / número de transações)
    const transacoesResult = await pool.query(
      `SELECT COUNT(DISTINCT cp.id_compra) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND EXTRACT(MONTH FROM cp.data_compra) = $2
       AND EXTRACT(YEAR FROM cp.data_compra) = $3`,
      [usuarioId, mesAtual, anoAtual]
    );

    const numeroTransacoes = parseInt(transacoesResult.rows[0].total || "0");
    const ticketMedio = numeroTransacoes > 0 ? vendasMes / numeroTransacoes : 0;

    // 8. Ticket Médio do Mês Passado (para calcular variação)
    const transacoesPassadoResult = await pool.query(
      `SELECT COUNT(DISTINCT cp.id_compra) as total
       FROM compra cp
       INNER JOIN conta ct ON cp.id_conta = ct.id_conta
       INNER JOIN cliente c ON ct.id_cliente = c.id_cliente
       WHERE c.id_usuario = $1
       AND EXTRACT(MONTH FROM cp.data_compra) = $2
       AND EXTRACT(YEAR FROM cp.data_compra) = $3`,
      [usuarioId, mesPassado, anoPassado]
    );

    const numeroTransacoesPassado = parseInt(
      transacoesPassadoResult.rows[0].total || "0"
    );
    const ticketMedioPassado =
      numeroTransacoesPassado > 0
        ? vendasMesPassado / numeroTransacoesPassado
        : 0;

    const variacaoTicketMedio =
      ticketMedioPassado > 0
        ? Math.round(
            ((ticketMedio - ticketMedioPassado) / ticketMedioPassado) * 100
          )
        : 0;

    return {
      totalAReceber,
      clientesAtivos,
      vendasMes,
      vendasDia,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      variacao: {
        totalAReceber: variacaoTotalAReceber,
        clientesAtivos: variacaoClientesAtivos,
        vendasMes: variacaoVendasMes,
        vendasDia: variacaoVendasDia,
        ticketMedio: variacaoTicketMedio,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas do dashboard:", error);
    throw error;
  }
}

export async function getSalesReport(
  usuarioId: number,
  params: {
    mode: "month" | "day";
    year?: number;
    month?: number;
    date?: string;
  }
): Promise<VendasReport> {
  const { mode } = params;

  let startDate: string;
  let endDate: string;
  let label: string;
  let referenceDate: string;
  let month: number | undefined;
  let year: number | undefined;

  if (mode === "month") {
    year = params.year;
    month = params.month;

    if (!year || !month || month < 1 || month > 12) {
      throw new Error("Mês ou ano inválido");
    }

    startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
    referenceDate = startDate;
    label = new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${startDate}T00:00:00Z`));
  } else {
    if (!params.date || !/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      throw new Error("Data inválida");
    }

    startDate = params.date;
    const current = new Date(`${params.date}T00:00:00Z`);
    const next = new Date(current);
    next.setUTCDate(next.getUTCDate() + 1);
    endDate = next.toISOString().slice(0, 10);
    referenceDate = startDate;
    label = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(current);
  }

  const query = `
    SELECT
      cp.id_compra,
      cl.nome AS cliente_nome,
      cp.data_compra,
      COALESCE(SUM(ic.quantidade * ic.valor_unitario), cp.valor_compra + COALESCE(cp.desconto, 0)) AS valor_bruto,
      COALESCE(cp.desconto, 0) AS desconto,
      cp.valor_compra AS valor_liquido
    FROM compra cp
    INNER JOIN conta ct ON cp.id_conta = ct.id_conta
    INNER JOIN cliente cl ON ct.id_cliente = cl.id_cliente
    LEFT JOIN item_compra ic ON cp.id_compra = ic.id_compra
    WHERE cl.id_usuario = $1
      AND cp.data_compra >= $2::date
      AND cp.data_compra < $3::date
    GROUP BY cp.id_compra, cl.nome, cp.data_compra, cp.valor_compra, cp.desconto
    ORDER BY cp.data_compra DESC, cp.id_compra DESC
  `;

  try {
    const result = await pool.query(query, [usuarioId, startDate, endDate]);

    const vendas: VendaRelatorioItem[] = result.rows.map((row) => ({
      id_compra: Number(row.id_compra),
      cliente_nome: row.cliente_nome,
      data_compra: row.data_compra,
      valor_bruto: Number(row.valor_bruto || 0),
      desconto: Number(row.desconto || 0),
      valor_liquido: Number(row.valor_liquido || 0),
    }));

    const resumo = vendas.reduce(
      (acc, venda) => {
        acc.totalVendas += venda.valor_liquido;
        acc.totalDescontos += venda.desconto;
        acc.quantidadeVendas += 1;
        return acc;
      },
      {
        totalVendas: 0,
        totalDescontos: 0,
        quantidadeVendas: 0,
      }
    );

    return {
      periodo: {
        mode,
        label,
        referenceDate,
        month,
        year,
      },
      resumo,
      vendas,
    };
  } catch (error) {
    console.error("❌ Erro ao obter relatório de vendas:", error);
    throw error;
  }
}
