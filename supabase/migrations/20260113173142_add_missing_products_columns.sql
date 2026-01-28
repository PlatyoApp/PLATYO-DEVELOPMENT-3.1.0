/*
  # Agregar columnas faltantes a products

  1. Cambios en products:
    - Agregar columna `images` (jsonb) - array de URLs de imágenes
    - Agregar columna `variations` (jsonb) - variaciones del producto con precios
    - Agregar columna `ingredients` (jsonb) - lista de ingredientes opcionales
    - Agregar columna `dietary_restrictions` (jsonb) - restricciones dietéticas
    - Agregar columna `spice_level` (integer) - nivel de picante (0-5)
    - Agregar columna `preparation_time` (text) - tiempo de preparación
    - Agregar columna `status` (text) - estado del producto (active/inactive)
    - Agregar columna `sku` (text) - código SKU del producto

  2. Notas:
    - La columna `image_url` existente se mantiene para compatibilidad
    - Las nuevas columnas usan JSONB para estructuras complejas
    - Se agregan valores por defecto apropiados
*/

-- Agregar columna images si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'images'
  ) THEN
    ALTER TABLE products ADD COLUMN images jsonb DEFAULT '[]'::jsonb;
    
    -- Migrar image_url existente a images array
    UPDATE products 
    SET images = jsonb_build_array(image_url) 
    WHERE image_url IS NOT NULL AND images = '[]'::jsonb;
  END IF;
END $$;

-- Agregar columna variations si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'variations'
  ) THEN
    ALTER TABLE products ADD COLUMN variations jsonb DEFAULT '[]'::jsonb;
    
    -- Migrar price existente a variations array
    UPDATE products 
    SET variations = jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'name', 'Normal',
        'price', price
      )
    )
    WHERE variations = '[]'::jsonb;
  END IF;
END $$;

-- Agregar columna ingredients si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'ingredients'
  ) THEN
    ALTER TABLE products ADD COLUMN ingredients jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Agregar columna dietary_restrictions si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'dietary_restrictions'
  ) THEN
    ALTER TABLE products ADD COLUMN dietary_restrictions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Agregar columna spice_level si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'spice_level'
  ) THEN
    ALTER TABLE products ADD COLUMN spice_level integer DEFAULT 0 CHECK (spice_level >= 0 AND spice_level <= 5);
  END IF;
END $$;

-- Agregar columna preparation_time si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'preparation_time'
  ) THEN
    ALTER TABLE products ADD COLUMN preparation_time text;
  END IF;
END $$;

-- Agregar columna status si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'status'
  ) THEN
    ALTER TABLE products ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'inactive'));
    
    -- Sincronizar status con is_available para registros existentes
    UPDATE products SET status = CASE WHEN is_available THEN 'active' ELSE 'inactive' END;
  END IF;
END $$;

-- Agregar columna sku si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'sku'
  ) THEN
    ALTER TABLE products ADD COLUMN sku text;
  END IF;
END $$;

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(restaurant_id, is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
