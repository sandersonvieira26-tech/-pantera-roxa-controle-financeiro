-- =============================================
-- Migração: Fiado rápido (clientes + acúmulo por tamanho)
-- Rodar no SQL Editor do Supabase Dashboard (uma vez).
-- Seguro rodar mais de uma vez (idempotente).
-- =============================================

-- 1. Lista de clientes salvos.
CREATE TABLE IF NOT EXISTS clientes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  nome        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, nome)
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes: owner full access" ON clientes;
CREATE POLICY "clientes: owner full access"
  ON clientes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Quantidades por tamanho na retirada rápida (fiados manuais ficam 0/0).
ALTER TABLE fiados
  ADD COLUMN IF NOT EXISTS qtd_300 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qtd_500 INTEGER NOT NULL DEFAULT 0;

-- 3. (Opcional) habilitar Realtime para a tabela clientes:
--    Supabase Dashboard → Database → Replication → marcar "clientes".
