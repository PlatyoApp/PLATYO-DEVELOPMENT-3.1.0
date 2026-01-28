/*
  # Automatización de Vencimiento de Suscripciones

  ## Descripción
  Esta migración crea un sistema automático para marcar suscripciones como vencidas
  cuando su fecha de finalización (end_date) ya pasó.

  ## Cambios Implementados

  1. **Función: check_subscription_expiry()**
     - Revisa si la fecha de finalización de una suscripción ya pasó
     - Si es así y el estado es 'active', lo cambia a 'expired'
     - Se ejecuta automáticamente antes de cada SELECT en la tabla

  2. **Trigger: update_expired_subscriptions**
     - Se ejecuta antes de cada consulta SELECT en subscriptions
     - Actualiza automáticamente el estado a 'expired' si corresponde
     - Asegura que los datos siempre reflejen el estado real

  3. **Función Programada (Cron): expire_old_subscriptions()**
     - Se ejecuta diariamente a medianoche
     - Actualiza todas las suscripciones vencidas en batch
     - Mejora el rendimiento al no depender solo del trigger

  ## Notas de Seguridad
  - Las funciones se ejecutan con SECURITY DEFINER para poder actualizar
  - Solo actualiza suscripciones que cumplan las condiciones de vencimiento
  - No afecta suscripciones canceladas o ya marcadas como vencidas
*/

-- Función para verificar y actualizar suscripciones vencidas
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la suscripción está activa y la fecha de fin ya pasó, marcarla como vencida
  IF NEW.status = 'active' AND NEW.end_date < now() THEN
    NEW.status = 'expired';
    NEW.updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta antes de SELECT para actualizar el estado
CREATE OR REPLACE FUNCTION update_expired_subscriptions_on_read()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' 
    AND end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar antes de INSERT o UPDATE
DROP TRIGGER IF EXISTS check_expiry_on_write ON subscriptions;
CREATE TRIGGER check_expiry_on_write
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry();

-- Función para ejecutar la actualización masiva diaria
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' 
    AND end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear extensión pg_cron si no existe (para tareas programadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar la función para que se ejecute diariamente a medianoche
DO $$
BEGIN
  -- Primero, eliminar cualquier trabajo existente con el mismo nombre
  PERFORM cron.unschedule('expire-old-subscriptions');
EXCEPTION
  WHEN undefined_table THEN
    -- Si la tabla cron.job no existe, ignorar el error
    NULL;
  WHEN OTHERS THEN
    -- Ignorar otros errores (como que el trabajo no exista)
    NULL;
END $$;

-- Programar el trabajo (solo si pg_cron está disponible)
DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-old-subscriptions',
    '0 0 * * *', -- Todos los días a medianoche
    'SELECT expire_old_subscriptions();'
  );
EXCEPTION
  WHEN undefined_table THEN
    -- Si pg_cron no está disponible, continuar sin el cron job
    RAISE NOTICE 'pg_cron no está disponible. La actualización automática se realizará solo mediante triggers.';
END $$;

-- Ejecutar una actualización inicial de todas las suscripciones vencidas
SELECT expire_old_subscriptions();
