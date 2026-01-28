/*
  # Agregar políticas de lectura pública

  1. Cambios
    - Permitir a usuarios públicos leer restaurantes activos
    - Permitir a usuarios públicos leer categorías activas
    - Permitir a usuarios públicos leer productos activos y disponibles
    - Permitir a usuarios públicos leer suscripciones activas

  2. Seguridad
    - Solo lectura (SELECT) para usuarios públicos
    - Los datos están filtrados por estado activo
    - No permite modificación de datos
*/

-- Política para leer restaurantes activos
CREATE POLICY "Public users can view active restaurants"
  ON restaurants
  FOR SELECT
  TO public
  USING (status = 'active');

-- Política para leer categorías activas
CREATE POLICY "Public users can view active categories"
  ON categories
  FOR SELECT
  TO public
  USING (active = true);

-- Política para leer productos activos y disponibles
CREATE POLICY "Public users can view available products"
  ON products
  FOR SELECT
  TO public
  USING (status = 'active' AND is_available = true);

-- Política para leer suscripciones activas
CREATE POLICY "Public users can view active subscriptions"
  ON subscriptions
  FOR SELECT
  TO public
  USING (status = 'active');
