-- =============================================
-- Migração: Fiado pago → entrada automática no Caixa
-- Rodar no SQL Editor do Supabase Dashboard (uma vez).
-- Seguro rodar mais de uma vez (idempotente).
-- =============================================

-- 1. Liga a entrada de caixa ao fiado de origem.
ALTER TABLE lancamentos
  ADD COLUMN IF NOT EXISTS fiado_id UUID REFERENCES fiados(id) ON DELETE CASCADE;

-- 2. Função: cria a entrada quando o fiado vira pago; remove quando volta a pendente.
CREATE OR REPLACE FUNCTION sync_fiado_lancamento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pago = true AND COALESCE(OLD.pago, false) = false THEN
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

-- 3. Trigger.
DROP TRIGGER IF EXISTS trg_fiado_pago ON fiados;
CREATE TRIGGER trg_fiado_pago
  AFTER UPDATE OF pago ON fiados
  FOR EACH ROW
  EXECUTE FUNCTION sync_fiado_lancamento();
