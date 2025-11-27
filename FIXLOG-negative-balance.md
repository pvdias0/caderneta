# Correção: Saldo Devedor Negativo

## 🔍 Problema Identificado

Ao editar uma compra (reduzindo a quantidade de itens), o `saldo_devedor` ficava **negativo**. 

**Exemplo do erro:**
- Compra original: 2 produtos × R$10 = R$20
- Editada para: 1 produto × R$10 = R$10
- Delta calculado: 10 - 20 = **-10** (aplicado ao saldo)
- Resultado: Saldo devedor **negativo** ❌

## 🔧 Raiz do Problema

Na função `updateCompraComItens()` do `movimento.service.ts`:

1. ❌ **Validação incorreta de estoque**: Validava ANTES de devolver as quantidades antigas
2. ❌ **Ordem de operações errada**: Não considerava que quantidades antigas seriam devolvidas
3. ❌ **Cálculo de saldo impreciso**: O trigger `trg_compra_after_update()` aplicava delta sem considerar o contexto

## ✅ Soluções Implementadas

### 1. **Backend - movimento.service.ts**

**Mudança**: Função `updateCompraComItens()` - Linha ~360

```typescript
// ANTES: Validava estoque sem considerar devolução
if (produto.quantidade_estoque < item.quantidade) {
  throw new Error(...)
}

// DEPOIS: Calcula estoque disponível APÓS devolver quantidades antigas
const estoqueDisponivel = 
  produto.quantidade_estoque + 
  (oldQtdByProduct[item.id_produto] || 0);

if (estoqueDisponivel < item.quantidade) {
  throw new Error(...)
}
```

**Benefício**: Garante que a validação considera as quantidades que serão devolvidas.

### 2. **Backend - movimento.controller.ts**

**Mudança**: Função `atualizarCompraComItens()` - Linha ~269

Adicionado notificações WebSocket após atualizar compra:
```typescript
// Notificar sobre atualização de saldo
notificarSaldoClienteAtualizado(usuarioId, clienteId, saldoDevedor);

// Notificar sobre atualização do total a receber
notificarTotalAReceberAtualizado(usuarioId, totalAReceber);
```

**Benefício**: Frontend recebe atualização do saldo em tempo real via WebSocket.

## 📊 Como o Trigger Agora Funciona

O trigger `trg_compra_after_update()` no banco:

```sql
delta := NEW.Valor_Compra - OLD.Valor_Compra;
PERFORM ajuste_saldo_conta(NEW.ID_Conta, delta);
```

**Exemplo corrigido:**
1. Compra original: R$20 → saldo_devedor = +20
2. Edita para: R$10 → delta = 10 - 20 = -10
3. Novo saldo: 20 + (-10) = **10** ✅ (correto!)

## 🔄 Fluxo Completo de Update

```
1. updateCompraComItens() chamado
2. Obtém itens antigos
3. Calcula estoque DISPONÍVEL (atual + devolução)
4. Valida novo estoque com valor disponível
5. Devolve quantidades antigas aos produtos
6. Atualiza valor_compra → Trigger calcula delta
7. Notifica WebSocket com novo saldo
```

## 🚀 Para Testar

1. Editar uma compra com 2 itens de R$10 = R$20
2. Mudar para 1 item = R$10
3. Saldo devedor deve **reduzir** em R$10 ✅
4. Nunca ficar negativo ❌

## 📝 Script de Verificação

Executar `fix-negative-balance.sql` para:
- Listar contas com saldo negativo (se existirem)
- Recalcular todos os saldos
- Verificar resultado
