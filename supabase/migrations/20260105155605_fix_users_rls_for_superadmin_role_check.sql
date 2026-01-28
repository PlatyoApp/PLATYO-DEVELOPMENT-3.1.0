/*
  # Fix Users RLS for Superadmin Role Check

  1. Problem
    - RLS policies check role from JWT but role is only in users table
    - Superadmins cannot see all users because JWT doesn't contain role
    
  2. Solution
    - Create helper function to check if current user is superadmin
    - Update RLS policies to use this function
    
  3. Changes
    - Create is_superadmin() function
    - Update users SELECT policy to use function
    - Ensure superadmins can see all users
*/

-- Create function to check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'superadmin'
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read profiles" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Superadmins can update all profiles" ON users;
DROP POLICY IF EXISTS "Superadmins can delete users" ON users;

-- SELECT: Users can see their own profile OR superadmins can see all
CREATE POLICY "Users can read profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    is_superadmin()
  );

-- INSERT: Users can create their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update own profile, superadmins can update all
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_superadmin())
  WITH CHECK (auth.uid() = id OR is_superadmin());

-- DELETE: Only superadmins can delete users
CREATE POLICY "Superadmins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (is_superadmin());
