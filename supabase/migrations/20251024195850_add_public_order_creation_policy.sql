/*
  # Agregar política para creación pública de pedidos

  1. Cambios
    - Agregar política que permite a usuarios no autenticados crear pedidos
    - Los pedidos públicos pueden ser creados desde el menú público del restaurante
    - La política valida que el restaurant_id exista en la tabla restaurants

  2. Seguridad
    - Solo permite INSERT (creación) de pedidos
    - No permite lectura, actualización o eliminación desde usuarios públicos
    - Los dueños de restaurantes mantienen acceso completo a través de su política existente
*/

-- Crear política para permitir que usuarios públicos creen pedidos
CREATE POLICY "Public users can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
    )
  );
