# Design: "Ver mais" nas listas + Contador de vendas/garrafas + Dashboard

**Data:** 2026-06-03
**Status:** Aprovado para implementação

Melhorias brainstormadas juntas. Execução em 3 etapas, com code review em cada:

1. **"Ver mais"** nas listas de Caixa e Fiado (acaba com a lista infinita).
2. **Contador de vendas/garrafas** no período (conferência: "fiz 10, registrei 9").
3. **Dashboard** (tela inicial) com cards, contador e gráfico de evolução mês a mês.

---

## Parte 1 — "Ver mais" (paginação por blocos)

### Decisões

| Tema | Decisão |
|------|---------|
| Estratégia | Mostrar os 25 mais recentes do que está visível; botão "Ver mais" carrega +25. |
| Reset | Ao trocar período ou busca, volta para os primeiros 25. |
| Escopo | Client-side (o app já baixa tudo). Resolve o tamanho da tela. |
| Bloco | 25. |

### Caixa (`Caixa.tsx`)

- Estado `limite` (25). `mostrados = filterByPeriod(items, periodo).slice(0, limite)`.
- Botão "Ver mais" quando há mais que `limite`. Resetar `limite` ao trocar período.

### Fiado (`Fiado.tsx` + `FiadoList.tsx`)

- **Refator:** mover a busca por nome de `FiadoList` para `Fiado.tsx` (paginar depois de buscar). `FiadoList` passa a só renderizar `items`.
- `visiveis = fiadosVisiveis(items, periodo)` → `buscados` (filtro de nome) → `mostrados = buscados.slice(0, limite)`.
- Botão "Ver mais" quando `buscados.length > limite`. Resetar `limite` ao trocar período **ou** busca.
- Cardões continuam sobre todos os dados.

---

## Parte 2 — Contador de vendas/garrafas

### Objetivo

Conferência: ver quantas **vendas** e quantas **garrafas** saíram no período, pra cruzar com o que foi produzido ("fiz 10, o app mostra 9 → faltou lançar").

### Decisões

| Tema | Decisão |
|------|---------|
| Base | Só vendas **estruturadas**: venda rápida (lançamentos com qtd) + fiado rápido (fiados com qtd). Lançamentos manuais de texto livre não entram. |
| Onde | Card no **Relatório** (respeita o filtro de período) e card no **Dashboard** (Parte 3). |
| Sem dobra | Entrada de caixa criada por fiado pago tem qtd 0 (o fiado guarda a qtd) → não conta duas vezes. |

### Banco de dados (`schema.sql` + migração)

```sql
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS qtd_300 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qtd_500 INTEGER NOT NULL DEFAULT 0;
```

- Venda rápida preenche; lançamento manual e entrada vinda de fiado ficam 0/0.

### Venda rápida grava a quantidade (`CaixaForm.tsx`)

- Hoje a venda rápida só preenche descrição e valor. Passa a enviar também `qtd_300`/`qtd_500` conforme o tamanho escolhido × quantidade (apenas em `entrada`; manual = 0).
- `Lancamento` ganha `qtd_300`/`qtd_500`; `LancamentoInsert` aceita os dois como opcionais.

### Cálculo (função pura testável)

`contarVendas(lancamentos, fiados, periodo)` → `{ vendas: number; garrafas: number }`:
- lançamentos `entrada` com `(qtd_300>0 || qtd_500>0)` e `data` no período.
- fiados com `(qtd_300>0 || qtd_500>0)` e `data` no período.
- `vendas` = nº desses registros (lançamentos + fiados).
- `garrafas` = Σ `(qtd_300 + qtd_500)` dos dois.

> Observação: como o fiado rápido acumula a retirada do dia numa linha só, cada linha de fiado conta como 1 "venda" (mas as garrafas somam o total real). Para a conferência o número que importa é o de **garrafas**.

### Relatório

- Card "Vendas no período" exibindo `9 vendas • 14 garrafas`, calculado sobre `filterByPeriod` (mesmo período das abas).

### Testes

- `contarVendas`: soma de garrafas, contagem de vendas, ignora manuais (qtd 0), não conta a entrada vinda de fiado, respeita período.

---

## Parte 3 — Dashboard (tela inicial) + evolução mensal

### Decisões

| Tema | Decisão |
|------|---------|
| Aba | Nova aba **`inicio`** ("Início"), tela inicial. As 5 atuais continuam. |
| Cards | Vendas de hoje, Saldo do mês, A Receber, Lucro do mês + meta, e **Vendas/garrafas** (do dia). |
| Gráfico | **Linha**, últimos **6 meses**, séries **Faturamento** e **Lucro**. |
| Dados | Reaproveita lançamentos/fiados/parceiros/metas. Sem tabela nova. |

### Navegação

- `types`: `'inicio'` em `Tab` e `TAB_LABELS` ("INÍCIO").
- `NavTabs.tsx` / `Sidebar.tsx`: item `inicio` (ícone `Home`) como primeiro.
- `App.tsx`: `useState<Tab>('inicio')`; render `{tab === 'inicio' && <Dashboard />}`.
- Mobile: menu inferior com 6 ícones (mais justo, cabe).

### Cards (reaproveitando cálculos)

- **Vendas de hoje** = Σ entradas com `data === hoje`.
- **Saldo do mês** = entradas − saídas do mês atual (`monthRange(0)`).
- **A Receber** = `calcAReceber(fiados, parceiros)`.
- **Lucro do mês + meta** = lucro do mês + progresso vs `meta_lucro` (%).
- **Vendas/garrafas de hoje** = `contarVendas(lancamentos, fiados, 'hoje')`.

### Evolução mensal (função pura)

- `buildEvolucaoMensal(lancamentos, parceiros, nMeses = 6)` → ordem cronológica `[{ label, faturamento, lucro }]`, usando `monthRange(i)`, `calcFaturamento`/`calcLucro`. `label` = mês pt-BR (jan, fev, …).
- `EvolucaoChart.tsx`: `LineChart` (recharts) com duas linhas, estilo de `RelatorioChart`.

### Estrutura (novo módulo `src/modules/dashboard/`)

- `Dashboard.tsx`, `useDashboard.ts` (useQuery nas chaves existentes — cache compartilhado), `EvolucaoChart.tsx`, `calcEvolucao.ts`.

### Testes

- `buildEvolucaoMensal`: nº de meses, ordem, soma por mês, rótulos.

---

## Fora de escopo

- Paginação no servidor (Supabase `range`).
- Personalizar cards/período do gráfico na tela.
- Relatório de "qual sabor/tamanho mais vende" (o `qtd` por tamanho já fica guardado, então é um próximo passo natural).
