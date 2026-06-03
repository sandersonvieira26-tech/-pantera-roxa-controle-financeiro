# Design: Filtro por data nas listas + Meta e comparativo mensal

**Data:** 2026-06-02
**Status:** Aprovado para implementação

Duas melhorias de organização/visão, no mesmo spec, em seções separadas. Execução sugerida em 2 etapas, com code review em cada:

1. **Filtro por data** nas listas de Caixa e Fiado (resolve a "lista infinita").
2. **Meta e comparativo mensal** no Relatório.

---

## Parte 1 — Filtro por data nas listas

### Decisões

| Tema | Decisão |
|------|---------|
| Estilo do filtro | Abas de período **Hoje / Semana / Mês / Tudo** (mesmas do Relatório), padrão **Mês**. |
| Reuso | Extrair componente `PeriodoTabs` e usar em Relatório, Caixa e Fiado (sem duplicar markup). |
| Caixa | Lista e cardões (Saldo/Entradas/Saídas) refletem o período. |
| Fiado | **Pendentes sempre visíveis** (são dívida); o período filtra só os **pagos** (histórico). |
| Cardões Fiado | A Receber = total pendente (tudo); Já Recebido = pago no período; Total = soma do que está na lista. |

### Componente `PeriodoTabs`

- Novo `src/components/PeriodoTabs.tsx`: recebe `value: Periodo` e `onChange`, renderiza as 4 abas (markup hoje embutido em `Relatorio.tsx`).
- `Relatorio.tsx` passa a usar `PeriodoTabs` (refator sem mudança de comportamento).

### Caixa (`src/modules/caixa/Caixa.tsx`)

- Estado `periodo` (default `'mes'`).
- `PeriodoTabs` acima da lista.
- `const visiveis = filterByPeriod(items, periodo)`.
- Cardões e lista calculados sobre `visiveis` (Saldo = Entradas − Saídas do período).
- `CaixaList` recebe `visiveis`.

### Fiado (`src/modules/fiado/Fiado.tsx`)

- Estado `periodo` (default `'mes'`).
- `PeriodoTabs` acima da lista (a busca por nome continua).
- Regra de exibição:
  - **Pendentes** (`!pago`): sempre na lista, independente do período.
  - **Pagos** (`pago`): só se `filterByPeriod` incluir a `data`.
  - `const visiveis = items.filter(f => !f.pago || estaNoPeriodo(f))`.
- Cardões:
  - **A Receber** = Σ valor dos pendentes (todos).
  - **Já Recebido** = Σ valor dos pagos dentro do período.
  - **Total** = A Receber + Já Recebido (= soma do que aparece na lista).
- `FiadoList` recebe `visiveis` (a busca por nome continua aplicada dentro dele).

### Testes

- `filterByPeriod` já tem comportamento conhecido; adicionar teste do filtro do Fiado ("pendentes sempre, pagos por período") como função/derivação pura, se extraída.

---

## Parte 2 — Meta e comparativo mensal (Relatório)

### Decisões

| Tema | Decisão |
|------|---------|
| Meta | De **faturamento E lucro** (duas metas). |
| Comparativo | **Faturamento e lucro** vs mês anterior. |
| Onde | Seção no topo do Relatório, sempre do **mês atual** (independente das abas de período). |
| Configurar | Botão "Meta" no Relatório abre modal. |

### Banco de dados (`supabase/schema.sql` + migração)

```sql
CREATE TABLE IF NOT EXISTS metas (
  user_id           UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
  meta_faturamento  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (meta_faturamento >= 0),
  meta_lucro        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (meta_lucro >= 0),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
-- RLS owner-only.
```

- Uma linha por usuário (PK = user_id). Upsert por `user_id`.

### Cálculos (funções puras, testáveis)

- `monthRange(mesesAtras = 0): { start: string; end: string }` em `utils/format.ts` — primeiro e último dia (ISO local) do mês deslocado. `0` = mês atual, `1` = mês passado.
- `calcVariacao(atual, anterior): number | null` — `((atual - anterior) / anterior) * 100`; retorna `null` se `anterior === 0`.
- Reaproveita `calcFaturamento` / `calcCustos` / `calcLucro` sobre as fatias do mês atual e do anterior.
- Fatia mensal: itens com `data >= start && data <= end` do `monthRange`.

### Frontend

- **`src/types/index.ts`**: `Meta { user_id, meta_faturamento, meta_lucro, updated_at }`; `MetaUpsert = { meta_faturamento, meta_lucro }`.
- **`useMetas.ts`** (novo, em `src/modules/relatorio/`): query + upsert.
- **`MetaModal.tsx`** (novo): define meta_faturamento e meta_lucro (upsert), no padrão de `PrecosModal`.
- **`useRelatorio.ts`**: além do que já retorna, calcula a partir de `allLanc`/`allParc`:
  - `mesAtual = { faturamento, lucro }`, `mesAnterior = { faturamento, lucro }` via `monthRange(0)` e `monthRange(1)`.
  - retorna esses + as variações.
- **`Relatorio.tsx`**: seção nova no topo (acima das abas), sempre mensal:
  - Botão "Meta".
  - Progresso: barra Faturamento (mês atual / meta_faturamento, %), barra Lucro (mês atual / meta_lucro, %). Se meta = 0, mostra "defina sua meta".
  - Comparativo: Faturamento e Lucro com seta ▲/▼ e variação; "—" quando mês anterior é 0.

### Testes

- `monthRange(0)` e `monthRange(1)` (limites do mês, e virada de ano em janeiro).
- `calcVariacao`: positivo, negativo, anterior zero (null).

---

## Arquitetura / isolamento

- `PeriodoTabs` centraliza o seletor de período (uma fonte da verdade).
- Cálculos novos ficam em funções puras (`utils/format.ts`, `calcRelatorio.ts`), testáveis isoladamente.
- `useMetas` e `MetaModal` isolam a configuração de metas.

## Fora de escopo

- Meta por mês específico (usa uma meta recorrente única).
- Paginação "carregar mais" (o filtro de período já resolve a lista infinita).
- Comparativo de outros períodos além de mês atual vs anterior.
