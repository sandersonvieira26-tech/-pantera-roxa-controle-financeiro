# Design Spec — Pantera Roxa: App de Controle Financeiro

**Data:** 2026-05-28  
**Status:** Aprovado pelo usuário

---

## 1. Contexto do Negócio

Pantera Roxa é uma marca de açaí cremoso vendido em garrafas (300ml e 500ml) em 3 sabores (banana, morango, maracujá). Opera em dois canais: B2C (direto ao consumidor) e B2B (revenda em comércios locais como barbearias e mercadinhos). Muitos clientes pagam depois (fiado) e parceiros acertam periodicamente.

O app controla todo o financeiro do negócio: caixa, relatórios, fiado e parceiros.

---

## 2. Usuários e Acesso

- **Login compartilhado:** todos os usuários (dono + funcionários) usam o mesmo email/senha
- **Dados compartilhados:** todos veem e editam os mesmos dados do negócio
- **Permissões:** todos os usuários têm acesso igual (sem hierarquia de roles)
- **Cadastro:** a conta é criada uma única vez direto no Supabase Dashboard; não há cadastro público no app

---

## 3. Stack Técnico

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilização | Tailwind CSS |
| Fontes | Bebas Neue (títulos) + Inter (corpo) via Google Fonts |
| Estado servidor | TanStack Query v5 |
| Backend/Banco | Supabase (PostgreSQL + Auth + Realtime) |
| Gráficos | Recharts |
| Ícones | lucide-react |
| PDF | jsPDF + jspdf-autotable |
| PWA | vite-plugin-pwa |
| Deploy | Vercel |

---

## 4. Estrutura de Pastas

```
src/
  components/         # SummaryCard, ListItem, FormModal, ConfirmDialog, EmptyState, PeriodSelector
  modules/
    caixa/
    relatorio/
    fiado/
    parceiros/
    estoque/
  hooks/              # custom hooks com useQuery/useMutation por módulo
  lib/
    supabase.ts
    queryClient.ts
  utils/
    format.ts         # formatação BRL e datas BR
    export.ts         # lógica CSV + PDF
  types/              # tipos TypeScript do domínio
  App.tsx             # auth guard + navegação por abas
```

---

## 5. Banco de Dados (Supabase)

### Tabela: `lancamentos`
```sql
id          uuid PK default gen_random_uuid()
user_id     uuid references auth.users NOT NULL
tipo        text CHECK (tipo IN ('entrada','saida'))
descricao   text NOT NULL
valor       numeric(10,2) NOT NULL
data        date NOT NULL
created_at  timestamptz default now()
```

### Tabela: `fiados`
```sql
id            uuid PK default gen_random_uuid()
user_id       uuid references auth.users NOT NULL
nome_cliente  text NOT NULL
descricao     text NOT NULL
valor         numeric(10,2) NOT NULL
data          date NOT NULL
pago          boolean default false
created_at    timestamptz default now()
```

### Tabela: `parceiros`
```sql
id              uuid PK default gen_random_uuid()
user_id         uuid references auth.users NOT NULL
nome_parceiro   text NOT NULL
quantidade      integer NOT NULL
valor_unitario  numeric(10,2) NOT NULL
total           numeric(10,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED
data            date NOT NULL
pago            boolean default false
created_at      timestamptz default now()
```

### Tabela: `estoque`
```sql
id          uuid PK default gen_random_uuid()
user_id     uuid references auth.users NOT NULL
sabor       text CHECK (sabor IN ('banana','morango','maracuja'))
tamanho     text CHECK (tamanho IN ('300ml','500ml'))
quantidade  integer NOT NULL default 0
updated_at  timestamptz default now()
UNIQUE (user_id, sabor, tamanho)
```

### RLS (Row Level Security)
Todas as tabelas têm policies: `user_id = auth.uid()` para SELECT, INSERT, UPDATE e DELETE.

### Realtime
Habilitado nas 4 tabelas para sincronização automática entre dispositivos.

---

## 6. Autenticação e Navegação

**Fluxo de auth:**
```
App inicia → verifica sessão Supabase
  ├── sem sessão → tela de Login (email + senha)
  └── com sessão → app completo
```

**Cabeçalho:**
```
[PANTERA ROXA]  Açaí. Sem inventar moda.    [Lucro do mês: R$ X.XXX]  [Sair]
```
O lucro do mês atualiza em tempo real.

**Navegação:**
- Mobile: bottom navigation fixada no rodapé
- Desktop: abas horizontais no topo

| Aba | Ícone lucide | Módulo |
|-----|-------------|--------|
| Caixa | `Wallet` | Entradas e saídas |
| Relatório | `BarChart2` | Faturamento e lucro |
| Fiado | `Clock` | Clientes a prazo |
| Parceiros | `Handshake` | Revendas B2B |
| Estoque | `Package` | Garrafas por sabor |

---

## 7. Módulos

### Módulo 1 — Caixa

**Cards de resumo (3):** Total Entradas (verde), Total Saídas (vermelho), Saldo (verde/vermelho conforme valor).

**Formulário inline:**
- Tipo: botões visuais Entrada (verde) / Saída (vermelho)
- Campos: descrição (text), valor (numeric), data (default: hoje)

**Lista:** ordenada por data desc.  
**Item:** ícone direcional | descrição | data | valor com sinal (+/-) | botão excluir (com confirmação).

---

### Módulo 2 — Relatório

**Seletor de período:** Hoje / Semana / Mês / Tudo.

**Cards (4):** Faturamento, Custos, Lucro (faturamento − custos), Margem % (lucro/faturamento × 100; exibe "—" quando faturamento = 0).

**Card destacado:** "A Receber" = fiados pendentes + parceiros pendentes.

**Gráfico:** barras dos últimos 7 dias, duas séries por dia (Faturamento roxo vs Lucro verde).

**Regra de faturamento:**
- Entradas do caixa no período
- \+ fiados com `pago = true` no período
- \+ parceiros com `pago = true` no período
- Pendentes **não** contam

**Regra de custos:** saídas do caixa no período.

---

### Módulo 3 — Fiado

**Cards (2):** A Receber (amarelo), Já Recebido (verde).

**Formulário:** nome do cliente, descrição, valor, data.

**Busca:** campo de filtro por nome do cliente (filtro em memória, sem request ao banco).

**Lista:** pendentes primeiro, depois por data.  
**Item:** nome | badge PENDENTE/PAGO | descrição | data | valor | botão toggle status | botão excluir.

---

### Módulo 4 — Parceiros

**Cards (2):** Parceiros Devem (amarelo), Já Acertado (verde).

**Formulário:** nome do parceiro, quantidade, valor unitário, data. Total calculado automaticamente ao digitar (`quantidade × valor_unitario`).

**Lista:** pendentes primeiro.  
**Item:** nome | badge A RECEBER/ACERTADO | `Xun × R$Y` | data | total | botão toggle | botão excluir.

---

### Módulo 5 — Estoque (Extra)

Grid 3×2 (sabores × tamanhos): banana 300ml, banana 500ml, morango 300ml, morango 500ml, maracujá 300ml, maracujá 500ml.

Cada célula: nome do sabor + tamanho, quantidade atual com botões `+` e `−`. Atualizações fazem `upsert` na tabela `estoque`. Sem histórico — apenas valor atual.

---

## 8. Funcionalidades Globais

### Exportar Dados
Botão no cabeçalho. Modal com duas opções:

**CSV:** arquivo único com 3 seções (Lançamentos, Fiados, Parceiros) separadas por linha em branco. Download direto via browser.

**PDF:** relatório formatado via jsPDF:
- Cabeçalho com nome "Pantera Roxa" e data de geração
- Resumo: faturamento, custos, lucro, a receber
- 3 tabelas com autoTable
- Cor `#AA00FF` no cabeçalho das tabelas

### Limpar Tudo
Botão discreto (ex: ícone de engrenagem no cabeçalho). Confirmação dupla:
1. Dialog: "Tem certeza? Essa ação apaga todos os dados."
2. Campo: digitar a palavra **LIMPAR** para confirmar

Apaga todos os registros do `auth.uid()` nas tabelas `lancamentos`, `fiados`, `parceiros` e `estoque`.

---

## 9. PWA

Configurado via `vite-plugin-pwa`:
- Nome: "Pantera Roxa"
- Nome curto: "Pantera"
- Cor de tema: `#AA00FF`
- Cor de fundo: `#0D0010`
- Ícones: 192×192 e 512×512
- Estratégia: `NetworkFirst` para requests Supabase, `CacheFirst` para assets estáticos
- Prompt "Adicionar à tela inicial" exibido automaticamente no mobile

---

## 10. Design Visual

### Paleta
| Uso | Cor |
|-----|-----|
| Fundo principal | `#0D0010` |
| Fundo de cards | `#1a0025` |
| Borda de cards | `#AA00FF` (20% opacidade) |
| Roxo principal | `#AA00FF` |
| Rosa neon (destaques) | `#E040FB` |
| Roxo escuro | `#7B1FA2` |
| Lavanda (texto secundário) | `#CE93D8` |
| Verde (entradas/sucesso) | `#1D9E75` |
| Vermelho (saídas/alerta) | `#E24B4A` |
| Amarelo (pendências) | `#BA7517` |

### Tipografia
- Títulos / labels grandes: **Bebas Neue**
- Corpo, campos, valores: **Inter**

### Componentes-chave
- Botões primários: gradiente `#AA00FF → #7B1FA2`
- Badges: PENDENTE/A RECEBER em amarelo, PAGO/ACERTADO em verde
- Inputs: fundo `#1a0025`, borda `#AA00FF`, placeholder em `#CE93D8`
- Bottom nav (mobile): fundo `#0D0010`, aba ativa com underline rosa `#E040FB`

---

## 11. Formatação Padrão

- Moeda: `R$ 1.234,56` (padrão pt-BR)
- Datas: `DD/MM/AAAA`
- Confirmação antes de excluir qualquer item

---

## 12. Fora de Escopo (v1)

- Gestão de múltiplas contas / workspaces
- Histórico de alterações / audit log
- Notificações push
- Integração com sistemas de pagamento
- Relatórios além dos 7 dias no gráfico
