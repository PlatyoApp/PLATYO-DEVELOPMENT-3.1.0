/*
  # Fix Complete Registration Flow

  1. Schema Changes
    - Add missing columns to restaurants table (owner_id, owner_name, settings, domain)
    - Add trigger to auto-create user record when auth user is created
    
  2. Security Changes
    - Add INSERT policy for restaurants to allow new users to create their restaurant
    - Add SELECT policy for unauthenticated users to check slug availability
    - Update users policies to work with triggers
    
  3. Notes
    - This enables the full registration flow from the frontend
    - Ensures data integrity with proper foreign keys
*/

-- Add missing columns to restaurants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN owner_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'restaurants' AND column_name = 'domain'
  ) THEN
    ALTER TABLE public.restaurants ADD COLUMN domain text;
  END IF;
END $$;

-- Create index on owner_id for performance
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);

-- Add missing columns to users table if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'require_password_change'
  ) THEN
    ALTER TABLE public.users ADD COLUMN require_password_change boolean DEFAULT false;
  END IF;
END $$;

-- Create trigger function to auto-create user record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, email_verified, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'restaurant_owner',
    NEW.email_confirmed_at IS NOT NULL,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Allow authenticated users to insert restaurants
DROP POLICY IF EXISTS "Users can create own restaurant" ON public.restaurants;

CREATE POLICY "Users can create own restaurant"
  ON public.restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Allow unauthenticated users to check slug availability (read-only for slug checking)
DROP POLICY IF EXISTS "Anyone can check slug availability" ON public.restaurants;

CREATE POLICY "Anyone can check slug availability"
  ON public.restaurants
  FOR SELECT
  TO anon
  USING (true);

-- Update users SELECT policy to allow broader access during registration
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Restaurant members can view related users" ON public.users;

CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    (
      restaurant_id IS NOT NULL 
      AND restaurant_id IN (
        SELECT restaurant_id 
        FROM public.users 
        WHERE id = auth.uid()
      )
    )
    OR
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Allow authenticated users to update their own user record
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
