/*
  # Simplify Users Table RLS Policies

  1. Problem
    - Multiple SELECT policies might be causing conflicts
    - Need clearer, more straightforward policies
    
  2. Solution
    - Consolidate policies to be simpler and more explicit
    - Use a single SELECT policy that handles both cases
    
  3. Changes
    - Drop all existing users policies
    - Create new simplified policies
*/

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;
DROP POLICY IF EXISTS "Superadmins can update all users" ON users;
DROP POLICY IF EXISTS "Superadmins can delete users" ON users;

-- Create new simplified SELECT policy that handles both regular users and superadmins
CREATE POLICY "Users can read profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    (auth.jwt()->>'role')::text = 'superadmin'
  );

-- INSERT policy - authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE policies
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Superadmins can update all profiles"
  ON users
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'superadmin')
  WITH CHECK ((auth.jwt()->>'role')::text = 'superadmin');

-- DELETE policy
CREATE POLICY "Superadmins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'superadmin');
