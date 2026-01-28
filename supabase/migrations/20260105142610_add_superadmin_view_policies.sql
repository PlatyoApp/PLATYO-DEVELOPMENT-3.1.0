/*
  # Add Superadmin View Policies

  1. Problem
    - Superadmin cannot view all restaurants and subscriptions from dashboard
    - Missing SELECT policies that allow superadmin to view all data
    
  2. Changes
    - Add SELECT policy for superadmin on restaurants table
    - Add SELECT policy for superadmin on subscriptions table
    - Ensure superadmin can view all users
    
  3. Security
    - Only users with role='superadmin' can access all data
    - Regular users maintain their existing restricted access
*/

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Superadmins can view all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Superadmins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;

-- Add policy for superadmin to view ALL restaurants
CREATE POLICY "Superadmins can view all restaurants"
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- Add policy for superadmin to view ALL subscriptions
CREATE POLICY "Superadmins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- Add policy for superadmin to view ALL users
CREATE POLICY "Superadmins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (is_superadmin());

-- Add superadmin INSERT policy for subscriptions
DROP POLICY IF EXISTS "Superadmins can insert subscriptions" ON public.subscriptions;

CREATE POLICY "Superadmins can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (is_superadmin());
