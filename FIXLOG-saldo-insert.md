# Correção: Saldo_Devedor Não Atualiza ao Criar Compra

## 🔴 Problema

Ao criar uma nova compra, o `saldo_devedor` da conta do cliente fica como **0** (não atualiza).

**Fluxo incorreto:**
1. Usuário cria compra com valor R$100
2. Registro criado em `compra` table ✓
3. Registro criado em `movimento` table ✓
4. Saldo_devedor em `conta` table **permanece 0** ❌

## 🔍 Causa Raiz

No banco de dados:

```sql
-- Trigger existente (apenas log):
CREATE TRIGGER log_compra 
AFTER INSERT ON public.compra 
FOR EACH ROW 
EXECUTE FUNCTION public.trg_log_compra();
```

A função `trg_log_compra()` apenas cria um registro em `movimento`:
```sql
INSERT INTO movimento (id_conta, tipo, id_compra)
VALUES (NEW.id_conta, 'COMPRA', NEW.id_compra);
```

**Falta:** Um trigger `AFTER INSERT` que chame `ajuste_saldo_conta()` para atualizar o saldo.

**Trigger existentes:**
- ✅ `trg_compra_au` (AFTER UPDATE) - atualiza saldo ao editar compra
- ✅ `trg_compra_ad` (AFTER DELETE) - atualiza saldo ao deletar compra
- ❌ `trg_compra_ai` (AFTER INSERT) - **FALTA!** - não atualiza saldo ao criar compra

## ✅ Solução

Adicionar trigger `AFTER INSERT` na tabela `compra`:

```sql
-- 1. Criar função
CREATE OR REPLACE FUNCTION trg_compra_after_insert()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ajuste_saldo_conta(NEW.ID_Conta, NEW.Valor_Compra);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Criar trigger
CREATE TRIGGER trg_compra_ai
AFTER INSERT ON public.compra
FOR EACH ROW
EXECUTE FUNCTION trg_compra_after_insert();
```

## 🔄 Fluxo Corrigido

1. Usuário cria compra com valor R$100
2. INSERT em `compra` table ✓
3. Trigger `log_compra` cria registro em `movimento` ✓
4. **Trigger `trg_compra_ai` chama `ajuste_saldo_conta()`** ✓
5. `saldo_devedor` na `conta` table = **R$100** ✓

## 📋 Triggers na Tabela Compra (Fluxo Completo)

| Evento | Trigger | Função | O que Faz |
|--------|---------|--------|-----------|
| INSERT | `log_compra` | `trg_log_compra()` | Cria registro em `movimento` |
| INSERT | `trg_compra_ai` | `trg_compra_after_insert()` | Aumenta `saldo_devedor` |
| UPDATE | `trg_compra_au` | `trg_compra_after_update()` | Aplica delta ao `saldo_devedor` |
| DELETE | `trg_compra_ad` | `trg_compra_after_delete()` | Reduz `saldo_devedor` |

## 🚀 Como Aplicar

Execute o script SQL:
```bash
psql -h <seu-host> -U <seu-user> -d caderneta -f scripts/fix-saldo-insert.sql
```

Ou via Neon Console:
1. Copie conteúdo de `scripts/fix-saldo-insert.sql`
2. Execute no SQL Editor do Neon
3. Verifique resultado com query de verificação no final

## 🧪 Teste

Após aplicar a correção:
1. Criar novo cliente
2. Criar novo produto com estoque
3. Criar compra com esse produto
4. Verificar se `saldo_devedor` foi atualizado
5. Saldo deve ser = valor total da compra ✓
