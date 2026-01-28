/*
  # Fix All Remaining Table RLS Cross-References

  1. Problem
    - Many tables (categories, products, orders, customers, support_tickets) query users table in RLS
    - This creates cross-table dependencies causing deadlocks on reload
    
  2. Solution
    - Replace all users table queries with JWT checks
    - Use auth.jwt()->>'restaurant_id' instead of querying users
    
  3. Changes
    - Update categories policies
    - Update products policies
    - Update orders policies
    - Update customers policies
    - Update support_tickets policies
*/

-- ========================================
-- CATEGORIES TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Restaurant staff can view own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant admins can manage own categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view categories of active restaurants" ON categories;
DROP POLICY IF EXISTS "Superadmins can manage all categories" ON categories;

-- Public can view categories of active restaurants
CREATE POLICY "Public can view active restaurant categories"
  ON categories
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Restaurant owners can view their categories using JWT
CREATE POLICY "Restaurant owners can view own categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can manage their categories using JWT
CREATE POLICY "Restaurant owners can insert own categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

CREATE POLICY "Restaurant owners can update own categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

CREATE POLICY "Restaurant owners can delete own categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies
CREATE POLICY "Superadmins can view all categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can manage all categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

-- ========================================
-- PRODUCTS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Restaurant staff can view own products" ON products;
DROP POLICY IF EXISTS "Restaurant admins can manage own products" ON products;
DROP POLICY IF EXISTS "Anyone can view products of active restaurants" ON products;
DROP POLICY IF EXISTS "Superadmins can manage all products" ON products;

-- Public can view products of active restaurants
CREATE POLICY "Public can view active restaurant products"
  ON products
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = products.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Restaurant owners can view their products using JWT
CREATE POLICY "Restaurant owners can view own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can manage their products using JWT
CREATE POLICY "Restaurant owners can insert own products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

CREATE POLICY "Restaurant owners can update own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

CREATE POLICY "Restaurant owners can delete own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies
CREATE POLICY "Superadmins can view all products"
  ON products
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can manage all products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

-- ========================================
-- ORDERS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Restaurant staff can view own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant staff can update own orders" ON orders;
DROP POLICY IF EXISTS "Restaurant admins can delete own orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Superadmins can manage all orders" ON orders;

-- Public can insert orders
CREATE POLICY "Public can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Restaurant owners can view their orders using JWT
CREATE POLICY "Restaurant owners can view own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can update their orders using JWT
CREATE POLICY "Restaurant owners can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can delete their orders using JWT
CREATE POLICY "Restaurant owners can delete own orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies
CREATE POLICY "Superadmins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

-- ========================================
-- CUSTOMERS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Restaurant staff can view own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant staff can manage own customers" ON customers;
DROP POLICY IF EXISTS "Superadmins can manage all customers" ON customers;

-- Restaurant owners can view their customers using JWT
CREATE POLICY "Restaurant owners can view own customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can manage their customers using JWT
CREATE POLICY "Restaurant owners can insert own customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

CREATE POLICY "Restaurant owners can update own customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

CREATE POLICY "Restaurant owners can delete own customers"
  ON customers
  FOR DELETE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies
CREATE POLICY "Superadmins can view all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can manage all customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

-- ========================================
-- SUPPORT_TICKETS TABLE POLICIES
-- ========================================

DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Restaurant staff can update own restaurant tickets" ON support_tickets;
DROP POLICY IF EXISTS "Superadmins can manage all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;

-- Users can view their own tickets
CREATE POLICY "Users can view own tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Users can create tickets
CREATE POLICY "Users can create tickets"
  ON support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
  );

-- Restaurant owners can update their restaurant tickets
CREATE POLICY "Restaurant owners can update own tickets"
  ON support_tickets
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies
CREATE POLICY "Superadmins can view all tickets"
  ON support_tickets
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can manage all tickets"
  ON support_tickets
  FOR ALL
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );
