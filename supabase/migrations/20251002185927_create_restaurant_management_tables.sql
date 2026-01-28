/*
  # Sistema de Gestión de Restaurantes

  ## Descripción
  Migración inicial para crear todas las tablas necesarias para el sistema de gestión de restaurantes,
  incluyendo usuarios, restaurantes, categorías, productos, pedidos y configuraciones.

  ## Nuevas Tablas
  
  ### users
  - `id` (uuid, primary key)
  - `email` (text, unique)
  - `password` (text)
  - `role` (text) - 'restaurant_owner' o 'super_admin'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### restaurants
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `name` (text)
  - `slug` (text, unique)
  - `email` (text)
  - `phone` (text)
  - `address` (text)
  - `description` (text)
  - `logo` (text)
  - `owner_name` (text)
  - `settings` (jsonb)
  - `status` (text)
  - `domain` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### categories
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, foreign key)
  - `name` (text)
  - `description` (text)
  - `icon` (text)
  - `order_position` (integer)
  - `active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### products
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, foreign key)
  - `category_id` (uuid, foreign key)
  - `name` (text)
  - `description` (text)
  - `images` (jsonb)
  - `variations` (jsonb)
  - `ingredients` (jsonb)
  - `dietary_restrictions` (jsonb)
  - `spice_level` (integer)
  - `preparation_time` (text)
  - `status` (text)
  - `sku` (text)
  - `is_available` (boolean)
  - `is_featured` (boolean)
  - `order_index` (integer)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### orders
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, foreign key)
  - `order_number` (text, unique)
  - `customer` (jsonb)
  - `items` (jsonb)
  - `order_type` (text)
  - `delivery_address` (text)
  - `table_number` (text)
  - `delivery_cost` (numeric)
  - `subtotal` (numeric)
  - `total` (numeric)
  - `status` (text)
  - `estimated_time` (text)
  - `special_instructions` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### subscriptions
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, foreign key)
  - `plan_type` (text)
  - `status` (text)
  - `start_date` (timestamptz)
  - `end_date` (timestamptz)
  - `auto_renew` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Seguridad
  - RLS habilitado en todas las tablas
  - Políticas restrictivas basadas en autenticación y propiedad
*/

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('restaurant_owner', 'super_admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Crear tabla de restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  description text,
  logo text,
  owner_name text,
  settings jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  domain text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can read own restaurant"
  ON restaurants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Restaurant owners can update own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can read all restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Crear tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  order_position integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Crear tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  variations jsonb DEFAULT '[]'::jsonb,
  ingredients jsonb DEFAULT '[]'::jsonb,
  dietary_restrictions jsonb DEFAULT '[]'::jsonb,
  spice_level integer DEFAULT 0,
  preparation_time text,
  status text DEFAULT 'active',
  sku text,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Crear tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  order_number text UNIQUE NOT NULL,
  customer jsonb DEFAULT '{}'::jsonb,
  items jsonb DEFAULT '[]'::jsonb,
  order_type text NOT NULL CHECK (order_type IN ('pickup', 'delivery', 'table')),
  delivery_address text,
  table_number text,
  delivery_cost numeric DEFAULT 0,
  subtotal numeric NOT NULL,
  total numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  estimated_time text,
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'business')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurant owners can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id ON subscriptions(restaurant_id);
