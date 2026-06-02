-- =============================================
-- Migração: Preços por tamanho (venda rápida)
-- Rodar no SQL Editor do Supabase Dashboard (uma vez).
-- Seguro rodar mais de uma vez (idempotente).
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

DROP POLICY IF EXISTS "precos: owner full access" ON precos;
CREATE POLICY "precos: owner full access"
  ON precos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- (Opcional) habilitar Realtime para a tabela precos:
-- Supabase Dashboard → Database → Replication → marcar "precos".
