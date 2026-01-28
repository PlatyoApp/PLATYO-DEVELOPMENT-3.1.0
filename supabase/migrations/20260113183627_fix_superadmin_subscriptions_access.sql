/*
  # Fix Superadmin Access to Subscriptions

  1. Changes
    - Drop existing subscription policies
    - Create new simplified policies that check user role from users table
    - Add separate policy for superadmins with direct role check
    - Ensure restaurant owners can still access their own subscriptions

  2. Security
    - Superadmins can view all subscriptions
    - Restaurant owners can only view their own restaurant's subscription
    - Maintain RLS enabled
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Restaurant owners can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Restaurant owners can view own subscription" ON subscriptions;

-- Create new policies with proper superadmin access
CREATE POLICY "Superadmins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can insert subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Superadmins can delete subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

CREATE POLICY "Restaurant owners can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );
