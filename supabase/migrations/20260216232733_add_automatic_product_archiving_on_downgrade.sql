/*
  # Automatic Product Archiving on Plan Downgrade

  ## Overview
  This migration adds automatic product archiving when a restaurant downgrades their subscription plan.

  ## What it Does
  1. Creates a function to handle automatic product archiving when plan limits decrease
  2. Archives oldest products first (by created_at) to stay within new plan limits
  3. Creates a trigger that runs whenever a subscription is updated
  4. Ensures products don't exceed the new plan's max_products limit

  ## Key Features
  - Only archives when max_products decreases (downgrade scenario)
  - Archives oldest products first to preserve most recent additions
  - Only affects 'active' products
  - Provides logging for tracking which products were archived

  ## Security
  - Function uses SECURITY DEFINER to bypass RLS for system operations
  - Sets search_path for security
  - Only system can trigger this via subscription updates
*/

-- Create function to archive excess products on plan downgrade
CREATE OR REPLACE FUNCTION handle_subscription_downgrade()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_max_products INTEGER;
  v_new_max_products INTEGER;
  v_current_active_count INTEGER;
  v_products_to_archive INTEGER;
BEGIN
  -- Get the old max_products from the OLD record
  SELECT COALESCE(max_products, 0) INTO v_old_max_products FROM subscriptions WHERE id = OLD.id;
  
  -- Get new max_products from the subscription_plans table
  SELECT COALESCE(sp.max_products, NEW.max_products, 0)
  INTO v_new_max_products
  FROM subscription_plans sp
  WHERE sp.name = NEW.plan_name
  LIMIT 1;

  -- If max_products hasn't decreased, no need to archive
  IF v_new_max_products >= v_old_max_products THEN
    RETURN NEW;
  END IF;

  -- Count current active products for this restaurant
  SELECT COUNT(*)
  INTO v_current_active_count
  FROM products
  WHERE restaurant_id = NEW.restaurant_id
    AND status = 'active';

  -- Calculate how many products need to be archived
  v_products_to_archive := v_current_active_count - v_new_max_products;

  -- If we need to archive products
  IF v_products_to_archive > 0 THEN
    -- Archive the oldest products (by created_at)
    UPDATE products
    SET status = 'archived',
        updated_at = NOW()
    WHERE id IN (
      SELECT id
      FROM products
      WHERE restaurant_id = NEW.restaurant_id
        AND status = 'active'
      ORDER BY created_at ASC
      LIMIT v_products_to_archive
    );

    RAISE NOTICE 'Archived % products for restaurant % due to plan downgrade from % to % products',
      v_products_to_archive, NEW.restaurant_id, v_old_max_products, v_new_max_products;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on subscriptions table
DROP TRIGGER IF EXISTS trigger_subscription_downgrade ON subscriptions;

CREATE TRIGGER trigger_subscription_downgrade
  AFTER UPDATE OF plan_name, max_products
  ON subscriptions
  FOR EACH ROW
  WHEN (OLD.plan_name IS DISTINCT FROM NEW.plan_name OR OLD.max_products IS DISTINCT FROM NEW.max_products)
  EXECUTE FUNCTION handle_subscription_downgrade();

-- Add comment
COMMENT ON FUNCTION handle_subscription_downgrade() IS 
  'Automatically archives excess products when a restaurant downgrades to a plan with fewer product slots';
