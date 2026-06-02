# Design: Fiado rápido (cliente + tamanho, com acúmulo diário)

**Data:** 2026-06-02
**Status:** Aprovado para implementação

## Problema

Registrar fiado hoje exige digitar cliente, descrição, valor e data toda vez. Como os produtos são só 300ml e 500ml (com preço já cadastrado em `precos`), dá pra registrar uma retirada escolhendo cliente + tamanho + quantidade — sem redigitar. Além disso, o mesmo cliente costuma pegar mais de uma vez no dia: nesse caso o ideal é **somar na retirada de hoje dele**, não criar várias linhas.

## Decisões

| Tema | Decisão |
|------|---------|
| Preço | Reaproveita a tabela `precos` (300ml/500ml). Sem preço por cliente. |
| Cliente padrão | Salva só o **nome** (sem tamanho fixo). Tamanho escolhido a cada retirada. |
| Cadastro de cliente | **Automático** ao registrar com um nome novo. Modal só pra apagar nomes errados. |
| Vários tamanhos no mesmo dia | **Uma linha só** por cliente/dia, ex.: `2x 500ml + 1x 300ml`, valor somado. |
| Já pago hoje | Cria **nova retirada** (linha pendente). Não mexe no que foi acertado. |
| Lógica de acúmulo | No app (hook + função pura testável); botão travado enquanto salva. |
| Convivência | Formulário manual de fiado continua disponível. |

## Banco de dados (`supabase/schema.sql` + migração)

```sql
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, nome)
);
-- RLS owner-only (mesmo padrão das demais tabelas).

ALTER TABLE fiados
  ADD COLUMN IF NOT EXISTS qtd_300 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qtd_500 INTEGER NOT NULL DEFAULT 0;
```

- `qtd_300`/`qtd_500`: quantidades por tamanho de uma retirada rápida. Fiados manuais ficam em 0/0. São o que distingue uma linha "rápida" (acumulável) de uma manual.

## Função pura de acúmulo (testável)

`acumularFiado(atual, tamanho, qtd, preco300, preco500)` → `{ qtd_300, qtd_500, descricao, valor }`

- `atual` = `{ qtd_300, qtd_500 }` da linha existente, ou `{ 0, 0 }` se for nova.
- Soma `qtd` ao tamanho escolhido.
- `descricao` = partes não-zero unidas por `" + "`, ex.: `"2x 500ml + 1x 300ml"`.
- `valor` = `qtd_300 * preco300 + qtd_500 * preco500` (recalculado com os preços atuais).
- Pré-condição: o preço do tamanho escolhido existe (a tela bloqueia/avisa caso contrário).

> Recalcular o valor com os preços atuais é aceitável: mudança de preço no meio do dia é rara, e mantém valor e quantidades sempre coerentes.

## Hook / fluxo

Nova mutation em `useFiados` — `addRapido({ nome_cliente, tamanho, qtd })`:

1. Busca no Supabase um fiado de `nome_cliente`, `data = hoje`, `pago = false` e `(qtd_300 > 0 OR qtd_500 > 0)` (retirada rápida).
2. Calcula via `acumularFiado` (partindo do existente ou do zero).
3. **Update** se achou; **insert** (com `user_id`, `pago=false`, `data=hoje`) se não.
4. `upsert` do nome em `clientes` (idempotente via `UNIQUE`, `ignoreDuplicates`).
5. Invalida `fiados` e `lucro-mes`.

Preços vêm de `usePrecos` (`getPreco`). Botão desabilitado enquanto a mutation está pendente (evita corrida por duplo clique), no padrão de `useEstoque.adjust`.

## Frontend

- **`src/types/index.ts`**: `Fiado.qtd_300`, `Fiado.qtd_500`; interface `Cliente { id, user_id, nome, created_at }`.
- **`useClientes.ts`** (novo, em `src/modules/fiado/`): query + `remove` + realtime (canal com nome único por instância, via `useId`).
- **`fiadoRapido.ts`** (novo): função pura `acumularFiado`.
- **`FiadoForm.tsx`**: novo bloco "Fiado rápido" — seletor de cliente (input com `datalist` dos salvos, aceita nome novo), chips de tamanho, contador de quantidade, aviso de preço ausente com atalho pra `PrecosModal`, botão "Adicionar retirada". O formulário manual segue abaixo/disponível.
- **`ClientesModal.tsx`** (novo): lista de clientes salvos com botão de apagar. Aberto por botão "Clientes" em `Fiado.tsx`.
- **`Fiado.tsx`**: estado dos modais (`PrecosModal` reaproveitado, `ClientesModal`) e fios da nova mutation.
- **`FiadoList.tsx`**: sem mudança — já exibe `descricao` e `valor`.

## Testes

- `acumularFiado`: primeira retirada (uma linha "Nx tamanho"); somar mesmo tamanho (2x); somar tamanho diferente (descrição combinada e valor somado); recálculo de valor; partindo de `null`.

## Fora de escopo

- Tamanho fixo por cliente.
- Baixa de estoque, escolha de sabor.
- Reduzir quantidade na linha (só acréscimo; pra corrigir, exclui a linha e relança).
- Renomear cliente (o nome fica gravado como texto no fiado; renomear não propagaria).
