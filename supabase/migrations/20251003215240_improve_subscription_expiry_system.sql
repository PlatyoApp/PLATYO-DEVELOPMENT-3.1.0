/*
  # Mejora del Sistema de Vencimiento Automático de Suscripciones

  ## Descripción
  Esta migración mejora el sistema existente para asegurar que las suscripciones
  se marquen automáticamente como 'expired' cuando la fecha de vencimiento (end_date)
  ha sido superada.

  ## Cambios Implementados

  1. **Función Mejorada: auto_expire_subscriptions()**
     - Actualiza todas las suscripciones activas cuya end_date < now()
     - Cambia el estado de 'active' o 'inactive' a 'expired'
     - No afecta suscripciones canceladas
     - Actualiza el campo updated_at con la marca de tiempo actual

  2. **Trigger Mejorado: auto_expire_on_write**
     - Se ejecuta ANTES de INSERT o UPDATE
     - Calcula automáticamente el estado correcto basándose en end_date
     - Asegura que nunca se guarde una suscripción con estado incorrecto

  3. **Vista: active_subscriptions**
     - Muestra solo suscripciones que realmente están activas
     - Calcula el estado en tiempo real basándose en end_date
     - Útil para consultas rápidas de suscripciones válidas

  ## Notas de Seguridad
  - La función se ejecuta con SECURITY DEFINER para poder actualizar registros
  - Solo actualiza suscripciones que cumplen condiciones específicas
  - Preserva el estado 'cancelled' sin modificarlo
*/

-- Función para actualizar suscripciones vencidas en batch
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE subscriptions
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status IN ('active', 'inactive')
    AND end_date < now()
    AND status != 'cancelled';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función mejorada para trigger que verifica el estado en cada escritura
CREATE OR REPLACE FUNCTION auto_expire_on_write_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no está cancelada y la fecha de fin ya pasó, marcar como vencida
  IF NEW.status != 'cancelled' AND NEW.end_date < now() THEN
    NEW.status = 'expired';
  END IF;
  
  -- Actualizar timestamp
  NEW.updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar el trigger existente con la versión mejorada
DROP TRIGGER IF EXISTS auto_expire_on_write ON subscriptions;
CREATE TRIGGER auto_expire_on_write
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_on_write_trigger();

-- Crear vista para consultar suscripciones con estado calculado en tiempo real
DROP VIEW IF EXISTS active_subscriptions;
CREATE VIEW active_subscriptions AS
SELECT 
  id,
  restaurant_id,
  plan_type,
  CASE 
    WHEN status = 'cancelled' THEN 'cancelled'
    WHEN end_date < now() THEN 'expired'
    ELSE status
  END as computed_status,
  status as original_status,
  start_date,
  end_date,
  auto_renew,
  created_at,
  updated_at,
  (end_date >= now() AND status NOT IN ('cancelled', 'expired')) as is_currently_active
FROM subscriptions;

-- Ejecutar actualización inmediata de todas las suscripciones vencidas
DO $$
DECLARE
  updated INTEGER;
BEGIN
  SELECT auto_expire_subscriptions() INTO updated;
  RAISE NOTICE 'Se actualizaron % suscripciones vencidas', updated;
END $$;

-- Comentario explicativo
COMMENT ON FUNCTION auto_expire_subscriptions() IS 
'Actualiza automáticamente el estado de las suscripciones a expired cuando end_date < now(). Retorna el número de registros actualizados.';

COMMENT ON VIEW active_subscriptions IS 
'Vista que muestra las suscripciones con su estado calculado en tiempo real basándose en la fecha de vencimiento. Incluye el campo is_currently_active para verificación rápida.';
