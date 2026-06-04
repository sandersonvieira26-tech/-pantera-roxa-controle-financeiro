-- =============================================
-- Migração: quantidade por tamanho na venda rápida (contador de garrafas)
-- Rodar no SQL Editor do Supabase Dashboard (uma vez).
-- Seguro rodar mais de uma vez (idempotente).
-- =============================================

-- Venda rápida preenche; lançamento manual e entrada vinda de fiado ficam 0/0.
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS qtd_300 INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qtd_500 INTEGER NOT NULL DEFAULT 0;
