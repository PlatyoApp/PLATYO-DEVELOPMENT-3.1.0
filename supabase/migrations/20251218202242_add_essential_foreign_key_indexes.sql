/*
  # Add Essential Foreign Key Indexes

  ## Description
  Adds covering indexes for foreign keys to improve query performance and JOIN operations.

  ## 1. Foreign Key Indexes
  Foreign keys should have indexes for:
  - JOIN operations between tables
  - WHERE clause filtering by foreign key
  - RLS policy evaluation
  - Cascade delete operations

  ## 2. Remove Unused Index
  - Removes idx_product_categories_category_id as it's not being utilized

  ## 3. Fix Function Search Path
  - Re-fixes get_subscription_status function with proper search path

  ## Notes
  - Auth DB Connection Strategy still requires manual dashboard change
  - Navigate to: Project Settings > Database > Connection Pooling
  - Change from "Fixed" to "Percentage" mode
*/

-- ============================================================================
-- 1. ADD ESSENTIAL FOREIGN KEY INDEXES
-- ============================================================================

-- Index for categories.restaurant_id (used in JOINs and RLS policies)
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id 
  ON categories(restaurant_id);

-- Index for orders.restaurant_id (used in JOINs and filtering orders by restaurant)
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id 
  ON orders(restaurant_id);

-- Index for products.category_id (used in JOINs with categories)
CREATE INDEX IF NOT EXISTS idx_products_category_id 
  ON products(category_id);

-- Index for products.restaurant_id (used in RLS policies and filtering)
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id 
  ON products(restaurant_id);

-- Index for restaurants.user_id (used in RLS policies to check ownership)
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id 
  ON restaurants(user_id);

-- Index for subscriptions.restaurant_id (used in JOINs and subscription queries)
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id 
  ON subscriptions(restaurant_id);

-- Index for support_tickets.restaurant_id (used in filtering tickets by restaurant)
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_id 
  ON support_tickets(restaurant_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEX
-- ============================================================================

-- Remove the unused product_categories index
DROP INDEX IF EXISTS idx_product_categories_category_id;

-- ============================================================================
-- 3. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Drop and recreate the function with proper search_path
DROP FUNCTION IF EXISTS public.get_subscription_status(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
-- Set search_path to public schema explicitly
SET search_path = 'public'
AS $$
DECLARE
  sub_status text;
  sub_end_date timestamptz;
  sub_auto_renew boolean;
BEGIN
  SELECT status, end_date, auto_renew
  INTO sub_status, sub_end_date, sub_auto_renew
  FROM subscriptions
  WHERE id = subscription_id;
  
  IF sub_status = 'active' AND sub_end_date < now() AND sub_auto_renew = false THEN
    RETURN 'expired';
  END IF;
  
  RETURN sub_status;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO anon;

-- Add comment documenting the function
COMMENT ON FUNCTION public.get_subscription_status(uuid) IS 
  'Returns the current status of a subscription, checking for expiry if auto_renew is disabled. Uses immutable search_path for security.';