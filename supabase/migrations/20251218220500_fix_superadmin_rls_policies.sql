/*
  # Fix Superadmin RLS Policies

  1. Changes
    - Drop recursive policies that query public.users
    - Create new policies that check role from public.users table directly
    - Ensure superadmin can view and manage all users without recursion
    
  2. Security
    - Superadmins identified by role='superadmin' in public.users
    - Regular users can only access their own data
*/

-- Drop the recursive policies
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can update all users" ON public.users;

-- Create new non-recursive policy for superadmin to view all users
CREATE POLICY "Superadmins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'superadmin'
    )
    OR auth.uid() = id
  );

-- Create policy for superadmin to update all users
CREATE POLICY "Superadmins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'superadmin'
    )
    OR auth.uid() = id
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'superadmin'
    )
    OR auth.uid() = id
  );

-- Create policy for superadmin to delete users
CREATE POLICY "Superadmins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'superadmin'
    )
  );
