# Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar uma sidebar lateral fixa no desktop (com nome do app, navegação, lucro do mês e ações) e simplificar o header desktop para mostrar apenas o título da aba ativa, mantendo header completo + bottom nav no mobile.

**Architecture:** Mudanças puramente visuais/estruturais — sem mudanças de dados. O hook `useLucroMes` é extraído de Header.tsx para `src/hooks/useLucroMes.ts`. O tipo `Tab` migra de NavTabs.tsx para `src/types/index.ts` (alinhamento com pattern dos outros tipos de domínio). Header retorna dois elementos exclusivos por breakpoint (`hidden sm:block` + `sm:hidden`) para evitar duplicação de lucro e botões com a Sidebar.

**Tech Stack:** React 18, Tailwind CSS v3, TanStack Query v5, lucide-react

---

## File Map

```
src/
  types/index.ts                    ← MODIFICAR: adicionar Tab + TAB_LABELS
  hooks/
    useLucroMes.ts                  ← CRIAR: hook extraído de Header.tsx
  components/
    Sidebar.tsx                     ← CRIAR: sidebar desktop (w-56)
    Header.tsx                      ← MODIFICAR: split em dois elementos por breakpoint
    NavTabs.tsx                     ← MODIFICAR: remover desktop, importar Tab de types
  App.tsx                           ← MODIFICAR: layout sm:flex com Sidebar
```

---

## Task 1: Mover `Tab` para `src/types/index.ts`

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/NavTabs.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Adicionar Tab e TAB_LABELS em src/types/index.ts**

Abrir `src/types/index.ts` e adicionar ao final do arquivo:

```typescript
export type Tab = 'caixa' | 'relatorio' | 'fiado' | 'parceiros' | 'estoque'

export const TAB_LABELS: Record<Tab, string> = {
  caixa: 'CAIXA',
  relatorio: 'RELATÓRIO',
  fiado: 'FIADO',
  parceiros: 'PARCEIROS',
  estoque: 'ESTOQUE',
}
```

- [ ] **Step 2: Remover definição de Tab de NavTabs.tsx e importar de types**

Em `src/components/NavTabs.tsx`, substituir:
```typescript
import { Wallet, BarChart2, Clock, Users, Package } from 'lucide-react'

export type Tab = 'caixa' | 'relatorio' | 'fiado' | 'parceiros' | 'estoque'
```

por:
```typescript
import { Wallet, BarChart2, Clock, Users, Package } from 'lucide-react'
import type { Tab } from '@/types'
```

- [ ] **Step 3: Atualizar import de Tab em App.tsx**

Em `src/App.tsx`, substituir:
```typescript
import NavTabs, { type Tab } from '@/components/NavTabs'
```

por:
```typescript
import NavTabs from '@/components/NavTabs'
import type { Tab } from '@/types'
```

- [ ] **Step 4: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 5: Verificar testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 6: Commit**

```powershell
git add src/types/index.ts src/components/NavTabs.tsx src/App.tsx
git commit -m "refactor: mover Tab e TAB_LABELS de NavTabs para src/types/index.ts"
```

---

## Task 2: Extrair `useLucroMes` para `src/hooks/useLucroMes.ts`

**Files:**
- Create: `src/hooks/useLucroMes.ts`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Criar src/hooks/useLucroMes.ts**

```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfMonth } from '@/utils/format'
import type { Lancamento, Fiado, Parceiro } from '@/types'

export const LUCRO_MES_KEY = ['lucro-mes'] as const

export function useLucroMes() {
  return useQuery({
    queryKey: LUCRO_MES_KEY,
    queryFn: async () => {
      const mesStart = startOfMonth()
      const [{ data: lanc }, { data: fiad }, { data: parc }] = await Promise.all([
        supabase.from('lancamentos').select('tipo,valor,data').gte('data', mesStart),
        supabase.from('fiados').select('valor,data,pago').gte('data', mesStart),
        supabase.from('parceiros').select('total,data,pago').gte('data', mesStart),
      ])
      const entradas = (lanc as Lancamento[] || [])
        .filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
      const saidas = (lanc as Lancamento[] || [])
        .filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
      const fiados = (fiad as Fiado[] || [])
        .filter(f => f.pago).reduce((s, f) => s + f.valor, 0)
      const parceiros = (parc as Parceiro[] || [])
        .filter(p => p.pago).reduce((s, p) => s + p.total, 0)
      return (entradas + fiados + parceiros) - saidas
    },
    staleTime: 0,
  })
}
```

- [ ] **Step 2: Remover useLucroMes inline de Header.tsx e importar do hook**

Em `src/components/Header.tsx`:

(a) Remover toda a função `useLucroMes` no topo (linhas 7-29) — bloco inteiro que começa com `function useLucroMes() {` e termina com `}`.

(b) Remover os imports que ficam sem uso:
```typescript
// REMOVER estas linhas:
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, startOfMonth } from '@/utils/format'
import type { Lancamento, Fiado, Parceiro } from '@/types'
```

(c) Adicionar imports novos:
```typescript
import { useLucroMes } from '@/hooks/useLucroMes'
import { formatCurrency } from '@/utils/format'
import { supabase } from '@/lib/supabase'
```

Nota: `supabase` continua sendo usado em `handleSignOut`. `formatCurrency` continua usado.

- [ ] **Step 3: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 4: Verificar testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 5: Commit**

```powershell
git add src/hooks/useLucroMes.ts src/components/Header.tsx
git commit -m "refactor: extrair useLucroMes para src/hooks/useLucroMes.ts (compartilhado entre Header e Sidebar)"
```

---

## Task 3: Refazer Header com split por breakpoint

**Files:**
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Substituir src/components/Header.tsx pelo conteúdo abaixo**

```typescript
import { LogOut, Download, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/format'
import { useLucroMes } from '@/hooks/useLucroMes'
import { TAB_LABELS } from '@/types'
import type { Tab } from '@/types'

interface HeaderProps {
  activeTab: Tab
  onExport: () => void
  onLimparTudo: () => void
}

export default function Header({ activeTab, onExport, onLimparTudo }: HeaderProps) {
  const { data: lucro } = useLucroMes()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <>
      {/* Desktop: só título da aba ativa (lucro e ações ficam na Sidebar) */}
      <div className="hidden sm:block px-4 py-3 border-b border-pantera-purple/20 bg-pantera-darker sticky top-0 z-40">
        <h2 className="font-display text-2xl text-white tracking-wide">
          {TAB_LABELS[activeTab]}
        </h2>
      </div>

      {/* Mobile: header completo com logo + lucro + ações */}
      <header className="sm:hidden bg-pantera-darker border-b border-pantera-purple/20 px-4 py-2 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-2xl text-pantera-purple tracking-wider leading-none">
              PANTERA ROXA
            </h1>
          </div>

          {lucro !== undefined && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-pantera-lavender">Lucro mês</span>
              <span className={`font-display text-lg leading-tight ${lucro >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(lucro)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <button onClick={onExport} className="btn-ghost p-2" title="Exportar dados">
              <Download size={18} />
            </button>
            <button onClick={onLimparTudo} className="btn-ghost p-2 text-expense/70 hover:text-expense" title="Limpar tudo">
              <Trash2 size={18} />
            </button>
            <button onClick={handleSignOut} className="btn-ghost p-2" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
```

- [ ] **Step 2: Verificar TypeScript — vai falhar**

```powershell
npx tsc --noEmit
```
Esperado: erro em `App.tsx` porque agora Header exige a prop `activeTab` mas App ainda não passa. Será corrigido na Task 6.

- [ ] **Step 3: Adicionar `activeTab={tab}` em App.tsx (apenas para destravar TS)**

Em `src/App.tsx`, na linha do Header, substituir:
```typescript
<Header onExport={() => setShowExport(true)} onLimparTudo={() => setShowLimpar(true)} />
```

por:
```typescript
<Header activeTab={tab} onExport={() => setShowExport(true)} onLimparTudo={() => setShowLimpar(true)} />
```

- [ ] **Step 4: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 5: Verificar testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 6: Commit**

```powershell
git add src/components/Header.tsx src/App.tsx
git commit -m "feat: Header split por breakpoint (desktop = só título, mobile = completo)"
```

---

## Task 4: Simplificar NavTabs (remover bloco desktop)

**Files:**
- Modify: `src/components/NavTabs.tsx`

- [ ] **Step 1: Substituir src/components/NavTabs.tsx**

```typescript
import { Wallet, BarChart2, Clock, Users, Package } from 'lucide-react'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Wallet }[] = [
  { id: 'caixa', label: 'Caixa', Icon: Wallet },
  { id: 'relatorio', label: 'Relatório', Icon: BarChart2 },
  { id: 'fiado', label: 'Fiado', Icon: Clock },
  { id: 'parceiros', label: 'Parceiros', Icon: Users },
  { id: 'estoque', label: 'Estoque', Icon: Package },
]

interface NavTabsProps {
  active: Tab
  onChange: (tab: Tab) => void
}

export default function NavTabs({ active, onChange }: NavTabsProps) {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md bg-pantera-black/90 border-t border-pantera-purple/20">
      <div className="flex">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
              ${active === id ? 'text-pantera-pink' : 'text-pantera-lavender'}`}
          >
            <span className={`inline-flex rounded-full p-1 transition-colors ${active === id ? 'bg-pantera-purple/20' : ''}`}>
              <Icon size={22} />
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 3: Verificar testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 4: Commit**

```powershell
git add src/components/NavTabs.tsx
git commit -m "refactor: NavTabs apenas mobile (desktop nav substituído pela Sidebar)"
```

---

## Task 5: Criar Sidebar

**Files:**
- Create: `src/components/Sidebar.tsx`

- [ ] **Step 1: Criar src/components/Sidebar.tsx**

```typescript
import { Wallet, BarChart2, Clock, Users, Package, LogOut, Download, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatCurrency } from '@/utils/format'
import { useLucroMes } from '@/hooks/useLucroMes'
import type { Tab } from '@/types'

const TABS: { id: Tab; label: string; Icon: typeof Wallet }[] = [
  { id: 'caixa', label: 'Caixa', Icon: Wallet },
  { id: 'relatorio', label: 'Relatório', Icon: BarChart2 },
  { id: 'fiado', label: 'Fiado', Icon: Clock },
  { id: 'parceiros', label: 'Parceiros', Icon: Users },
  { id: 'estoque', label: 'Estoque', Icon: Package },
]

interface SidebarProps {
  active: Tab
  onChange: (tab: Tab) => void
  onExport: () => void
  onLimparTudo: () => void
}

export default function Sidebar({ active, onChange, onExport, onLimparTudo }: SidebarProps) {
  const { data: lucro } = useLucroMes()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <aside className="hidden sm:flex flex-col w-56 min-h-screen sticky top-0 bg-pantera-darker border-r border-pantera-purple/20">
      {/* Marca */}
      <div className="px-4 py-5">
        <h1 className="font-display text-xl text-pantera-purple tracking-wider leading-none">
          PANTERA ROXA
        </h1>
        <p className="text-pantera-lavender/70 text-xs mt-1">Açaí. Sem inventar moda.</p>
      </div>

      {/* Navegação */}
      <nav className="border-t border-pantera-purple/20 py-2 flex-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-l-2
              ${active === id
                ? 'bg-pantera-purple/15 text-white border-pantera-purple'
                : 'border-transparent text-pantera-lavender hover:text-white hover:bg-white/5'}`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* Lucro do mês */}
      {lucro !== undefined && (
        <div className="border-t border-pantera-purple/20 px-4 py-3">
          <span className="text-[10px] uppercase tracking-widest text-pantera-lavender block">Lucro mês</span>
          <span className={`font-display text-xl leading-tight ${lucro >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(lucro)}
          </span>
        </div>
      )}

      {/* Ações */}
      <div className="border-t border-pantera-purple/20 py-2">
        <button
          onClick={onExport}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-pantera-lavender hover:text-white hover:bg-white/5 transition-colors"
        >
          <Download size={16} />
          Exportar
        </button>
        <button
          onClick={onLimparTudo}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-expense/70 hover:text-expense hover:bg-white/5 transition-colors"
        >
          <Trash2 size={16} />
          Limpar tudo
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-pantera-lavender hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros (Sidebar não está usado ainda — ok).

- [ ] **Step 3: Commit**

```powershell
git add src/components/Sidebar.tsx
git commit -m "feat: criar Sidebar desktop (logo + nav + lucro + acoes)"
```

---

## Task 6: Integrar Sidebar no App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Substituir src/App.tsx pelo conteúdo abaixo**

```typescript
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Login from '@/modules/auth/Login'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import NavTabs from '@/components/NavTabs'
import Caixa from '@/modules/caixa/Caixa'
import Relatorio from '@/modules/relatorio/Relatorio'
import Fiado from '@/modules/fiado/Fiado'
import Parceiros from '@/modules/parceiros/Parceiros'
import Estoque from '@/modules/estoque/Estoque'
import ExportModal from '@/utils/ExportModal'
import LimparTudoDialog from '@/utils/LimparTudoDialog'
import type { Tab } from '@/types'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [tab, setTab] = useState<Tab>('caixa')
  const [showExport, setShowExport] = useState(false)
  const [showLimpar, setShowLimpar] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pantera-black">
        <div className="w-8 h-8 border-2 border-pantera-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div className="sm:flex min-h-screen bg-pantera-black">
      <Sidebar
        active={tab}
        onChange={setTab}
        onExport={() => setShowExport(true)}
        onLimparTudo={() => setShowLimpar(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-20 sm:pb-0">
        <Header
          activeTab={tab}
          onExport={() => setShowExport(true)}
          onLimparTudo={() => setShowLimpar(true)}
        />
        <NavTabs active={tab} onChange={setTab} />

        <main className="max-w-3xl mx-auto w-full px-2 py-3 sm:px-4">
          {tab === 'caixa' && <Caixa />}
          {tab === 'relatorio' && <Relatorio />}
          {tab === 'fiado' && <Fiado />}
          {tab === 'parceiros' && <Parceiros />}
          {tab === 'estoque' && <Estoque />}
        </main>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showLimpar && <LimparTudoDialog onClose={() => setShowLimpar(false)} />}
    </div>
  )
}
```

Nota: `<main>` ganhou `w-full` para ocupar a largura disponível dentro do flex container.

- [ ] **Step 2: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 3: Verificar testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 4: Build de produção**

```powershell
npm run build
```
Esperado: dist/ gerado sem erros.

- [ ] **Step 5: Verificar visualmente no navegador**

```powershell
npm run dev
```
Abrir `http://localhost:5173`. Conferir:
- **Desktop (≥640px):** sidebar visível na lateral esquerda com logo, abas, lucro, ações; header no topo do conteúdo com APENAS o título da aba (sem botões, sem lucro); ao trocar de aba, o título atualiza.
- **Mobile (<640px, F12 → Toggle device toolbar):** sidebar oculta; header completo com logo + lucro + botões; bottom nav fixa no rodapé.

- [ ] **Step 6: Commit final**

```powershell
git add src/App.tsx
git commit -m "feat: integrar Sidebar no App com layout sm:flex"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|-----------|------|
| `Tab` movido para `src/types/index.ts` | Task 1 |
| `TAB_LABELS` em `src/types/index.ts` | Task 1 |
| Hook `useLucroMes` em `src/hooks/useLucroMes.ts` | Task 2 |
| Sidebar `w-56`, fundo `bg-pantera-darker`, borda direita | Task 5 |
| Sidebar 4 seções (marca, nav, lucro, ações) com divisores | Task 5 |
| Sidebar aba ativa: `bg-pantera-purple/15 border-l-2 border-pantera-purple` | Task 5 |
| Header desktop: só título via `hidden sm:block` | Task 3 |
| Header mobile: completo via `sm:hidden` | Task 3 |
| NavTabs só mobile (`sm:hidden fixed bottom-0`) | Task 4 |
| App.tsx `sm:flex` no wrapper | Task 6 |
| `pb-20 sm:pb-0` no container interno (para bottom nav mobile) | Task 6 |
| Zero duplicação de lucro/botões entre Header e Sidebar | Task 3 (split) + Task 5 |

Todos os requisitos cobertos.

### Consistência de tipos e nomes

- `Tab` exportado de `@/types` — Tasks 1, 3, 4, 5, 6 importam de lá
- `TAB_LABELS` exportado de `@/types` — Task 3 importa em Header
- `useLucroMes` exportado de `@/hooks/useLucroMes` — Tasks 3 e 5 importam
- `LUCRO_MES_KEY` exportado para futuras invalidações (já usado pelos hooks dos módulos)
- `HeaderProps.activeTab: Tab` — adicionado em Task 3, App.tsx passa em Tasks 3 e 6
- `SidebarProps`: `active`, `onChange`, `onExport`, `onLimparTudo` — consistente com NavTabs (`active`, `onChange`) + Header (`onExport`, `onLimparTudo`)
