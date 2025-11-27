-- Script para corrigir saldos_devedor negativos
-- Este script recalcula os saldos com base nas compras e pagamentos reais

-- 1. Verificar contas com saldo_devedor negativo
SELECT 
    c.id_conta,
    cl.nome as cliente_nome,
    c.saldo_devedor as saldo_atual,
    COALESCE(SUM(CASE WHEN m.tipo = 'COMPRA' THEN 1 ELSE 0 END), 0) as total_compras,
    COALESCE(SUM(CASE WHEN m.tipo = 'PAGAMENTO' THEN 1 ELSE 0 END), 0) as total_pagamentos
FROM conta c
JOIN cliente cl ON c.id_cliente = cl.id_cliente
LEFT JOIN movimento m ON c.id_conta = m.id_conta
WHERE c.saldo_devedor < 0
GROUP BY c.id_conta, cl.nome, c.saldo_devedor
ORDER BY c.saldo_devedor ASC;

-- 2. Recalcular todos os saldos (esta função já existe no schema)
SELECT recalc_todas_saldos();

-- 3. Verificar resultado após recalcular
SELECT 
    c.id_conta,
    cl.nome as cliente_nome,
    c.saldo_devedor as saldo_corrigido
FROM conta c
JOIN cliente cl ON c.id_cliente = cl.id_cliente
ORDER BY c.id_conta;
