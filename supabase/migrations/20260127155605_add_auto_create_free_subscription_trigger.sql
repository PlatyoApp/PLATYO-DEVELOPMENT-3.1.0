/*
  # Auto-Create FREE Subscription on Restaurant Creation

  1. Purpose
    - Automatically creates a FREE subscription when a new restaurant is created
    - Ensures every restaurant always has an active subscription from the start
    - Eliminates the need for manual subscription creation during registration

  2. Changes
    - Creates a trigger function that runs after restaurant INSERT
    - Automatically inserts a FREE subscription with default values
    - Uses SECURITY DEFINER to bypass RLS restrictions

  3. Subscription Details
    - Plan: 'free'
    - Status: 'active'
    - Duration: 'monthly'
    - Price: $0
    - Max Products: 10
    - Max Orders: 999999 (unlimited)
    - End Date: 2099-12-31 (effectively never expires)
    - Auto Renew: false

  4. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only triggers on INSERT, not UPDATE or DELETE
    - Idempotent: won't create duplicate subscriptions
*/

-- Create function to auto-create FREE subscription
CREATE OR REPLACE FUNCTION public.create_free_subscription_for_restaurant()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert FREE subscription for the new restaurant
  INSERT INTO public.subscriptions (
    restaurant_id,
    plan_name,
    duration,
    status,
    start_date,
    end_date,
    auto_renew,
    monthly_price,
    max_products,
    max_orders,
    features
  ) VALUES (
    NEW.id,
    'free',
    'monthly',
    'active',
    now(),
    '2099-12-31T23:59:59Z'::timestamptz,
    false,
    0,
    10,
    999999,
    '{"analytics": false, "custom_domain": false, "priority_support": false, "advanced_customization": false}'::jsonb
  )
  ON CONFLICT DO NOTHING; -- Prevent duplicates if subscription already exists

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_free_subscription ON public.restaurants;

-- Create trigger that fires after restaurant insert
CREATE TRIGGER auto_create_free_subscription
  AFTER INSERT ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.create_free_subscription_for_restaurant();

-- Add comment
COMMENT ON FUNCTION public.create_free_subscription_for_restaurant() IS
'Automatically creates a FREE subscription when a new restaurant is created. This ensures every restaurant always starts with an active subscription.';
