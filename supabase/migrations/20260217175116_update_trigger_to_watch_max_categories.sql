/*
  # Update Subscription Plan Change Trigger

  ## Overview
  This migration updates the trigger to also watch for changes in max_categories.

  ## Changes Made
  
  1. **Update trigger definition**
     - Add max_categories to the list of watched columns
     - Ensure trigger fires when max_categories changes
*/

-- Drop and recreate the trigger to watch max_categories too
DROP TRIGGER IF EXISTS trigger_subscription_plan_change ON subscriptions;

CREATE TRIGGER trigger_subscription_plan_change
  AFTER UPDATE OF plan_name, max_products, max_categories ON subscriptions
  FOR EACH ROW
  WHEN (
    OLD.plan_name IS DISTINCT FROM NEW.plan_name 
    OR OLD.max_products IS DISTINCT FROM NEW.max_products
    OR OLD.max_categories IS DISTINCT FROM NEW.max_categories
  )
  EXECUTE FUNCTION handle_subscription_plan_change();