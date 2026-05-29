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
