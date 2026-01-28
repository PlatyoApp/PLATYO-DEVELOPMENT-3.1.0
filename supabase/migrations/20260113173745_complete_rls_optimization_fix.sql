/*
  # Complete RLS Optimization Fix

  1. Performance Optimization:
    - Wrap ALL auth.uid() and auth.jwt() calls with (SELECT ...), including in subqueries
    - This prevents re-evaluation of auth functions for each row

  2. Tables fixed:
    - All tables with RLS policies using auth functions
*/

-- ============================================================================
-- RESTAURANTS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can create restaurants" ON restaurants;
DROP POLICY IF EXISTS "Owners and superadmins can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can delete restaurants" ON restaurants;

CREATE POLICY "Authenticated users can create restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin'
  );

CREATE POLICY "Owners and superadmins can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (
    owner_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin'
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin'
  );

CREATE POLICY "Superadmins can delete restaurants"
  ON restaurants FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'superadmin');

-- ============================================================================
-- CATEGORIES TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own categories" ON categories;

CREATE POLICY "Restaurant owners can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- PRODUCTS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own products" ON products;

CREATE POLICY "Restaurant owners can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- PRODUCT_CATEGORIES TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage product categories" ON product_categories;

CREATE POLICY "Restaurant owners can manage product categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN restaurants ON restaurants.id = products.restaurant_id
      WHERE products.id = product_categories.product_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN restaurants ON restaurants.id = products.restaurant_id
      WHERE products.id = product_categories.product_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- ORDERS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can view own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can manage own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can delete own orders" ON orders;

CREATE POLICY "Restaurant owners can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

CREATE POLICY "Restaurant owners can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- ORDER_ITEMS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can view own order items" ON order_items;
DROP POLICY IF EXISTS "Restaurant owners can manage own order items" ON order_items;

CREATE POLICY "Restaurant owners can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

CREATE POLICY "Restaurant owners can manage own order items"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- CUSTOMERS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own customers" ON customers;

CREATE POLICY "Restaurant owners can manage own customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- SUPPORT_TICKETS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Users can view relevant tickets" ON support_tickets;
DROP POLICY IF EXISTS "Authenticated users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users and superadmins can update tickets" ON support_tickets;

CREATE POLICY "Users can view relevant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin' OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Authenticated users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin'
  );

CREATE POLICY "Users and superadmins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin' OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    (SELECT auth.jwt()->>'role') = 'superadmin' OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Restaurant owners can manage subscriptions" ON subscriptions;

CREATE POLICY "Restaurant owners can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

CREATE POLICY "Restaurant owners can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        (SELECT auth.jwt()->>'role') = 'superadmin'
      )
    )
  );

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE - Complete Optimization
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can manage plans" ON subscription_plans;

CREATE POLICY "Superadmins can manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'superadmin')
  WITH CHECK ((SELECT auth.jwt()->>'role') = 'superadmin');
