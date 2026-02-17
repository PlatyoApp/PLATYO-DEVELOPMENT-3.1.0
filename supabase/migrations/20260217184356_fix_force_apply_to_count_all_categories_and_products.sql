/*
  # Fix force_apply_subscription_limits to Count ALL Items
  
  ## Problem
  The function only counts items with blocked_by_plan_limit = false,
  which causes it to block the wrong items when some are already inactive/archived.
  
  ## Solution
  Count ALL active/inactive items (including already blocked ones) to determine
  which ones should be blocked. Block the oldest items regardless of current state.
  
  ## Changes
  - Remove blocked_by_plan_limit filter from the CTE
  - Count all items to properly determine which oldest ones to block
*/

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

    -- First, unblock everything to recalculate from scratch
    UPDATE categories c
    SET blocked_by_plan_limit = false
    WHERE c.restaurant_id = v_subscription.rest_id;

    UPDATE products p
    SET blocked_by_plan_limit = false
    WHERE p.restaurant_id = v_subscription.rest_id;

    -- Block excess categories (keep NEWEST, block OLDEST)
    -- Count ALL active categories including those that were previously blocked
    WITH all_active_cats AS (
      SELECT id, created_at
      FROM categories
      WHERE categories.restaurant_id = v_subscription.rest_id
        AND is_active = true
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    ),
    to_block AS (
      SELECT id
      FROM all_active_cats
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
    -- Count ALL active products including those that were previously blocked
    WITH all_active_prods AS (
      SELECT id, created_at
      FROM products
      WHERE products.restaurant_id = v_subscription.rest_id
        AND status = 'active'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    ),
    to_block AS (
      SELECT id
      FROM all_active_prods
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

COMMENT ON FUNCTION force_apply_subscription_limits(uuid) IS 
  'Recalculates and applies subscription limits from scratch. Blocks oldest items that exceed limits. Use this to fix any inconsistent states.';
