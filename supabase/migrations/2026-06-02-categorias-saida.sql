-- =============================================
-- Migração: Categorias de saída
-- Rodar no SQL Editor do Supabase Dashboard (uma vez).
-- Seguro rodar mais de uma vez (idempotente).
-- =============================================

-- 1. Tabela de categorias (editável pelo dono).
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, nome)
);
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categorias: owner full access" ON categorias;
CREATE POLICY "categorias: owner full access"
  ON categorias FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Liga a saída à categoria. NULL = "Sem categoria".
--    ON DELETE RESTRICT: o banco impede apagar categoria em uso.
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias(id) ON DELETE RESTRICT;

-- 3. (Opcional) habilitar Realtime para a tabela categorias:
--    Supabase Dashboard → Database → Replication → marcar "categorias".
