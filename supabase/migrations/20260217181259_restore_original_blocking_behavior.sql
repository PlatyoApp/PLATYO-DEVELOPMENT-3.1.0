/*
  # Restore Original Blocking Behavior
  
  ## Overview
  This migration restores the original blocking behavior that was working correctly.
  
  ## Changes Made
  
  1. **Categories Blocking**
     - Sets `blocked_by_plan_limit = true`
     - Sets `is_active = false`
     - Does NOT modify any other fields
     
  2. **Products Blocking**
     - Sets `blocked_by_plan_limit = true`
     - Sets `is_available = false`
     - Does NOT change status to 'archived'
     - Keeps status as 'active' so products remain in inventory
     
  3. **Unblocking Behavior**
     - When upgrading, items are unblocked
     - `blocked_by_plan_limit` set to false
     - Items remain inactive but can now be manually activated
     
  ## Key Principles
  - Blocking is temporary and reversible
  - Blocked items are just hidden from the public menu
  - No permanent changes like archiving
  - User can reactivate items after upgrading plan
*/

-- Drop existing triggers and functions to replace them
DROP TRIGGER IF EXISTS trigger_subscription_plan_change ON subscriptions;
DROP TRIGGER IF EXISTS trigger_handle_subscription_limit_change ON subscriptions;
DROP FUNCTION IF EXISTS handle_subscription_plan_change() CASCADE;
DROP FUNCTION IF EXISTS handle_subscription_limit_change() CASCADE;

-- Create the correct blocking function
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
        ORDER BY created_at DESC
        LIMIT v_categories_to_block
      ) subquery;

      -- Block categories (set blocked flag and deactivate)
      UPDATE categories
      SET 
        blocked_by_plan_limit = true,
        is_active = false,
        updated_at = NOW()
      WHERE id = ANY(v_blocked_category_ids);

      RAISE NOTICE 'Blocked % categories for restaurant % due to plan downgrade',
        v_categories_to_block, NEW.restaurant_id;
    END IF;
  END IF;

  -- ========== HANDLE PRODUCTS ==========
  IF v_new_max_products < v_old_max_products THEN
    -- Count current available products (not deleted, by is_available not status)
    SELECT COUNT(*)
    INTO v_current_active_products
    FROM products
    WHERE restaurant_id = NEW.restaurant_id
      AND is_available = true
      AND (deleted_at IS NULL);

    v_products_to_block := GREATEST(0, v_current_active_products - v_new_max_products);

    IF v_products_to_block > 0 THEN
      SELECT ARRAY_AGG(id)
      INTO v_blocked_product_ids
      FROM (
        SELECT id
        FROM products
        WHERE restaurant_id = NEW.restaurant_id
          AND is_available = true
          AND (deleted_at IS NULL)
        ORDER BY created_at DESC
        LIMIT v_products_to_block
      ) subquery;

      -- Block products (set blocked flag and make unavailable, but DON'T change status)
      UPDATE products
      SET 
        blocked_by_plan_limit = true,
        is_available = false,
        updated_at = NOW()
      WHERE id = ANY(v_blocked_product_ids);

      RAISE NOTICE 'Blocked % products for restaurant % due to plan downgrade',
        v_products_to_block, NEW.restaurant_id;
    END IF;
  END IF;

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
        THEN 'Plan downgrade with automatic blocking'
        ELSE 'Plan change or upgrade'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger that watches for changes in plan_name, max_products, or max_categories
CREATE TRIGGER trigger_subscription_plan_change
  AFTER UPDATE OF plan_name, max_products, max_categories
  ON subscriptions
  FOR EACH ROW
  WHEN (
    OLD.plan_name IS DISTINCT FROM NEW.plan_name 
    OR OLD.max_products IS DISTINCT FROM NEW.max_products
    OR OLD.max_categories IS DISTINCT FROM NEW.max_categories
  )
  EXECUTE FUNCTION handle_subscription_plan_change();

-- Update the manual force function to use the same logic
CREATE OR REPLACE FUNCTION force_apply_subscription_limits(p_restaurant_id uuid DEFAULT NULL)
RETURNS TABLE (
  rest_id uuid,
  restaurant_name text,
  categories_blocked integer,
  products_blocked integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_subscription RECORD;
  v_categories_blocked INTEGER;
  v_products_blocked INTEGER;
BEGIN
  FOR v_subscription IN 
    SELECT 
      s.id as subscription_id,
      s.restaurant_id as rest_id,
      r.name as rest_name,
      s.plan_name,
      s.max_products,
      s.max_categories
    FROM subscriptions s
    JOIN restaurants r ON r.id = s.restaurant_id
    WHERE s.status = 'active'
    AND (p_restaurant_id IS NULL OR s.restaurant_id = p_restaurant_id)
  LOOP
    v_categories_blocked := 0;
    v_products_blocked := 0;

    -- Unblock everything for this restaurant
    UPDATE categories c
    SET blocked_by_plan_limit = false
    WHERE c.restaurant_id = v_subscription.rest_id
      AND c.blocked_by_plan_limit = true;

    UPDATE products p
    SET blocked_by_plan_limit = false
    WHERE p.restaurant_id = v_subscription.rest_id
      AND p.blocked_by_plan_limit = true;

    -- Block excess categories
    WITH active_cats AS (
      SELECT id, created_at
      FROM categories
      WHERE categories.restaurant_id = v_subscription.rest_id
        AND is_active = true
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    ),
    to_block AS (
      SELECT id
      FROM active_cats
      OFFSET v_subscription.max_categories
    )
    UPDATE categories
    SET 
      blocked_by_plan_limit = true,
      is_active = false,
      updated_at = NOW()
    WHERE id IN (SELECT id FROM to_block);

    GET DIAGNOSTICS v_categories_blocked = ROW_COUNT;

    -- Block excess products (by is_available, don't change status)
    WITH active_prods AS (
      SELECT id, created_at
      FROM products
      WHERE products.restaurant_id = v_subscription.rest_id
        AND is_available = true
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    ),
    to_block AS (
      SELECT id
      FROM active_prods
      OFFSET v_subscription.max_products
    )
    UPDATE products
    SET 
      blocked_by_plan_limit = true,
      is_available = false,
      updated_at = NOW()
    WHERE id IN (SELECT id FROM to_block);

    GET DIAGNOSTICS v_products_blocked = ROW_COUNT;

    RETURN QUERY SELECT 
      v_subscription.rest_id,
      v_subscription.rest_name,
      v_categories_blocked,
      v_products_blocked;
  END LOOP;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION handle_subscription_plan_change() IS 
  'Automatically blocks excess categories and products when subscription plan changes. Blocked items are just made inactive/unavailable but keep their status for easy restoration on upgrade.';

COMMENT ON FUNCTION force_apply_subscription_limits(uuid) IS 
  'Manually applies subscription limits to all restaurants or a specific restaurant. Blocks excess items without archiving them.';