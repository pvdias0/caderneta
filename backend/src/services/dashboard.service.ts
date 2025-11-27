import pool from "../config/database.js";

/**
 * Serviço de Dashboard - Calcula estatísticas para o usuário
 */

export interface DashboardStats {
  totalAReceber: number;
  clientesAtivos: number;
  vendasMes: number;
  ticketMedio: number;
  variacao: {
    totalAReceber: number;
    clientesAtivos: number;
    vendasMes: number;
    ticketMedio: number;
  };
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
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      variacao: {
        totalAReceber: variacaoTotalAReceber,
        clientesAtivos: variacaoClientesAtivos,
        vendasMes: variacaoVendasMes,
        ticketMedio: variacaoTicketMedio,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas do dashboard:", error);
    throw error;
  }
}
