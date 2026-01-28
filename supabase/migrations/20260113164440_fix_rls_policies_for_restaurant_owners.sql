/*
  # Fix RLS Policies for Restaurant Owners

  This migration fixes Row Level Security policies to allow restaurant owners to properly manage their data.

  ## Changes Made

  1. **Categories Table**
     - Drop existing policies that rely on JWT claims
     - Create new policies that query the users table to verify ownership
     - Allow restaurant owners to INSERT, UPDATE, DELETE, and SELECT their own categories

  2. **Products Table**
     - Drop existing policies that rely on JWT claims
     - Create new policies that query the users table to verify ownership
     - Allow restaurant owners to INSERT, UPDATE, DELETE, and SELECT their own products

  3. **Restaurants Table**
     - Drop existing policies that rely on JWT claims
     - Create new policies that allow owners to update their restaurants
     - Maintain superadmin access for all operations

  ## Security
  - All policies verify that auth.uid() matches the owner in the users table
  - Superadmin policies remain unchanged
  - Public access for viewing active restaurants and categories remains unchanged
*/

-- =====================================================
-- CATEGORIES TABLE - Drop old policies
-- =====================================================

DROP POLICY IF EXISTS "Restaurant owners can insert own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can update own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can delete own categories" ON categories;
DROP POLICY IF EXISTS "Restaurant owners can view own categories" ON categories;

-- =====================================================
-- CATEGORIES TABLE - Create new policies
-- =====================================================

CREATE POLICY "Restaurant owners can insert own categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = categories.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners can update own categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = categories.restaurant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = categories.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners can delete own categories"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = categories.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners can view own categories"
  ON categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = categories.restaurant_id
    )
  );

-- =====================================================
-- PRODUCTS TABLE - Drop old policies
-- =====================================================

DROP POLICY IF EXISTS "Restaurant owners can insert own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can update own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can delete own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can view own products" ON products;

-- =====================================================
-- PRODUCTS TABLE - Create new policies
-- =====================================================

CREATE POLICY "Restaurant owners can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = products.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = products.restaurant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = products.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = products.restaurant_id
    )
  );

CREATE POLICY "Restaurant owners can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = products.restaurant_id
    )
  );

-- =====================================================
-- RESTAURANTS TABLE - Drop old policies
-- =====================================================

DROP POLICY IF EXISTS "Restaurant owners can update own restaurant" ON restaurants;

-- =====================================================
-- RESTAURANTS TABLE - Create new policies
-- =====================================================

CREATE POLICY "Restaurant owners can update own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = restaurants.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.restaurant_id = restaurants.id
    )
  );

-- =====================================================
-- ORDERS TABLE - Add policies if missing
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Restaurant owners can view own orders'
  ) THEN
    CREATE POLICY "Restaurant owners can view own orders"
      ON orders FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = orders.restaurant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Restaurant owners can insert own orders'
  ) THEN
    CREATE POLICY "Restaurant owners can insert own orders"
      ON orders FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = orders.restaurant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Restaurant owners can update own orders'
  ) THEN
    CREATE POLICY "Restaurant owners can update own orders"
      ON orders FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = orders.restaurant_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = orders.restaurant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Restaurant owners can delete own orders'
  ) THEN
    CREATE POLICY "Restaurant owners can delete own orders"
      ON orders FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = orders.restaurant_id
        )
      );
  END IF;
END $$;

-- =====================================================
-- CUSTOMERS TABLE - Add policies if missing
-- =====================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Restaurant owners can view own customers'
  ) THEN
    CREATE POLICY "Restaurant owners can view own customers"
      ON customers FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = customers.restaurant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Restaurant owners can insert own customers'
  ) THEN
    CREATE POLICY "Restaurant owners can insert own customers"
      ON customers FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = customers.restaurant_id
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Restaurant owners can update own customers'
  ) THEN
    CREATE POLICY "Restaurant owners can update own customers"
      ON customers FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = customers.restaurant_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.restaurant_id = customers.restaurant_id
        )
      );
  END IF;
END $$;