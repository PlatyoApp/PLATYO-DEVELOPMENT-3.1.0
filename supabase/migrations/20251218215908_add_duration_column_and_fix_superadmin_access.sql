/*
  # Add Duration Column and Fix Superadmin Access

  1. Changes
    - Add `duration` column to subscriptions table
    - Add policies to allow superadmin to view all users
    - Add policies to allow superadmin to view all restaurants
    - Fix login issues for superadmin role
    
  2. Security
    - Superadmins can view all data
    - Regular users maintain their existing restrictions
*/

-- Add duration column to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS duration text NOT NULL DEFAULT 'monthly' 
CHECK (duration IN ('monthly', 'annual'));

-- Add policy for superadmins to view all users
CREATE POLICY "Superadmins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

-- Add policy for superadmins to view all restaurants  
CREATE POLICY "Superadmins can view all restaurants"
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      WHERE au.id = auth.uid()
      AND au.raw_user_meta_data->>'role' = 'superadmin'
    )
  );

-- Update existing superadmin user metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"superadmin"'
)
WHERE email = 'admin@digitalfenixpro.com';
