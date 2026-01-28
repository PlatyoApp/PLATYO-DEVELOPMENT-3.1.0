/*
  # Fix Users RLS Recursion

  1. Changes
    - Remove recursive policies that query the same table
    - Simplify policies to avoid infinite recursion
    - Use direct checks instead of subqueries
    
  2. Security
    - Users can only view and update their own profile
    - Superadmins need separate handling without recursion
    - Allow system to insert users during registration
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "System can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public read for restaurants" ON public.users;

-- Simple policy: Users can view their own profile only
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Simple policy: Users can update their own profile only
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own record (for registration flow)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Note: The trigger function with SECURITY DEFINER will bypass RLS entirely
-- so we don't need a separate policy for system inserts
