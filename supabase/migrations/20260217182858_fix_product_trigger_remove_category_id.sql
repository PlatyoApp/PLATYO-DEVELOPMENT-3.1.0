/*
  # Fix Product Trigger - Remove category_id Check
  
  ## Overview
  Fixes the prevent_blocked_product_updates trigger by removing check for non-existent category_id field.
  
  ## Changes Made
  - Removes category_id from the field check in product update prevention
*/

CREATE OR REPLACE FUNCTION prevent_blocked_product_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If product is blocked by plan limit, only allow deletion (handled separately)
  IF OLD.blocked_by_plan_limit = true THEN
    -- Check if they're trying to unblock it (not allowed unless from trigger)
    IF NEW.blocked_by_plan_limit = false AND current_setting('app.bypass_blocked_check', true) IS NULL THEN
      RAISE EXCEPTION 'No puedes desbloquear este producto manualmente. Debes eliminar otros productos o actualizar tu plan.';
    END IF;
    
    -- Check if they're trying to change status from archived
    IF NEW.status != 'archived' AND OLD.status = 'archived' THEN
      RAISE EXCEPTION 'No puedes cambiar el status de un producto bloqueado por límite del plan. Elimina este producto o actualiza tu plan.';
    END IF;
    
    -- Check if they're trying to make it available
    IF NEW.is_available = true AND OLD.is_available = false THEN
      RAISE EXCEPTION 'No puedes hacer disponible un producto bloqueado por límite del plan. Elimina este producto o actualiza tu plan.';
    END IF;
    
    -- Check if they're trying to edit other important fields
    IF NEW.name IS DISTINCT FROM OLD.name OR
       NEW.description IS DISTINCT FROM OLD.description OR
       NEW.price IS DISTINCT FROM OLD.price THEN
      RAISE EXCEPTION 'No puedes editar un producto bloqueado por límite del plan. Elimina este producto o actualiza tu plan.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION prevent_blocked_product_updates() IS 
  'Prevents any updates to products that are blocked by plan limits. Only deletion is allowed.';