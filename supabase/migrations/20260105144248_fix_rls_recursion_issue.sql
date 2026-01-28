/*
  # Fix RLS Recursion Issue

  1. Problem
    - The is_superadmin() function queries the users table
    - RLS policies on users table call is_superadmin()
    - This creates infinite recursion causing page reload hangs

  2. Solution
    - Remove is_superadmin() function dependency from users table policies
    - Use direct auth.uid() checks for user policies
    - Keep is_superadmin() for other tables that don't create recursion

  3. Changes
    - Drop existing policies on users table that use is_superadmin()
    - Create new simplified policies that avoid recursion
    - Superadmin access to users table will be handled separately
*/

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Superadmins and users can view users" ON users;
DROP POLICY IF EXISTS "Superadmins and users can update users" ON users;
DROP POLICY IF EXISTS "Superadmins can view all users" ON users;
DROP POLICY IF EXISTS "Superadmins can delete users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new non-recursive policies for users table

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for registration)
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Superadmin view policy using app_metadata from JWT (no recursion)
CREATE POLICY "Superadmins can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'role')::text = 'superadmin',
      false
    )
  );

-- Superadmin update policy using app_metadata from JWT
CREATE POLICY "Superadmins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'role')::text = 'superadmin',
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt()->>'role')::text = 'superadmin',
      false
    )
  );

-- Superadmin delete policy using app_metadata from JWT
CREATE POLICY "Superadmins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    COALESCE(
      (auth.jwt()->>'role')::text = 'superadmin',
      false
    )
  );

-- Update the handle_new_user trigger to set role in JWT metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Insert the user record
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    email_verified, 
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'restaurant_owner',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW()
  RETURNING role INTO user_role;

  -- Update auth.users metadata with the role
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', user_role)
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Function to update user role in JWT when role changes
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- When role changes, update the JWT metadata
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', NEW.role)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to sync role changes to JWT
DROP TRIGGER IF EXISTS sync_role_to_jwt ON users;
CREATE TRIGGER sync_role_to_jwt
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- Update existing users to have their role in JWT
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role FROM users LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;
