/*
  # Fix Remaining Security Issues

  ## Description
  Addresses remaining security and performance warnings:

  ## 1. Remove Unused Indexes
  - Removes indexes that are not being utilized by queries
  - Keeps essential indexes for RLS policy performance
  - Reduces write operation overhead

  ## 2. Consolidate Multiple Permissive Policies
  - Combines multiple SELECT/UPDATE policies into single policies with OR logic
  - Improves policy clarity and maintainability
  - Reduces policy evaluation overhead

  ## 3. Fix Security Definer Views
  - Explicitly sets views to SECURITY INVOKER
  - Prevents privilege escalation risks

  ## 4. Fix Function Search Paths
  - Ensures all functions have immutable search paths
  - Prevents schema poisoning attacks

  ## Impact
  - Improved write performance from fewer indexes
  - Clearer security model with consolidated policies
  - Enhanced security posture
*/

-- ============================================================================
-- 1. REMOVE UNUSED INDEXES
-- ============================================================================

-- Note: Keeping indexes that will be used by RLS policies and common queries
-- Removing indexes that are truly redundant or not needed

-- Keep idx_restaurants_user_id (used by RLS policies)
-- Keep idx_categories_restaurant_id (used by RLS policies)
-- Keep idx_products_restaurant_id (used by RLS policies)
-- Keep idx_orders_restaurant_id (used by RLS policies)
-- Keep idx_subscriptions_restaurant_id (used by RLS policies)

-- Remove redundant or unused indexes
DROP INDEX IF EXISTS idx_customers_is_vip;
DROP INDEX IF EXISTS idx_product_categories_product_id;
DROP INDEX IF EXISTS idx_product_categories_category_id;
DROP INDEX IF EXISTS idx_product_categories_is_primary;
DROP INDEX IF EXISTS idx_product_categories_lookup;
DROP INDEX IF EXISTS idx_customers_restaurant_id;
DROP INDEX IF EXISTS idx_customers_phone;
DROP INDEX IF EXISTS idx_customers_email;
DROP INDEX IF EXISTS idx_support_tickets_restaurant_id;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_priority;
DROP INDEX IF EXISTS idx_support_tickets_created_at;

-- Create only essential indexes for customers (phone and email for lookups)
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_phone 
  ON customers(restaurant_id, phone) WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_restaurant_email 
  ON customers(restaurant_id, email) WHERE email IS NOT NULL;

-- Create essential index for support tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_status 
  ON support_tickets(restaurant_id, status);

-- Create essential index for product_categories
CREATE INDEX IF NOT EXISTS idx_product_categories_product 
  ON product_categories(product_id, is_primary);

-- ============================================================================
-- 2. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- USERS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;

CREATE POLICY "Users can read accessible data"
  ON users FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
      AND u.role = 'super_admin'
    )
  );

-- RESTAURANTS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Restaurant owners can read own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Super admins can read all restaurants" ON restaurants;

CREATE POLICY "Authenticated users can read accessible restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- SUBSCRIPTIONS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Restaurant owners can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can read all subscriptions" ON subscriptions;

CREATE POLICY "Authenticated users can read accessible subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- CUSTOMERS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Restaurant owners can view own customers" ON customers;
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;

CREATE POLICY "Authenticated users can view accessible customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- SUPPORT_TICKETS TABLE: Consolidate SELECT policies
DROP POLICY IF EXISTS "Restaurant owners can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON support_tickets;

CREATE POLICY "Authenticated users can view accessible tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- SUPPORT_TICKETS TABLE: Consolidate UPDATE policies
DROP POLICY IF EXISTS "Restaurant owners can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update all tickets" ON support_tickets;

CREATE POLICY "Authenticated users can update accessible tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    (
      EXISTS (
        SELECT 1 FROM restaurants
        WHERE restaurants.id = support_tickets.restaurant_id
        AND restaurants.user_id = (select auth.uid())
      )
      AND status = 'pending'
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 3. FIX SECURITY DEFINER VIEWS
-- ============================================================================

DROP VIEW IF EXISTS product_categories_detail CASCADE;
DROP VIEW IF EXISTS subscriptions_with_status CASCADE;
DROP VIEW IF EXISTS active_subscriptions CASCADE;

-- Create views with SECURITY INVOKER (explicit, though it's the default)
CREATE VIEW product_categories_detail 
WITH (security_invoker = true) AS
SELECT 
  pc.id,
  pc.product_id,
  pc.category_id,
  pc.is_primary,
  p.name AS product_name,
  c.name AS category_name,
  c.restaurant_id
FROM product_categories pc
JOIN products p ON p.id = pc.product_id
JOIN categories c ON c.id = pc.category_id;

CREATE VIEW subscriptions_with_status 
WITH (security_invoker = true) AS
SELECT 
  s.*,
  r.name AS restaurant_name,
  CASE 
    WHEN s.end_date < now() THEN 'expired'
    WHEN s.status = 'active' THEN 'active'
    ELSE s.status
  END AS computed_status
FROM subscriptions s
JOIN restaurants r ON r.id = s.restaurant_id;

CREATE VIEW active_subscriptions 
WITH (security_invoker = true) AS
SELECT *
FROM subscriptions
WHERE status = 'active' AND end_date > now();

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATH
-- ============================================================================

-- Recreate get_subscription_status with proper search_path
DROP FUNCTION IF EXISTS get_subscription_status(uuid) CASCADE;
CREATE OR REPLACE FUNCTION get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
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