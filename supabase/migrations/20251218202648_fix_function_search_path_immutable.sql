/*
  # Fix Function Search Path Security (Immutable)

  ## Description
  Fixes the get_subscription_status function to have an immutable search_path
  by using fully qualified function calls including pg_catalog schema.

  ## Changes
  - Drops existing function
  - Recreates with SET search_path TO 'pg_catalog', 'public'
  - Uses fully qualified pg_catalog.now() instead of now()
  - All table references use public schema prefix

  ## Security
  - Function uses SECURITY DEFINER with restricted search_path
  - Prevents search_path injection attacks
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_subscription_status(uuid) CASCADE;

-- Recreate with proper immutable search_path
CREATE OR REPLACE FUNCTION public.get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $$
DECLARE
  sub_status text;
  sub_end_date timestamptz;
  sub_auto_renew boolean;
BEGIN
  -- Query subscription data
  SELECT status, end_date, auto_renew
  INTO sub_status, sub_end_date, sub_auto_renew
  FROM public.subscriptions
  WHERE id = subscription_id;
  
  -- Check if subscription is expired
  IF sub_status = 'active' AND sub_end_date < pg_catalog.now() AND sub_auto_renew = false THEN
    RETURN 'expired';
  END IF;
  
  RETURN sub_status;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO anon;

-- Add documentation
COMMENT ON FUNCTION public.get_subscription_status(uuid) IS 
  'Returns subscription status with expiry check. Uses restricted search_path for security.';