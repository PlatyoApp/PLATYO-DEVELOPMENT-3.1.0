/*
  # Implementar Renovación Automática de Suscripciones

  ## Descripción
  Esta migración reemplaza el sistema de auto-expiración con un sistema de renovación
  automática. Las suscripciones con auto_renew = true se renovarán automáticamente
  cuando llegue su fecha de vencimiento, extendiendo el período según su duración
  (mensual o anual).

  ## Cambios Implementados

  1. **Función: calculate_new_end_date()**
     - Calcula la nueva fecha de vencimiento basándose en la fecha actual y la duración
     - Maneja duraciones mensuales y anuales

  2. **Función Mejorada: auto_renew_subscriptions()**
     - Reemplaza la función de auto-expiración
     - Verifica suscripciones activas cuya end_date < now()
     - Si auto_renew = true: extiende la suscripción según su duración
     - Si auto_renew = false: marca la suscripción como 'expired'
     - Actualiza start_date y end_date para suscripciones renovadas

  3. **Trigger Mejorado: auto_renew_on_write**
     - Se ejecuta ANTES de INSERT o UPDATE
     - Calcula automáticamente si una suscripción debe renovarse o expirar
     - Asegura consistencia en todas las escrituras

  ## Notas de Seguridad
  - Las funciones se ejecutan con SECURITY DEFINER para poder actualizar registros
  - Solo actualiza suscripciones activas que cumplan las condiciones
  - Preserva el estado 'expired' para suscripciones ya expiradas
*/

-- Función para calcular nueva fecha de vencimiento basándose en la duración
CREATE OR REPLACE FUNCTION calculate_new_end_date(current_end_date timestamptz, duration text)
RETURNS timestamptz AS $$
DECLARE
  new_end_date timestamptz;
BEGIN
  new_end_date := current_end_date;

  IF duration = 'monthly' THEN
    new_end_date := current_end_date + interval '1 month';
  ELSIF duration = 'annual' THEN
    new_end_date := current_end_date + interval '1 year';
  END IF;

  RETURN new_end_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para renovar automáticamente o expirar suscripciones
CREATE OR REPLACE FUNCTION auto_renew_subscriptions()
RETURNS TABLE(
  renewed_count INTEGER,
  expired_count INTEGER
) AS $$
DECLARE
  v_renewed_count INTEGER := 0;
  v_expired_count INTEGER := 0;
BEGIN
  -- Renovar suscripciones con auto_renew = true
  UPDATE subscriptions
  SET
    start_date = end_date,
    end_date = calculate_new_end_date(end_date, duration),
    updated_at = now()
  WHERE status = 'active'
    AND end_date < now()
    AND auto_renew = true;

  GET DIAGNOSTICS v_renewed_count = ROW_COUNT;

  -- Expirar suscripciones con auto_renew = false
  UPDATE subscriptions
  SET
    status = 'expired',
    updated_at = now()
  WHERE status = 'active'
    AND end_date < now()
    AND auto_renew = false;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN QUERY SELECT v_renewed_count, v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función mejorada para trigger que verifica renovación o expiración en cada escritura
CREATE OR REPLACE FUNCTION auto_renew_on_write_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la suscripción está activa y la fecha de fin ya pasó
  IF NEW.status = 'active' AND NEW.end_date < now() THEN
    IF NEW.auto_renew = true THEN
      -- Renovar automáticamente
      NEW.start_date := NEW.end_date;
      NEW.end_date := calculate_new_end_date(NEW.end_date, NEW.duration);
    ELSE
      -- Marcar como expirada
      NEW.status := 'expired';
    END IF;
  END IF;

  -- Actualizar timestamp
  NEW.updated_at := now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar el trigger existente con la versión mejorada
DROP TRIGGER IF EXISTS auto_expire_on_write ON subscriptions;
DROP TRIGGER IF EXISTS auto_renew_on_write ON subscriptions;

CREATE TRIGGER auto_renew_on_write
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_renew_on_write_trigger();

-- Actualizar vista para mostrar estado calculado incluyendo renovación
DROP VIEW IF EXISTS active_subscriptions;
CREATE VIEW active_subscriptions AS
SELECT
  id,
  restaurant_id,
  plan_type,
  duration,
  auto_renew,
  CASE
    WHEN status = 'expired' THEN 'expired'
    WHEN end_date < now() AND auto_renew = false THEN 'expired'
    WHEN end_date < now() AND auto_renew = true THEN 'active_renewing'
    ELSE status
  END as computed_status,
  status as original_status,
  start_date,
  end_date,
  created_at,
  updated_at,
  (end_date >= now() OR (end_date < now() AND auto_renew = true)) as is_currently_active
FROM subscriptions;

-- Ejecutar renovación inmediata de todas las suscripciones vencidas
DO $$
DECLARE
  renewed INTEGER;
  expired INTEGER;
BEGIN
  SELECT * FROM auto_renew_subscriptions() INTO renewed, expired;
  RAISE NOTICE 'Se renovaron % suscripciones y se marcaron % como expiradas', renewed, expired;
END $$;

-- Comentarios explicativos
COMMENT ON FUNCTION calculate_new_end_date(timestamptz, text) IS
'Calcula la nueva fecha de vencimiento basándose en la fecha actual y la duración (monthly/annual).';

COMMENT ON FUNCTION auto_renew_subscriptions() IS
'Renueva automáticamente las suscripciones con auto_renew=true o las marca como expired si auto_renew=false. Retorna el número de suscripciones renovadas y expiradas.';

COMMENT ON VIEW active_subscriptions IS
'Vista que muestra las suscripciones con su estado calculado en tiempo real, considerando renovación automática. Las suscripciones con auto_renew=true se marcan como active_renewing cuando su fecha ha pasado.';
