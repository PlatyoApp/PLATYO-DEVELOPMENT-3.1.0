/*
  # Create Super Admin User

  ## Description
  Creates a super_admin user with the following credentials:
  - Email: admin@digitalfenixpro.com
  - Password: Renovaciondigital2024#
  - Role: super_admin

  ## Changes
  1. Creates auth.users entry with encrypted password
  2. Creates public.users entry with super_admin role and hashed password
  3. Marks email as confirmed

  ## Security
  - Password is properly hashed using bcrypt via extensions.crypt()
  - User is created with confirmed email
  - Same hashed password stored in both auth.users and public.users
*/

DO $$
DECLARE
  new_user_id uuid;
  hashed_password text;
BEGIN
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Hash the password using bcrypt (Supabase uses bcrypt with cost 10)
  hashed_password := extensions.crypt('Renovaciondigital2024#', extensions.gen_salt('bf', 10));
  
  -- Insert into auth.users (confirmed_at is a generated column, so we exclude it)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    is_sso_user,
    is_anonymous
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@digitalfenixpro.com',
    hashed_password,
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    false,
    false,
    false
  );
  
  -- Insert into public.users with correct role name 'super_admin' (with underscore)
  INSERT INTO public.users (
    id,
    email,
    password,
    role,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    'admin@digitalfenixpro.com',
    hashed_password,
    'super_admin',
    now(),
    now()
  );
  
  RAISE NOTICE 'Super admin user created successfully with ID: %', new_user_id;
END $$;