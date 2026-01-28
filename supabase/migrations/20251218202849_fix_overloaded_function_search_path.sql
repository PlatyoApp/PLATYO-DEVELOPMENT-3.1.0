/*
  # Fix Overloaded Function Search Path Security

  ## Description
  Fixes the overloaded get_subscription_status function (with text and timestamptz params)
  to have an immutable search_path and proper volatility.

  ## Changes
  - Drops existing overloaded function get_subscription_status(text, timestamptz)
  - Recreates with SET search_path TO 'pg_catalog', 'public'
  - Changes from IMMUTABLE to STABLE (because it uses pg_catalog.now())
  - Uses fully qualified pg_catalog.now()

  ## Security
  - Function uses restricted search_path
  - Prevents search_path injection attacks
*/

-- Drop the overloaded function
DROP FUNCTION IF EXISTS public.get_subscription_status(text, timestamptz) CASCADE;

-- Recreate with proper immutable search_path
CREATE OR REPLACE FUNCTION public.get_subscription_status(
  current_status text, 
  end_date timestamptz
)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path TO 'pg_catalog', 'public'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_subscription_status(text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscription_status(text, timestamptz) TO anon;

-- Add documentation
COMMENT ON FUNCTION public.get_subscription_status(text, timestamptz) IS 
  'Returns subscription status with expiry check. Uses restricted search_path for security.';