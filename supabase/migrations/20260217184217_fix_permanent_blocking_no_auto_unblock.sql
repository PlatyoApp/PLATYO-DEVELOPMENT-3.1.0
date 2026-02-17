/*
  # Fix Permanent Blocking - No Auto-Unblock
  
  ## Problem
  The current trigger unblocks ALL items at the start of every subscription change,
  even when there's no upgrade. This removes the blocking when it should stay.
  
  ## Solution
  - Only unblock items when there's an ACTUAL UPGRADE (limits increase)
  - Keep items blocked permanently until upgrade or deletion
  - Block oldest items when limits decrease
  
  ## Changes
  1. Remove the automatic unblock at the start
  2. Only unblock if max_products or max_categories INCREASE
  3. Maintain blocked_by_plan_limit flag permanently otherwise
*/

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

  -- ========== ONLY UNBLOCK IF UPGRADE ==========
  -- Unblock categories if limit increased
  IF v_new_max_categories > v_old_max_categories THEN
    UPDATE categories
    SET blocked_by_plan_limit = false
    WHERE restaurant_id = NEW.restaurant_id
      AND blocked_by_plan_limit = true;
      
    RAISE NOTICE 'Unblocked categories for restaurant % due to plan upgrade', NEW.restaurant_id;
  END IF;

  -- Unblock products if limit increased
  IF v_new_max_products > v_old_max_products THEN
    UPDATE products
    SET blocked_by_plan_limit = false
    WHERE restaurant_id = NEW.restaurant_id
      AND blocked_by_plan_limit = true;
      
    RAISE NOTICE 'Unblocked products for restaurant % due to plan upgrade', NEW.restaurant_id;
  END IF;

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
        OFFSET v_new_max_categories
      ) subquery;

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
        ORDER BY created_at DESC
        OFFSET v_new_max_products
      ) subquery;

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
        WHEN v_new_max_products > v_old_max_products OR v_new_max_categories > v_old_max_categories
        THEN 'Plan upgrade - items unblocked'
        ELSE 'Plan change - no limit changes'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Also fix force_apply_subscription_limits to NOT unblock first
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

    -- Set bypass flag for system operations
    PERFORM set_config('app.bypass_blocked_check', 'true', true);

    -- DO NOT unblock - keep existing blocks

    -- Block excess categories (keep NEWEST, block OLDEST)
    WITH active_cats AS (
      SELECT id, created_at
      FROM categories
      WHERE categories.restaurant_id = v_subscription.rest_id
        AND is_active = true
        AND deleted_at IS NULL
        AND blocked_by_plan_limit = false
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

    -- Block excess products (keep NEWEST, block OLDEST)
    WITH active_prods AS (
      SELECT id, created_at
      FROM products
      WHERE products.restaurant_id = v_subscription.rest_id
        AND status = 'active'
        AND deleted_at IS NULL
        AND blocked_by_plan_limit = false
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
      status = 'archived',
      is_available = false,
      updated_at = NOW()
    WHERE id IN (SELECT id FROM to_block);

    GET DIAGNOSTICS v_products_blocked = ROW_COUNT;

    -- Reset bypass flag
    PERFORM set_config('app.bypass_blocked_check', NULL, true);

    RETURN QUERY SELECT 
      v_subscription.rest_id,
      v_subscription.rest_name,
      v_categories_blocked,
      v_products_blocked;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION handle_subscription_plan_change() IS 
  'Blocks oldest categories and products when downgrading. ONLY unblocks when upgrading. Keeps newest items active. Blocked items require deletion or plan upgrade.';

COMMENT ON FUNCTION force_apply_subscription_limits(uuid) IS 
  'Manually applies subscription limits without unblocking existing blocks. Blocks additional oldest items if needed. Blocked items stay blocked until upgrade or deletion.';
