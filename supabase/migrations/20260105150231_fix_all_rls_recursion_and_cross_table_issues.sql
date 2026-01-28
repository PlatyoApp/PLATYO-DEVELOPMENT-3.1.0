/*
  # Fix All RLS Recursion and Cross-Table Issues

  1. Problem
    - Policies on restaurants and subscriptions query the users table
    - This creates cross-table dependencies that can cause deadlocks on reload
    - When a user reloads, the system tries to load user -> restaurant -> user again
    
  2. Solution
    - Store restaurant_id in JWT metadata when user logs in
    - Use JWT data directly in policies instead of querying tables
    - Eliminate all cross-table queries in RLS policies
    
  3. Changes
    - Update all restaurant policies to use JWT instead of users table
    - Update all subscription policies to use JWT instead of users table
    - Add trigger to sync restaurant_id to JWT metadata
    - Update existing users to have restaurant_id in JWT
*/

-- ========================================
-- RESTAURANTS TABLE POLICIES
-- ========================================

-- Drop all existing restaurant policies
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can check slug availability" ON restaurants;
DROP POLICY IF EXISTS "Restaurant admins can view own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurant admins can update own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can view all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can manage restaurants" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can update all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Superadmins can delete restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can create own restaurant" ON restaurants;

-- Public read access for active restaurants
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (is_active = true);

-- Restaurant owners can view their own restaurant using JWT
CREATE POLICY "Restaurant owners can view own restaurant"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (
    id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can update their own restaurant using JWT
CREATE POLICY "Restaurant owners can update own restaurant"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (
    id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies using JWT
CREATE POLICY "Superadmins can view all restaurants"
  ON restaurants
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can insert restaurants"
  ON restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can update all restaurants"
  ON restaurants
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  )
  WITH CHECK (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can delete restaurants"
  ON restaurants
  FOR DELETE
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

-- ========================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ========================================

-- Drop all existing subscription policies
DROP POLICY IF EXISTS "Restaurant staff can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Restaurant owners can create own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Restaurant admins can update own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can view all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Superadmins can insert subscriptions" ON subscriptions;

-- Restaurant owners can view their subscription using JWT
CREATE POLICY "Restaurant owners can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can create subscription using JWT
CREATE POLICY "Restaurant owners can create own subscription"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Restaurant owners can update their subscription using JWT
CREATE POLICY "Restaurant owners can update own subscription"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  )
  WITH CHECK (
    restaurant_id::text = COALESCE(auth.jwt()->>'restaurant_id', '')
  );

-- Superadmin policies using JWT
CREATE POLICY "Superadmins can view all subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can insert subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can update subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  )
  WITH CHECK (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

CREATE POLICY "Superadmins can delete subscriptions"
  ON subscriptions
  FOR DELETE
  TO authenticated
  USING (
    COALESCE((auth.jwt()->>'role')::text = 'superadmin', false)
  );

-- ========================================
-- JWT SYNC FUNCTIONS
-- ========================================

-- Update handle_new_user to include restaurant_id in JWT
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_role text;
  user_restaurant_id uuid;
BEGIN
  -- Insert the user record
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    role, 
    email_verified, 
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'restaurant_owner',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW()
  RETURNING role, restaurant_id INTO user_role, user_restaurant_id;

  -- Update auth.users metadata with role and restaurant_id
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', user_role,
      'restaurant_id', COALESCE(user_restaurant_id::text, '')
    )
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update sync function to include restaurant_id
CREATE OR REPLACE FUNCTION sync_user_role_to_jwt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- When role or restaurant_id changes, update the JWT metadata
  IF OLD.role IS DISTINCT FROM NEW.role OR OLD.restaurant_id IS DISTINCT FROM NEW.restaurant_id THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', NEW.role,
        'restaurant_id', COALESCE(NEW.restaurant_id::text, '')
      )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the trigger to watch restaurant_id changes too
DROP TRIGGER IF EXISTS sync_role_to_jwt ON users;
CREATE TRIGGER sync_role_to_jwt
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role OR OLD.restaurant_id IS DISTINCT FROM NEW.restaurant_id)
  EXECUTE FUNCTION sync_user_role_to_jwt();

-- Update all existing users to have restaurant_id in JWT
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, role, restaurant_id FROM users LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'role', user_record.role,
        'restaurant_id', COALESCE(user_record.restaurant_id::text, '')
      )
    WHERE id = user_record.id;
  END LOOP;
END $$;
