/*
  # Fix Trigger RLS Bypass

  1. Changes
    - Update trigger function to properly bypass RLS
    - Ensure the function can insert users regardless of RLS policies
    
  2. Security
    - Uses SECURITY DEFINER with service role permissions
    - Only triggers on auth.users INSERT, not user-callable
*/

-- Recreate function with explicit RLS bypass
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert with explicit SECURITY DEFINER context (bypasses RLS)
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
    -- Log error but don't block auth user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure function owner is postgres (has bypass RLS privilege)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
