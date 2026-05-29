# Redesign de UI — Pantera Roxa: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Melhorar a legibilidade e hierarquia visual do app com tipografia maior, cards com destaque principal, bordas coloridas nos itens de lista e navegação mais clara.

**Architecture:** Apenas mudanças visuais (Tailwind classes) — sem alterações de lógica, hooks ou dados. A prop `primary` adicionada ao SummaryCard é aditiva (não quebra callers existentes). Badge.tsx é deletado pois a borda colorida substitui o status visual.

**Tech Stack:** React 18, Tailwind CSS v3, lucide-react

---

## File Map

```
tailwind.config.js                    ← adicionar keyframes fadeIn + animation
src/components/SummaryCard.tsx        ← adicionar prop primary
src/components/NavTabs.tsx            ← aba ativa com círculo, backdrop-blur, ícone maior
src/components/Header.tsx             ← py-2, lucro visível no mobile
src/components/Badge.tsx              ← DELETAR
src/modules/caixa/Caixa.tsx           ← Saldo como card primary + grid secundários
src/modules/caixa/CaixaForm.tsx       ← labels acima dos inputs, botões sólidos
src/modules/caixa/CaixaList.tsx       ← borda colorida, sem ícone direcional, animate-fadeIn
src/modules/fiado/Fiado.tsx           ← A Receber como card primary
src/modules/fiado/FiadoForm.tsx       ← labels acima dos inputs
src/modules/fiado/FiadoList.tsx       ← borda colorida, sem Badge, animate-fadeIn
src/modules/parceiros/Parceiros.tsx   ← Parceiros Devem como card primary
src/modules/parceiros/ParceiroForm.tsx← labels acima dos inputs
src/modules/parceiros/ParceiroList.tsx← borda colorida, sem Badge, animate-fadeIn
src/App.tsx                           ← px-2 sm:px-4 no main
```

---

## Task 1: Fundação — Tailwind animation + SummaryCard primary + deletar Badge

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/components/SummaryCard.tsx`
- Delete: `src/components/Badge.tsx`

- [ ] **Step 1: Adicionar animação fadeIn no tailwind.config.js**

Substituir `tailwind.config.js` por:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pantera: {
          purple: '#AA00FF',
          pink: '#E040FB',
          dark: '#7B1FA2',
          darker: '#4A0060',
          black: '#0D0010',
          lavender: '#CE93D8',
          card: '#1a0025',
        },
        income: '#1D9E75',
        expense: '#E24B4A',
        pending: '#BA7517',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 200ms ease-out',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Substituir src/components/SummaryCard.tsx**

```typescript
interface SummaryCardProps {
  title: string
  value: string
  accent?: 'green' | 'red' | 'yellow' | 'purple'
  size?: 'normal' | 'large'
  primary?: boolean
}

const ACCENTS = {
  green: 'text-income',
  red: 'text-expense',
  yellow: 'text-pending',
  purple: 'text-pantera-pink',
}

export default function SummaryCard({ title, value, accent = 'purple', size = 'normal', primary = false }: SummaryCardProps) {
  return (
    <div className="card p-3">
      <p className="text-[11px] uppercase tracking-widest text-pantera-lavender mb-1">{title}</p>
      <p className={`font-display leading-tight ${ACCENTS[accent]} ${
        primary ? 'text-4xl' : size === 'large' ? 'text-3xl' : 'text-2xl'
      }`}>
        {value}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Deletar src/components/Badge.tsx**

```powershell
Remove-Item "src\components\Badge.tsx"
```

- [ ] **Step 4: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: erros em FiadoList e ParceiroList (ainda importam Badge) — serão corrigidos nas Tasks 4 e 5.

- [ ] **Step 5: Commit**

```powershell
git add tailwind.config.js src/components/SummaryCard.tsx
git rm src/components/Badge.tsx
git commit -m "refactor: adicionar animate-fadeIn, prop primary no SummaryCard, deletar Badge"
```

---

## Task 2: Header + NavTabs

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/NavTabs.tsx`

- [ ] **Step 1: Substituir src/components/Header.tsx**

```typescript
import { LogOut, Download, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { formatCurrency, startOfMonth } from '@/utils/format'
import type { Lancamento, Fiado, Parceiro } from '@/types'

function useLucroMes() {
  return useQuery({
    queryKey: ['lucro-mes'],
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

interface HeaderProps {
  onExport: () => void
  onLimparTudo: () => void
}

export default function Header({ onExport, onLimparTudo }: HeaderProps) {
  const { data: lucro } = useLucroMes()

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="bg-pantera-darker border-b border-pantera-purple/20 px-4 py-2 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl text-pantera-purple tracking-wider leading-none">
            PANTERA ROXA
          </h1>
          <p className="text-pantera-lavender text-xs hidden sm:block mt-0.5">
            Açaí. Sem inventar moda.
          </p>
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
  )
}
```

- [ ] **Step 2: Substituir src/components/NavTabs.tsx**

```typescript
import { Wallet, BarChart2, Clock, Users, Package } from 'lucide-react'

export type Tab = 'caixa' | 'relatorio' | 'fiado' | 'parceiros' | 'estoque'

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
    <>
      {/* Desktop: abas horizontais no topo */}
      <nav className="hidden sm:flex border-b border-pantera-purple/20 bg-pantera-darker sticky top-[57px] z-30">
        <div className="max-w-3xl mx-auto w-full flex">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${active === id
                  ? 'border-pantera-pink text-white'
                  : 'border-transparent text-pantera-lavender hover:text-white'}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile: bottom navigation */}
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
    </>
  )
}
```

- [ ] **Step 3: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: sem novos erros.

- [ ] **Step 4: Commit**

```powershell
git add src/components/Header.tsx src/components/NavTabs.tsx
git commit -m "style: header compacto com lucro no mobile, nav com aba ativa destacada"
```

---

## Task 3: Módulo Caixa

**Files:**
- Modify: `src/modules/caixa/Caixa.tsx`
- Modify: `src/modules/caixa/CaixaForm.tsx`
- Modify: `src/modules/caixa/CaixaList.tsx`

- [ ] **Step 1: Substituir src/modules/caixa/Caixa.tsx**

```typescript
import SummaryCard from '@/components/SummaryCard'
import CaixaForm from './CaixaForm'
import CaixaList from './CaixaList'
import { useLancamentos } from './useLancamentos'
import { formatCurrency } from '@/utils/format'

export default function Caixa() {
  const { data: items = [], add, remove } = useLancamentos()

  const entradas = items.filter(i => i.tipo === 'entrada').reduce((s, i) => s + i.valor, 0)
  const saidas = items.filter(i => i.tipo === 'saida').reduce((s, i) => s + i.valor, 0)
  const saldo = entradas - saidas

  return (
    <div>
      <div className="mb-3">
        <SummaryCard primary title="Saldo" value={formatCurrency(saldo)} accent={saldo >= 0 ? 'green' : 'red'} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Entradas" value={formatCurrency(entradas)} accent="green" />
          <SummaryCard title="Saídas" value={formatCurrency(saidas)} accent="red" />
        </div>
      </div>

      {(add.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <CaixaForm onSubmit={item => add.mutate(item)} loading={add.isPending} />
      <CaixaList items={items} onDelete={id => remove.mutate(id)} />
    </div>
  )
}
```

- [ ] **Step 2: Substituir src/modules/caixa/CaixaForm.tsx**

```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import type { LancamentoInsert } from '@/types'

interface CaixaFormProps {
  onSubmit: (item: LancamentoInsert) => void
  loading: boolean
}

export default function CaixaForm({ onSubmit, loading }: CaixaFormProps) {
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ tipo, descricao, valor: parseFloat(valor), data })
    setDescricao('')
    setValor('')
    setData(todayISO())
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-3">
      <h2 className="font-display text-lg text-white tracking-wide mb-3">NOVO LANÇAMENTO</h2>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'entrada'
              ? 'bg-income text-white border-income'
              : 'border-pantera-purple/20 text-pantera-lavender hover:border-income/30'}`}
        >
          + Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('saida')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'saida'
              ? 'bg-expense text-white border-expense'
              : 'border-pantera-purple/20 text-pantera-lavender hover:border-expense/30'}`}
        >
          − Saída
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <div className="sm:col-span-1">
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Descrição</label>
          <input
            className="input"
            placeholder="Ex: Venda 2x 500ml banana"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Valor (R$)</label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Data</label>
          <input
            className="input"
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Adicionar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Substituir src/modules/caixa/CaixaList.tsx**

```typescript
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Lancamento } from '@/types'

interface CaixaListProps {
  items: Lancamento[]
  onDelete: (id: string) => void
}

export default function CaixaList({ items, onDelete }: CaixaListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (items.length === 0) {
    return <EmptyState message="Nenhum lançamento ainda" />
  }

  return (
    <>
      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-pantera-card rounded-xl py-2.5 px-3 flex items-center gap-3 border-l-4 transition-colors duration-300 animate-fadeIn
              ${item.tipo === 'entrada' ? 'border-income' : 'border-expense'}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.descricao}</p>
              <p className="text-pantera-lavender/70 text-xs">{formatDate(item.data)}</p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
              {item.tipo === 'entrada' ? '+' : '−'}{formatCurrency(item.valor)}
            </span>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1 shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Excluir lançamento?"
          message="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          onConfirm={() => { onDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: erros apenas em FiadoList/ParceiroList (Badge ainda importado) — correto, serão resolvidos nas próximas tasks.

- [ ] **Step 5: Commit**

```powershell
git add src/modules/caixa/
git commit -m "style: módulo Caixa com hierarquia de cards, labels e bordas coloridas"
```

---

## Task 4: Módulo Fiado

**Files:**
- Modify: `src/modules/fiado/Fiado.tsx`
- Modify: `src/modules/fiado/FiadoForm.tsx`
- Modify: `src/modules/fiado/FiadoList.tsx`

- [ ] **Step 1: Substituir src/modules/fiado/Fiado.tsx**

```typescript
import { useState } from 'react'
import { Search } from 'lucide-react'
import SummaryCard from '@/components/SummaryCard'
import FiadoForm from './FiadoForm'
import FiadoList from './FiadoList'
import { useFiados } from './useFiados'
import { formatCurrency } from '@/utils/format'

export default function Fiado() {
  const { data: items = [], add, togglePago, remove } = useFiados()
  const [search, setSearch] = useState('')

  const pendente = items.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0)
  const recebido = items.filter(f => f.pago).reduce((s, f) => s + f.valor, 0)

  return (
    <div>
      <div className="mb-3">
        <SummaryCard primary title="A Receber" value={formatCurrency(pendente)} accent="yellow" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Já Recebido" value={formatCurrency(recebido)} accent="green" />
          <SummaryCard title="Total" value={formatCurrency(pendente + recebido)} accent="purple" />
        </div>
      </div>

      {(add.error || togglePago.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <FiadoForm onSubmit={item => add.mutate(item)} loading={add.isPending} />

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pantera-lavender" />
        <input
          className="input pl-9"
          placeholder="Buscar por nome do cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <FiadoList
        items={items}
        search={search}
        onToggle={(id, pago) => togglePago.mutate({ id, pago })}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Substituir src/modules/fiado/FiadoForm.tsx**

```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO } from '@/utils/format'
import type { FiadoInsert } from '@/types'

interface FiadoFormProps {
  onSubmit: (item: FiadoInsert) => void
  loading: boolean
}

export default function FiadoForm({ onSubmit, loading }: FiadoFormProps) {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [data, setData] = useState(todayISO())

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ nome_cliente: nome, descricao, valor: parseFloat(valor), data, pago: false })
    setNome(''); setDescricao(''); setValor(''); setData(todayISO())
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-3">
      <h2 className="font-display text-lg text-white tracking-wide mb-3">REGISTRAR FIADO</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Cliente</label>
          <input className="input" placeholder="Nome do cliente" value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Descrição</label>
          <input className="input" placeholder="Ex: 2x 500ml banana" value={descricao} onChange={e => setDescricao(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Valor (R$)</label>
          <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={valor} onChange={e => setValor(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Data</label>
          <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
        </div>
      </div>
      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Registrar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Substituir src/modules/fiado/FiadoList.tsx**

```typescript
import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Fiado } from '@/types'

interface FiadoListProps {
  items: Fiado[]
  search: string
  onToggle: (id: string, pago: boolean) => void
  onDelete: (id: string) => void
}

export default function FiadoList({ items, search, onToggle, onDelete }: FiadoListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = search
    ? items.filter(f => f.nome_cliente.toLowerCase().includes(search.toLowerCase()))
    : items

  if (filtered.length === 0) {
    return <EmptyState message={search ? 'Nenhum cliente encontrado' : 'Nenhum fiado ainda'} />
  }

  return (
    <>
      <div className="space-y-1.5">
        {filtered.map(item => (
          <div
            key={item.id}
            className={`bg-pantera-card rounded-xl py-2.5 px-3 flex items-center gap-3 border-l-4 transition-colors duration-300 animate-fadeIn
              ${item.pago ? 'border-income' : 'border-pending'}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{item.nome_cliente}</p>
              <p className="text-pantera-lavender/70 text-xs truncate mt-0.5">{item.descricao} · {formatDate(item.data)}</p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.pago ? 'text-income' : 'text-pending'}`}>
              {formatCurrency(item.valor)}
            </span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
              title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
            >
              {item.pago ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </button>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1 shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Excluir fiado?"
          message="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          onConfirm={() => { onDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: erro restante apenas em ParceiroList (Badge ainda importado).

- [ ] **Step 5: Commit**

```powershell
git add src/modules/fiado/
git commit -m "style: módulo Fiado com hierarquia de cards, labels e bordas coloridas"
```

---

## Task 5: Módulo Parceiros

**Files:**
- Modify: `src/modules/parceiros/Parceiros.tsx`
- Modify: `src/modules/parceiros/ParceiroForm.tsx`
- Modify: `src/modules/parceiros/ParceiroList.tsx`

- [ ] **Step 1: Substituir src/modules/parceiros/Parceiros.tsx**

```typescript
import SummaryCard from '@/components/SummaryCard'
import ParceiroForm from './ParceiroForm'
import ParceiroList from './ParceiroList'
import { useParceiros } from './useParceiros'
import { formatCurrency } from '@/utils/format'

export default function Parceiros() {
  const { data: items = [], add, togglePago, remove } = useParceiros()

  const devem = items.filter(p => !p.pago).reduce((s, p) => s + p.total, 0)
  const acertado = items.filter(p => p.pago).reduce((s, p) => s + p.total, 0)

  return (
    <div>
      <div className="mb-3">
        <SummaryCard primary title="Parceiros Devem" value={formatCurrency(devem)} accent="yellow" />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SummaryCard title="Já Acertado" value={formatCurrency(acertado)} accent="green" />
          <SummaryCard title="Total" value={formatCurrency(devem + acertado)} accent="purple" />
        </div>
      </div>

      {(add.error || togglePago.error || remove.error) && (
        <div className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2 mb-3">
          Erro ao salvar. Verifique sua conexão e tente novamente.
        </div>
      )}

      <ParceiroForm onSubmit={item => add.mutate(item)} loading={add.isPending} />
      <ParceiroList
        items={items}
        onToggle={(id, pago) => togglePago.mutate({ id, pago })}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Substituir src/modules/parceiros/ParceiroForm.tsx**

```typescript
import { useState } from 'react'
import type { FormEvent } from 'react'
import { PlusCircle } from 'lucide-react'
import { todayISO, formatCurrency } from '@/utils/format'
import type { ParceiroInsert } from '@/types'

interface ParceiroFormProps {
  onSubmit: (item: ParceiroInsert) => void
  loading: boolean
}

export default function ParceiroForm({ onSubmit, loading }: ParceiroFormProps) {
  const [nome, setNome] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [valorUnitario, setValorUnitario] = useState('')
  const [data, setData] = useState(todayISO())

  const total = (parseFloat(quantidade) || 0) * (parseFloat(valorUnitario) || 0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ nome_parceiro: nome, quantidade: parseInt(quantidade), valor_unitario: parseFloat(valorUnitario), data, pago: false })
    setNome(''); setQuantidade(''); setValorUnitario(''); setData(todayISO())
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-3">
      <h2 className="font-display text-lg text-white tracking-wide mb-3">REGISTRAR ENTREGA</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Parceiro</label>
          <input className="input" placeholder="Nome do parceiro" value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Data</label>
          <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Qtd. de garrafas</label>
          <input className="input" type="number" min="1" placeholder="0" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1">Valor por garrafa (R$)</label>
          <input className="input" type="number" step="0.01" min="0.01" placeholder="0,00" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} required />
        </div>
      </div>
      {total > 0 && (
        <p className="text-pantera-lavender text-sm mb-3">
          Total a receber: <span className="text-income font-semibold">{formatCurrency(total)}</span>
        </p>
      )}
      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Registrar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Substituir src/modules/parceiros/ParceiroList.tsx**

```typescript
import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import ConfirmDialog from '@/components/ConfirmDialog'
import { formatCurrency, formatDate } from '@/utils/format'
import type { Parceiro } from '@/types'

interface ParceiroListProps {
  items: Parceiro[]
  onToggle: (id: string, pago: boolean) => void
  onDelete: (id: string) => void
}

export default function ParceiroList({ items, onToggle, onDelete }: ParceiroListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (items.length === 0) return <EmptyState message="Nenhuma entrega registrada ainda" />

  return (
    <>
      <div className="space-y-1.5">
        {items.map(item => (
          <div
            key={item.id}
            className={`bg-pantera-card rounded-xl py-2.5 px-3 flex items-center gap-3 border-l-4 transition-colors duration-300 animate-fadeIn
              ${item.pago ? 'border-income' : 'border-pending'}`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{item.nome_parceiro}</p>
              <p className="text-pantera-lavender/70 text-xs mt-0.5">
                {item.quantidade}un × {formatCurrency(item.valor_unitario)} · {formatDate(item.data)}
              </p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.pago ? 'text-income' : 'text-pending'}`}>
              {formatCurrency(item.total)}
            </span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
            >
              {item.pago ? <XCircle size={16} /> : <CheckCircle size={16} />}
            </button>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1 shrink-0">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {deleteId && (
        <ConfirmDialog
          title="Excluir entrega?"
          message="Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          danger
          onConfirm={() => { onDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 4: Verificar TypeScript — deve estar limpo**

```powershell
npx tsc --noEmit
```
Esperado: **zero erros** (Badge foi deletado e não é mais importado).

- [ ] **Step 5: Rodar testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 6: Commit**

```powershell
git add src/modules/parceiros/
git commit -m "style: módulo Parceiros com hierarquia de cards, labels e bordas coloridas"
```

---

## Task 6: App.tsx padding + build final

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Atualizar padding do main em src/App.tsx**

Localizar a linha com `<main className="max-w-3xl mx-auto px-4 py-4">` e alterar para:

```typescript
<main className="max-w-3xl mx-auto px-2 py-3 sm:px-4">
```

- [ ] **Step 2: Verificar TypeScript**

```powershell
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 3: Rodar todos os testes**

```powershell
npx vitest run
```
Esperado: 21/21 pass.

- [ ] **Step 4: Build de produção**

```powershell
npm run build
```
Esperado: `dist/` gerado sem erros.

- [ ] **Step 5: Commit final**

```powershell
git add src/App.tsx
git commit -m "style: padding responsivo no main + redesign UI completo"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|-----------|------|
| Tailwind fadeIn animation via config | Task 1 |
| SummaryCard prop `primary` (text-4xl) | Task 1 |
| Badge.tsx deletado | Task 1 |
| Header py-2, lucro visível no mobile | Task 2 |
| NavTabs aba ativa com círculo, backdrop-blur, size=22 | Task 2 |
| Caixa: Saldo primary + grid-cols-2 secundários | Task 3 |
| CaixaForm: labels + botões sólidos | Task 3 |
| CaixaList: border-l-4 colorida + animate-fadeIn | Task 3 |
| Fiado: A Receber primary + grid-cols-2 | Task 4 |
| FiadoForm: labels | Task 4 |
| FiadoList: border-l-4 colorida + sem Badge | Task 4 |
| Parceiros: Parceiros Devem primary | Task 5 |
| ParceiroForm: labels | Task 5 |
| ParceiroList: border-l-4 colorida + sem Badge | Task 5 |
| App.tsx: px-2 sm:px-4 | Task 6 |

Todos os requisitos cobertos.

### Consistência de classes

- Borda colorida: `border-l-4 border-income/expense/pending` — consistente em Tasks 3, 4, 5
- Card item div: `bg-pantera-card rounded-xl py-2.5 px-3` — consistente em Tasks 3, 4, 5 (substitui `.card` que tem border diferente)
- Label dos forms: `text-[11px] uppercase tracking-widest text-pantera-lavender block mb-1` — consistente em Tasks 3, 4, 5
- `animate-fadeIn` em todos os itens de lista — Tasks 3, 4, 5
- `space-y-1.5` nos containers de lista — consistente (era `space-y-2`)
