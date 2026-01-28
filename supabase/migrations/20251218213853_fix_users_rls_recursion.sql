/*
  # Fix Users RLS Recursion Issue

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create new simplified policies without recursion
    - Allow authenticated users to read their own data
    - System operations bypass RLS for admin queries

  2. Security
    - Users can only read and update their own profile
    - Service role can manage all users (bypasses RLS)
*/

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Superadmins can manage all users" ON users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow system to insert users (for registration)
CREATE POLICY "System can insert users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
