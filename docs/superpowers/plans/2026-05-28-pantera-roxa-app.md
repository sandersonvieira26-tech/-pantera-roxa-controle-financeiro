# Pantera Roxa — Controle Financeiro: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive PWA de controle financeiro para a Pantera Roxa com 5 módulos (Caixa, Relatório, Fiado, Parceiros, Estoque), autenticação Supabase, sincronização em tempo real e exportação CSV/PDF.

**Architecture:** React 18 + Vite SPA com TanStack Query gerenciando todo estado servidor; Supabase como backend (PostgreSQL + Auth + Realtime); cada módulo tem seus próprios hooks e componentes isolados; utils puras testadas com Vitest.

**Tech Stack:** React 18, Vite, TypeScript, Tailwind CSS, TanStack Query v5, Supabase JS v2, Recharts, lucide-react, jsPDF + jspdf-autotable, vite-plugin-pwa, Vitest

---

## File Map

```
(working dir: PANTERA ROXA - CONTROLE FINANCEIRO/)
├── docs/                          # já existe
├── public/
│   └── icons/
│       ├── icon-192.png           # ícone PWA 192×192
│       └── icon-512.png           # ícone PWA 512×512
├── src/
│   ├── lib/
│   │   ├── supabase.ts            # cliente Supabase singleton
│   │   └── queryClient.ts        # TanStack QueryClient singleton
│   ├── types/
│   │   └── index.ts              # todos os tipos de domínio
│   ├── utils/
│   │   ├── format.ts             # formatação BRL, datas, períodos
│   │   └── export.ts             # geração CSV e PDF
│   ├── components/
│   │   ├── Badge.tsx             # badge colorido (PENDENTE/PAGO)
│   │   ├── SummaryCard.tsx       # card de resumo com valor destacado
│   │   ├── EmptyState.tsx        # estado vazio com mensagem
│   │   ├── ConfirmDialog.tsx     # modal de confirmação genérico
│   │   ├── Header.tsx            # cabeçalho com lucro do mês + ações
│   │   └── NavTabs.tsx           # abas topo (desktop) / bottom nav (mobile)
│   ├── modules/
│   │   ├── auth/
│   │   │   └── Login.tsx         # tela de login email/senha
│   │   ├── caixa/
│   │   │   ├── useLancamentos.ts # hooks CRUD + realtime
│   │   │   ├── CaixaForm.tsx     # formulário inline de lançamento
│   │   │   ├── CaixaList.tsx     # lista de lançamentos
│   │   │   └── Caixa.tsx         # página do módulo
│   │   ├── relatorio/
│   │   │   ├── calcRelatorio.ts  # funções puras de agregação (testadas)
│   │   │   ├── useRelatorio.ts   # hook que agrega dados dos 3 módulos
│   │   │   ├── RelatorioChart.tsx# gráfico últimos 7 dias
│   │   │   └── Relatorio.tsx     # página do módulo
│   │   ├── fiado/
│   │   │   ├── useFiados.ts
│   │   │   ├── FiadoForm.tsx
│   │   │   ├── FiadoList.tsx
│   │   │   └── Fiado.tsx
│   │   ├── parceiros/
│   │   │   ├── useParceiros.ts
│   │   │   ├── ParceiroForm.tsx
│   │   │   ├── ParceiroList.tsx
│   │   │   └── Parceiros.tsx
│   │   └── estoque/
│   │       ├── useEstoque.ts
│   │       ├── EstoqueCell.tsx
│   │       └── Estoque.tsx
│   ├── App.tsx                   # auth guard + roteamento por aba
│   ├── main.tsx
│   └── index.css                 # tailwind directives + global styles
├── tests/
│   ├── utils/
│   │   └── format.test.ts
│   └── modules/relatorio/
│       └── calcRelatorio.test.ts
├── supabase/
│   └── schema.sql                # DDL completo para rodar no Supabase
├── .env.local.example
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.app.json             # adicionar paths alias
```

---

## Task 1: Scaffold do projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.app.json`, `index.html`, `.env.local.example`

- [ ] **Step 1: Criar projeto Vite React TypeScript no diretório atual**

```powershell
cd "C:\Users\sande\OneDrive\Desktop\PANTERA ROXA - CONTROLE FINANCEIRO"
npm create vite@latest . -- --template react-ts
```
Quando perguntar sobre arquivos existentes (pasta `docs/`), confirme com `y`.

- [ ] **Step 2: Instalar dependências de produção**

```powershell
npm install @supabase/supabase-js @tanstack/react-query recharts lucide-react jspdf jspdf-autotable
```

- [ ] **Step 3: Instalar dependências de desenvolvimento**

```powershell
npm install -D tailwindcss postcss autoprefixer vite-plugin-pwa vitest jsdom @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 4: Inicializar Tailwind**

```powershell
npx tailwindcss init -p
```

- [ ] **Step 5: Adicionar path alias `@` no vite.config.ts**

Substituir o conteúdo de `vite.config.ts` por:

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pantera Roxa',
        short_name: 'Pantera',
        description: 'Controle financeiro da Pantera Roxa',
        theme_color: '#AA00FF',
        background_color: '#0D0010',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
})
```

- [ ] **Step 6: Adicionar paths no tsconfig.app.json**

Abrir `tsconfig.app.json` e adicionar dentro de `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 7: Criar arquivo de setup do Vitest**

Criar `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Criar .env.local.example**

Criar `.env.local.example`:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica-aqui
```

- [ ] **Step 9: Verificar que o projeto roda**

```powershell
npm run dev
```
Esperado: servidor em `http://localhost:5173` sem erros.

- [ ] **Step 10: Commit inicial**

```powershell
git init
git add package.json vite.config.ts tsconfig.app.json .env.local.example tests/setup.ts
git commit -m "chore: scaffold projeto React+Vite+TS com Tailwind e Supabase"
```

---

## Task 2: Tailwind config + fontes + estilos globais

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Substituir tailwind.config.ts com as cores da marca**

```typescript
import type { Config } from 'tailwindcss'

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
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 2: Adicionar link das fontes no index.html**

No `<head>` do `index.html`, adicionar antes do `</head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Substituir src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-pantera-black text-white font-body antialiased;
  }
}

@layer components {
  .input {
    @apply w-full bg-pantera-card border border-pantera-purple/40 rounded-lg px-3 py-2.5
           text-white placeholder-pantera-lavender/50 focus:outline-none
           focus:border-pantera-purple transition-colors text-sm;
  }

  .btn-primary {
    @apply bg-gradient-to-r from-pantera-purple to-pantera-dark text-white
           font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity
           disabled:opacity-50 disabled:cursor-not-allowed text-sm;
  }

  .btn-ghost {
    @apply text-pantera-lavender hover:text-white px-3 py-2 rounded-lg
           hover:bg-white/5 transition-colors text-sm;
  }

  .btn-danger {
    @apply text-expense hover:bg-expense/10 px-2.5 py-1.5 rounded-lg
           transition-colors text-sm;
  }

  .card {
    @apply bg-pantera-card border border-pantera-purple/20 rounded-xl p-4;
  }

  .label {
    @apply text-pantera-lavender text-xs font-medium uppercase tracking-wide;
  }
}
```

- [ ] **Step 4: Commit**

```powershell
git add tailwind.config.ts src/index.css index.html
git commit -m "style: configurar Tailwind com identidade visual Pantera Roxa"
```

---

## Task 3: Tipos TypeScript + setup Vitest

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Criar src/types/index.ts**

```typescript
export interface Lancamento {
  id: string
  user_id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  valor: number
  data: string // YYYY-MM-DD
  created_at: string
}

export type LancamentoInsert = Omit<Lancamento, 'id' | 'user_id' | 'created_at'>

export interface Fiado {
  id: string
  user_id: string
  nome_cliente: string
  descricao: string
  valor: number
  data: string
  pago: boolean
  created_at: string
}

export type FiadoInsert = Omit<Fiado, 'id' | 'user_id' | 'created_at'>

export interface Parceiro {
  id: string
  user_id: string
  nome_parceiro: string
  quantidade: number
  valor_unitario: number
  total: number // coluna gerada pelo banco
  data: string
  pago: boolean
  created_at: string
}

export type ParceiroInsert = Omit<Parceiro, 'id' | 'user_id' | 'created_at' | 'total'>

export interface EstoqueItem {
  id: string
  user_id: string
  sabor: 'banana' | 'morango' | 'maracuja'
  tamanho: '300ml' | '500ml'
  quantidade: number
  updated_at: string
}

export type EstoqueUpsert = Pick<EstoqueItem, 'sabor' | 'tamanho' | 'quantidade'>

export type Periodo = 'hoje' | 'semana' | 'mes' | 'tudo'

export const SABORES = ['banana', 'morango', 'maracuja'] as const
export const TAMANHOS = ['300ml', '500ml'] as const
export type Sabor = typeof SABORES[number]
export type Tamanho = typeof TAMANHOS[number]

export const SABOR_LABELS: Record<Sabor, string> = {
  banana: 'Banana',
  morango: 'Morango',
  maracuja: 'Maracujá',
}
```

- [ ] **Step 2: Verificar que TypeScript não tem erros**

```powershell
npx tsc --noEmit
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```powershell
git add src/types/index.ts
git commit -m "feat: adicionar tipos de domínio TypeScript"
```

---

## Task 4: Utilidades de formatação (TDD)

**Files:**
- Create: `src/utils/format.ts`
- Create: `tests/utils/format.test.ts`

- [ ] **Step 1: Escrever os testes antes da implementação**

Criar `tests/utils/format.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import {
  formatCurrency,
  formatDate,
  todayISO,
  startOfMonth,
  startOfWeek,
  filterByPeriod,
} from '@/utils/format'

describe('formatCurrency', () => {
  it('formata zero', () => {
    expect(formatCurrency(0)).toMatch(/R\$/)
    expect(formatCurrency(0)).toMatch(/0,00/)
  })
  it('formata milhares com ponto e centavos com vírgula', () => {
    expect(formatCurrency(1234.56)).toMatch(/1\.234,56/)
  })
  it('formata valor negativo', () => {
    expect(formatCurrency(-50.5)).toMatch(/50,50/)
  })
})

describe('formatDate', () => {
  it('converte ISO para formato BR', () => {
    expect(formatDate('2024-12-31')).toBe('31/12/2024')
  })
  it('preserva zeros à esquerda', () => {
    expect(formatDate('2024-01-05')).toBe('05/01/2024')
  })
})

describe('todayISO', () => {
  it('retorna string no formato YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('startOfMonth', () => {
  it('retorna o primeiro dia do mês atual', () => {
    const result = startOfMonth()
    expect(result).toMatch(/^\d{4}-\d{2}-01$/)
  })
})

describe('filterByPeriod', () => {
  const items = [
    { data: todayISO() },
    { data: '2020-01-01' },
    { data: '2020-06-15' },
  ]

  it('hoje: retorna apenas itens de hoje', () => {
    const result = filterByPeriod(items as { data: string }[], 'hoje')
    expect(result).toHaveLength(1)
    expect(result[0].data).toBe(todayISO())
  })

  it('tudo: retorna todos os itens', () => {
    expect(filterByPeriod(items as { data: string }[], 'tudo')).toHaveLength(3)
  })

  it('semana: retorna item de hoje e exclui 2020', () => {
    const result = filterByPeriod(items as { data: string }[], 'semana')
    expect(result.every(i => i.data >= startOfWeek())).toBe(true)
    expect(result.some(i => i.data === todayISO())).toBe(true)
    expect(result.find(i => i.data === '2020-01-01')).toBeUndefined()
  })

  it('mes: retorna item de hoje e exclui 2020', () => {
    const result = filterByPeriod(items as { data: string }[], 'mes')
    expect(result.every(i => i.data >= startOfMonth())).toBe(true)
    expect(result.some(i => i.data === todayISO())).toBe(true)
    expect(result.find(i => i.data === '2020-06-15')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Executar e confirmar que os testes falham**

```powershell
npm run test -- --run tests/utils/format.test.ts
```
Esperado: erros de "cannot find module @/utils/format".

- [ ] **Step 3: Criar src/utils/format.ts**

```typescript
import type { Periodo } from '@/types'

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

// Retorna YYYY-MM-DD no fuso horário LOCAL do usuário.
// NÃO usar toISOString() — ela retorna UTC e produz a data errada
// no Brasil (UTC-3) após as 21h.
function localDateISO(d = new Date()): string {
  return d.toLocaleDateString('en-CA') // en-CA produz YYYY-MM-DD
}

export function todayISO(): string {
  return localDateISO()
}

export function startOfMonth(): string {
  const d = new Date()
  d.setDate(1)
  return localDateISO(d)
}

export function startOfWeek(): string {
  const d = new Date()
  const day = d.getDay() // 0=dom, 1=seg, ..., 6=sab
  const diff = day === 0 ? 6 : day - 1 // dias desde segunda-feira (semana BR)
  d.setDate(d.getDate() - diff)
  return localDateISO(d)
}

export function last7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return localDateISO(d)
  })
}

export function filterByPeriod<T extends { data: string }>(
  items: T[],
  periodo: Periodo,
): T[] {
  if (periodo === 'tudo') return items
  if (periodo === 'hoje') return items.filter(i => i.data === todayISO())
  if (periodo === 'semana') return items.filter(i => i.data >= startOfWeek())
  // mes
  return items.filter(i => i.data >= startOfMonth())
}

export function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}
```

- [ ] **Step 4: Executar testes e confirmar que passam**

```powershell
npm run test -- --run tests/utils/format.test.ts
```
Esperado: todos PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/utils/format.ts tests/utils/format.test.ts
git commit -m "feat: adicionar utilitários de formatação com testes"
```

---

## Task 5: Supabase — schema SQL + cliente

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/queryClient.ts`

- [ ] **Step 1: Criar supabase/schema.sql**

```sql
-- =============================================
-- Pantera Roxa — Schema Supabase
-- Rodar no SQL Editor do Supabase Dashboard
-- =============================================

-- Lançamentos de caixa
CREATE TABLE IF NOT EXISTS lancamentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao   TEXT NOT NULL,
  valor       NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  data        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lancamentos: owner full access"
  ON lancamentos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Clientes fiado
CREATE TABLE IF NOT EXISTS fiados (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users NOT NULL,
  nome_cliente  TEXT NOT NULL,
  descricao     TEXT NOT NULL,
  valor         NUMERIC(10,2) NOT NULL CHECK (valor > 0),
  data          DATE NOT NULL,
  pago          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE fiados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fiados: owner full access"
  ON fiados FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Parceiros B2B
CREATE TABLE IF NOT EXISTS parceiros (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users NOT NULL,
  nome_parceiro   TEXT NOT NULL,
  quantidade      INTEGER NOT NULL CHECK (quantidade > 0),
  valor_unitario  NUMERIC(10,2) NOT NULL CHECK (valor_unitario > 0),
  total           NUMERIC(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
  data            DATE NOT NULL,
  pago            BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE parceiros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parceiros: owner full access"
  ON parceiros FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Estoque por sabor e tamanho
CREATE TABLE IF NOT EXISTS estoque (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  sabor       TEXT NOT NULL CHECK (sabor IN ('banana', 'morango', 'maracuja')),
  tamanho     TEXT NOT NULL CHECK (tamanho IN ('300ml', '500ml')),
  quantidade  INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, sabor, tamanho)
);
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
CREATE POLICY "estoque: owner full access"
  ON estoque FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habilitar Realtime (rodar separadamente se necessário)
-- No Supabase Dashboard → Database → Replication → habilitar para as 4 tabelas
```

- [ ] **Step 2: Rodar o schema no Supabase**

  1. Acesse [supabase.com](https://supabase.com) → crie uma conta gratuita
  2. Crie um novo projeto (nome: "pantera-roxa", anote a senha do banco)
  3. Vá em **SQL Editor** → cole todo o conteúdo de `supabase/schema.sql` → clique **Run**
  4. Vá em **Authentication → Users** → clique **Add user** → crie o usuário com seu email e senha
  5. Vá em **Database → Replication** → habilite as tabelas `lancamentos`, `fiados`, `parceiros`, `estoque`
  6. Vá em **Project Settings → API** → copie **Project URL** e **anon public key**

- [ ] **Step 3: Criar .env.local com as chaves reais**

Copiar `.env.local.example` para `.env.local` e preencher:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- [ ] **Step 4: Criar src/lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 5: Criar src/lib/queryClient.ts**

```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})
```

- [ ] **Step 6: Commit**

```powershell
git add supabase/schema.sql src/lib/supabase.ts src/lib/queryClient.ts .env.local.example
git commit -m "feat: schema Supabase + cliente + queryClient"
```

---

## Task 6: Módulo de autenticação

**Files:**
- Create: `src/modules/auth/Login.tsx`

- [ ] **Step 1: Criar src/modules/auth/Login.tsx**

```typescript
import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pantera-black px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-pantera-purple tracking-wider">
            PANTERA ROXA
          </h1>
          <p className="text-pantera-lavender text-sm mt-2">Açaí. Sem inventar moda.</p>
        </div>

        <div className="card">
          <h2 className="font-display text-2xl text-white mb-6 tracking-wide">ENTRAR</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label block mb-1">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label block mb-1">Senha</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-expense text-sm bg-expense/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/modules/auth/Login.tsx
git commit -m "feat: tela de login com Supabase auth"
```

---

## Task 7: App shell — Header, NavTabs e App.tsx

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/NavTabs.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Criar src/components/Header.tsx**

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
    <header className="bg-pantera-darker border-b border-pantera-purple/20 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-3xl text-pantera-purple tracking-wider leading-none">
            PANTERA ROXA
          </h1>
          <p className="text-pantera-lavender text-xs hidden sm:block mt-0.5">
            Açaí. Sem inventar moda.
          </p>
        </div>

        {lucro !== undefined && (
          <div className="hidden sm:flex flex-col items-end">
            <span className="label text-[10px]">Lucro do mês</span>
            <span className={`font-display text-xl leading-tight ${lucro >= 0 ? 'text-income' : 'text-expense'}`}>
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

- [ ] **Step 2: Criar src/components/NavTabs.tsx**

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
      <nav className="hidden sm:flex border-b border-pantera-purple/20 bg-pantera-darker sticky top-[61px] z-30">
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
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-pantera-black border-t border-pantera-purple/20">
        <div className="flex">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors
                ${active === id ? 'text-pantera-pink' : 'text-pantera-lavender'}`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  )
}
```

- [ ] **Step 3: Criar src/App.tsx**

```typescript
import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import Login from '@/modules/auth/Login'
import Header from '@/components/Header'
import NavTabs, { type Tab } from '@/components/NavTabs'
import Caixa from '@/modules/caixa/Caixa'
import Relatorio from '@/modules/relatorio/Relatorio'
import Fiado from '@/modules/fiado/Fiado'
import Parceiros from '@/modules/parceiros/Parceiros'
import Estoque from '@/modules/estoque/Estoque'
import ExportModal from '@/utils/ExportModal'
import LimparTudoDialog from '@/utils/LimparTudoDialog'

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
    <div className="min-h-screen bg-pantera-black pb-20 sm:pb-0">
      <Header onExport={() => setShowExport(true)} onLimparTudo={() => setShowLimpar(true)} />
      <NavTabs active={tab} onChange={setTab} />

      <main className="max-w-3xl mx-auto px-4 py-4">
        {tab === 'caixa' && <Caixa />}
        {tab === 'relatorio' && <Relatorio />}
        {tab === 'fiado' && <Fiado />}
        {tab === 'parceiros' && <Parceiros />}
        {tab === 'estoque' && <Estoque />}
      </main>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showLimpar && <LimparTudoDialog onClose={() => setShowLimpar(false)} />}
    </div>
  )
}
```

- [ ] **Step 4: Substituir src/main.tsx**

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 5: Verificar compilação**

```powershell
npx tsc --noEmit
```
Esperado: erros apenas de módulos ainda não criados (Caixa, Relatorio, etc.) — normal neste estágio.

- [ ] **Step 6: Commit**

```powershell
git add src/components/Header.tsx src/components/NavTabs.tsx src/App.tsx src/main.tsx
git commit -m "feat: app shell com header, navegação e auth guard"
```

---

## Task 8: Componentes compartilhados

**Files:**
- Create: `src/components/Badge.tsx`
- Create: `src/components/SummaryCard.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/ConfirmDialog.tsx`

- [ ] **Step 1: Criar src/components/Badge.tsx**

```typescript
interface BadgeProps {
  variant: 'pending' | 'paid' | 'receivable'
  children: React.ReactNode
}

const VARIANTS = {
  pending: 'bg-pending/20 text-pending border border-pending/30',
  paid: 'bg-income/20 text-income border border-income/30',
  receivable: 'bg-pending/20 text-pending border border-pending/30',
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Criar src/components/SummaryCard.tsx**

```typescript
interface SummaryCardProps {
  title: string
  value: string
  accent?: 'green' | 'red' | 'yellow' | 'purple'
  size?: 'normal' | 'large'
}

const ACCENTS = {
  green: 'text-income',
  red: 'text-expense',
  yellow: 'text-pending',
  purple: 'text-pantera-pink',
}

export default function SummaryCard({ title, value, accent = 'purple', size = 'normal' }: SummaryCardProps) {
  return (
    <div className="card">
      <p className="label mb-1">{title}</p>
      <p className={`font-display leading-tight ${ACCENTS[accent]} ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Criar src/components/EmptyState.tsx**

```typescript
interface EmptyStateProps {
  message: string
  icon?: React.ReactNode
}

export default function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-pantera-lavender/60">
      {icon && <div className="mb-3 opacity-40">{icon}</div>}
      <p className="text-sm">{message}</p>
    </div>
  )
}
```

- [ ] **Step 4: Criar src/components/ConfirmDialog.tsx**

```typescript
import { X } from 'lucide-react'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export default function ConfirmDialog({
  title, message, confirmLabel = 'Confirmar', onConfirm, onCancel, danger = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-display text-xl text-white tracking-wide">{title}</h3>
          <button onClick={onCancel} className="text-pantera-lavender hover:text-white">
            <X size={18} />
          </button>
        </div>
        <p className="text-pantera-lavender text-sm mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger px-4 py-2 rounded-lg font-semibold' : 'btn-primary'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/Badge.tsx src/components/SummaryCard.tsx src/components/EmptyState.tsx src/components/ConfirmDialog.tsx
git commit -m "feat: componentes compartilhados (Badge, SummaryCard, EmptyState, ConfirmDialog)"
```

---

## Task 9: Módulo Caixa

**Files:**
- Create: `src/modules/caixa/useLancamentos.ts`
- Create: `src/modules/caixa/CaixaForm.tsx`
- Create: `src/modules/caixa/CaixaList.tsx`
- Create: `src/modules/caixa/Caixa.tsx`

- [ ] **Step 1: Criar src/modules/caixa/useLancamentos.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lancamento, LancamentoInsert } from '@/types'

export const LANCAMENTOS_KEY = ['lancamentos'] as const

export async function fetchLancamentos(): Promise<Lancamento[]> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('*')
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export function useLancamentos() {
  const qc = useQueryClient()

  const query = useQuery({ queryKey: LANCAMENTOS_KEY, queryFn: fetchLancamentos })

  useEffect(() => {
    const channel = supabase
      .channel('lancamentos-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lancamentos' }, () => {
        qc.invalidateQueries({ queryKey: LANCAMENTOS_KEY })
        qc.invalidateQueries({ queryKey: ['lucro-mes'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const add = useMutation({
    mutationFn: async (item: LancamentoInsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('lancamentos').insert({ ...item, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANCAMENTOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lancamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LANCAMENTOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  return { ...query, add, remove }
}
```

- [ ] **Step 2: Criar src/modules/caixa/CaixaForm.tsx**

```typescript
import { useState, FormEvent } from 'react'
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
    <form onSubmit={handleSubmit} className="card mb-4">
      <h2 className="font-display text-xl text-white tracking-wide mb-3">NOVO LANÇAMENTO</h2>

      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTipo('entrada')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'entrada' ? 'bg-income/20 text-income border-income/50' : 'border-pantera-purple/20 text-pantera-lavender hover:border-income/30'}`}
        >
          + Entrada
        </button>
        <button
          type="button"
          onClick={() => setTipo('saida')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
            ${tipo === 'saida' ? 'bg-expense/20 text-expense border-expense/50' : 'border-pantera-purple/20 text-pantera-lavender hover:border-expense/30'}`}
        >
          − Saída
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        <input
          className="input sm:col-span-1"
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          required
        />
        <input
          className="input"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Valor (R$)"
          value={valor}
          onChange={e => setValor(e.target.value)}
          required
        />
        <input
          className="input"
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Adicionar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Criar src/modules/caixa/CaixaList.tsx**

```typescript
import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
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
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="card flex items-center gap-3 py-3">
            {item.tipo === 'entrada'
              ? <ArrowDownCircle size={20} className="text-income shrink-0" />
              : <ArrowUpCircle size={20} className="text-expense shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{item.descricao}</p>
              <p className="text-pantera-lavender text-xs">{formatDate(item.data)}</p>
            </div>
            <span className={`font-semibold text-sm shrink-0 ${item.tipo === 'entrada' ? 'text-income' : 'text-expense'}`}>
              {item.tipo === 'entrada' ? '+' : '−'}{formatCurrency(item.valor)}
            </span>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1.5 shrink-0">
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

- [ ] **Step 4: Criar src/modules/caixa/Caixa.tsx**

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
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SummaryCard title="Entradas" value={formatCurrency(entradas)} accent="green" />
        <SummaryCard title="Saídas" value={formatCurrency(saidas)} accent="red" />
        <SummaryCard title="Saldo" value={formatCurrency(saldo)} accent={saldo >= 0 ? 'green' : 'red'} />
      </div>

      <CaixaForm
        onSubmit={item => add.mutate(item)}
        loading={add.isPending}
      />

      <CaixaList
        items={items}
        onDelete={id => remove.mutate(id)}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```powershell
git add src/modules/caixa/
git commit -m "feat: módulo Caixa com lançamentos e sincronização Realtime"
```

---

## Task 10: Cálculos do Relatório (TDD) + Módulo Relatório

**Files:**
- Create: `src/modules/relatorio/calcRelatorio.ts`
- Create: `tests/modules/relatorio/calcRelatorio.test.ts`
- Create: `src/modules/relatorio/useRelatorio.ts`
- Create: `src/modules/relatorio/RelatorioChart.tsx`
- Create: `src/modules/relatorio/Relatorio.tsx`

- [ ] **Step 1: Escrever testes para calcRelatorio**

Criar `tests/modules/relatorio/calcRelatorio.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  calcFaturamento,
  calcCustos,
  calcLucro,
  calcMargem,
  calcAReceber,
  buildChartData,
} from '@/modules/relatorio/calcRelatorio'
import type { Lancamento, Fiado, Parceiro } from '@/types'

const today = new Date().toISOString().split('T')[0]

const lancamentos: Lancamento[] = [
  { id: '1', user_id: 'u', tipo: 'entrada', descricao: 'venda', valor: 100, data: today, created_at: '' },
  { id: '2', user_id: 'u', tipo: 'saida', descricao: 'compra', valor: 40, data: today, created_at: '' },
]

const fiados: Fiado[] = [
  { id: '3', user_id: 'u', nome_cliente: 'Ana', descricao: 'x', valor: 30, data: today, pago: true, created_at: '' },
  { id: '4', user_id: 'u', nome_cliente: 'Bob', descricao: 'y', valor: 20, data: today, pago: false, created_at: '' },
]

const parceiros: Parceiro[] = [
  { id: '5', user_id: 'u', nome_parceiro: 'Barbearia', quantidade: 10, valor_unitario: 10, total: 100, data: today, pago: true, created_at: '' },
  { id: '6', user_id: 'u', nome_parceiro: 'Mercado', quantidade: 5, valor_unitario: 10, total: 50, data: today, pago: false, created_at: '' },
]

describe('calcFaturamento', () => {
  it('soma entradas + fiados pagos + parceiros pagos', () => {
    expect(calcFaturamento(lancamentos, fiados, parceiros)).toBe(230) // 100 + 30 + 100
  })
  it('não conta fiados pendentes nem parceiros pendentes', () => {
    const soSaida: Lancamento[] = [lancamentos[1]]
    expect(calcFaturamento(soSaida, [fiados[1]], [parceiros[1]])).toBe(0)
  })
})

describe('calcCustos', () => {
  it('soma apenas saídas', () => {
    expect(calcCustos(lancamentos)).toBe(40)
  })
})

describe('calcLucro', () => {
  it('faturamento menos custos', () => {
    expect(calcLucro(230, 40)).toBe(190)
  })
  it('pode ser negativo', () => {
    expect(calcLucro(0, 100)).toBe(-100)
  })
})

describe('calcMargem', () => {
  it('retorna percentual com 1 decimal', () => {
    expect(calcMargem(190, 230)).toBeCloseTo(82.6, 1)
  })
  it('retorna null quando faturamento é zero', () => {
    expect(calcMargem(-100, 0)).toBeNull()
  })
})

describe('calcAReceber', () => {
  it('soma fiados pendentes + parceiros pendentes', () => {
    expect(calcAReceber(fiados, parceiros)).toBe(70) // 20 + 50
  })
})

describe('buildChartData', () => {
  it('retorna 7 entradas', () => {
    expect(buildChartData(lancamentos, fiados, parceiros)).toHaveLength(7)
  })
  it('hoje tem faturamento 230 e lucro 190', () => {
    const data = buildChartData(lancamentos, fiados, parceiros)
    const todayEntry = data.find(d => d.isoDate === today)
    expect(todayEntry?.faturamento).toBe(230)
    expect(todayEntry?.lucro).toBe(190)
  })
})
```

- [ ] **Step 2: Executar e confirmar falha**

```powershell
npm run test -- --run tests/modules/relatorio/calcRelatorio.test.ts
```
Esperado: erro "cannot find module".

- [ ] **Step 3: Criar src/modules/relatorio/calcRelatorio.ts**

```typescript
import type { Lancamento, Fiado, Parceiro } from '@/types'
import { last7Days, shortDate } from '@/utils/format'

export function calcFaturamento(
  lancamentos: Lancamento[],
  fiados: Fiado[],
  parceiros: Parceiro[],
): number {
  const entradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const fiadosPagos = fiados.filter(f => f.pago).reduce((s, f) => s + f.valor, 0)
  const parceirosPagos = parceiros.filter(p => p.pago).reduce((s, p) => s + p.total, 0)
  return entradas + fiadosPagos + parceirosPagos
}

export function calcCustos(lancamentos: Lancamento[]): number {
  return lancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
}

export function calcLucro(faturamento: number, custos: number): number {
  return faturamento - custos
}

export function calcMargem(lucro: number, faturamento: number): number | null {
  if (faturamento === 0) return null
  return (lucro / faturamento) * 100
}

export function calcAReceber(fiados: Fiado[], parceiros: Parceiro[]): number {
  const fiadosPendentes = fiados.filter(f => !f.pago).reduce((s, f) => s + f.valor, 0)
  const parceirosPendentes = parceiros.filter(p => !p.pago).reduce((s, p) => s + p.total, 0)
  return fiadosPendentes + parceirosPendentes
}

export function buildChartData(
  lancamentos: Lancamento[],
  fiados: Fiado[],
  parceiros: Parceiro[],
) {
  return last7Days().map(isoDate => {
    const dayLanc = lancamentos.filter(l => l.data === isoDate)
    const dayFiad = fiados.filter(f => f.data === isoDate)
    const dayParc = parceiros.filter(p => p.data === isoDate)
    const faturamento = calcFaturamento(dayLanc, dayFiad, dayParc)
    const custos = calcCustos(dayLanc)
    return { isoDate, label: shortDate(isoDate), faturamento, lucro: calcLucro(faturamento, custos) }
  })
}
```

- [ ] **Step 4: Executar testes e confirmar aprovação**

```powershell
npm run test -- --run tests/modules/relatorio/calcRelatorio.test.ts
```
Esperado: todos PASS.

- [ ] **Step 5: Criar src/modules/relatorio/useRelatorio.ts**

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { filterByPeriod } from '@/utils/format'
import { calcFaturamento, calcCustos, calcLucro, calcMargem, calcAReceber, buildChartData } from './calcRelatorio'
import { fetchLancamentos, LANCAMENTOS_KEY } from '@/modules/caixa/useLancamentos'
import { fetchFiados, FIADOS_KEY } from '@/modules/fiado/useFiados'
import { fetchParceiros, PARCEIROS_KEY } from '@/modules/parceiros/useParceiros'
import type { Lancamento, Fiado, Parceiro, Periodo } from '@/types'

export function useRelatorio(periodo: Periodo) {
  const qc = useQueryClient()

  // Reutiliza as mesmas queryKeys e queryFns dos módulos para evitar
  // duplicação e inconsistência de ordenação no cache do React Query.
  const { data: allLanc = [] } = useQuery<Lancamento[]>({
    queryKey: LANCAMENTOS_KEY,
    queryFn: fetchLancamentos,
  })

  const { data: allFiad = [] } = useQuery<Fiado[]>({
    queryKey: FIADOS_KEY,
    queryFn: fetchFiados,
  })

  const { data: allParc = [] } = useQuery<Parceiro[]>({
    queryKey: PARCEIROS_KEY,
    queryFn: fetchParceiros,
  })

  useEffect(() => {
    // Inclui 'lancamentos' para que adições no módulo Caixa atualizem o
    // Relatório em tempo real.
    const subs = ['lancamentos', 'fiados', 'parceiros'].map(table =>
      supabase.channel(`${table}-relatorio`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          qc.invalidateQueries({ queryKey: [table] })
        })
        .subscribe()
    )
    return () => { subs.forEach(s => supabase.removeChannel(s)) }
  }, [qc])

  const lanc = filterByPeriod(allLanc, periodo)
  const fiad = filterByPeriod(allFiad, periodo)
  const parc = filterByPeriod(allParc, periodo)

  const faturamento = calcFaturamento(lanc, fiad, parc)
  const custos = calcCustos(lanc)
  const lucro = calcLucro(faturamento, custos)
  const margem = calcMargem(lucro, faturamento)
  const aReceber = calcAReceber(allFiad, allParc)
  const chartData = buildChartData(allLanc, allFiad, allParc)

  return { faturamento, custos, lucro, margem, aReceber, chartData }
}
```

- [ ] **Step 6: Criar src/modules/relatorio/RelatorioChart.tsx**

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/utils/format'

interface ChartEntry { label: string; faturamento: number; lucro: number }

const tooltipFormatter = (value: number) => formatCurrency(value)

export default function RelatorioChart({ data }: { data: ChartEntry[] }) {
  return (
    <div className="card mt-4">
      <p className="label mb-3">Últimos 7 dias</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fill: '#CE93D8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#CE93D8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ backgroundColor: '#1a0025', border: '1px solid #AA00FF44', borderRadius: 8 }}
            labelStyle={{ color: '#CE93D8' }}
          />
          <Legend wrapperStyle={{ color: '#CE93D8', fontSize: 12 }} />
          <Bar dataKey="faturamento" name="Faturamento" fill="#AA00FF" radius={[4, 4, 0, 0]} />
          <Bar dataKey="lucro" name="Lucro" fill="#1D9E75" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 7: Criar src/modules/relatorio/Relatorio.tsx**

```typescript
import { useState } from 'react'
import SummaryCard from '@/components/SummaryCard'
import RelatorioChart from './RelatorioChart'
import { useRelatorio } from './useRelatorio'
import { formatCurrency } from '@/utils/format'
import type { Periodo } from '@/types'

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'tudo', label: 'Tudo' },
]

export default function Relatorio() {
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const { faturamento, custos, lucro, margem, aReceber, chartData } = useRelatorio(periodo)

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-pantera-card rounded-xl p-1">
        {PERIODOS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriodo(p.value)}
            className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${periodo === p.value ? 'bg-pantera-purple text-white' : 'text-pantera-lavender hover:text-white'}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <SummaryCard title="Faturamento" value={formatCurrency(faturamento)} accent="purple" />
        <SummaryCard title="Custos" value={formatCurrency(custos)} accent="red" />
        <SummaryCard title="Lucro" value={formatCurrency(lucro)} accent={lucro >= 0 ? 'green' : 'red'} />
        <SummaryCard
          title="Margem"
          value={margem !== null ? `${margem.toFixed(1)}%` : '—'}
          accent="purple"
        />
      </div>

      <div className="card border-pantera-pink/30 bg-pantera-pink/5">
        <p className="label mb-1">A Receber</p>
        <p className="font-display text-3xl text-pantera-pink">{formatCurrency(aReceber)}</p>
        <p className="text-pantera-lavender text-xs mt-1">Fiados + parceiros pendentes</p>
      </div>

      <RelatorioChart data={chartData} />
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```powershell
git add src/modules/relatorio/ tests/modules/
git commit -m "feat: módulo Relatório com cálculos testados e gráfico"
```

---

## Task 11: Módulo Fiado

**Files:**
- Create: `src/modules/fiado/useFiados.ts`
- Create: `src/modules/fiado/FiadoForm.tsx`
- Create: `src/modules/fiado/FiadoList.tsx`
- Create: `src/modules/fiado/Fiado.tsx`

- [ ] **Step 1: Criar src/modules/fiado/useFiados.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Fiado, FiadoInsert } from '@/types'

export const FIADOS_KEY = ['fiados'] as const

export async function fetchFiados(): Promise<Fiado[]> {
  const { data, error } = await supabase
    .from('fiados').select('*')
    .order('pago', { ascending: true })
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export function useFiados() {
  const qc = useQueryClient()

  const query = useQuery<Fiado[]>({
    queryKey: FIADOS_KEY,
    queryFn: fetchFiados,
  })

  useEffect(() => {
    const channel = supabase.channel('fiados-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fiados' }, () => {
        qc.invalidateQueries({ queryKey: FIADOS_KEY })
        qc.invalidateQueries({ queryKey: ['lucro-mes'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const add = useMutation({
    mutationFn: async (item: FiadoInsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('fiados').insert({ ...item, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const togglePago = useMutation({
    mutationFn: async ({ id, pago }: { id: string; pago: boolean }) => {
      const { error } = await supabase.from('fiados').update({ pago }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fiados').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FIADOS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  return { ...query, add, togglePago, remove }
}
```

- [ ] **Step 2: Criar src/modules/fiado/FiadoForm.tsx**

```typescript
import { useState, FormEvent } from 'react'
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
    <form onSubmit={handleSubmit} className="card mb-4">
      <h2 className="font-display text-xl text-white tracking-wide mb-3">REGISTRAR FIADO</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <input className="input" placeholder="Nome do cliente" value={nome} onChange={e => setNome(e.target.value)} required />
        <input className="input" placeholder="Descrição (ex: 2x 500ml banana)" value={descricao} onChange={e => setDescricao(e.target.value)} required />
        <input className="input" type="number" step="0.01" min="0.01" placeholder="Valor (R$)" value={valor} onChange={e => setValor(e.target.value)} required />
        <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
      </div>
      <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
        <PlusCircle size={16} />
        {loading ? 'Salvando...' : 'Registrar'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Criar src/modules/fiado/FiadoList.tsx**

```typescript
import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import Badge from '@/components/Badge'
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
      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="card flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">{item.nome_cliente}</span>
                <Badge variant={item.pago ? 'paid' : 'pending'}>{item.pago ? 'PAGO' : 'PENDENTE'}</Badge>
              </div>
              <p className="text-pantera-lavender text-xs truncate mt-0.5">{item.descricao} · {formatDate(item.data)}</p>
            </div>
            <span className="font-semibold text-sm text-white shrink-0">{formatCurrency(item.valor)}</span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
              title={item.pago ? 'Marcar como pendente' : 'Marcar como pago'}
            >
              {item.pago ? <XCircle size={18} /> : <CheckCircle size={18} />}
            </button>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1.5 shrink-0">
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

- [ ] **Step 4: Criar src/modules/fiado/Fiado.tsx**

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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="A Receber" value={formatCurrency(pendente)} accent="yellow" />
        <SummaryCard title="Já Recebido" value={formatCurrency(recebido)} accent="green" />
      </div>

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

- [ ] **Step 5: Commit**

```powershell
git add src/modules/fiado/
git commit -m "feat: módulo Fiado com busca e toggle de pagamento"
```

---

## Task 12: Módulo Parceiros

**Files:**
- Create: `src/modules/parceiros/useParceiros.ts`
- Create: `src/modules/parceiros/ParceiroForm.tsx`
- Create: `src/modules/parceiros/ParceiroList.tsx`
- Create: `src/modules/parceiros/Parceiros.tsx`

- [ ] **Step 1: Criar src/modules/parceiros/useParceiros.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Parceiro, ParceiroInsert } from '@/types'

export const PARCEIROS_KEY = ['parceiros'] as const

export async function fetchParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase
    .from('parceiros').select('*')
    .order('pago', { ascending: true })
    .order('data', { ascending: false })
  if (error) throw error
  return data
}

export function useParceiros() {
  const qc = useQueryClient()

  const query = useQuery<Parceiro[]>({
    queryKey: PARCEIROS_KEY,
    queryFn: fetchParceiros,
  })

  useEffect(() => {
    const channel = supabase.channel('parceiros-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parceiros' }, () => {
        qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
        qc.invalidateQueries({ queryKey: ['lucro-mes'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [qc])

  const add = useMutation({
    mutationFn: async (item: ParceiroInsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('parceiros').insert({ ...item, user_id: user.id })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const togglePago = useMutation({
    mutationFn: async ({ id, pago }: { id: string; pago: boolean }) => {
      const { error } = await supabase.from('parceiros').update({ pago }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parceiros').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARCEIROS_KEY })
      qc.invalidateQueries({ queryKey: ['lucro-mes'] })
    },
  })

  return { ...query, add, togglePago, remove }
}
```

- [ ] **Step 2: Criar src/modules/parceiros/ParceiroForm.tsx**

```typescript
import { useState, FormEvent } from 'react'
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
    <form onSubmit={handleSubmit} className="card mb-4">
      <h2 className="font-display text-xl text-white tracking-wide mb-3">REGISTRAR ENTREGA</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <input className="input" placeholder="Nome do parceiro" value={nome} onChange={e => setNome(e.target.value)} required />
        <input className="input" type="date" value={data} onChange={e => setData(e.target.value)} required />
        <input className="input" type="number" min="1" placeholder="Quantidade de garrafas" value={quantidade} onChange={e => setQuantidade(e.target.value)} required />
        <input className="input" type="number" step="0.01" min="0.01" placeholder="Valor por garrafa (R$)" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} required />
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

- [ ] **Step 3: Criar src/modules/parceiros/ParceiroList.tsx**

```typescript
import { useState } from 'react'
import { Trash2, CheckCircle, XCircle } from 'lucide-react'
import Badge from '@/components/Badge'
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
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="card flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white text-sm font-medium">{item.nome_parceiro}</span>
                <Badge variant={item.pago ? 'paid' : 'receivable'}>{item.pago ? 'ACERTADO' : 'A RECEBER'}</Badge>
              </div>
              <p className="text-pantera-lavender text-xs mt-0.5">
                {item.quantidade}un × {formatCurrency(item.valor_unitario)} · {formatDate(item.data)}
              </p>
            </div>
            <span className="font-semibold text-sm text-income shrink-0">{formatCurrency(item.total)}</span>
            <button
              onClick={() => onToggle(item.id, !item.pago)}
              className={`p-1.5 rounded-lg transition-colors shrink-0 ${item.pago ? 'text-income/60 hover:text-expense' : 'text-pending hover:text-income'}`}
            >
              {item.pago ? <XCircle size={18} /> : <CheckCircle size={18} />}
            </button>
            <button onClick={() => setDeleteId(item.id)} className="btn-danger p-1.5 shrink-0">
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

- [ ] **Step 4: Criar src/modules/parceiros/Parceiros.tsx**

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
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard title="Parceiros Devem" value={formatCurrency(devem)} accent="yellow" />
        <SummaryCard title="Já Acertado" value={formatCurrency(acertado)} accent="green" />
      </div>

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

- [ ] **Step 5: Commit**

```powershell
git add src/modules/parceiros/
git commit -m "feat: módulo Parceiros com cálculo automático de total"
```

---

## Task 13: Módulo Estoque

**Files:**
- Create: `src/modules/estoque/useEstoque.ts`
- Create: `src/modules/estoque/EstoqueCell.tsx`
- Create: `src/modules/estoque/Estoque.tsx`

- [ ] **Step 1: Criar src/modules/estoque/useEstoque.ts**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EstoqueItem, EstoqueUpsert, Sabor, Tamanho } from '@/types'

const ESTOQUE_KEY = ['estoque'] as const

export function useEstoque() {
  const qc = useQueryClient()

  const query = useQuery<EstoqueItem[]>({
    queryKey: ESTOQUE_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('estoque').select('*')
      if (error) throw error
      return data
    },
  })

  const upsert = useMutation({
    mutationFn: async (item: EstoqueUpsert) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')
      const { error } = await supabase.from('estoque').upsert(
        { ...item, user_id: user.id, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,sabor,tamanho' },
      )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ESTOQUE_KEY }),
  })

  function getQtd(sabor: Sabor, tamanho: Tamanho): number {
    return query.data?.find(e => e.sabor === sabor && e.tamanho === tamanho)?.quantidade ?? 0
  }

  function adjust(sabor: Sabor, tamanho: Tamanho, delta: number) {
    // Bloqueia cliques duplos enquanto o upsert anterior ainda está em voo
    // para evitar race condition (dois cliques rápidos leriam o mesmo valor
    // do cache e ambos escreveriam o mesmo resultado, perdendo um incremento).
    if (upsert.isPending) return
    const current = getQtd(sabor, tamanho)
    const next = Math.max(0, current + delta)
    upsert.mutate({ sabor, tamanho, quantidade: next })
  }

  return { ...query, getQtd, adjust, adjustPending: upsert.isPending }
}
```

- [ ] **Step 2: Criar src/modules/estoque/EstoqueCell.tsx**

```typescript
import { Plus, Minus } from 'lucide-react'
import type { Sabor, Tamanho } from '@/types'
import { SABOR_LABELS } from '@/types'

interface EstoqueCellProps {
  sabor: Sabor
  tamanho: Tamanho
  quantidade: number
  onAdjust: (sabor: Sabor, tamanho: Tamanho, delta: number) => void
  disabled?: boolean
}

export default function EstoqueCell({ sabor, tamanho, quantidade, onAdjust, disabled }: EstoqueCellProps) {
  return (
    <div className="card flex flex-col items-center gap-2 py-4">
      <p className="font-display text-lg text-white tracking-wide">{SABOR_LABELS[sabor]}</p>
      <p className="text-pantera-lavender text-xs">{tamanho}</p>
      <p className={`font-display text-4xl ${quantidade === 0 ? 'text-expense' : 'text-pantera-pink'}`}>
        {quantidade}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAdjust(sabor, tamanho, -1)}
          disabled={quantidade === 0 || disabled}
          className="w-8 h-8 rounded-lg bg-expense/10 text-expense hover:bg-expense/20 transition-colors disabled:opacity-30 flex items-center justify-center"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => onAdjust(sabor, tamanho, 1)}
          disabled={disabled}
          className="w-8 h-8 rounded-lg bg-income/10 text-income hover:bg-income/20 transition-colors disabled:opacity-30 flex items-center justify-center"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar src/modules/estoque/Estoque.tsx**

```typescript
import EstoqueCell from './EstoqueCell'
import { useEstoque } from './useEstoque'
import { SABORES, TAMANHOS } from '@/types'

export default function Estoque() {
  const { getQtd, adjust, adjustPending } = useEstoque()

  return (
    <div>
      <h2 className="font-display text-2xl text-white tracking-wide mb-4">ESTOQUE</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SABORES.map(sabor =>
          TAMANHOS.map(tamanho => (
            <EstoqueCell
              key={`${sabor}-${tamanho}`}
              sabor={sabor}
              tamanho={tamanho}
              quantidade={getQtd(sabor, tamanho)}
              onAdjust={adjust}
              disabled={adjustPending}
            />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```powershell
git add src/modules/estoque/
git commit -m "feat: módulo Estoque com grid por sabor e tamanho"
```

---

## Task 14: Exportação (CSV + PDF)

**Files:**
- Create: `src/utils/export.ts`
- Create: `src/utils/ExportModal.tsx`

- [ ] **Step 1: Criar src/utils/export.ts**

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Lancamento, Fiado, Parceiro } from '@/types'
import { formatCurrency, formatDate } from './format'

export function exportCSV(lancamentos: Lancamento[], fiados: Fiado[], parceiros: Parceiro[]) {
  const lines: string[] = []

  lines.push('LANÇAMENTOS')
  lines.push('Data,Tipo,Descrição,Valor')
  lancamentos.forEach(l => {
    lines.push(`${formatDate(l.data)},${l.tipo},"${l.descricao}",${l.valor.toFixed(2)}`)
  })

  lines.push('')
  lines.push('FIADOS')
  lines.push('Data,Cliente,Descrição,Valor,Status')
  fiados.forEach(f => {
    lines.push(`${formatDate(f.data)},"${f.nome_cliente}","${f.descricao}",${f.valor.toFixed(2)},${f.pago ? 'Pago' : 'Pendente'}`)
  })

  lines.push('')
  lines.push('PARCEIROS')
  lines.push('Data,Parceiro,Quantidade,Valor Unitário,Total,Status')
  parceiros.forEach(p => {
    lines.push(`${formatDate(p.data)},"${p.nome_parceiro}",${p.quantidade},${p.valor_unitario.toFixed(2)},${p.total.toFixed(2)},${p.pago ? 'Acertado' : 'A Receber'}`)
  })

  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pantera-roxa-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPDF(lancamentos: Lancamento[], fiados: Fiado[], parceiros: Parceiro[]) {
  const doc = new jsPDF()
  const headerColor: [number, number, number] = [170, 0, 255]
  const today = formatDate(new Date().toISOString().split('T')[0])

  // Cabeçalho
  doc.setFontSize(22)
  doc.setTextColor(170, 0, 255)
  doc.text('PANTERA ROXA', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text(`Açaí. Sem inventar moda. — Gerado em ${today}`, 14, 25)

  // Resumo financeiro
  const entradas = lancamentos.filter(l => l.tipo === 'entrada').reduce((s, l) => s + l.valor, 0)
  const saidas = lancamentos.filter(l => l.tipo === 'saida').reduce((s, l) => s + l.valor, 0)
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`Faturamento (entradas): ${formatCurrency(entradas)}`, 14, 33)
  doc.text(`Custos (saídas): ${formatCurrency(saidas)}`, 14, 39)
  doc.text(`Lucro: ${formatCurrency(entradas - saidas)}`, 14, 45)

  // Tabela lançamentos
  autoTable(doc, {
    startY: 52,
    head: [['Data', 'Tipo', 'Descrição', 'Valor']],
    body: lancamentos.map(l => [formatDate(l.data), l.tipo, l.descricao, formatCurrency(l.valor)]),
    headStyles: { fillColor: headerColor },
    styles: { fontSize: 9 },
    didDrawPage: (data) => {
      if (data.pageNumber === 1) return
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('PANTERA ROXA', 14, 8)
    },
  })

  // Tabela fiados
  const afterLanc = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(12)
  doc.setTextColor(170, 0, 255)
  doc.text('FIADOS', 14, afterLanc)
  autoTable(doc, {
    startY: afterLanc + 4,
    head: [['Data', 'Cliente', 'Descrição', 'Valor', 'Status']],
    body: fiados.map(f => [formatDate(f.data), f.nome_cliente, f.descricao, formatCurrency(f.valor), f.pago ? 'Pago' : 'Pendente']),
    headStyles: { fillColor: headerColor },
    styles: { fontSize: 9 },
  })

  // Tabela parceiros
  const afterFiad = (doc as any).lastAutoTable.finalY + 8
  doc.setFontSize(12)
  doc.setTextColor(170, 0, 255)
  doc.text('PARCEIROS', 14, afterFiad)
  autoTable(doc, {
    startY: afterFiad + 4,
    head: [['Data', 'Parceiro', 'Qtd', 'Un', 'Total', 'Status']],
    body: parceiros.map(p => [formatDate(p.data), p.nome_parceiro, p.quantidade, formatCurrency(p.valor_unitario), formatCurrency(p.total), p.pago ? 'Acertado' : 'A Receber']),
    headStyles: { fillColor: headerColor },
    styles: { fontSize: 9 },
  })

  doc.save(`pantera-roxa-${new Date().toISOString().split('T')[0]}.pdf`)
}
```

- [ ] **Step 2: Criar src/utils/ExportModal.tsx**

```typescript
import { useState } from 'react'
import { X, FileText, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { exportCSV, exportPDF } from './export'
import { fetchLancamentos, LANCAMENTOS_KEY } from '@/modules/caixa/useLancamentos'
import { fetchFiados, FIADOS_KEY } from '@/modules/fiado/useFiados'
import { fetchParceiros, PARCEIROS_KEY } from '@/modules/parceiros/useParceiros'
import type { Lancamento, Fiado, Parceiro } from '@/types'

interface ExportModalProps {
  onClose: () => void
}

export default function ExportModal({ onClose }: ExportModalProps) {
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null)

  // Reutiliza as mesmas queryKeys e fetchFns dos módulos — dados já estão
  // em cache, sem requests extras. Erros do Supabase são lançados (não silenciados).
  const { data: lancamentos = [], isError: lancError } = useQuery<Lancamento[]>({ queryKey: LANCAMENTOS_KEY, queryFn: fetchLancamentos })
  const { data: fiados = [], isError: fiadError } = useQuery<Fiado[]>({ queryKey: FIADOS_KEY, queryFn: fetchFiados })
  const { data: parceiros = [], isError: parcError } = useQuery<Parceiro[]>({ queryKey: PARCEIROS_KEY, queryFn: fetchParceiros })
  const hasError = lancError || fiadError || parcError

  async function handleExport(format: 'csv' | 'pdf') {
    setLoading(format)
    try {
      if (format === 'csv') exportCSV(lancamentos, fiados, parceiros)
      else exportPDF(lancamentos, fiados, parceiros)
      onClose()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-white tracking-wide">EXPORTAR DADOS</h3>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleExport('csv')}
            disabled={loading !== null || !!hasError}
            className="w-full card hover:border-income/50 transition-colors flex items-center gap-3 p-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={24} className="text-income" />
            <div className="text-left">
              <p className="text-white font-medium">CSV</p>
              <p className="text-pantera-lavender text-xs">Excel / Google Sheets</p>
            </div>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={loading !== null || !!hasError}
            className="w-full card hover:border-pantera-purple/50 transition-colors flex items-center gap-3 p-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={24} className="text-pantera-purple" />
            <div className="text-left">
              <p className="text-white font-medium">PDF</p>
              <p className="text-pantera-lavender text-xs">Relatório formatado</p>
            </div>
          </button>
        </div>

        {hasError && (
          <div className="flex items-center gap-2 text-expense text-sm mt-3 bg-expense/10 rounded-lg px-3 py-2">
            <AlertCircle size={15} />
            Erro ao carregar dados. Verifique sua conexão e tente novamente.
          </div>
        )}
        {loading && (
          <p className="text-pantera-lavender text-sm text-center mt-3">
            Gerando {loading.toUpperCase()}...
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```powershell
git add src/utils/export.ts src/utils/ExportModal.tsx
git commit -m "feat: exportação CSV e PDF com identidade visual"
```

---

## Task 15: Limpar Tudo

**Files:**
- Create: `src/utils/LimparTudoDialog.tsx`

- [ ] **Step 1: Criar src/utils/LimparTudoDialog.tsx**

```typescript
import { useState, useRef, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

interface LimparTudoDialogProps {
  onClose: () => void
}

export default function LimparTudoDialog({ onClose }: LimparTudoDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mountedRef = useRef(true)
  useEffect(() => () => { mountedRef.current = false }, [])

  async function handleLimpar() {
    if (confirmText !== 'LIMPAR') return
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')
      const uid = user.id

      const results = await Promise.all([
        supabase.from('lancamentos').delete().eq('user_id', uid),
        supabase.from('fiados').delete().eq('user_id', uid),
        supabase.from('parceiros').delete().eq('user_id', uid),
        supabase.from('estoque').delete().eq('user_id', uid),
      ])

      const err = results.find(r => r.error)?.error
      if (err) throw err

      await queryClient.invalidateQueries()
      if (mountedRef.current) onClose()
    } catch (e: any) {
      if (mountedRef.current) setError('Erro ao limpar dados. Tente novamente.')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm border-expense/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-expense" />
            <h3 className="font-display text-xl text-expense tracking-wide">LIMPAR TUDO</h3>
          </div>
          <button onClick={onClose} className="text-pantera-lavender hover:text-white"><X size={18} /></button>
        </div>

        {step === 1 && (
          <>
            <p className="text-pantera-lavender text-sm mb-5">
              Essa ação apaga <strong className="text-white">todos os dados</strong> do app (lançamentos, fiados, parceiros e estoque). Essa ação <strong className="text-expense">não pode ser desfeita</strong>.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
              <button onClick={() => setStep(2)} className="btn-danger px-4 py-2 rounded-lg font-semibold">
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-pantera-lavender text-sm mb-3">
              Digite <strong className="text-expense">LIMPAR</strong> para confirmar:
            </p>
            <input
              className="input mb-4"
              placeholder="Digite LIMPAR"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              autoFocus
            />
            {error && <p className="text-expense text-sm mb-3">{error}</p>}
            <div className="flex gap-3 justify-end">
              <button onClick={onClose} className="btn-ghost">Cancelar</button>
              <button
                onClick={handleLimpar}
                disabled={confirmText !== 'LIMPAR' || loading}
                className="btn-danger px-4 py-2 rounded-lg font-semibold disabled:opacity-40"
              >
                {loading ? 'Limpando...' : 'Apagar tudo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/utils/LimparTudoDialog.tsx
git commit -m "feat: dialog Limpar Tudo com confirmação dupla"
```

---

## Task 16: Ícones PWA + build de produção + README

**Files:**
- Create: `public/icons/icon-192.png` (manual)
- Create: `public/icons/icon-512.png` (manual)
- Create: `README.md`

- [ ] **Step 1: Criar os ícones PWA**

Crie uma imagem simples com fundo `#AA00FF` e o texto "PR" ou a letra "P" em branco usando qualquer ferramenta (Canva, GIMP, paint.net). Exporte como PNG em dois tamanhos:
- `public/icons/icon-192.png` — 192×192px
- `public/icons/icon-512.png` — 512×512px

Alternativamente, use um gerador online como [favicon.io](https://favicon.io/favicon-generator/) com texto "PR", cor de fundo `#AA00FF`, cor do texto branco, e baixe os PNGs.

- [ ] **Step 2: Verificar que o build de produção funciona**

```powershell
npm run build
```
Esperado: pasta `dist/` gerada sem erros.

- [ ] **Step 3: Criar README.md**

```markdown
# Pantera Roxa — Controle Financeiro

App web responsivo (PWA) para controle financeiro da Pantera Roxa.

## Pré-requisitos

- Node.js 18+
- Conta Supabase (gratuita)

## Setup inicial

### 1. Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`
4. Vá em **Authentication → Users → Add user** e crie seu usuário
5. Vá em **Database → Replication** e habilite as tabelas: `lancamentos`, `fiados`, `parceiros`, `estoque`
6. Vá em **Project Settings → API** e copie **Project URL** e **anon public key**

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com suas chaves do Supabase:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

### 4. Rodar testes

```bash
npm test
```

## Deploy na Vercel

1. Faça push do código para um repositório GitHub (não inclua `.env.local`)
2. Acesse [vercel.com](https://vercel.com) → **New Project** → importe o repositório
3. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Clique **Deploy**

A Vercel detecta automaticamente o Vite e configura o build.

## Instalar como app no celular (PWA)

Após o deploy na Vercel, acesse o app no celular:
- **Android (Chrome):** menu → "Adicionar à tela inicial"
- **iOS (Safari):** botão compartilhar → "Adicionar à Tela de Início"

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Caixa** | Lançamentos de entrada e saída |
| **Relatório** | Faturamento, lucro e gráfico dos 7 dias |
| **Fiado** | Clientes que pagam depois |
| **Parceiros** | Revendas B2B |
| **Estoque** | Quantidade de garrafas por sabor/tamanho |
```

- [ ] **Step 4: Executar todos os testes**

```powershell
npm run test -- --run
```
Esperado: todos os testes passam.

- [ ] **Step 5: Commit final**

```powershell
git add public/icons/ README.md
git commit -m "feat: ícones PWA e README com instruções de deploy"
```

---

## Self-Review

### Spec coverage

| Requisito | Task |
|-----------|------|
| Módulo Caixa (3 cards + form + lista) | Task 9 |
| Módulo Relatório (período + 4 cards + gráfico + a receber) | Task 10 |
| Módulo Fiado (busca + toggle + badges) | Task 11 |
| Módulo Parceiros (cálculo automático + toggle) | Task 12 |
| Módulo Estoque (grid 3×2 + +/-) | Task 13 |
| Exportação CSV + PDF | Task 14 |
| Limpar Tudo com confirmação dupla | Task 15 |
| PWA com manifest + ícones + NetworkFirst | Tasks 1 + 16 |
| Supabase Auth login/senha | Task 6 |
| Supabase Realtime sync | Tasks 9–12 |
| RLS por user_id | Task 5 |
| Lucro do mês no header | Task 7 |
| Bottom nav mobile / abas desktop | Task 7 |
| Formatação BRL + datas BR | Task 4 |
| Design visual Pantera Roxa | Task 2 |
| Confirmação antes de excluir | Tasks 9–12 |
| Estados vazios | Task 8 + todos os módulos |

Todos os requisitos cobertos.

### Tipos e nomes consistentes

- `Lancamento.tipo`: `'entrada' | 'saida'` — usado consistentemente em Tasks 3, 9, 10
- `Fiado.pago` / `Parceiro.pago`: `boolean` — usado em Tasks 11–12 e `calcRelatorio.ts`
- `Parceiro.total`: coluna gerada, nunca incluída no insert (`ParceiroInsert` omite `total`) — Task 3
- `LANCAMENTOS_KEY`, `FIADOS_KEY`, `PARCEIROS_KEY`: exportados dos hooks para evitar inconsistência — Tasks 9–12
- `queryClient.invalidateQueries({ queryKey: ['lucro-mes'] })`: chamado em todos os hooks de mutação — Tasks 9–12
