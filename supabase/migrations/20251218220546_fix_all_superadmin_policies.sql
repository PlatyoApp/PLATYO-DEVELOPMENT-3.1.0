/*
  # Fix All Superadmin Policies

  1. Changes
    - Update restaurants policies to use is_superadmin()
    - Update subscriptions policies to use is_superadmin()
    - Remove duplicate/conflicting policies
    
  2. Security
    - Consistent superadmin access across all tables
    - No recursion issues
*/

-- Drop old superadmin policies that might have issues
DROP POLICY IF EXISTS "Superadmins can view all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Superadmins can manage all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Superadmins can manage all subscriptions" ON public.subscriptions;

-- Create new restaurant policies for superadmin
CREATE POLICY "Superadmins can manage restaurants"
  ON public.restaurants
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Create new subscription policies for superadmin
CREATE POLICY "Superadmins can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());
