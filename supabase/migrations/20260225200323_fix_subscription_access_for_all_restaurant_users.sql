/*
  # Fix Subscription Access for All Restaurant Users
  
  ## Problem
  Users assigned to the same restaurant but who are not the owner cannot view the subscription.
  The current policy only allows the restaurant owner to view subscriptions.
  
  ## Solution
  Update the policy to allow ANY user whose restaurant_id matches the subscription's restaurant_id
  to view the subscription, not just the owner.
  
  ## Changes
  - Drop and recreate "Restaurant owners can view own subscription" policy
  - Drop and recreate "Restaurant owners can update own subscription" policy
  - Allow access based on user's restaurant_id, not restaurant owner_id
*/

-- Fix SELECT policy for subscriptions
DROP POLICY IF EXISTS "Restaurant owners can view own subscription" ON subscriptions;
CREATE POLICY "Restaurant owners can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );

-- Fix UPDATE policy for subscriptions
DROP POLICY IF EXISTS "Restaurant owners can update own subscription" ON subscriptions;
CREATE POLICY "Restaurant owners can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM users WHERE id = (SELECT auth.uid())
    )
    OR (SELECT (current_setting('request.jwt.claims', true)::json->>'role')) = 'superadmin'
  );
