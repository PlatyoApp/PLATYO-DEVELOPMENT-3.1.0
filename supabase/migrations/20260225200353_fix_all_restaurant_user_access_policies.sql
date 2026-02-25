/*
  # Fix All Restaurant User Access Policies
  
  ## Problem
  Multiple tables have RLS policies that only allow the restaurant OWNER to access data,
  excluding other users who are assigned to the same restaurant. This causes different
  users of the same restaurant to see different data.
  
  ## Solution
  Update all policies to check the user's restaurant_id instead of checking if they are
  the restaurant owner. This allows ALL users assigned to a restaurant to access the
  same data.
  
  ## Tables Fixed
  - restaurants (UPDATE only, owner check is still needed for some operations)
  - categories (SELECT, INSERT, UPDATE, DELETE)
  - products (SELECT, INSERT, UPDATE, DELETE)
  - orders (SELECT, UPDATE, DELETE)
  - order_items (SELECT, INSERT, UPDATE, DELETE)
  - customers (SELECT, INSERT, UPDATE, DELETE)
  - product_categories (SELECT, INSERT, UPDATE, DELETE)
*/

-- ========== FIX RESTAURANTS POLICY ==========
-- Keep owner check for restaurants table since we don't want any user to modify restaurant settings
-- Only the actual owner should be able to update restaurant details
-- No changes needed here - this is intentional

-- ========== FIX CATEGORIES POLICIES ==========
DROP POLICY IF EXISTS "Restaurant owners can manage own categories" ON categories;
CREATE POLICY "Restaurant owners can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
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
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
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
      WHERE p.restaurant_id IN (
        SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
      )
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
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can manage own orders" ON orders;
CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

DROP POLICY IF EXISTS "Restaurant owners can delete own orders" ON orders;
CREATE POLICY "Restaurant owners can delete own orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
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
      WHERE o.restaurant_id IN (
        SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
      )
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
      WHERE o.restaurant_id IN (
        SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
      )
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
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );
