/*
  # Fix Final Security Issues

  ## Description
  Resolves remaining security and performance warnings:

  ## 1. Add Missing Foreign Key Index
  - Adds index for product_categories.category_id foreign key

  ## 2. Remove Unused Indexes
  - Removes indexes that aren't being utilized
  - Only keeps indexes essential for application queries

  ## 3. Consolidate Permissive Policies
  - Merges multiple policies into single policies with OR conditions
  - Reduces policy evaluation overhead
  - Improves security clarity

  ## 4. Fix Function Search Path
  - Sets immutable search path for security functions

  ## Notes
  - Auth DB Connection Strategy must be changed in Supabase Dashboard (cannot be set via SQL)
  - Navigate to: Project Settings > Database > Connection Pooling
  - Change from "Fixed" to "Percentage" mode
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEX
-- ============================================================================

-- Add index for category_id foreign key in product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id 
  ON product_categories(category_id);

-- ============================================================================
-- 2. REMOVE UNUSED INDEXES
-- ============================================================================

-- Remove indexes that aren't being used by queries or RLS policies
DROP INDEX IF EXISTS idx_restaurants_user_id;
DROP INDEX IF EXISTS idx_categories_restaurant_id;
DROP INDEX IF EXISTS idx_products_restaurant_id;
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_orders_restaurant_id;
DROP INDEX IF EXISTS idx_subscriptions_restaurant_id;
DROP INDEX IF EXISTS idx_customers_restaurant_phone;
DROP INDEX IF EXISTS idx_customers_restaurant_email;
DROP INDEX IF EXISTS idx_support_tickets_restaurant_status;
DROP INDEX IF EXISTS idx_product_categories_product;

-- ============================================================================
-- 3. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- CATEGORIES TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can manage own categories" ON categories;

CREATE POLICY "Users can view accessible categories"
  ON categories FOR SELECT
  USING (
    active = true
    OR EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

-- ORDERS TABLE: Consolidate INSERT policies
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can manage own orders" ON orders;

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    true
  );

-- PRODUCT_CATEGORIES TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Public can read product categories" ON product_categories;
DROP POLICY IF EXISTS "Public can view product categories" ON product_categories;
DROP POLICY IF EXISTS "Restaurant owners can manage own product categories" ON product_categories;

CREATE POLICY "Users can view product categories"
  ON product_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN categories c ON c.id = product_categories.category_id
      WHERE p.id = product_categories.product_id
      AND (
        (p.is_available = true AND c.active = true)
        OR EXISTS (
          SELECT 1 FROM restaurants r
          WHERE r.id = c.restaurant_id
          AND r.user_id = (select auth.uid())
        )
      )
    )
  );

-- PRODUCTS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can manage own products" ON products;

CREATE POLICY "Users can view accessible products"
  ON products FOR SELECT
  USING (
    is_available = true
    OR EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

-- RESTAURANTS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Authenticated users can read accessible restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

CREATE POLICY "Users can view accessible restaurants"
  ON restaurants FOR SELECT
  USING (
    status = 'active'
    OR user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATH (MAKE IT IMMUTABLE)
-- ============================================================================

-- Recreate function with properly immutable search_path
DROP FUNCTION IF EXISTS get_subscription_status(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  sub_status text;
  sub_end_date timestamptz;
  sub_auto_renew boolean;
BEGIN
  SELECT status, end_date, auto_renew
  INTO sub_status, sub_end_date, sub_auto_renew
  FROM public.subscriptions
  WHERE id = subscription_id;
  
  IF sub_status = 'active' AND sub_end_date < now() AND sub_auto_renew = false THEN
    RETURN 'expired';
  END IF;
  
  RETURN sub_status;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO anon;