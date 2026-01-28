/*
  # Corrección del Sistema de Vencimiento de Suscripciones

  ## Descripción
  Esta migración corrige y mejora el sistema de vencimiento automático de suscripciones
  para que funcione en tiempo real cuando se consultan los datos.

  ## Cambios Implementados

  1. **Vista: subscriptions_with_status**
     - Vista que calcula el estado real de las suscripciones en tiempo real
     - Marca automáticamente como 'expired' las suscripciones con end_date < now()
     - Se puede consultar como una tabla normal

  2. **Función Mejorada: get_subscription_status()**
     - Calcula el estado real basándose en la fecha de vencimiento
     - Puede ser usada en consultas para obtener el estado actualizado

  3. **Trigger Mejorado**
     - Actualiza físicamente el estado en la tabla cuando hay cambios
     - Asegura que la tabla siempre tenga datos consistentes

  ## Notas
  - Las aplicaciones deben usar la vista subscriptions_with_status en lugar de la tabla directamente
  - El estado se calcula dinámicamente basándose en la fecha actual
*/

-- Función para obtener el estado real de una suscripción
CREATE OR REPLACE FUNCTION get_subscription_status(
  current_status text,
  end_date timestamptz
)
RETURNS text AS $$
BEGIN
  -- Si el estado es 'cancelled', mantenerlo
  IF current_status = 'cancelled' THEN
    RETURN 'cancelled';
  END IF;
  
  -- Si la fecha de fin ya pasó, está vencida
  IF end_date < now() THEN
    RETURN 'expired';
  END IF;
  
  -- En cualquier otro caso, retornar el estado actual
  RETURN current_status;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Crear vista que muestra suscripciones con estado calculado en tiempo real
CREATE OR REPLACE VIEW subscriptions_with_status AS
SELECT 
  id,
  restaurant_id,
  plan_type,
  CASE 
    WHEN status = 'cancelled' THEN 'cancelled'
    WHEN end_date < now() THEN 'expired'
    ELSE status
  END as status,
  start_date,
  end_date,
  auto_renew,
  created_at,
  updated_at
FROM subscriptions;

-- Función que actualiza físicamente el estado en la tabla
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET 
    status = 'expired',
    updated_at = now()
  WHERE status IN ('active', 'inactive')
    AND end_date < now()
    AND status != 'cancelled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger mejorado para actualizar en escritura
CREATE OR REPLACE FUNCTION check_subscription_expiry_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular el estado real
  NEW.status := get_subscription_status(NEW.status, NEW.end_date);
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Reemplazar el trigger existente
DROP TRIGGER IF EXISTS check_expiry_on_write ON subscriptions;
CREATE TRIGGER check_expiry_on_write
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_expiry_trigger();

-- Ejecutar actualización inmediata de todos los estados
SELECT update_subscription_status();

-- Actualizar la política de RLS para la vista
DROP POLICY IF EXISTS "Restaurant owners can read own subscription" ON subscriptions;

CREATE POLICY "Restaurant owners can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Permitir a superadmins ver todas las suscripciones
CREATE POLICY "Super admins can read all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
