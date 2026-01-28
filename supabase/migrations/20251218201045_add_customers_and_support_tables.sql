/*
  # Agregar Tablas de Clientes y Soporte + Políticas Públicas

  ## Descripción
  Esta migración agrega las tablas faltantes para completar el sistema de gestión de restaurantes:
  - Tabla de clientes para cada restaurante
  - Tabla de tickets de soporte
  - Políticas de lectura pública para el menú

  ## 1. Nuevas Tablas

  ### customers
  Almacena los clientes de cada restaurante con su información de contacto y preferencias.
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, foreign key a restaurants) - Restaurante al que pertenece
  - `name` (text) - Nombre completo del cliente
  - `phone` (text) - Teléfono (único por restaurante)
  - `email` (text, opcional) - Email del cliente
  - `address` (text, opcional) - Dirección de entrega
  - `delivery_instructions` (text, opcional) - Instrucciones especiales de entrega
  - `is_vip` (boolean) - Cliente VIP o no
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de última actualización

  ### support_tickets
  Almacena tickets de soporte enviados por los restaurantes al SuperAdmin.
  - `id` (uuid, primary key)
  - `restaurant_id` (uuid, foreign key a restaurants) - Restaurante que envía el ticket
  - `subject` (text) - Asunto del ticket
  - `category` (text) - Categoría: general, technical, billing, feature, account, other
  - `priority` (text) - Prioridad: urgent, high, medium, low
  - `message` (text) - Mensaje del cliente
  - `contact_email` (text) - Email de contacto
  - `contact_phone` (text, opcional) - Teléfono de contacto
  - `status` (text) - Estado: pending, in_progress, resolved, closed
  - `response` (text, opcional) - Respuesta del administrador
  - `response_date` (timestamptz, opcional) - Fecha de respuesta
  - `admin_notes` (text, opcional) - Notas internas del equipo
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de última actualización

  ## 2. Políticas de Lectura Pública
  - Permitir lectura pública de categorías activas para el menú público
  - Permitir lectura pública de productos activos y disponibles para el menú público

  ## 3. Seguridad
  - RLS habilitado en todas las tablas nuevas
  - Políticas restrictivas basadas en restaurant_id
  - SuperAdmin puede ver todos los registros
  - Restaurantes solo ven sus propios datos
  - Usuarios anónimos pueden leer menús públicos

  ## 4. Índices
  - Índices en restaurant_id para optimizar consultas
  - Índice compuesto en (restaurant_id, phone) para customers
  - Índice en status para support_tickets
*/

-- ============================================================================
-- TABLA: customers
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  delivery_instructions text,
  is_vip boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_phone_per_restaurant UNIQUE (restaurant_id, phone)
);

-- Habilitar RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política: Restaurantes pueden ver y gestionar sus propios clientes
CREATE POLICY "Restaurant owners can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurant owners can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Política: SuperAdmin puede ver todos los clientes
CREATE POLICY "Super admins can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Crear índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_restaurant_id ON customers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(restaurant_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_is_vip ON customers(restaurant_id, is_vip);

-- ============================================================================
-- TABLA: support_tickets
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('general', 'technical', 'billing', 'feature', 'account', 'other')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  message text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  response text,
  response_date timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Política: Restaurantes pueden ver sus propios tickets
CREATE POLICY "Restaurant owners can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Política: Restaurantes pueden crear tickets
CREATE POLICY "Restaurant owners can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Política: Restaurantes pueden actualizar sus propios tickets (solo antes de ser respondidos)
CREATE POLICY "Restaurant owners can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Política: SuperAdmin puede ver todos los tickets
CREATE POLICY "Super admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Política: SuperAdmin puede actualizar todos los tickets
CREATE POLICY "Super admins can update all tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Política: SuperAdmin puede eliminar tickets
CREATE POLICY "Super admins can delete tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Crear índices para support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_id ON support_tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- ============================================================================
-- POLÍTICAS DE LECTURA PÚBLICA PARA MENÚ
-- ============================================================================

-- Permitir lectura pública de categorías activas
CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  TO anon
  USING (active = true);

-- Permitir lectura pública de productos activos y disponibles
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  TO anon
  USING (status = 'active' AND is_available = true);

-- Permitir lectura pública de restaurantes activos
CREATE POLICY "Public can view active restaurants"
  ON restaurants FOR SELECT
  TO anon
  USING (status = 'active');

-- ============================================================================
-- POLÍTICAS PÚBLICAS PARA CREAR PEDIDOS
-- ============================================================================

-- Permitir a usuarios anónimos crear pedidos
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);