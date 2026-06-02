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

-- =============================================
-- Fiado pago → entrada automática no Caixa
-- =============================================

-- Liga a entrada de caixa ao fiado de origem.
-- NULL = lançamento manual normal. ON DELETE CASCADE: ao excluir o
-- fiado, sua entrada no caixa some junto.
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS fiado_id UUID REFERENCES fiados(id) ON DELETE CASCADE;

-- Quando um fiado vira pago, cria a entrada no caixa; quando volta a
-- pendente, remove. Roda como o próprio usuário (SECURITY INVOKER), e o
-- user_id copiado do fiado satisfaz a policy de RLS de lancamentos.
CREATE OR REPLACE FUNCTION sync_fiado_lancamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pago = true AND COALESCE(OLD.pago, false) = false THEN
    -- Idempotente: não duplica se já existir entrada para este fiado.
    INSERT INTO lancamentos (user_id, tipo, descricao, valor, data, fiado_id)
    SELECT NEW.user_id,
           'entrada',
           'Fiado pago — ' || NEW.nome_cliente,
           NEW.valor,
           (now() AT TIME ZONE 'America/Sao_Paulo')::date,
           NEW.id
    WHERE NOT EXISTS (SELECT 1 FROM lancamentos WHERE fiado_id = NEW.id);
  ELSIF NEW.pago = false AND OLD.pago = true THEN
    DELETE FROM lancamentos WHERE fiado_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fiado_pago ON fiados;
CREATE TRIGGER trg_fiado_pago
  AFTER UPDATE OF pago ON fiados
  FOR EACH ROW
  EXECUTE FUNCTION sync_fiado_lancamento();

-- =============================================
-- Categorias de saída
-- =============================================

CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, nome)
);
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias: owner full access"
  ON categorias FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Liga a saída à categoria. NULL = "Sem categoria".
-- ON DELETE RESTRICT: o banco impede apagar categoria em uso.
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE RESTRICT;

-- =============================================
-- Preços por tamanho (venda rápida)
-- =============================================

CREATE TABLE IF NOT EXISTS precos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  tamanho     TEXT NOT NULL CHECK (tamanho IN ('300ml', '500ml')),
  preco       NUMERIC(10,2) NOT NULL CHECK (preco > 0),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, tamanho)
);
ALTER TABLE precos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "precos: owner full access"
  ON precos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Fiado rápido (clientes salvos + acúmulo por tamanho)
-- =============================================

CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, nome)
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes: owner full access"
  ON clientes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Quantidades por tamanho de uma retirada rápida. Fiados manuais ficam 0/0.
ALTER TABLE fiados
  ADD COLUMN IF NOT EXISTS qtd_300 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qtd_500 INTEGER NOT NULL DEFAULT 0;

-- Habilitar Realtime (rodar separadamente se necessário)
-- No Supabase Dashboard → Database → Replication → habilitar para as tabelas
