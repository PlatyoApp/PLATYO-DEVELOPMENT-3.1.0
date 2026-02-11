/*
  # Corrección: Número de Orden Único por Restaurante

  ## Descripción
  Esta migración asegura que el número de orden sea único por restaurante, no globalmente.
  También optimiza las consultas de generación de números de orden.

  ## 1. Cambios en Schema
  - Agregar constraint UNIQUE compuesto en (restaurant_id, order_number)
  - Agregar índice para optimizar consultas de orden máximo

  ## 2. Seguridad
  - Mantiene todas las políticas RLS existentes
  - No afecta datos existentes

  ## 3. Beneficios
  - Permite que diferentes restaurantes usen los mismos números de orden
  - Mejora el rendimiento de las consultas de generación de números
  - Previene duplicados dentro del mismo restaurante
*/

-- ============================================================================
-- CONSTRAINT: Número de orden único por restaurante
-- ============================================================================

-- Primero, eliminar constraint si existe (por si se ejecuta múltiples veces)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_order_number_per_restaurant'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT unique_order_number_per_restaurant;
  END IF;
END $$;

-- Agregar constraint único compuesto
ALTER TABLE orders
ADD CONSTRAINT unique_order_number_per_restaurant
UNIQUE (restaurant_id, order_number);

-- ============================================================================
-- ÍNDICES: Optimización de consultas
-- ============================================================================

-- Índice compuesto para optimizar la búsqueda del número máximo por restaurante
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_order_number
ON orders(restaurant_id, order_number);

-- Índice para optimizar consultas de órdenes recientes por restaurante
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created
ON orders(restaurant_id, created_at DESC);
