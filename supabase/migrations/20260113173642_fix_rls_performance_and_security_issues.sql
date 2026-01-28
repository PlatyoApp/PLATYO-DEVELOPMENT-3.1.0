/*
  # Fix RLS Performance and Security Issues

  1. Performance Optimization:
    - Wrap all auth.uid() and auth.jwt() calls with (SELECT ...) to prevent re-evaluation per row
    - This dramatically improves query performance at scale

  2. Remove Duplicate Policies:
    - Consolidate multiple permissive policies into single, well-named policies
    - Remove redundant policies that provide the same access

  3. Fix Security Bypasses:
    - Remove "always true" policies that bypass security
    - Replace with proper public access policies where needed

  4. Tables affected:
    - users, restaurants, categories, products, product_categories
    - orders, order_items, customers, support_tickets
    - subscriptions, subscription_plans
*/

-- ============================================================================
-- USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can read profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can read profiles"
  ON users FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================================================
-- RESTAURANTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can create own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can insert any restaurant" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can update all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can delete restaurants" ON restaurants;

-- Public read access for all restaurants
CREATE POLICY "Anyone can view restaurants"
  ON restaurants FOR SELECT
  TO public
  USING (true);

-- Authenticated users can create restaurants
CREATE POLICY "Authenticated users can create restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = owner_id OR
    ((SELECT auth.jwt()->>'role') = 'superadmin')
  );

-- Restaurant owners and superadmins can update
CREATE POLICY "Owners and superadmins can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = owner_id OR
    ((SELECT auth.jwt()->>'role') = 'superadmin')
  )
  WITH CHECK (
    (SELECT auth.uid()) = owner_id OR
    ((SELECT auth.jwt()->>'role') = 'superadmin')
  );

-- Only superadmins can delete
CREATE POLICY "Superadmins can delete restaurants"
  ON restaurants FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'superadmin');

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active categories" ON categories;
DROP POLICY IF EXISTS "Public can view active restaurant categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can view own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can insert own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can update own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can delete own categories" ON categories;
DROP POLICY IF EXISTS "Superadmins can view all categories" ON categories;
DROP POLICY IF EXISTS "Superadmins can manage all categories" ON categories;

-- Public read access for active categories
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  TO public
  USING (is_active = true);

-- Restaurant owners can manage their categories
CREATE POLICY "Restaurant owners can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view available products" ON products;
DROP POLICY IF EXISTS "Public can view active restaurant products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can view own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can insert own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can update own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can delete own products" ON products;
DROP POLICY IF EXISTS "Superadmins can view all products" ON products;
DROP POLICY IF EXISTS "Superadmins can manage all products" ON products;

-- Public read access for available products
CREATE POLICY "Public can view available products"
  ON products FOR SELECT
  TO public
  USING (is_available = true);

-- Restaurant owners can manage their products
CREATE POLICY "Restaurant owners can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- PRODUCT_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view product categories" ON product_categories;
DROP POLICY IF EXISTS "Restaurant owners can view own product categories" ON product_categories;
DROP POLICY IF EXISTS "Restaurant owners can insert own product categories" ON product_categories;
DROP POLICY IF EXISTS "Restaurant owners can delete own product categories" ON product_categories;
DROP POLICY IF EXISTS "Superadmins can manage all product categories" ON product_categories;

-- Public read access for product categories
CREATE POLICY "Public can view product categories"
  ON product_categories FOR SELECT
  TO public
  USING (true);

-- Restaurant owners can manage their product categories
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
        ((SELECT auth.jwt()->>'role') = 'superadmin')
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
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Public can create orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can view own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can insert own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can update own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant owners can delete own orders" ON orders;
DROP POLICY IF EXISTS "Superadmins can view all orders" ON orders;
DROP POLICY IF EXISTS "Superadmins can manage all orders" ON orders;

-- Public can create orders (for public menu ordering)
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.is_active = true
    )
  );

-- Restaurant owners can view their orders
CREATE POLICY "Restaurant owners can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- Restaurant owners can manage their orders
CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- Restaurant owners can delete their orders
CREATE POLICY "Restaurant owners can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- ORDER_ITEMS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Restaurant owners can view own order items" ON order_items;
DROP POLICY IF EXISTS "Restaurant owners can update own order items" ON order_items;
DROP POLICY IF EXISTS "Restaurant owners can delete own order items" ON order_items;
DROP POLICY IF EXISTS "Superadmins can manage all order items" ON order_items;

-- Public can create order items (for public menu ordering)
CREATE POLICY "Public can create order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id
      AND restaurants.is_active = true
    )
  );

-- Restaurant owners can view their order items
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
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- Restaurant owners can manage their order items
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
        ((SELECT auth.jwt()->>'role') = 'superadmin')
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
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can view own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant owners can insert own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant owners can update own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant owners can delete own customers" ON customers;
DROP POLICY IF EXISTS "Superadmins can view all customers" ON customers;
DROP POLICY IF EXISTS "Superadmins can manage all customers" ON customers;

-- Restaurant owners can manage their customers
CREATE POLICY "Restaurant owners can manage own customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- SUPPORT_TICKETS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Restaurant owners can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Superadmins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Superadmins can manage all tickets" ON support_tickets;

-- Users can view their own tickets and tickets for their restaurants
CREATE POLICY "Users can view relevant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    ((SELECT auth.jwt()->>'role') = 'superadmin') OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  );

-- Authenticated users can create tickets
CREATE POLICY "Authenticated users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    ((SELECT auth.jwt()->>'role') = 'superadmin')
  );

-- Users can update their own tickets, superadmins can update all
CREATE POLICY "Users and superadmins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid()) OR
    ((SELECT auth.jwt()->>'role') = 'superadmin') OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    user_id = (SELECT auth.uid()) OR
    ((SELECT auth.jwt()->>'role') = 'superadmin') OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Public can view subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Restaurant owners can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Restaurant owners can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can create subscription for owned restaurant" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can delete subscriptions" ON subscriptions;

-- Restaurant owners can view their subscription
CREATE POLICY "Restaurant owners can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- Restaurant owners and superadmins can manage subscriptions
CREATE POLICY "Restaurant owners can manage subscriptions"
  ON subscriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND (
        restaurants.owner_id = (SELECT auth.uid()) OR
        ((SELECT auth.jwt()->>'role') = 'superadmin')
      )
    )
  );

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Superadmins can manage plans" ON subscription_plans;

-- Anyone can view active subscription plans
CREATE POLICY "Public can view active plans"
  ON subscription_plans FOR SELECT
  TO public
  USING (is_active = true);

-- Only superadmins can manage plans
CREATE POLICY "Superadmins can manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt()->>'role') = 'superadmin')
  WITH CHECK ((SELECT auth.jwt()->>'role') = 'superadmin');

-- ============================================================================
-- REMOVE UNUSED INDEXES (OPTIONAL - keeping for now as they may be used later)
-- ============================================================================

-- Commented out to keep indexes that may become useful as the app scales
-- DROP INDEX IF EXISTS idx_products_sku;
-- DROP INDEX IF EXISTS idx_subscription_plans_active;
-- DROP INDEX IF EXISTS idx_subscription_plans_slug;
