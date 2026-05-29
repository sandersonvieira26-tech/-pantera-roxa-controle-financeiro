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
| Valores monetários | `text-2xl font-display` | `text-3xl font-display` + cor da categoria |
| Labels de resumo | `text-xs uppercase` | `text-[11px] uppercase tracking-widest` — mais fino |
| Título de seção | `text-xl font-display` | `text-lg font-display` |
| Texto principal (descrição) | `text-sm` | `text-sm font-medium` |
| Texto secundário (data, detalhe) | `text-xs text-pantera-lavender` | `text-xs text-pantera-lavender/70` |

---

## 2. Espaçamentos

| Elemento | Antes | Depois |
|----------|-------|--------|
| Padding de card | `p-4` | `p-3` |
| Padding de item de lista | `py-3 px-4` | `py-2.5 px-3` |
| Gap entre cards | `gap-3` | `gap-2` |
| Padding lateral da main | `px-4 py-4` | `px-2 py-3` (mobile) / `px-4 py-3` (desktop) |
| Espaço entre seções | `mb-4` | `mb-3` |

---

## 3. Cards de Resumo — Nova Hierarquia

O card principal (Saldo / A Receber / Parceiros Devem) ocupa a linha toda, com valor em `text-4xl`. Os dois cards secundários ficam lado a lado em `grid-cols-2` abaixo.

```
┌─────────────────────────────────┐
│  SALDO                          │
│  R$ 1.450,00                    │
└─────────────────────────────────┘
┌───────────────┐ ┌───────────────┐
│ Entradas      │ │ Saídas        │
│ R$ 2.000,00   │ │ R$ 550,00     │
└───────────────┘ └───────────────┘
```

Aplicação por módulo:
- **Caixa:** Saldo (principal) + Entradas / Saídas
- **Fiado:** A Receber (principal, amarelo) + Já Recebido
- **Parceiros:** Parceiros Devem (principal, amarelo) + Já Acertado
- **Relatório:** mantém 2×2 grid (4 métricas de igual importância)

---

## 4. Itens de Lista — Borda Colorida

Cada item tem borda esquerda de `4px` com cor semântica:

| Tipo | Cor da borda | Cor do valor |
|------|-------------|--------------|
| Entrada / Pago / Acertado | `border-income` (`#1D9E75`) | `text-income` |
| Saída | `border-expense` (`#E24B4A`) | `text-expense` |
| Pendente / A Receber | `border-pending` (`#BA7517`) | `text-pending` |

Layout do item:
```
│▌ [Descrição/Nome]           [valor]  [ações] │
│   [detalhe secundário · data]                 │
```

- Badge `PENDENTE`/`PAGO` removido — a cor da borda e do valor já comunicam o status
- Botões de ação (toggle, excluir): ícones `size={15}`, sem fundo, mais discretos

---

## 5. Transições

- **Entrada de novo item:** `fade-in` (opacity 0→1 + translateY -4px→0) em 200ms — via classe CSS `animate-fadeIn`
- **Toggle pago/pendente:** borda e valor mudam com `transition-colors duration-300`
- **Remoção de item:** sem animação (remoção imediata — adicionar fade-out exigiria atrasar o setState, complexidade não justificada)

Adicionar em `src/index.css`:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 200ms ease-out;
}
```

---

## 6. Navegação

**Bottom nav (mobile):**
- Aba ativa: ícone com `bg-pantera-purple/20 rounded-full p-1` + label em `text-pantera-pink`
- Ícones: `size={22}` (era 20)
- Container: `backdrop-blur-md bg-pantera-black/90`

**Header:**
- Altura reduzida: `py-2` (era `py-3`)
- Lucro do mês visível também no mobile — texto compacto: `Lucro: R$ X.XXX`

---

## 7. Formulários

- Inputs ganham `<label>` acima com `text-[11px] label mb-1` (em vez de só placeholder)
- Botões Entrada/Saída quando selecionados: `bg-income text-white` / `bg-expense text-white` (fundo sólido, em vez do atual semi-transparente)

---

## 8. Arquivos a modificar

| Arquivo | O que muda |
|---------|-----------|
| `src/index.css` | Adicionar `@keyframes fadeIn` + `.animate-fadeIn` |
| `src/components/SummaryCard.tsx` | Adicionar prop `primary` para card grande |
| `src/components/NavTabs.tsx` | Aba ativa com fundo circular, backdrop-blur, ícone maior |
| `src/components/Header.tsx` | Altura menor, lucro visível no mobile |
| `src/modules/caixa/Caixa.tsx` | Nova hierarquia de cards (Saldo principal) |
| `src/modules/caixa/CaixaForm.tsx` | Labels acima dos inputs, botões com fundo sólido |
| `src/modules/caixa/CaixaList.tsx` | Borda colorida, remoção do badge, fade-in/out |
| `src/modules/fiado/Fiado.tsx` | A Receber como card principal |
| `src/modules/fiado/FiadoForm.tsx` | Labels acima dos inputs |
| `src/modules/fiado/FiadoList.tsx` | Borda colorida, remoção do badge, transições |
| `src/modules/parceiros/Parceiros.tsx` | Parceiros Devem como card principal |
| `src/modules/parceiros/ParceiroForm.tsx` | Labels acima dos inputs |
| `src/modules/parceiros/ParceiroList.tsx` | Borda colorida, remoção do badge, transições |
| `src/App.tsx` | Padding lateral menor no mobile |

---

## 9. Fora de escopo

- Redesign do Módulo Relatório (layout de gráfico e período ficam como estão)
- Redesign do Módulo Estoque (grid de células fica como está)
- Mudança de cores da marca
- Mudança de fontes
