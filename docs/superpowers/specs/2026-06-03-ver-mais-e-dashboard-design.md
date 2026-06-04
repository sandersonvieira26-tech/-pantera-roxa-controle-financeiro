# Design: "Ver mais" nas listas + Dashboard (tela inicial) com evolução mensal

**Data:** 2026-06-03
**Status:** Aprovado para implementação

Duas melhorias brainstormadas juntas. Execução em 2 etapas, com code review em cada:

1. **"Ver mais"** nas listas de Caixa e Fiado (acaba com a lista infinita).
2. **Dashboard** (tela inicial) com cards e gráfico de evolução mês a mês.

---

## Parte 1 — "Ver mais" (paginação por blocos)

### Decisões

| Tema | Decisão |
|------|---------|
| Estratégia | Mostrar os 25 itens mais recentes do que está visível; botão "Ver mais" carrega +25. |
| Reset | Ao trocar período ou busca, volta para os primeiros 25. |
| Escopo de dados | Client-side (o app já baixa tudo). Resolve o tamanho da tela; volume baixado fica para uma futura paginação no servidor (fora de escopo). |
| Tamanho do bloco | 25. |

### Caixa (`src/modules/caixa/Caixa.tsx`)

- Estado `limite` (default 25).
- `visiveis = filterByPeriod(items, periodo)`; `mostrados = visiveis.slice(0, limite)`.
- `CaixaList` recebe `mostrados`.
- Abaixo da lista: botão **"Ver mais"** quando `visiveis.length > limite` (`onClick` → `setLimite(l => l + 25)`).
- Resetar `limite` para 25 ao mudar o período: `onChange={p => { setPeriodo(p); setLimite(25) }}`.

### Fiado (`src/modules/fiado/Fiado.tsx` + `FiadoList.tsx`)

- **Refator:** mover a busca por nome do `FiadoList` para o `Fiado.tsx`, para paginar **depois** de buscar.
  - `FiadoList` deixa de receber/usar `search`; passa a só renderizar `items`.
  - A mensagem de vazio do `FiadoList` fica genérica ("Nenhum fiado").
- No `Fiado.tsx`:
  - `visiveis = fiadosVisiveis(items, periodo)` (pendentes sempre + pagos no período — já existe).
  - `buscados = search ? visiveis.filter(nome inclui search) : visiveis`.
  - `mostrados = buscados.slice(0, limite)`.
  - Botão **"Ver mais"** quando `buscados.length > limite`.
  - Resetar `limite` para 25 ao mudar período **ou** busca (nos respectivos handlers).
- Cardões (A Receber / Já Recebido / Total) continuam calculados sobre todos os dados, não sobre os `mostrados`.

### Testes

- A paginação é estado de UI simples (slice + botão); coberta pelo type-check e teste manual. Sem função pura nova a testar além do que já existe (`fiadosVisiveis`).

---

## Parte 2 — Dashboard (tela inicial) + evolução mensal

### Decisões

| Tema | Decisão |
|------|---------|
| Aba | Nova aba **`inicio`** ("Início"), vira a tela inicial do app. As 5 abas atuais continuam. |
| Cards | Vendas de hoje, Saldo do mês, A Receber, Lucro do mês + meta (progresso %). |
| Gráfico | **Linha**, últimos **6 meses**, séries **Faturamento** e **Lucro**. |
| Dados | Reaproveita lançamentos/fiados/parceiros/metas. Nenhuma tabela nova. |

### Navegação

- `src/types/index.ts`: adicionar `'inicio'` ao tipo `Tab` e `TAB_LABELS` (label "INÍCIO").
- `NavTabs.tsx` e `Sidebar.tsx`: adicionar item `inicio` (ícone `Home`) como primeiro da lista.
- `App.tsx`: `useState<Tab>('inicio')` (abre no Dashboard); renderizar `{tab === 'inicio' && <Dashboard />}`.
- Mobile: o menu inferior passa a ter 6 ícones (cabe, fica mais justo).

### Cards (cálculos, reaproveitando funções existentes)

- **Vendas de hoje** = Σ `lancamentos` tipo `entrada` com `data === hoje`.
- **Saldo do mês** = entradas − saídas do mês atual (`monthRange(0)`).
- **A Receber** = `calcAReceber(fiados, parceiros)`.
- **Lucro do mês + meta** = lucro do mês atual + progresso vs `meta_lucro` (barra %).

### Evolução mensal (função pura testável)

- `calcEvolucao.ts` → `buildEvolucaoMensal(lancamentos, parceiros, nMeses = 6)` retorna, em ordem cronológica, `[{ label, faturamento, lucro }]`:
  - para cada mês (de `nMeses-1` atrás até 0): fatia por `monthRange(i)`, `faturamento = calcFaturamento(l, p)`, `lucro = calcLucro(faturamento, calcCustos(l))`.
  - `label` = abreviação do mês em pt-BR (jan, fev, …) derivada de `monthRange(i).start`.
- `EvolucaoChart.tsx`: `LineChart` (recharts) com duas linhas, no estilo de `RelatorioChart`.

### Estrutura (novo módulo `src/modules/dashboard/`)

- `Dashboard.tsx` — monta cards + gráfico.
- `useDashboard.ts` — `useQuery` nas chaves já existentes (lançamentos, fiados, parceiros, metas — cache compartilhado, sem busca extra) e deriva cards + evolução.
- `EvolucaoChart.tsx` — gráfico de linha.
- `calcEvolucao.ts` — função pura.

### Atualização

- Dados carregam ao abrir o Dashboard (busca atual). Atualização em tempo real permanece nas abas Caixa/Fiado/Relatório.

### Testes

- `buildEvolucaoMensal`: nº de meses, ordem cronológica, soma por mês, rótulos pt-BR.

---

## Fora de escopo

- Paginação no servidor (Supabase `range`) — futura, se o volume crescer muito.
- Personalizar quais cards aparecem / escolher período do gráfico na tela.
- KPIs de produto ("o que mais vende").
