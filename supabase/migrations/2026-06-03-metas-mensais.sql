-- =============================================
-- Migração: Metas mensais (faturamento e lucro)
-- Rodar no SQL Editor do Supabase Dashboard (uma vez).
-- Seguro rodar mais de uma vez (idempotente).
-- =============================================

CREATE TABLE IF NOT EXISTS metas (
  user_id           UUID PRIMARY KEY REFERENCES auth.users NOT NULL,
  meta_faturamento  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (meta_faturamento >= 0),
  meta_lucro        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (meta_lucro >= 0),
  updated_at        TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas: owner full access" ON metas;
CREATE POLICY "metas: owner full access"
  ON metas FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
