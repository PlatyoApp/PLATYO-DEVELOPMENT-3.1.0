/*
  # Fix Remaining RLS Performance Issues
  
  ## Issues Fixed
  1. Wrap current_setting() calls with SELECT to prevent re-evaluation per row
  2. This affects all policies checking for superadmin role
  
  ## Performance Impact
  - Eliminates per-row function calls
  - Improves query performance at scale
  - Maintains same security guarantees
*/

-- ========== FIX RESTAURANTS POLICIES ==========
DROP POLICY IF EXISTS "Owners and superadmins can update restaurants" ON restaurants;
CREATE POLICY "Owners and superadmins can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX CATEGORIES POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own categories" ON categories;
CREATE POLICY "Restaurant owners can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX PRODUCTS POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own products" ON products;
CREATE POLICY "Restaurant owners can manage own products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX PRODUCT_CATEGORIES POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can manage product categories" ON product_categories;
CREATE POLICY "Restaurant owners can manage product categories"
  ON product_categories
  FOR ALL
  TO authenticated
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN restaurants r ON r.id = p.restaurant_id
      WHERE r.owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX ORDERS POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can view own orders" ON orders;
CREATE POLICY "Restaurant owners can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can manage own orders" ON orders;
CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can delete own orders" ON orders;
CREATE POLICY "Restaurant owners can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX ORDER_ITEMS POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can view own order items" ON order_items;
CREATE POLICY "Restaurant owners can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE r.owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can manage own order items" ON order_items;
CREATE POLICY "Restaurant owners can manage own order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (
    order_id IN (
      SELECT o.id FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      WHERE r.owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX CUSTOMERS POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own customers" ON customers;
CREATE POLICY "Restaurant owners can manage own customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX SUPPORT_TICKETS POLICIES ==========
DROP POLICY IF EXISTS "Superadmins can delete tickets" ON support_tickets;
CREATE POLICY "Superadmins can delete tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING ((SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin');

DROP POLICY IF EXISTS "Users can view relevant tickets" ON support_tickets;
CREATE POLICY "Users can view relevant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

DROP POLICY IF EXISTS "Users and superadmins can update tickets" ON support_tickets;
CREATE POLICY "Users and superadmins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- ========== FIX SUBSCRIPTIONS POLICIES ==========
DROP POLICY IF EXISTS "Superadmins can view all subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin');

DROP POLICY IF EXISTS "Superadmins can insert subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin');

DROP POLICY IF EXISTS "Superadmins can update subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING ((SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin');

DROP POLICY IF EXISTS "Superadmins can delete subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can delete subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING ((SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin');

-- ========== FIX PLAN_CHANGE_LOGS POLICIES ==========
DROP POLICY IF EXISTS "Superadmins can view all plan change logs" ON plan_change_logs;
CREATE POLICY "Superadmins can view all plan change logs"
  ON plan_change_logs FOR SELECT
  TO authenticated
  USING ((SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin');
