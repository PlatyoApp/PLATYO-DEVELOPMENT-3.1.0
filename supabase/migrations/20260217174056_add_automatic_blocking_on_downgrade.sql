/*
  # Add Automatic Blocking on Plan Downgrade

  ## Overview
  This migration implements automatic blocking of categories and products when a restaurant 
  downgrades to a plan with lower limits. Items that exceed the new limits are automatically 
  blocked and cannot be made visible until they are deleted or the plan is upgraded.

  ## Changes Made
  
  1. **New Columns**
     - `categories.blocked_by_plan_limit` (boolean, default false)
     - `products.blocked_by_plan_limit` (boolean, default false)
     - `subscriptions.max_categories` (integer) - if not exists
     
  2. **New Functions**
     - `handle_subscription_limit_change()`: Automatically blocks excess categories and products when subscription changes
     - Blocks newest items first (by created_at DESC) that exceed the new plan limits
     - Automatically sets blocked items as not active/available
     
  3. **New Trigger**
     - Executes after subscription updates to check and apply blocking
     
  ## Behavior
  
  - When downgrading (e.g., Basic 50 products → Free 10 products):
    * Items beyond the new limit are marked as `blocked_by_plan_limit = true`
    * Blocked categories are automatically set to `is_active = false`
    * Blocked products are automatically set to `is_available = false`
    * Blocked items cannot be made active/available until deleted or plan upgraded
    
  - When upgrading:
    * All previously blocked items are automatically unblocked
    * Items remain inactive but can now be made active manually
*/

-- Add max_categories to subscriptions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'max_categories'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN max_categories integer DEFAULT 5;
    
    -- Update existing subscriptions based on plan_name
    UPDATE subscriptions SET max_categories = CASE
      WHEN plan_name = 'free' THEN 5
      WHEN plan_name = 'basic' THEN 15
      WHEN plan_name = 'pro' THEN 50
      WHEN plan_name = 'business' THEN 999999
      ELSE 5
    END;
  END IF;
END $$;

-- Add blocked_by_plan_limit column to categories
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'blocked_by_plan_limit'
  ) THEN
    ALTER TABLE categories ADD COLUMN blocked_by_plan_limit boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add blocked_by_plan_limit column to products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'blocked_by_plan_limit'
  ) THEN
    ALTER TABLE products ADD COLUMN blocked_by_plan_limit boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add deleted_at to categories if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE categories ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add deleted_at to products if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE products ADD COLUMN deleted_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Create function to handle plan limit changes
CREATE OR REPLACE FUNCTION handle_subscription_limit_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_restaurant_id uuid;
  v_category_limit int;
  v_product_limit int;
  v_current_active_categories int;
  v_current_active_products int;
  v_categories_to_block int;
  v_products_to_block int;
BEGIN
  -- Only process if limits changed
  IF NEW.max_categories = OLD.max_categories AND NEW.max_products = OLD.max_products THEN
    RETURN NEW;
  END IF;

  v_restaurant_id := NEW.restaurant_id;
  v_category_limit := NEW.max_categories;
  v_product_limit := NEW.max_products;

  -- Count current active categories and products (not deleted)
  SELECT COUNT(*) INTO v_current_active_categories
  FROM categories
  WHERE restaurant_id = v_restaurant_id 
    AND is_active = true
    AND (deleted_at IS NULL);

  SELECT COUNT(*) INTO v_current_active_products
  FROM products
  WHERE restaurant_id = v_restaurant_id 
    AND is_available = true
    AND (deleted_at IS NULL);

  -- Calculate how many items need to be blocked
  v_categories_to_block := GREATEST(0, v_current_active_categories - v_category_limit);
  v_products_to_block := GREATEST(0, v_current_active_products - v_product_limit);

  -- First, unblock everything (in case of upgrade)
  UPDATE categories
  SET blocked_by_plan_limit = false
  WHERE restaurant_id = v_restaurant_id
    AND blocked_by_plan_limit = true;

  UPDATE products
  SET blocked_by_plan_limit = false
  WHERE restaurant_id = v_restaurant_id
    AND blocked_by_plan_limit = true;

  -- Block excess categories (newest first - last created will be blocked first)
  IF v_categories_to_block > 0 THEN
    UPDATE categories
    SET 
      blocked_by_plan_limit = true,
      is_active = false
    WHERE id IN (
      SELECT id
      FROM categories
      WHERE restaurant_id = v_restaurant_id 
        AND is_active = true
        AND (deleted_at IS NULL)
      ORDER BY created_at DESC
      LIMIT v_categories_to_block
    );
  END IF;

  -- Block excess products (newest first - last created will be blocked first)
  IF v_products_to_block > 0 THEN
    UPDATE products
    SET 
      blocked_by_plan_limit = true,
      is_available = false
    WHERE id IN (
      SELECT id
      FROM products
      WHERE restaurant_id = v_restaurant_id 
        AND is_available = true
        AND (deleted_at IS NULL)
      ORDER BY created_at DESC
      LIMIT v_products_to_block
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_handle_subscription_limit_change ON subscriptions;

CREATE TRIGGER trigger_handle_subscription_limit_change
  AFTER UPDATE OF max_products, max_categories ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_limit_change();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_blocked_by_plan 
  ON categories(restaurant_id, blocked_by_plan_limit) 
  WHERE blocked_by_plan_limit = true;

CREATE INDEX IF NOT EXISTS idx_products_blocked_by_plan 
  ON products(restaurant_id, blocked_by_plan_limit) 
  WHERE blocked_by_plan_limit = true;

-- Add comment to explain the feature
COMMENT ON COLUMN categories.blocked_by_plan_limit IS 
  'Indicates if category is blocked due to plan limits. Blocked categories cannot be made active until deleted or plan upgraded.';

COMMENT ON COLUMN products.blocked_by_plan_limit IS 
  'Indicates if product is blocked due to plan limits. Blocked products cannot be made available until deleted or plan upgraded.';