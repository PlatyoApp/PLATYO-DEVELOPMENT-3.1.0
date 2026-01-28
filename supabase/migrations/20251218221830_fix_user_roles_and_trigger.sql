/*
  # Fix User Roles and Creation Trigger

  1. Problem
    - The users.role check constraint doesn't include 'restaurant_owner'
    - This prevents the trigger from creating user records during registration
    - Users created in auth.users don't get corresponding records in public.users

  2. Changes
    - Update the role check constraint to include 'restaurant_owner'
    - Sync existing auth.users that don't have public.users records
    - Recreate the trigger function with correct role value
    - Ensure proper permissions and RLS bypass

  3. Security
    - Uses SECURITY DEFINER to bypass RLS
    - Maintains proper role-based access control
*/

-- Drop the old check constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the new check constraint with 'restaurant_owner' included
ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['superadmin'::text, 'restaurant_owner'::text, 'restaurant_admin'::text, 'staff'::text]));

-- Sync any existing auth.users that don't have public.users records
INSERT INTO public.users (id, email, full_name, role, email_verified, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'restaurant_owner',
  au.email_confirmed_at IS NOT NULL,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with proper configuration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert the user record, bypassing RLS due to SECURITY DEFINER
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
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging but don't block auth user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the function is owned by postgres (superuser)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
