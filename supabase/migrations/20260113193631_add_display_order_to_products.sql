/*
  # Add display_order column to products table

  1. Changes
    - Add `display_order` column to products table (integer, default 0)
    - Create index on display_order for better query performance
    - Initialize display_order values based on created_at timestamp
  
  2. Notes
    - Products will be ordered by display_order (ascending) in the menu
    - Lower numbers appear first
    - Default value of 0 ensures new products appear at the beginning
*/

-- Add display_order column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'display_order'
  ) THEN
    ALTER TABLE products ADD COLUMN display_order integer DEFAULT 0;
  END IF;
END $$;

-- Initialize display_order based on created_at (older products get lower numbers)
UPDATE products
SET display_order = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY created_at) as row_num
  FROM products
) sub
WHERE products.id = sub.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(restaurant_id, display_order);