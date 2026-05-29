# Design Spec — Pantera Roxa: Redesign de UI

**Data:** 2026-05-29  
**Status:** Aprovado pelo usuário

---

## Problemas identificados

1. Textos muito pequenos e sem hierarquia clara
2. Cards de resumo com mesmo peso visual — difícil saber o que importa
3. Itens de lista visualmente idênticos — entrada igual a saída
4. Sem transições — mudanças são bruscas
5. Muito espaço em branco — pouco conteúdo visível por tela
6. Formulários com campos pouco claros (só placeholder, sem label)

---

## 1. Tipografia e Hierarquia

| Elemento | Antes | Depois |
|----------|-------|--------|
| Valores monetários (cards) | `text-2xl font-display` | `text-3xl font-display` (secundários) / `text-4xl` (principal) |
| Labels de resumo | `text-xs uppercase` | `text-[11px] uppercase tracking-widest` — mais fino |
| Título de seção | `text-xl font-display` | `text-lg font-display` |
| Texto principal (descrição) | `text-sm` | `text-sm font-medium` |
| Texto secundário (data, detalhe) | `text-xs text-pantera-lavender` | `text-xs text-pantera-lavender/70` |

---

## 2. Espaçamentos

| Elemento | Antes | Depois |
|----------|-------|--------|
| Padding de card | `p-4` | `p-3` |
| Padding de item de lista | `py-3` | `py-2.5 px-3` |
| Gap entre cards | `gap-3` | `gap-2` |
| Padding lateral da main | `px-4 py-4` | `px-2 py-3` (mobile) / `px-4 py-3` (desktop) |
| Espaço entre seções | `mb-4` | `mb-3` |

---

## 3. Cards de Resumo — Nova Hierarquia

**SummaryCard ganha prop `primary` (diferente de `size`):**
- `primary={false}` (padrão): comportamento atual — `text-2xl` ou `text-3xl` via `size`
- `primary={true}`: `text-4xl font-display`, ocupa linha inteira, sem restrição de largura

O card principal ocupa linha 1 (`col-span-full`). Os secundários ficam em `grid-cols-2` na linha 2:

```
┌─────────────────────────────────┐   ← grid-cols-1 (primary)
│  SALDO                          │
│  R$ 1.450,00                    │
└─────────────────────────────────┘
┌───────────────┐ ┌───────────────┐   ← grid-cols-2 (secundários)
│ Entradas      │ │ Saídas        │
│ R$ 2.000,00   │ │ R$ 550,00     │
└───────────────┘ └───────────────┘
```

Estrutura JSX resultante em Caixa/Fiado/Parceiros:
```tsx
<div className="mb-4 space-y-2">
  <SummaryCard primary title="Saldo" value={...} accent="green" />
  <div className="grid grid-cols-2 gap-2">
    <SummaryCard title="Entradas" value={...} accent="green" />
    <SummaryCard title="Saídas" value={...} accent="red" />
  </div>
</div>
```

Aplicação por módulo:
- **Caixa:** Saldo (primary, verde/vermelho conforme valor) + Entradas / Saídas
- **Fiado:** A Receber (primary, amarelo) + Já Recebido
- **Parceiros:** Parceiros Devem (primary, amarelo) + Já Acertado
- **Relatório:** mantém 2×2 grid sem alteração (4 métricas iguais)

---

## 4. Itens de Lista — Borda Colorida

Cada item tem **borda esquerda de 4px** com cor semântica, **substituindo** o badge de status:

| Tipo | Classes Tailwind | Cor do valor |
|------|-----------------|--------------|
| Entrada / Pago / Acertado | `border-l-4 border-income` | `text-income` |
| Saída | `border-l-4 border-expense` | `text-expense` |
| Pendente / A Receber | `border-l-4 border-pending` | `text-pending` |

**Implementação no `<div>` do item:** substituir `className="card flex..."` por:
```tsx
className={`bg-pantera-card rounded-xl p-3 flex items-center gap-3
  border-l-4 transition-colors duration-300
  ${item.tipo === 'entrada' ? 'border-income' : 'border-expense'}`}
```
(A classe `.card` usa `border border-pantera-purple/20` — substituir pela borda lateral colorida remove a borda padrão e aplica a semântica.)

Layout do item:
```
│▌ [Descrição/Nome]           [valor]  [ações] │
│   [detalhe secundário · data]                 │
```

- **Badge `PENDENTE`/`PAGO` removido** dos componentes FiadoList e ParceiroList
- **`src/components/Badge.tsx` DELETADO** — fica sem uso após a remoção
- Botões de ação (toggle, excluir): ícones `size={15}`, sem fundo, mais discretos
- Classe `animate-fadeIn` adicionada ao `<div>` de cada item para a animação de entrada

---

## 5. Transições

Animação via `tailwind.config.js` (melhor que CSS manual — purge-safe):

```js
// tailwind.config.js — adicionar em theme.extend:
keyframes: {
  fadeIn: {
    '0%':   { opacity: '0', transform: 'translateY(-4px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
},
animation: {
  fadeIn: 'fadeIn 200ms ease-out',
},
```

- **Entrada de novo item:** classe `animate-fadeIn` no `<div>` de cada item
- **Toggle pago/pendente:** `transition-colors duration-300` já está no `<div>` do item (ver seção 4)
- **Remoção de item:** sem animação (remoção imediata — fade-out exigiria atrasar setState)

---

## 6. Navegação

**Bottom nav (mobile):**
- Aba ativa: ícone envolto em `<span className="bg-pantera-purple/20 rounded-full p-1">` + label em `text-pantera-pink`
- Ícones: `size={22}` (era `size={20}`)
- Container nav: `backdrop-blur-md bg-pantera-black/90` (backdrop-blur funciona out-of-the-box no Tailwind v3)

**Header:**
- Altura reduzida: `py-2` (era `py-3`)
- Lucro do mês: remover `hidden sm:flex` — mostrar em todas as telas, mas simplificar para uma linha:
  ```tsx
  {lucro !== undefined && (
    <div className="flex flex-col items-end">
      <span className="label text-[10px]">Lucro mês</span>
      <span className={`font-display text-lg leading-tight ${lucro >= 0 ? 'text-income' : 'text-expense'}`}>
        {formatCurrency(lucro)}
      </span>
    </div>
  )}
  ```

---

## 7. Formulários

- Inputs ganham `<label>` com classe `label block mb-1` acima de cada campo
- Botões Entrada/Saída quando selecionados: fundo sólido:
  - Selecionado: `bg-income text-white border-income` / `bg-expense text-white border-expense`
  - Não selecionado: `border-pantera-purple/20 text-pantera-lavender` (mantém atual)

---

## 8. Arquivos a modificar / deletar

| Arquivo | O que muda |
|---------|-----------|
| `tailwind.config.js` | Adicionar `keyframes.fadeIn` + `animation.fadeIn` |
| `src/components/SummaryCard.tsx` | Adicionar prop `primary?: boolean` — controla `text-4xl` e layout |
| `src/components/NavTabs.tsx` | Aba ativa com span circular, `backdrop-blur-md`, ícone `size={22}` |
| `src/components/Header.tsx` | `py-2`, lucro visível em todas as telas |
| `src/components/Badge.tsx` | **DELETAR** — fica sem uso após redesign |
| `src/modules/caixa/Caixa.tsx` | Saldo como card primary + grid-cols-2 para secundários |
| `src/modules/caixa/CaixaForm.tsx` | Labels acima dos inputs, botões Entrada/Saída com fundo sólido |
| `src/modules/caixa/CaixaList.tsx` | Borda colorida `border-l-4`, remoção do badge, `animate-fadeIn` |
| `src/modules/fiado/Fiado.tsx` | A Receber como card primary + grid-cols-2 |
| `src/modules/fiado/FiadoForm.tsx` | Labels acima dos inputs |
| `src/modules/fiado/FiadoList.tsx` | Borda colorida, remoção de Badge, `animate-fadeIn` |
| `src/modules/parceiros/Parceiros.tsx` | Parceiros Devem como card primary + grid-cols-2 |
| `src/modules/parceiros/ParceiroForm.tsx` | Labels acima dos inputs |
| `src/modules/parceiros/ParceiroList.tsx` | Borda colorida, remoção de Badge, `animate-fadeIn` |
| `src/App.tsx` | `px-2 py-3 sm:px-4` no `<main>` |

---

## 9. Fora de escopo

- Redesign do Módulo Relatório (layout de gráfico e período ficam como estão)
- Redesign do Módulo Estoque (grid de células fica como está)
- Mudança de cores da marca
- Mudança de fontes
