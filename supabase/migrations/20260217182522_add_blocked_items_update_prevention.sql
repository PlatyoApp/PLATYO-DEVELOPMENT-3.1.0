/*
  # Prevent Updates to Blocked Items
  
  ## Overview
  Adds database-level validation to prevent editing or activating items blocked by plan limits.
  
  ## Changes Made
  
  1. **Category Update Prevention**
     - Cannot update any field if `blocked_by_plan_limit = true`
     - Cannot set `is_active = true` if `blocked_by_plan_limit = true`
     - Only deletion is allowed
     
  2. **Product Update Prevention**
     - Cannot update any field if `blocked_by_plan_limit = true`
     - Cannot change status from 'archived' if `blocked_by_plan_limit = true`
     - Only deletion is allowed
     
  3. **Error Messages**
     - Clear error messages explaining why the update was blocked
     - Guides user to delete or upgrade plan
*/

-- Function to prevent category updates when blocked
CREATE OR REPLACE FUNCTION prevent_blocked_category_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If category is blocked by plan limit, only allow deletion (handled separately)
  IF OLD.blocked_by_plan_limit = true THEN
    -- Check if they're trying to unblock it (not allowed unless from trigger)
    IF NEW.blocked_by_plan_limit = false AND current_setting('app.bypass_blocked_check', true) IS NULL THEN
      RAISE EXCEPTION 'No puedes desbloquear esta categoría manualmente. Debes eliminar otras categorías o actualizar tu plan.';
    END IF;
    
    -- Check if they're trying to activate it
    IF NEW.is_active = true AND OLD.is_active = false THEN
      RAISE EXCEPTION 'No puedes activar una categoría bloqueada por límite del plan. Elimina esta categoría o actualiza tu plan.';
    END IF;
    
    -- Check if they're trying to edit other fields (except updated_at)
    IF NEW.name IS DISTINCT FROM OLD.name OR
       NEW.description IS DISTINCT FROM OLD.description OR
       NEW.icon IS DISTINCT FROM OLD.icon OR
       NEW.display_order IS DISTINCT FROM OLD.display_order THEN
      RAISE EXCEPTION 'No puedes editar una categoría bloqueada por límite del plan. Elimina esta categoría o actualiza tu plan.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to prevent product updates when blocked
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
       NEW.price IS DISTINCT FROM OLD.price OR
       NEW.category_id IS DISTINCT FROM OLD.category_id THEN
      RAISE EXCEPTION 'No puedes editar un producto bloqueado por límite del plan. Elimina este producto o actualiza tu plan.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trigger_prevent_blocked_category_updates ON categories;
DROP TRIGGER IF EXISTS trigger_prevent_blocked_product_updates ON products;

-- Create triggers
CREATE TRIGGER trigger_prevent_blocked_category_updates
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION prevent_blocked_category_updates();

CREATE TRIGGER trigger_prevent_blocked_product_updates
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_blocked_product_updates();

-- Update the subscription plan change function to bypass this check
CREATE OR REPLACE FUNCTION handle_subscription_plan_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path TO 'public'
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_max_products INTEGER;
  v_new_max_products INTEGER;
  v_old_max_categories INTEGER;
  v_new_max_categories INTEGER;
  v_current_active_products INTEGER;
  v_current_active_categories INTEGER;
  v_products_to_block INTEGER := 0;
  v_categories_to_block INTEGER := 0;
  v_blocked_product_ids uuid[];
  v_blocked_category_ids uuid[];
  v_old_plan_name TEXT;
BEGIN
  v_old_plan_name := OLD.plan_name;
  v_old_max_products := OLD.max_products;
  v_old_max_categories := OLD.max_categories;
  v_new_max_products := NEW.max_products;
  v_new_max_categories := NEW.max_categories;

  v_blocked_product_ids := ARRAY[]::uuid[];
  v_blocked_category_ids := ARRAY[]::uuid[];

  -- Set flag to bypass blocked check for system operations
  PERFORM set_config('app.bypass_blocked_check', 'true', true);

  -- Always unblock everything first (in case of upgrade)
  UPDATE products
  SET blocked_by_plan_limit = false
  WHERE restaurant_id = NEW.restaurant_id
    AND blocked_by_plan_limit = true;

  UPDATE categories
  SET blocked_by_plan_limit = false
  WHERE restaurant_id = NEW.restaurant_id
    AND blocked_by_plan_limit = true;

  -- ========== HANDLE CATEGORIES ==========
  IF v_new_max_categories < v_old_max_categories THEN
    -- Count current active categories (not deleted)
    SELECT COUNT(*)
    INTO v_current_active_categories
    FROM categories
    WHERE restaurant_id = NEW.restaurant_id
      AND is_active = true
      AND (deleted_at IS NULL);

    v_categories_to_block := GREATEST(0, v_current_active_categories - v_new_max_categories);

    IF v_categories_to_block > 0 THEN
      SELECT ARRAY_AGG(id)
      INTO v_blocked_category_ids
      FROM (
        SELECT id
        FROM categories
        WHERE restaurant_id = NEW.restaurant_id
          AND is_active = true
          AND (deleted_at IS NULL)
        ORDER BY created_at ASC
        LIMIT v_categories_to_block
      ) subquery;

      -- Block categories (set blocked flag and deactivate)
      UPDATE categories
      SET 
        blocked_by_plan_limit = true,
        is_active = false,
        updated_at = NOW()
      WHERE id = ANY(v_blocked_category_ids);

      RAISE NOTICE 'Blocked % oldest categories for restaurant % due to plan downgrade',
        v_categories_to_block, NEW.restaurant_id;
    END IF;
  END IF;

  -- ========== HANDLE PRODUCTS ==========
  IF v_new_max_products < v_old_max_products THEN
    -- Count current active products (status = 'active', not deleted)
    SELECT COUNT(*)
    INTO v_current_active_products
    FROM products
    WHERE restaurant_id = NEW.restaurant_id
      AND status = 'active'
      AND (deleted_at IS NULL);

    v_products_to_block := GREATEST(0, v_current_active_products - v_new_max_products);

    IF v_products_to_block > 0 THEN
      SELECT ARRAY_AGG(id)
      INTO v_blocked_product_ids
      FROM (
        SELECT id
        FROM products
        WHERE restaurant_id = NEW.restaurant_id
          AND status = 'active'
          AND (deleted_at IS NULL)
        ORDER BY created_at ASC
        LIMIT v_products_to_block
      ) subquery;

      -- Block products (set blocked flag, archive them, and make unavailable)
      UPDATE products
      SET 
        blocked_by_plan_limit = true,
        status = 'archived',
        is_available = false,
        updated_at = NOW()
      WHERE id = ANY(v_blocked_product_ids);

      RAISE NOTICE 'Blocked and archived % oldest products for restaurant % due to plan downgrade',
        v_products_to_block, NEW.restaurant_id;
    END IF;
  END IF;

  -- Reset bypass flag
  PERFORM set_config('app.bypass_blocked_check', NULL, true);

  -- ========== LOG THE CHANGE ==========
  IF OLD.plan_name IS DISTINCT FROM NEW.plan_name 
    OR v_old_max_products != v_new_max_products 
    OR v_old_max_categories != v_new_max_categories THEN

    INSERT INTO plan_change_logs (
      restaurant_id,
      subscription_id,
      old_plan_name,
      new_plan_name,
      old_max_products,
      new_max_products,
      old_max_categories,
      new_max_categories,
      products_archived,
      categories_deactivated,
      affected_product_ids,
      affected_category_ids,
      change_reason
    ) VALUES (
      NEW.restaurant_id,
      NEW.id,
      v_old_plan_name,
      NEW.plan_name,
      v_old_max_products,
      v_new_max_products,
      v_old_max_categories,
      v_new_max_categories,
      v_products_to_block,
      v_categories_to_block,
      v_blocked_product_ids,
      v_blocked_category_ids,
      CASE 
        WHEN v_new_max_products < v_old_max_products OR v_new_max_categories < v_old_max_categories 
        THEN 'Plan downgrade - blocked oldest items'
        ELSE 'Plan upgrade - items unblocked'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION prevent_blocked_category_updates() IS 
  'Prevents any updates to categories that are blocked by plan limits. Only deletion is allowed.';

COMMENT ON FUNCTION prevent_blocked_product_updates() IS 
  'Prevents any updates to products that are blocked by plan limits. Only deletion is allowed.';