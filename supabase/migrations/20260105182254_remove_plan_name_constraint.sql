/*
  # Remove plan_name constraint

  1. Changes
    - Drop the old CHECK constraint on subscriptions.plan_name
    - This allows any plan_name value since plans are now managed in subscription_plans table
*/

ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_name_check;
