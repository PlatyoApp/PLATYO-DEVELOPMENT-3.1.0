/*
  # Clean Duplicate User Policies

  1. Changes
    - Remove old duplicate policies
    - Keep only the new policies that work with is_superadmin()
    
  2. Security
    - Superadmins can view and manage all users
    - Regular users can only access their own profile
*/

-- Drop old duplicate policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- The new policies already cover these cases:
-- "Superadmins and users can view users" - allows auth.uid() = id OR is_superadmin()
-- "Superadmins and users can update users" - allows auth.uid() = id OR is_superadmin()
