/*
  # Fix Support Tickets Superadmin Access

  1. Changes
    - Update SELECT policy to properly check superadmin role from users table
    - Update UPDATE policy to allow superadmins to update tickets
    
  2. Security
    - Superadmins can see all tickets
    - Restaurant owners can see their own restaurant tickets
    - Users can see tickets they created
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view relevant tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users and superadmins can update tickets" ON support_tickets;

-- Create new SELECT policy that properly checks superadmin from users table
CREATE POLICY "Users can view relevant tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    -- Superadmins can see all tickets
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
    OR
    -- Users can see tickets they created
    user_id = auth.uid()
    OR
    -- Restaurant owners can see their restaurant's tickets
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Create new UPDATE policy
CREATE POLICY "Users and superadmins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    -- Superadmins can update all tickets
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
    OR
    -- Users can update tickets they created
    user_id = auth.uid()
    OR
    -- Restaurant owners can update their restaurant's tickets
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same as USING clause
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
    OR
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );
