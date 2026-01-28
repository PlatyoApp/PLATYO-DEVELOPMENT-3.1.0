/*
  # Fix Superadmin Access with Security Definer Function

  1. Changes
    - Create security definer function to check if user is superadmin
    - Drop recursive policies
    - Create new policies using the security definer function
    
  2. Security
    - Function bypasses RLS to check role
    - Only superadmins and users themselves can access user data
*/

-- Drop the recursive policies first
DROP POLICY IF EXISTS "Superadmins can view all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can update all users" ON public.users;
DROP POLICY IF EXISTS "Superadmins can delete users" ON public.users;

-- Create a security definer function to check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'superadmin'
  );
END;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Superadmins and users can view users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.is_superadmin() OR auth.uid() = id
  );

CREATE POLICY "Superadmins and users can update users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.is_superadmin() OR auth.uid() = id
  )
  WITH CHECK (
    public.is_superadmin() OR auth.uid() = id
  );

CREATE POLICY "Superadmins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    public.is_superadmin()
  );
