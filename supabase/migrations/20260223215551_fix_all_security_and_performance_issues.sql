/*
  # Fix All Security and Performance Issues
  
  ## Issues Fixed
  1. Add missing foreign key index for plan_change_logs.subscription_id
  2. Fix all RLS policies to use (SELECT auth.uid()) instead of auth.uid()
  3. Drop duplicate indexes
  4. Remove unused indexes warnings by keeping essential ones
  
  ## Changes
  - Add index on plan_change_logs(subscription_id)
  - Optimize all RLS policies with SELECT wrapper
  - Drop duplicate indexes
*/

-- ========== 1. ADD MISSING FOREIGN KEY INDEX ==========
CREATE INDEX IF NOT EXISTS idx_plan_change_logs_subscription_id ON plan_change_logs(subscription_id);

-- ========== 2. DROP DUPLICATE INDEXES ==========
DROP INDEX IF EXISTS idx_customers_restaurant_id;
DROP INDEX IF EXISTS idx_product_categories_category_id;
DROP INDEX IF EXISTS idx_product_categories_product_id;
DROP INDEX IF EXISTS idx_support_tickets_restaurant_id;

-- ========== 3. FIX RLS POLICIES - RESTAURANTS ==========
DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON restaurants;
CREATE POLICY "Authenticated users can create restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Owners and superadmins can update restaurants" ON restaurants;
CREATE POLICY "Owners and superadmins can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 4. FIX RLS POLICIES - CATEGORIES ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own categories" ON categories;
CREATE POLICY "Restaurant owners can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 5. FIX RLS POLICIES - PRODUCTS ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own products" ON products;
CREATE POLICY "Restaurant owners can manage own products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 6. FIX RLS POLICIES - PRODUCT_CATEGORIES ==========
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
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 7. FIX RLS POLICIES - ORDERS ==========
DROP POLICY IF EXISTS "Restaurant owners can view own orders" ON orders;
CREATE POLICY "Restaurant owners can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can manage own orders" ON orders;
CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can delete own orders" ON orders;
CREATE POLICY "Restaurant owners can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 8. FIX RLS POLICIES - ORDER_ITEMS ==========
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
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
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
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 9. FIX RLS POLICIES - CUSTOMERS ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own customers" ON customers;
CREATE POLICY "Restaurant owners can manage own customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 10. FIX RLS POLICIES - SUPPORT_TICKETS ==========
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON support_tickets;
CREATE POLICY "Authenticated users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Superadmins can delete tickets" ON support_tickets;
CREATE POLICY "Superadmins can delete tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING ((SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin');

DROP POLICY IF EXISTS "Users can view relevant tickets" ON support_tickets;
CREATE POLICY "Users can view relevant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

DROP POLICY IF EXISTS "Users and superadmins can update tickets" ON support_tickets;
CREATE POLICY "Users and superadmins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin'
  );

-- ========== 11. FIX RLS POLICIES - USERS ==========
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

-- ========== 12. FIX RLS POLICIES - SUBSCRIPTIONS ==========
DROP POLICY IF EXISTS "Superadmins can view all subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING ((SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin');

DROP POLICY IF EXISTS "Superadmins can insert subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin');

DROP POLICY IF EXISTS "Superadmins can update subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING ((SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin');

DROP POLICY IF EXISTS "Superadmins can delete subscriptions" ON subscriptions;
CREATE POLICY "Superadmins can delete subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING ((SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin');

DROP POLICY IF EXISTS "Restaurant owners can view own subscription" ON subscriptions;
CREATE POLICY "Restaurant owners can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can update own subscription" ON subscriptions;
CREATE POLICY "Restaurant owners can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ========== 13. FIX RLS POLICIES - PLAN_CHANGE_LOGS ==========
DROP POLICY IF EXISTS "Users can view own restaurant plan change logs" ON plan_change_logs;
CREATE POLICY "Users can view own restaurant plan change logs"
  ON plan_change_logs FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT id FROM restaurants WHERE owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Superadmins can view all plan change logs" ON plan_change_logs;
CREATE POLICY "Superadmins can view all plan change logs"
  ON plan_change_logs FOR SELECT
  TO authenticated
  USING ((SELECT current_setting('request.jwt.claims', true)::json->>'role') = 'superadmin');
