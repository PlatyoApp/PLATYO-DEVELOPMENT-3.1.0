/*
  # Add function to check if email exists
  
  1. New Function
    - `check_email_exists(email text)` - Returns boolean indicating if email exists
    - Uses SECURITY DEFINER to bypass RLS
    - Safe for public use (only returns boolean, no user data)
  
  2. Security
    - Function is SECURITY DEFINER but only returns boolean
    - No sensitive data exposed
    - Case-insensitive email comparison
*/

CREATE OR REPLACE FUNCTION check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE LOWER(email) = LOWER(check_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION check_email_exists(text) TO authenticated;