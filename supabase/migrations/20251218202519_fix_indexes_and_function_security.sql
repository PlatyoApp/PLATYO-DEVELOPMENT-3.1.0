/*
  # Fix Indexes and Function Security

  ## Description
  Removes unused indexes and adds only the needed index for product_categories.
  Fixes function search path security issue properly.

  ## 1. Remove Unused Indexes
  - Removes 7 indexes that are not being utilized by queries
  - Indexes consume storage and slow down INSERT/UPDATE operations

  ## 2. Add Needed Index
  - Adds index for product_categories.category_id foreign key

  ## 3. Fix Function Search Path Security
  - Properly secures get_subscription_status function with restricted search_path

  ## Notes
  - Auth DB Connection Strategy requires manual dashboard configuration
  - Navigate to: Project Settings > Database > Connection Pooling
  - Change from "Fixed" to "Percentage" mode
*/

-- ============================================================================
-- 1. REMOVE UNUSED INDEXES
-- ============================================================================

-- These indexes are not being used by the query planner
DROP INDEX IF EXISTS idx_categories_restaurant_id;
DROP INDEX IF EXISTS idx_orders_restaurant_id;
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_products_restaurant_id;
DROP INDEX IF EXISTS idx_restaurants_user_id;
DROP INDEX IF EXISTS idx_subscriptions_restaurant_id;
DROP INDEX IF EXISTS idx_support_tickets_restaurant_id;

-- ============================================================================
-- 2. ADD NEEDED INDEX FOR PRODUCT_CATEGORIES
-- ============================================================================

-- Index for product_categories.category_id (used for joins and lookups)
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id_v2
  ON product_categories(category_id);

-- ============================================================================
-- 3. FIX FUNCTION SEARCH PATH SECURITY
-- ============================================================================

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_subscription_status(uuid) CASCADE;

-- Recreate with proper search_path security
-- Using empty search_path and fully qualified names is the most secure approach
CREATE OR REPLACE FUNCTION public.get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  sub_status text;
  sub_end_date timestamptz;
  sub_auto_renew boolean;
BEGIN
  -- Use fully qualified table name
  SELECT status, end_date, auto_renew
  INTO sub_status, sub_end_date, sub_auto_renew
  FROM public.subscriptions
  WHERE id = subscription_id;
  
  -- Use fully qualified function name for now()
  IF sub_status = 'active' AND sub_end_date < now() AND sub_auto_renew = false THEN
    RETURN 'expired';
  END IF;
  
  RETURN sub_status;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO anon;

-- Add documentation comment
COMMENT ON FUNCTION public.get_subscription_status(uuid) IS 
  'Returns subscription status with expiry check. Uses empty search_path with fully qualified names for security.';