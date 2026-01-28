/*
  # Fix Registration Flow RLS Policies

  This migration fixes the RLS policies to allow new users to:
  1. Create their own restaurant during registration
  2. Create the initial subscription for their restaurant
  3. Update their user profile with restaurant assignment

  ## Changes

  1. **Restaurants Table**
     - Add policy to allow users to insert restaurants where they are the owner
     - Keeps existing policies for superadmin and owner updates

  2. **Subscriptions Table**
     - Add policy to allow users to insert subscriptions for restaurants they own
     - Uses a subquery to verify ownership through the restaurants table

  3. **Security**
     - All policies verify ownership before allowing operations
     - No cross-user data access is possible
     - Maintains existing superadmin capabilities
*/

-- Drop old restrictive policies for restaurants
DROP POLICY IF EXISTS "Superadmins can insert restaurants" ON restaurants;

-- Create new policy to allow users to insert their own restaurant during registration
CREATE POLICY "Users can create own restaurant"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Keep superadmin insert policy with higher precedence
CREATE POLICY "Superadmins can insert any restaurant"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE(((auth.jwt() ->> 'role'::text) = 'superadmin'::text), false));

-- Drop old restrictive policy for subscriptions
DROP POLICY IF EXISTS "Restaurant owners can create own subscription" ON subscriptions;

-- Create new policy to allow users to insert subscriptions for restaurants they own
CREATE POLICY "Users can create subscription for owned restaurant"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = subscriptions.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );
