/*
  # Fix All SECURITY DEFINER Functions Search Path

  ## Description
  Fixes all SECURITY DEFINER functions to have an immutable search_path
  by setting `SET search_path = pg_catalog, public` and using fully qualified names.

  ## Changes
  - Fixes auto_expire_on_write_trigger
  - Fixes auto_expire_subscriptions
  - Fixes check_primary_category
  - Fixes check_subscription_expiry
  - Fixes check_subscription_expiry_trigger
  - Fixes expire_old_subscriptions
  - Fixes update_expired_subscriptions_on_read
  - Fixes update_subscription_status

  ## Security
  - All functions use restricted search_path
  - Prevents search_path injection attacks
*/

-- Fix auto_expire_on_write_trigger
DROP FUNCTION IF EXISTS public.auto_expire_on_write_trigger() CASCADE;
CREATE OR REPLACE FUNCTION public.auto_expire_on_write_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.end_date < pg_catalog.now() AND NEW.auto_renew = false THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix auto_expire_subscriptions
DROP FUNCTION IF EXISTS public.auto_expire_subscriptions() CASCADE;
CREATE OR REPLACE FUNCTION public.auto_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < pg_catalog.now()
    AND auto_renew = false;
END;
$$;

-- Fix check_primary_category
DROP FUNCTION IF EXISTS public.check_primary_category() CASCADE;
CREATE OR REPLACE FUNCTION public.check_primary_category()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  primary_count integer;
BEGIN
  IF NEW.is_primary = true THEN
    SELECT pg_catalog.count(*)
    INTO primary_count
    FROM public.product_categories pc
    WHERE pc.product_id = NEW.product_id
      AND pc.is_primary = true
      AND pc.id != NEW.id;
    
    IF primary_count > 0 THEN
      UPDATE public.product_categories
      SET is_primary = false
      WHERE product_id = NEW.product_id
        AND id != NEW.id
        AND is_primary = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix check_subscription_expiry
DROP FUNCTION IF EXISTS public.check_subscription_expiry() CASCADE;
CREATE OR REPLACE FUNCTION public.check_subscription_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.end_date < pg_catalog.now() AND NEW.auto_renew = false THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix check_subscription_expiry_trigger
DROP FUNCTION IF EXISTS public.check_subscription_expiry_trigger() CASCADE;
CREATE OR REPLACE FUNCTION public.check_subscription_expiry_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.end_date < pg_catalog.now() AND NEW.auto_renew = false THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix expire_old_subscriptions
DROP FUNCTION IF EXISTS public.expire_old_subscriptions() CASCADE;
CREATE OR REPLACE FUNCTION public.expire_old_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < pg_catalog.now()
    AND auto_renew = false;
END;
$$;

-- Fix update_expired_subscriptions_on_read
DROP FUNCTION IF EXISTS public.update_expired_subscriptions_on_read() CASCADE;
CREATE OR REPLACE FUNCTION public.update_expired_subscriptions_on_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  UPDATE public.subscriptions
  SET status = 'expired'
  WHERE status = 'active'
    AND end_date < pg_catalog.now()
    AND auto_renew = false;
END;
$$;

-- Fix update_subscription_status
DROP FUNCTION IF EXISTS public.update_subscription_status() CASCADE;
CREATE OR REPLACE FUNCTION public.update_subscription_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.end_date < pg_catalog.now() AND NEW.auto_renew = false THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate any triggers that were dropped
DROP TRIGGER IF EXISTS check_subscription_expiry_trigger ON public.subscriptions;
CREATE TRIGGER check_subscription_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_subscription_expiry_trigger();

DROP TRIGGER IF EXISTS check_primary_category_trigger ON public.product_categories;
CREATE TRIGGER check_primary_category_trigger
  BEFORE INSERT OR UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.check_primary_category();