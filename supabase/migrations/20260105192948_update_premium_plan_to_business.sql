/*
  # Update Premium Plan to Business Plan

  1. Changes
    - Update plan slug from 'premium' to 'business'
    - Update plan name from 'Premium' to 'Business'
    - Update plan price to match the displayed value
    - Update subscriptions that reference 'premium' to 'business'

  2. Notes
    - This ensures consistency between the database and UI
    - All existing premium subscriptions will be updated to business
*/

-- Update the subscription_plans table
UPDATE subscription_plans
SET 
  slug = 'business',
  name = 'Business',
  price = 75,
  updated_at = now()
WHERE slug = 'premium';

-- Update existing subscriptions that reference premium
UPDATE subscriptions
SET 
  plan_name = 'business',
  monthly_price = 75,
  updated_at = now()
WHERE plan_name = 'premium';