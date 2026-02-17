/*
  # Fix Subscription Update and Product/Category Blocking

  ## Overview
  This migration fixes two issues:
  1. Subscription update failing due to incorrect plan_change_logs insertion
  2. Products and categories not being properly blocked on downgrade

  ## Changes Made
  
  1. **Remove conflicting trigger**
     - Drop `trigger_handle_subscription_limit_change` which conflicts with existing trigger
     
  2. **Update existing trigger function**
     - Fix `handle_subscription_plan_change` to use blocked_by_plan_limit fields
     - Fix bug where old_plan_name was incorrectly retrieved
     - Update to block items instead of just archiving/deactivating
     
  ## Behavior
  
  - When downgrading, products and categories exceeding limits are:
    * Marked with `blocked_by_plan_limit = true`
    * Set to inactive/unavailable status
    * Cannot be activated until deleted or plan upgraded
    
  - When upgrading:
    * All blocked_by_plan_limit flags are cleared
    * Items remain inactive but can be manually activated
*/

-- Drop the conflicting trigger
DROP TRIGGER IF EXISTS trigger_handle_subscription_limit_change ON subscriptions;
DROP FUNCTION IF EXISTS handle_subscription_limit_change();

-- Update the existing function to use blocked_by_plan_limit
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
  -- Get old plan name from OLD record (not from a query)
  v_old_plan_name := OLD.plan_name;

  -- Get old max limits from current subscription values
  v_old_max_products := OLD.max_products;
  v_old_max_categories := OLD.max_categories;

  -- Get new max limits from NEW record
  v_new_max_products := NEW.max_products;
  v_new_max_categories := NEW.max_categories;

  -- Initialize arrays
  v_blocked_product_ids := ARRAY[]::uuid[];
  v_blocked_category_ids := ARRAY[]::uuid[];

  -- First, unblock everything (in case of upgrade)
  UPDATE products
  SET blocked_by_plan_limit = false
  WHERE restaurant_id = NEW.restaurant_id
    AND blocked_by_plan_limit = true;

  UPDATE categories
  SET blocked_by_plan_limit = false
  WHERE restaurant_id = NEW.restaurant_id
    AND blocked_by_plan_limit = true;

  -- ========== HANDLE PRODUCTS ==========
  IF v_new_max_products < v_old_max_products THEN
    -- Count current available products (not deleted)
    SELECT COUNT(*)
    INTO v_current_active_products
    FROM products
    WHERE restaurant_id = NEW.restaurant_id
      AND is_available = true
      AND (deleted_at IS NULL);

    -- Calculate how many products need to be blocked
    v_products_to_block := GREATEST(0, v_current_active_products - v_new_max_products);

    -- Block excess products if needed (newest first)
    IF v_products_to_block > 0 THEN
      -- Get IDs of products to block (newest first)
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

      -- Block the products
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

  -- ========== HANDLE CATEGORIES ==========
  IF v_new_max_categories < v_old_max_categories THEN
    -- Count current active categories (not deleted)
    SELECT COUNT(*)
    INTO v_current_active_categories
    FROM categories
    WHERE restaurant_id = NEW.restaurant_id
      AND is_active = true
      AND (deleted_at IS NULL);

    -- Calculate how many categories need to be blocked
    v_categories_to_block := GREATEST(0, v_current_active_categories - v_new_max_categories);

    -- Block excess categories if needed (newest first)
    IF v_categories_to_block > 0 THEN
      -- Get IDs of categories to block (newest first)
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

      -- Block the categories
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

  -- ========== LOG THE CHANGE ==========
  -- Only log if there was actually a change in plan or limits
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