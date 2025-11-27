-- Script para corrigir o problema de saldo_devedor não atualizar ao criar compra
-- O problema: o trigger 'log_compra' só cria registro em movimento
-- Solução: adicionar trigger AFTER INSERT para atualizar saldo_devedor

-- 1. Criar função para atualizar saldo ao inserir compra
CREATE OR REPLACE FUNCTION trg_compra_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Ao inserir uma compra, adiciona-se o valor (aumento no saldo_devedor)
    PERFORM ajuste_saldo_conta(NEW.ID_Conta, NEW.Valor_Compra);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger para chamar a função ao inserir compra
-- Verificar se o trigger já existe antes de criar
DROP TRIGGER IF EXISTS trg_compra_ai ON compra;

CREATE TRIGGER trg_compra_ai
AFTER INSERT ON public.compra
FOR EACH ROW
EXECUTE FUNCTION trg_compra_after_insert();

-- 3. Verificar resultado: saldos devem estar corretos agora
SELECT 
    c.id_conta,
    cl.nome as cliente_nome,
    c.saldo_devedor as saldo_atual,
    COALESCE(SUM(CASE WHEN m.tipo = 'COMPRA' THEN comp.valor_compra ELSE 0 END), 0) as total_compras,
    COALESCE(SUM(CASE WHEN m.tipo = 'PAGAMENTO' THEN pag.valor_pagamento ELSE 0 END), 0) as total_pagamentos
FROM conta c
JOIN cliente cl ON c.id_cliente = cl.id_cliente
LEFT JOIN movimento m ON c.id_conta = m.id_conta
LEFT JOIN compra comp ON m.id_compra = comp.id_compra
LEFT JOIN pagamento pag ON m.id_pagamento = pag.id_pagamento
GROUP BY c.id_conta, cl.nome, c.saldo_devedor
ORDER BY c.id_conta;
