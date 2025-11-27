-- Script para criar triggers de pagamento que faltavam
-- Problema: quando um pagamento é criado/atualizado/deletado, o saldo não era atualizado
-- Solução: criar triggers que chamam ajuste_saldo_conta

-- Função para INSERT de pagamento
CREATE OR REPLACE FUNCTION public.trg_pagamento_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Um pagamento reduz o saldo devedor (valor negativo)
    PERFORM ajuste_saldo_conta(NEW.id_conta, -NEW.valor_pagamento);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para INSERT de pagamento
DROP TRIGGER IF EXISTS trg_pagamento_after_insert ON pagamento;
CREATE TRIGGER trg_pagamento_after_insert
AFTER INSERT ON pagamento
FOR EACH ROW
EXECUTE FUNCTION trg_pagamento_after_insert();

-- Função para UPDATE de pagamento
CREATE OR REPLACE FUNCTION public.trg_pagamento_after_update()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC;
BEGIN
    -- Calcular a diferença entre novo e antigo pagamento
    -- Se novo pagamento > antigo, é uma redução maior do saldo (delta negativo)
    delta := -(NEW.valor_pagamento - OLD.valor_pagamento);
    
    -- Se mudou de conta, reverte na conta antiga e aplica na nova
    IF (NEW.id_conta <> OLD.id_conta) THEN
        -- Reverter na conta antiga (remover efeito do pagamento antigo = saldo aumenta)
        PERFORM ajuste_saldo_conta(OLD.id_conta, OLD.valor_pagamento);
        -- Aplicar na conta nova (novo pagamento = saldo diminui)
        PERFORM ajuste_saldo_conta(NEW.id_conta, -NEW.valor_pagamento);
    ELSE
        -- Mesma conta, apenas aplicar delta
        PERFORM ajuste_saldo_conta(NEW.id_conta, delta);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para UPDATE de pagamento
DROP TRIGGER IF EXISTS trg_pagamento_after_update ON pagamento;
CREATE TRIGGER trg_pagamento_after_update
AFTER UPDATE ON pagamento
FOR EACH ROW
EXECUTE FUNCTION trg_pagamento_after_update();

-- Função para DELETE de pagamento
CREATE OR REPLACE FUNCTION public.trg_pagamento_after_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Deletar um pagamento aumenta o saldo devedor (valor positivo)
    PERFORM ajuste_saldo_conta(OLD.id_conta, OLD.valor_pagamento);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para DELETE de pagamento
DROP TRIGGER IF EXISTS trg_pagamento_after_delete ON pagamento;
CREATE TRIGGER trg_pagamento_after_delete
AFTER DELETE ON pagamento
FOR EACH ROW
EXECUTE FUNCTION trg_pagamento_after_delete();
