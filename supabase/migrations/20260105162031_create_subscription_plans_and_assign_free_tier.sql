/*
  # Create Subscription Plans and Assign Free Tier to Existing Restaurants

  1. New Tables
    - `subscription_plans`
      - `id` (uuid, primary key)
      - `name` (text) - Display name of the plan
      - `slug` (text, unique) - URL-friendly identifier (gratis, basic, pro, premium)
      - `price` (numeric) - Monthly price in USD
      - `billing_period` (text) - 'monthly' or 'annual'
      - `max_products` (integer) - Maximum number of products allowed
      - `max_categories` (integer) - Maximum number of categories allowed
      - `features` (jsonb) - Plan features as JSON object
      - `is_active` (boolean) - Whether the plan is available for subscription
      - `display_order` (integer) - Order to display plans
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Data
    - Insert 4 subscription plans: FREE, Basic, Pro, Premium
    - Create FREE subscriptions for all existing restaurants without subscriptions

  3. Security
    - Enable RLS on `subscription_plans` table
    - Add policies for authenticated users to read plans
    - Only superadmins can modify plans
*/

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  price numeric NOT NULL DEFAULT 0 CHECK (price >= 0),
  billing_period text NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
  max_products integer NOT NULL DEFAULT 10 CHECK (max_products > 0),
  max_categories integer NOT NULL DEFAULT 5 CHECK (max_categories > 0),
  features jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public can read active plans (for pricing page)
CREATE POLICY "Anyone can view active plans"
  ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Superadmins can manage all plans
CREATE POLICY "Superadmins can manage plans"
  ON subscription_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );

-- Insert subscription plans
INSERT INTO subscription_plans (slug, name, price, billing_period, max_products, max_categories, features, display_order, is_active)
VALUES
  (
    'gratis',
    'FREE',
    0,
    'monthly',
    10,
    5,
    '{"analytics": false, "custom_domain": false, "priority_support": false, "advanced_customization": false}'::jsonb,
    1,
    true
  ),
  (
    'basic',
    'Basic',
    15,
    'monthly',
    50,
    15,
    '{"analytics": true, "custom_domain": false, "priority_support": false, "advanced_customization": true}'::jsonb,
    2,
    true
  ),
  (
    'pro',
    'Pro',
    35,
    'monthly',
    200,
    50,
    '{"analytics": true, "custom_domain": true, "priority_support": true, "advanced_customization": true, "popular": true}'::jsonb,
    3,
    true
  ),
  (
    'premium',
    'Premium',
    80,
    'monthly',
    999999,
    999999,
    '{"analytics": true, "custom_domain": true, "priority_support": true, "advanced_customization": true}'::jsonb,
    4,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Create FREE subscriptions for all existing restaurants without a subscription
INSERT INTO subscriptions (
  restaurant_id,
  plan_name,
  status,
  start_date,
  end_date,
  auto_renew,
  monthly_price,
  max_products,
  max_orders,
  features,
  duration
)
SELECT 
  r.id,
  'free',
  'active',
  now(),
  now() + interval '1000 years',
  false,
  0,
  10,
  999999,
  '{"analytics": false, "custom_domain": false, "priority_support": false, "advanced_customization": false}'::jsonb,
  'monthly'
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions s
  WHERE s.restaurant_id = r.id
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;