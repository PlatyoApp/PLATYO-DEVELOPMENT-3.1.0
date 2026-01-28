/*
  # Fix Superadmin JWT Role Path

  1. Problem
    - RLS policies are checking `auth.jwt() ->> 'role'`
    - But superadmin role is stored in `auth.jwt() -> 'app_metadata' ->> 'role'`
    - This causes superadmins to not see subscription data

  2. Solution
    - Update all subscription policies to check the correct JWT path
    - Change from `auth.jwt() ->> 'role'` to `auth.jwt() -> 'app_metadata' ->> 'role'`
*/

-- Drop existing superadmin policies
DROP POLICY IF EXISTS "Superadmins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can update subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can delete subscriptions" ON subscriptions;

-- Recreate with correct JWT path
CREATE POLICY "Superadmins can view all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false));

CREATE POLICY "Superadmins can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false));

CREATE POLICY "Superadmins can update subscriptions"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false))
  WITH CHECK (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false));

CREATE POLICY "Superadmins can delete subscriptions"
  ON subscriptions FOR DELETE
  TO authenticated
  USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false));
