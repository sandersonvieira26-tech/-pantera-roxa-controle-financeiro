# Design Spec — Pantera Roxa: Sidebar Navigation

**Data:** 2026-05-29  
**Status:** Aprovado pelo usuário

---

## Problema

A navegação atual usa bottom nav no mobile e abas horizontais no desktop. No desktop, as abas horizontais desperdiçam espaço vertical e a estrutura de header + abas duplica o espaço de navegação.

---

## Solução

**Desktop (≥ 640px):** sidebar fixa na lateral esquerda com nome do app, links de navegação, lucro do mês e ações (exportar, limpar, sair). Header simplificado mostra apenas o nome da aba ativa.

**Mobile (< 640px):** layout atual sem mudança — header completo + bottom nav no rodapé.

---

## 1. Layout Geral

### Desktop
```
┌─────────────┬──────────────────────────────┐
│ PANTERA ROXA│  CAIXA                       │  ← header simplificado
│ Açaí. Sem   ├──────────────────────────────┤
│ inventar    │                              │
├─────────────┤    [conteúdo do módulo]      │
│ ● Caixa     │                              │
│   Relatório │                              │
│   Fiado     │                              │
│   Parceiros │                              │
│   Estoque   │                              │
├─────────────┤                              │
│ Lucro mês   │                              │
│ R$ 1.450,00 │                              │
├─────────────┤                              │
│ ↓ Exportar  │                              │
│ 🗑 Limpar    │                              │
│ → Sair      │                              │
└─────────────┴──────────────────────────────┘
```

**App.tsx — nova estrutura:**
```tsx
<div className="sm:flex min-h-screen bg-pantera-black">
  <Sidebar ... />                           {/* hidden mobile, flex desktop */}
  <div className="flex-1 flex flex-col min-w-0 pb-20 sm:pb-0">
    <Header activeTab={tab} ... />
    <main className="max-w-3xl mx-auto px-2 py-3 sm:px-4">
      {modules}
    </main>
  </div>
</div>
{modals}
{/* Bottom nav permanece em NavTabs.tsx — apenas versão mobile */}
```

### Mobile
Sem mudanças visuais — header completo com logo + lucro + ações + bottom nav.

---

## 2. Sidebar (`src/components/Sidebar.tsx` — novo arquivo)

Visível apenas no desktop (`hidden sm:flex`).

**Estrutura:**
```
┌─────────────────┐
│  PANTERA ROXA   │  font-display text-xl text-pantera-purple
│  Açaí. Sem      │  text-xs text-pantera-lavender
│  inventar moda. │
├─────────────────┤  border-t border-pantera-purple/20
│ ● Caixa         │  ativa: bg-pantera-purple/15 text-white border-l-2 border-pantera-purple
│   Relatório     │  inativa: text-pantera-lavender hover:text-white hover:bg-white/5
│   Fiado         │
│   Parceiros     │
│   Estoque       │
├─────────────────┤  border-t border-pantera-purple/20
│  Lucro mês      │  text-[10px] uppercase tracking-widest text-pantera-lavender
│  R$ 1.450,00    │  font-display text-xl text-income/text-expense
├─────────────────┤  border-t border-pantera-purple/20
│  ↓ Exportar     │  btn-ghost w-full justify-start gap-2 text-sm
│  🗑 Limpar       │  btn-ghost w-full justify-start gap-2 text-sm text-expense/70
│  → Sair         │  btn-ghost w-full justify-start gap-2 text-sm
└─────────────────┘
```

**Dimensões:**
- Largura: `w-56` (224px)
- Altura: `min-h-screen sticky top-0`
- Fundo: `bg-pantera-darker`
- Borda direita: `border-r border-pantera-purple/20`

**Query de lucro:** `useLucroMes` é extraída de `Header.tsx` para `src/hooks/useLucroMes.ts` — tanto `Sidebar.tsx` quanto `Header.tsx` importam de lá. Ambos usam a mesma queryKey `['lucro-mes']` → TanStack Query retorna o cache sem request extra.

---

## 3. Header adaptado (`src/components/Header.tsx` — modificado)

Recebe nova prop `activeTab: Tab`.

**Desktop:** exibe apenas o título da aba ativa em Bebas Neue.
```tsx
{/* Desktop: só título da aba ativa */}
<div className="hidden sm:block px-4 py-3 border-b border-pantera-purple/20">
  <h2 className="font-display text-2xl text-white tracking-wide">
    {TAB_LABELS[activeTab]}
  </h2>
</div>

{/* Mobile: header completo atual (logo + lucro + ações) */}
<header className="sm:hidden ...">
  {/* conteúdo atual */}
</header>
```

**Mapeamento de labels:**
```typescript
const TAB_LABELS: Record<Tab, string> = {
  caixa: 'CAIXA',
  relatorio: 'RELATÓRIO',
  fiado: 'FIADO',
  parceiros: 'PARCEIROS',
  estoque: 'ESTOQUE',
}
```

---

## 4. NavTabs simplificado (`src/components/NavTabs.tsx` — modificado)

Remove o bloco desktop (`hidden sm:flex`) — a sidebar substitui. Mantém apenas o mobile bottom nav (`sm:hidden fixed bottom-0 ...`).

---

## 5. App.tsx — mudanças de layout

```tsx
import Sidebar from '@/components/Sidebar'

// Remover: showExport e showLimpar do Header (passam para Sidebar)
// Adicionar: activeTab={tab} no Header

return (
  <div className="sm:flex min-h-screen bg-pantera-black">
    <Sidebar
      active={tab}
      onChange={setTab}
      onExport={() => setShowExport(true)}
      onLimparTudo={() => setShowLimpar(true)}
    />
    <div className="flex-1 flex flex-col min-w-0 pb-20 sm:pb-0">
      <Header activeTab={tab} onExport={() => setShowExport(true)} onLimparTudo={() => setShowLimpar(true)} />
      <NavTabs active={tab} onChange={setTab} />
      <main className="max-w-3xl mx-auto px-2 py-3 sm:px-4">
        {/* módulos */}
      </main>
    </div>
    {modals}
  </div>
)
```

Nota: `onExport` e `onLimparTudo` ficam em Header (mobile) E Sidebar (desktop) — ambos precisam dos callbacks.

---

## 6. Arquivos a modificar/criar

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useLucroMes.ts` | **CRIAR** — extrair `useLucroMes` de Header.tsx para hook compartilhado |
| `src/components/Sidebar.tsx` | **CRIAR** — sidebar desktop completa |
| `src/components/Header.tsx` | Importar `useLucroMes` do hook, receber `activeTab`, mostrar título no desktop / header completo no mobile |
| `src/components/NavTabs.tsx` | Remover bloco desktop, manter só mobile bottom nav |
| `src/App.tsx` | Adicionar `<Sidebar>`, novo layout flex, passar `activeTab` para Header |

---

## 7. Fora de escopo

- Sidebar colapsável / hambúrguer no mobile (mobile usa bottom nav)
- Persistência da aba ativa em URL (não tem roteamento)
- Sub-itens de menu
