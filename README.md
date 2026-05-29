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
4. Vá em **Authentication → Users → Add user** e crie seu usuário com email e senha
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

> **Ícones PWA:** Substitua `public/icons/icon-192.png` e `public/icons/icon-512.png` por imagens reais de 192×192px e 512×512px com fundo roxo (#AA00FF). Use Canva, GIMP, ou [favicon.io](https://favicon.io/favicon-generator/) com texto "PR" e cor de fundo `#AA00FF`.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Caixa** | Lançamentos de entrada e saída |
| **Relatório** | Faturamento, lucro e gráfico dos 7 dias |
| **Fiado** | Clientes que pagam depois |
| **Parceiros** | Revendas B2B |
| **Estoque** | Quantidade de garrafas por sabor/tamanho |

## Configuração Supabase — Realtime

Para sincronização em tempo real entre dispositivos, certifique-se de habilitar Realtime nas 4 tabelas no Supabase Dashboard → Database → Replication.

## Stack técnica

- React 18 + Vite + TypeScript
- Tailwind CSS (tema Pantera Roxa)
- TanStack Query v5 (cache e sincronização)
- Supabase (PostgreSQL + Auth + Realtime)
- Recharts (gráficos)
- jsPDF + autoTable (exportação PDF)
- Vitest (testes)
- vite-plugin-pwa (Progressive Web App)
