# Design: Categorias de saída + Venda rápida (entrada)

**Data:** 2026-06-02
**Status:** Aprovado para implementação

Duas melhorias independentes, no mesmo spec, em seções separadas:

1. **Categorias de saída** — classificar gastos e ver "custos por categoria".
2. **Venda rápida** — registrar venda à vista escolhendo tamanho + quantidade, com preço fixo por tamanho, sem redigitar tudo.

---

## Parte 1 — Categorias de saída

### Decisões

| Tema | Decisão |
|------|---------|
| Modelo | Tabela própria `categorias` (editável), `lancamentos.categoria_id` aponta pra ela. Renomear reflete em todos os lançamentos. |
| Lista inicial | Pronta e editável. Seed: Insumo, Embalagem, Transporte, Gás/Energia, Marketing, Equipamento, Outros. |
| Obrigatória? | **Opcional.** Sem escolher → exibido como "Sem categoria". |
| Escopo | Só **saídas**. Entradas ficam com `categoria_id` nulo. |
| Apagar em uso | **Bloquear** (FK `ON DELETE RESTRICT`). App mostra aviso pra reclassificar antes. |
| Gerenciar | Botão "Gerenciar categorias" no Caixa → modal. |
| Relatório | Seção "Custos por categoria": lista ordenada (maior→menor) com valor e %. |

### Banco de dados (`supabase/schema.sql` + migração)

```sql
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, nome)
);
-- RLS owner-only (mesmo padrão das outras tabelas).

ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE RESTRICT;
```

- `ON DELETE RESTRICT`: o próprio banco impede apagar categoria referenciada. O app captura o erro (código `23503`) e mostra: *"Categoria em uso. Reclassifique os lançamentos antes de apagar."*

### Seed dos padrões

- Client-side, idempotente: ao carregar as categorias, se o usuário não tiver nenhuma, o app insere a lista padrão. Inserção tolerante a conflito (`UNIQUE (user_id, nome)`) pra evitar duplicar em corrida.

### Frontend

- **`src/types/index.ts`**: interface `Categoria { id, user_id, nome, created_at }`; `Lancamento.categoria_id: string | null`. `LancamentoInsert` passa a aceitar `categoria_id?: string | null`.
- **`useCategorias.ts`** (novo, em `src/modules/caixa/`): query + mutations (add, rename, remove, seedDefaults) + realtime, no padrão de `useLancamentos`/`useFiados`.
- **`CaixaForm.tsx`**: quando `tipo === 'saida'`, exibe um `<select>` de Categoria (opcional). Em entrada, não aparece; envia `categoria_id` no insert.
- **`CategoriasModal.tsx`** (novo): CRUD simples (listar, adicionar, renomear, apagar) com o aviso de bloqueio. Aberto por botão no `Caixa.tsx`.
- **`CaixaList.tsx`**: em saídas com categoria, etiqueta sutil (mesmo estilo da etiqueta "Fiado").
- **Relatório**: nova função em `calcRelatorio.ts` — `calcCustosPorCategoria(lancamentos, categorias)` retornando `[{ nome, valor, pct }]` ordenado desc, com bucket "Sem categoria" pros nulos. Novo componente de lista exibido em `Relatorio.tsx`, respeitando o período. `useRelatorio` passa a buscar `categorias` pra mapear id→nome.
- **Exportação** (`export.ts`): coluna "Categoria" na tabela/linhas de lançamentos do CSV e do PDF.

### Testes

- `calcCustosPorCategoria`: soma por categoria, percentual, ordenação, bucket "Sem categoria", lista vazia.

---

## Parte 2 — Venda rápida (entrada)

### Decisões

| Tema | Decisão |
|------|---------|
| Valor | **Preço fixo por tamanho** (300ml, 500ml), configurável. Valor = preço × quantidade. |
| Campos | Só **tamanho + quantidade** (sem sabor). |
| Estoque | **Não** baixa estoque agora (fora de escopo). |
| O que salva | Um lançamento de **entrada** comum, com descrição e valor preenchidos. Sem colunas novas em `lancamentos`. |

### Banco de dados

```sql
CREATE TABLE IF NOT EXISTS precos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  tamanho     TEXT NOT NULL CHECK (tamanho IN ('300ml', '500ml')),
  preco       NUMERIC(10,2) NOT NULL CHECK (preco > 0),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tamanho)
);
-- RLS owner-only.
```

- Sem seed (preço é decisão do dono). Upsert por `(user_id, tamanho)`.

### Frontend

- **`src/types/index.ts`**: interface `Preco { id, user_id, tamanho, preco, updated_at }`; `PrecoUpsert = { tamanho, preco }`.
- **`usePrecos.ts`** (novo, em `src/modules/caixa/`): query + upsert + realtime.
- **`CaixaForm.tsx`**, modo **Entrada**: linha de "Venda rápida" com chips de tamanho (300ml/500ml) e stepper de quantidade (+/−, mínimo 1). Ao selecionar:
  - preenche `valor = preco[tamanho] × quantidade`
  - preenche `descricao = "{qtd}x {tamanho}"`
  - campos continuam editáveis; o lançamento manual segue disponível pra entradas que não são garrafa.
  - se faltar o preço do tamanho escolhido, aviso discreto com link pro modal de preços.
- **`PrecosModal.tsx`** (novo): definir/editar preço de 300ml e 500ml. Aberto por botão "Preços" no `Caixa.tsx`.

### Testes

- Helper puro de cálculo da venda rápida: `valor = preco × qtd` e montagem da descrição (`"2x 500ml"`), incluindo preço ausente.

---

## Arquitetura / isolamento

- Cada feature tem hooks próprios (`useCategorias`, `usePrecos`) e modais próprios (`CategoriasModal`, `PrecosModal`), seguindo o padrão existente dos módulos. `CaixaForm` ganha os dois extras de UI mas continua emitindo o mesmo `LancamentoInsert`.
- Cálculos puros ficam em `calcRelatorio.ts` (testáveis isoladamente).

## Fora de escopo (próximas etapas, sem bola de neve)

- Baixa automática de estoque na venda.
- Escolha de sabor na venda rápida.
- Relatório de "qual tamanho/sabor vende mais" (exigiria guardar tamanho/quantidade estruturados no lançamento).
- Categorias para entradas; orçamento/limite por categoria.
