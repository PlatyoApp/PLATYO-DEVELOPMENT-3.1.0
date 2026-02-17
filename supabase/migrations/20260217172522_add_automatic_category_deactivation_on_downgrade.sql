/*
  # Automatic Category Deactivation and Plan Change Logging on Downgrade

  ## Overview
  This migration adds automatic category deactivation when a restaurant downgrades their subscription plan,
  and creates a comprehensive logging system to track all plan changes and their effects.

  ## What it Does
  1. Creates plan_change_logs table to track all subscription changes
  2. Creates a function to handle automatic category deactivation when plan limits decrease
  3. Deactivates oldest categories first (by created_at) to stay within new plan limits
  4. Updates the subscription downgrade trigger to also handle categories and log changes
  5. Ensures categories don't exceed the new plan's max_categories limit

  ## Key Features
  - Only deactivates when max_categories decreases (downgrade scenario)
  - Deactivates oldest categories first to preserve most recent additions
  - Only affects 'active' categories (is_active = true)
  - Logs all changes to plan_change_logs for auditing and user notifications
  - Tracks which products and categories were affected

  ## Security
  - Functions use SECURITY DEFINER to bypass RLS for system operations
  - Sets search_path for security
  - Only system can trigger this via subscription updates
  - RLS policies allow users to view their own plan change logs
*/

-- Create plan_change_logs table
CREATE TABLE IF NOT EXISTS plan_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  old_plan_name text NOT NULL,
  new_plan_name text NOT NULL,
  old_max_products integer NOT NULL DEFAULT 0,
  new_max_products integer NOT NULL DEFAULT 0,
  old_max_categories integer NOT NULL DEFAULT 0,
  new_max_categories integer NOT NULL DEFAULT 0,
  products_archived integer NOT NULL DEFAULT 0,
  categories_deactivated integer NOT NULL DEFAULT 0,
  affected_product_ids uuid[] DEFAULT ARRAY[]::uuid[],
  affected_category_ids uuid[] DEFAULT ARRAY[]::uuid[],
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_plan_change_logs_restaurant_id ON plan_change_logs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_logs_created_at ON plan_change_logs(created_at DESC);

-- Enable RLS on plan_change_logs
ALTER TABLE plan_change_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own restaurant's plan change logs
CREATE POLICY "Users can view own restaurant plan change logs"
  ON plan_change_logs
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = auth.uid()
    )
  );

-- Policy: Superadmins can view all plan change logs
CREATE POLICY "Superadmins can view all plan change logs"
  ON plan_change_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'superadmin'
    )
  );

-- Drop the old trigger and function to replace with new comprehensive version
DROP TRIGGER IF EXISTS trigger_subscription_downgrade ON subscriptions;
DROP FUNCTION IF EXISTS handle_subscription_downgrade();

-- Create comprehensive function to handle both products and categories on downgrade
CREATE OR REPLACE FUNCTION handle_subscription_plan_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_max_products INTEGER;
  v_new_max_products INTEGER;
  v_old_max_categories INTEGER;
  v_new_max_categories INTEGER;
  v_current_active_products INTEGER;
  v_current_active_categories INTEGER;
  v_products_to_archive INTEGER := 0;
  v_categories_to_deactivate INTEGER := 0;
  v_archived_product_ids uuid[];
  v_deactivated_category_ids uuid[];
  v_old_plan_name TEXT;
BEGIN
  -- Get old plan information from subscription_plans
  SELECT plan_name INTO v_old_plan_name FROM subscriptions WHERE id = OLD.id;
  
  SELECT COALESCE(max_products, 0), COALESCE(max_categories, 0)
  INTO v_old_max_products, v_old_max_categories
  FROM subscription_plans
  WHERE name = v_old_plan_name
  LIMIT 1;
  
  -- Get new max limits from subscription_plans table
  SELECT 
    COALESCE(sp.max_products, 0),
    COALESCE(sp.max_categories, 0)
  INTO v_new_max_products, v_new_max_categories
  FROM subscription_plans sp
  WHERE sp.name = NEW.plan_name
  LIMIT 1;

  -- Initialize arrays
  v_archived_product_ids := ARRAY[]::uuid[];
  v_deactivated_category_ids := ARRAY[]::uuid[];

  -- ========== HANDLE PRODUCTS ==========
  IF v_new_max_products < v_old_max_products THEN
    -- Count current active products
    SELECT COUNT(*)
    INTO v_current_active_products
    FROM products
    WHERE restaurant_id = NEW.restaurant_id
      AND status = 'active';

    -- Calculate how many products need to be archived
    v_products_to_archive := GREATEST(0, v_current_active_products - v_new_max_products);

    -- Archive excess products if needed
    IF v_products_to_archive > 0 THEN
      -- Get IDs of products to archive
      SELECT ARRAY_AGG(id)
      INTO v_archived_product_ids
      FROM (
        SELECT id
        FROM products
        WHERE restaurant_id = NEW.restaurant_id
          AND status = 'active'
        ORDER BY created_at ASC
        LIMIT v_products_to_archive
      ) subquery;

      -- Archive the products
      UPDATE products
      SET status = 'archived',
          updated_at = NOW()
      WHERE id = ANY(v_archived_product_ids);

      RAISE NOTICE 'Archived % products for restaurant % due to plan downgrade',
        v_products_to_archive, NEW.restaurant_id;
    END IF;
  END IF;

  -- ========== HANDLE CATEGORIES ==========
  IF v_new_max_categories < v_old_max_categories THEN
    -- Count current active categories
    SELECT COUNT(*)
    INTO v_current_active_categories
    FROM categories
    WHERE restaurant_id = NEW.restaurant_id
      AND is_active = true;

    -- Calculate how many categories need to be deactivated
    v_categories_to_deactivate := GREATEST(0, v_current_active_categories - v_new_max_categories);

    -- Deactivate excess categories if needed
    IF v_categories_to_deactivate > 0 THEN
      -- Get IDs of categories to deactivate
      SELECT ARRAY_AGG(id)
      INTO v_deactivated_category_ids
      FROM (
        SELECT id
        FROM categories
        WHERE restaurant_id = NEW.restaurant_id
          AND is_active = true
        ORDER BY created_at ASC
        LIMIT v_categories_to_deactivate
      ) subquery;

      -- Deactivate the categories
      UPDATE categories
      SET is_active = false,
          updated_at = NOW()
      WHERE id = ANY(v_deactivated_category_ids);

      RAISE NOTICE 'Deactivated % categories for restaurant % due to plan downgrade',
        v_categories_to_deactivate, NEW.restaurant_id;
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
      v_products_to_archive,
      v_categories_to_deactivate,
      v_archived_product_ids,
      v_deactivated_category_ids,
      CASE 
        WHEN v_new_max_products < v_old_max_products OR v_new_max_categories < v_old_max_categories 
        THEN 'Plan downgrade with automatic archiving'
        ELSE 'Plan change or upgrade'
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on subscriptions table
CREATE TRIGGER trigger_subscription_plan_change
  AFTER UPDATE OF plan_name, max_products
  ON subscriptions
  FOR EACH ROW
  WHEN (
    OLD.plan_name IS DISTINCT FROM NEW.plan_name 
    OR OLD.max_products IS DISTINCT FROM NEW.max_products
  )
  EXECUTE FUNCTION handle_subscription_plan_change();

-- Add comments
COMMENT ON TABLE plan_change_logs IS 
  'Tracks all subscription plan changes and their effects on products and categories';

COMMENT ON FUNCTION handle_subscription_plan_change() IS 
  'Automatically archives excess products and deactivates excess categories when a restaurant changes plans. Logs all changes for auditing and notifications';
