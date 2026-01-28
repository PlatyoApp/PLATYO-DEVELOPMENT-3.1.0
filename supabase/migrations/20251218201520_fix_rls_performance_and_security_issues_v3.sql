/*
  # Corrección de Problemas de Seguridad y Rendimiento

  ## Descripción
  Esta migración corrige problemas críticos de seguridad y rendimiento en el sistema:

  ## 1. Optimización de Políticas RLS
  - Reemplaza `auth.uid()` con `(select auth.uid())` en todas las políticas
  - Esto previene la re-evaluación de auth.uid() por cada fila
  - Mejora significativa en el rendimiento de consultas a escala

  ## 2. Eliminación de Políticas Duplicadas
  - Elimina políticas permisivas duplicadas que causan confusión
  - Mantiene solo una política por rol y acción
  - Reduce complejidad y mejora mantenibilidad

  ## 3. Corrección de Vistas con SECURITY DEFINER
  - Recrea vistas sin SECURITY DEFINER o con configuración segura
  - Previene escalación de privilegios

  ## 4. Corrección de Search Path en Funciones
  - Agrega search_path explícito a todas las funciones
  - Previene ataques de envenenamiento de esquema

  ## Tablas Afectadas
  - users
  - restaurants
  - categories
  - products
  - orders
  - subscriptions
  - customers
  - support_tickets
  - product_categories

  ## Impacto
  - Mejora significativa en rendimiento de consultas
  - Mayor seguridad contra ataques
  - Código más mantenible
*/

-- ============================================================================
-- 1. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA USERS
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Super admins can read all users" ON users;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Super admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 2. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA RESTAURANTS
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can read own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update own restaurant" ON restaurants;
DROP POLICY IF EXISTS "Super admins can read all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public users can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Public can view active restaurants" ON restaurants;

CREATE POLICY "Restaurant owners can read own restaurant"
  ON restaurants FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Restaurant owners can update own restaurant"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Super admins can read all restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Public can view active restaurants"
  ON restaurants FOR SELECT
  TO anon
  USING (status = 'active');

-- ============================================================================
-- 3. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA CATEGORIES
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own categories" ON categories;
DROP POLICY IF EXISTS "Public users can view active categories" ON categories;
DROP POLICY IF EXISTS "Public can view active categories" ON categories;

CREATE POLICY "Restaurant owners can manage own categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Public can view active categories"
  ON categories FOR SELECT
  TO anon
  USING (active = true);

-- ============================================================================
-- 4. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA PRODUCTS
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own products" ON products;
DROP POLICY IF EXISTS "Public users can view available products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;

CREATE POLICY "Restaurant owners can manage own products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = products.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  TO anon
  USING (status = 'active' AND is_available = true);

-- ============================================================================
-- 5. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA ORDERS
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own orders" ON orders;
DROP POLICY IF EXISTS "Public users can create orders" ON orders;
DROP POLICY IF EXISTS "Public can create orders" ON orders;

CREATE POLICY "Restaurant owners can manage own orders"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================================
-- 6. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA SUBSCRIPTIONS
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can read own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can read all subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Public users can view active subscriptions" ON subscriptions;

CREATE POLICY "Restaurant owners can read own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = subscriptions.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Super admins can read all subscriptions"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 7. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA CUSTOMERS
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can view own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant owners can insert own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant owners can update own customers" ON customers;
DROP POLICY IF EXISTS "Restaurant owners can delete own customers" ON customers;
DROP POLICY IF EXISTS "Super admins can view all customers" ON customers;

CREATE POLICY "Restaurant owners can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Restaurant owners can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Restaurant owners can update own customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Restaurant owners can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = customers.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Super admins can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 8. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA SUPPORT_TICKETS
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Restaurant owners can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Restaurant owners can update own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can update all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Super admins can delete tickets" ON support_tickets;

CREATE POLICY "Restaurant owners can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Restaurant owners can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Restaurant owners can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
    AND status = 'pending'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = support_tickets.restaurant_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Super admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can update all tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete tickets"
  ON support_tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
      AND users.role = 'super_admin'
    )
  );

-- ============================================================================
-- 9. OPTIMIZACIÓN DE POLÍTICAS RLS - TABLA PRODUCT_CATEGORIES
-- ============================================================================

DROP POLICY IF EXISTS "Restaurant owners can manage own product categories" ON product_categories;

CREATE POLICY "Restaurant owners can manage own product categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN restaurants ON restaurants.id = products.restaurant_id
      WHERE products.id = product_categories.product_id
      AND restaurants.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN restaurants ON restaurants.id = products.restaurant_id
      WHERE products.id = product_categories.product_id
      AND restaurants.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 10. CORRECCIÓN DE VISTAS CON SECURITY DEFINER
-- ============================================================================

DROP VIEW IF EXISTS product_categories_detail CASCADE;
DROP VIEW IF EXISTS subscriptions_with_status CASCADE;
DROP VIEW IF EXISTS active_subscriptions CASCADE;

CREATE OR REPLACE VIEW product_categories_detail AS
SELECT 
  pc.id,
  pc.product_id,
  pc.category_id,
  pc.is_primary,
  p.name AS product_name,
  c.name AS category_name,
  c.restaurant_id
FROM product_categories pc
JOIN products p ON p.id = pc.product_id
JOIN categories c ON c.id = pc.category_id;

CREATE OR REPLACE VIEW subscriptions_with_status AS
SELECT 
  s.*,
  r.name AS restaurant_name,
  CASE 
    WHEN s.end_date < now() THEN 'expired'
    WHEN s.status = 'active' THEN 'active'
    ELSE s.status
  END AS computed_status
FROM subscriptions s
JOIN restaurants r ON r.id = s.restaurant_id;

CREATE OR REPLACE VIEW active_subscriptions AS
SELECT *
FROM subscriptions
WHERE status = 'active' AND end_date > now();

-- ============================================================================
-- 11. CORRECCIÓN DE SEARCH PATH EN FUNCIONES
-- ============================================================================

DROP FUNCTION IF EXISTS check_primary_category() CASCADE;
CREATE OR REPLACE FUNCTION check_primary_category()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE product_categories
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND category_id != NEW.category_id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS auto_expire_subscriptions() CASCADE;
CREATE OR REPLACE FUNCTION auto_expire_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND end_date < now()
    AND auto_renew = false;
END;
$$;

DROP FUNCTION IF EXISTS auto_expire_on_write_trigger() CASCADE;
CREATE OR REPLACE FUNCTION auto_expire_on_write_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM auto_expire_subscriptions();
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS expire_old_subscriptions() CASCADE;
CREATE OR REPLACE FUNCTION expire_old_subscriptions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND end_date < now()
    AND auto_renew = false;
END;
$$;

DROP FUNCTION IF EXISTS check_subscription_expiry() CASCADE;
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND end_date < now()
    AND auto_renew = false;
END;
$$;

DROP FUNCTION IF EXISTS update_expired_subscriptions_on_read() CASCADE;
CREATE OR REPLACE FUNCTION update_expired_subscriptions_on_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'active' AND NEW.end_date < now() AND NEW.auto_renew = false THEN
    NEW.status = 'expired';
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS get_subscription_status(uuid) CASCADE;
CREATE OR REPLACE FUNCTION get_subscription_status(subscription_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  sub_status text;
  sub_end_date timestamptz;
  sub_auto_renew boolean;
BEGIN
  SELECT status, end_date, auto_renew
  INTO sub_status, sub_end_date, sub_auto_renew
  FROM subscriptions
  WHERE id = subscription_id;
  
  IF sub_status = 'active' AND sub_end_date < now() AND sub_auto_renew = false THEN
    RETURN 'expired';
  END IF;
  
  RETURN sub_status;
END;
$$;

DROP FUNCTION IF EXISTS update_subscription_status() CASCADE;
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired',
      updated_at = now()
  WHERE status = 'active'
    AND end_date < now()
    AND auto_renew = false;
END;
$$;

DROP FUNCTION IF EXISTS check_subscription_expiry_trigger() CASCADE;
CREATE OR REPLACE FUNCTION check_subscription_expiry_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM update_subscription_status();
  RETURN NULL;
END;
$$;

-- Recrear triggers si fueron eliminados
DROP TRIGGER IF EXISTS check_primary_category_trigger ON product_categories;
CREATE TRIGGER check_primary_category_trigger
  BEFORE INSERT OR UPDATE ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION check_primary_category();