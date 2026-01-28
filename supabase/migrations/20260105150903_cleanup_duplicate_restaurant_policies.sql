/*
  # Cleanup Duplicate Restaurant Policies

  1. Problem
    - Multiple overlapping SELECT policies on restaurants may cause conflicts
    - Need to consolidate into clear, non-overlapping policies
    
  2. Solution
    - Drop all SELECT policies and recreate with clear precedence
    - Use a single comprehensive policy for authenticated users
    
  3. Changes
    - Consolidate all SELECT policies into one clear policy
*/

-- Drop all existing SELECT policies on restaurants
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can view all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can verify restaurant existence" ON restaurants;
DROP POLICY IF EXISTS "Anyone can check slug availability" ON restaurants;

-- Create a single comprehensive SELECT policy
CREATE POLICY "Users can view restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (
    -- Public users can see active restaurants
    is_active = true
    OR
    -- Authenticated users can see their own restaurant (using JWT)
    (auth.uid() IS NOT NULL AND id::text = (auth.jwt()->>'restaurant_id')::text)
    OR
    -- Superadmins can see all restaurants
    (auth.uid() IS NOT NULL AND (auth.jwt()->>'role')::text = 'superadmin')
  );
