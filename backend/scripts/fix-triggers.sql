-- Script para corrigir triggers e funções que usam nomes de colunas em minúsculas
-- Execute este script na Neon em produção

-- 1. Corrigir ajuste_saldo_conta - procurar por id_cliente e ajustar se necessário
-- 2. Corrigir recalc_saldo_conta

-- Função para ajustar saldo da conta
CREATE OR REPLACE FUNCTION public.ajuste_saldo_conta(
    p_id_conta bigint,
    p_delta numeric
) RETURNS void AS $$
BEGIN
    -- Validar que a conta existe
    IF NOT EXISTS(SELECT 1 FROM conta WHERE ID_Conta = p_id_conta) THEN
        RAISE EXCEPTION 'Conta % não encontrada', p_id_conta;
    END IF;

    -- Atualizar o saldo
    UPDATE conta
    SET Saldo_Devedor = Saldo_Devedor + p_delta,
        UltimaAtualizacao = NOW()
    WHERE ID_Conta = p_id_conta;
END;
$$ LANGUAGE plpgsql;

-- Função para recalcular saldo da conta
CREATE OR REPLACE FUNCTION public.recalc_saldo_conta(p_id_conta bigint)
RETURNS numeric AS $$
DECLARE
    total_compras NUMERIC := 0;
    total_pagamentos NUMERIC := 0;
    novo_saldo NUMERIC := 0;
BEGIN
    -- Calcular total de compras
    SELECT COALESCE(SUM(Valor_Compra), 0)
    INTO total_compras
    FROM compra
    WHERE ID_Conta = p_id_conta AND Deletado = false;

    -- Calcular total de pagamentos
    SELECT COALESCE(SUM(Valor_Pagamento), 0)
    INTO total_pagamentos
    FROM pagamento
    WHERE ID_Conta = p_id_conta AND Deletado = false;

    -- Calcular novo saldo
    novo_saldo := total_compras - total_pagamentos;

    -- Atualizar a conta
    UPDATE conta
    SET Saldo_Devedor = novo_saldo,
        UltimaAtualizacao = NOW()
    WHERE ID_Conta = p_id_conta;

    RETURN novo_saldo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para delete de compra
CREATE OR REPLACE FUNCTION public.trg_compra_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ajuste_saldo_conta(OLD.ID_Conta, -OLD.Valor_Compra);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para insert de compra
CREATE OR REPLACE FUNCTION public.trg_compra_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ajuste_saldo_conta(NEW.ID_Conta, NEW.Valor_Compra);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para delete de pagamento
CREATE OR REPLACE FUNCTION public.trg_pagamento_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ajuste_saldo_conta(OLD.ID_Conta, OLD.Valor_Pagamento);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para insert de pagamento
CREATE OR REPLACE FUNCTION public.trg_pagamento_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ajuste_saldo_conta(NEW.ID_Conta, -NEW.Valor_Pagamento);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
