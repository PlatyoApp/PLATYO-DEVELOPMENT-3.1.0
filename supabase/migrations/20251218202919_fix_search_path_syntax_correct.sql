/*
  # Fix Search Path Syntax (Without Quotes)

  ## Description
  Fixes both get_subscription_status functions to use proper search_path syntax
  without quotes around schema names, which is required by Supabase security checks.

  ## Changes
  - Drops both overloaded functions
  - Recreates with `SET search_path = pg_catalog, public` (no quotes)
  - Ensures all internal calls use qualified names

  ## Security
  - Functions use restricted search_path without quotes
  - Prevents search_path injection attacks
*/

-- Drop both overloaded functions
DROP FUNCTION IF EXISTS public.get_subscription_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_subscription_status(text, timestamptz) CASCADE;

-- Recreate function with uuid parameter
CREATE OR REPLACE FUNCTION public.get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
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

-- Recreate function with text and timestamptz parameters
CREATE OR REPLACE FUNCTION public.get_subscription_status(
  current_status text, 
  end_date timestamptz
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- Si el estado es 'cancelled', mantenerlo
  IF current_status = 'cancelled' THEN
    RETURN 'cancelled';
  END IF;
  
  -- Si la fecha de fin ya pasó, está vencida
  IF end_date < pg_catalog.now() THEN
    RETURN 'expired';
  END IF;
  
  -- En cualquier otro caso, retornar el estado actual
  RETURN current_status;
END;
$$;

-- Grant execute permissions for both functions
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(text, timestamptz) TO anon;

-- Add documentation
COMMENT ON FUNCTION public.get_subscription_status(uuid) IS 
  'Returns subscription status with expiry check. Uses restricted search_path for security.';
COMMENT ON FUNCTION public.get_subscription_status(text, timestamptz) IS 
  'Returns subscription status with expiry check. Uses restricted search_path for security.';