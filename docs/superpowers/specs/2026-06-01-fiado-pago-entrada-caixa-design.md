# Design: Fiado pago → entrada automática no Caixa

**Data:** 2026-06-01
**Status:** Aprovado para implementação

## Problema

Hoje, quando um fiado é marcado como pago:

- O **Relatório** e o **Lucro do mês** já somam o valor do fiado pago (em `calcRelatorio.ts` e `useLucroMes.ts`).
- A aba **CAIXA**, porém, calcula saldo/entradas/saídas apenas a partir da tabela `lancamentos` — então o fiado pago **não aparece no caixa**.

Resultado: o dinheiro do fiado pago entra no lucro, mas fica invisível no Caixa. O usuário quer que, ao marcar um fiado como pago, ele apareça automaticamente como entrada no Caixa.

**Risco principal:** se simplesmente criarmos um lançamento de entrada ao marcar o fiado como pago, sem ajustar o cálculo, o valor seria contado **em dobro** no lucro (uma vez via `fiados.pago`, outra via `lancamentos`).

## Decisões tomadas

| Tema | Decisão |
|------|---------|
| Comportamento | Lançamento automático **visível** no Caixa, com ajuste de cálculo para não duplicar. |
| Fiados já pagos antes da mudança | Nenhuma migração (usuário tem poucos/nenhum fiado pago). Vale daqui pra frente. |
| Data da entrada | **Data do pagamento (hoje)** — reflete quando o dinheiro entrou no caixa. |
| Onde fica a lógica | **Trigger no banco (Supabase)** — atômico e à prova de inconsistência. |
| Marca visual | Etiqueta/ícone sutil "Fiado" na linha automática do Caixa. |
| Exclusão da linha automática | Sem botão de excluir nas linhas vindas de fiado; remoção só ao desmarcar o fiado. |

## Solução

### 1. Banco de dados (`supabase/schema.sql` + migração)

- Adicionar coluna `fiado_id UUID REFERENCES fiados(id) ON DELETE CASCADE` (nullable) em `lancamentos`. Liga a entrada automática ao fiado de origem. `NULL` = lançamento manual normal.
- Criar função + trigger `AFTER UPDATE` (e cobrir `DELETE`) em `fiados`:
  - Quando `pago` muda de `false` → `true`: inserir em `lancamentos`:
    - `tipo = 'entrada'`
    - `descricao = 'Fiado pago — ' || nome_cliente`
    - `valor = NEW.valor`
    - `data = CURRENT_DATE` (data do pagamento)
    - `user_id = NEW.user_id`
    - `fiado_id = NEW.id`
  - Quando `pago` muda de `true` → `false`: deletar o lançamento com `fiado_id = NEW.id`.
  - Quando o fiado é deletado: `ON DELETE CASCADE` remove o lançamento ligado automaticamente.
- Garantir idempotência: ao virar pago, evitar inserir duplicado se já existir lançamento com aquele `fiado_id`.

### 2. Cálculo do lucro/relatório (sem dobra)

- `src/modules/relatorio/calcRelatorio.ts` → `calcFaturamento`: **remover** o termo `fiadosPagos`. O fiado pago agora entra via `lancamentos` (entrada). Manter `parceirosPagos` como está (fora de escopo).
- `src/hooks/useLucroMes.ts`: **remover** a soma de `fiados.pago`. Continuar somando entradas/saídas de `lancamentos` e `parceiros.pago`.
- `calcAReceber` permanece igual (soma fiados/parceiros **pendentes**).
- Atenção: a query de `useLucroMes` deixa de precisar buscar fiados para o cálculo do lucro (mas ainda pode buscar para "a receber" se aplicável — verificar uso real na implementação).

### 3. App (frontend)

- `togglePago` em `src/modules/fiado/useFiados.ts`: **sem mudança** — apenas atualiza `fiados.pago`; o banco faz o resto. O realtime existente em `useLancamentos` já invalida e atualiza o Caixa.
- `src/modules/caixa/CaixaList.tsx`:
  - Mostrar etiqueta/ícone sutil "Fiado" quando `item.fiado_id` estiver preenchido.
  - Ocultar o botão de excluir quando `item.fiado_id` estiver preenchido (remoção só via desmarcar o fiado).
- `src/types/index.ts`: adicionar `fiado_id?: string | null` na interface `Lancamento`. `LancamentoInsert` continua sem `fiado_id` (inserções manuais não usam).

### 4. Telas que NÃO mudam

- Aba **FIADO** (`Fiado.tsx`): "A Receber", "Já Recebido", "Total" continuam calculados direto da tabela `fiados`.
- Aba **CAIXA** (`Caixa.tsx`): saldo/entradas/saídas continuam derivando de `lancamentos` — agora passam a refletir os fiados pagos automaticamente (efeito desejado).

### 5. Testes

- Atualizar `tests/modules/relatorio/calcRelatorio.test.ts` para refletir que fiado pago **não** soma mais em `calcFaturamento`.
- Adicionar caso garantindo que entradas de `lancamentos` (incluindo as vindas de fiado) somam corretamente, sem duplicação.

## Fora de escopo

- Migração de fiados já pagos antes da mudança.
- Parceiros pagos (continuam contados via `parceiros.pago`).
- Atribuição de mês por data original do fiado (usamos data do pagamento).

## Fluxo de dados (resumo)

```
[Usuário marca fiado como pago]
        │
        ▼
 UPDATE fiados.pago = true
        │  (trigger no banco)
        ▼
 INSERT lancamentos (tipo=entrada, fiado_id=..., data=hoje)
        │  (realtime)
        ▼
 Caixa atualiza saldo + mostra linha "Fiado pago — Fulano" 🏷️Fiado
 Relatório/Lucro contam a entrada uma única vez
```
