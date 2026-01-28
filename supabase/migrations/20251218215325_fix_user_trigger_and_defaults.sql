/*
  # Fix User Creation Trigger and Defaults

  1. Changes
    - Make full_name nullable with default value
    - Make role have a default value
    - Fix trigger function to handle all edge cases
    - Add better error handling
    
  2. Security
    - Maintains SECURITY DEFINER for proper permissions
    - Uses proper search_path to avoid security issues
*/

-- Make full_name nullable and add default
ALTER TABLE public.users 
  ALTER COLUMN full_name DROP NOT NULL,
  ALTER COLUMN full_name SET DEFAULT '';

-- Add default value for role
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'restaurant_owner';

-- Recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    email_verified, 
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''),
    'restaurant_owner',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified;
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
