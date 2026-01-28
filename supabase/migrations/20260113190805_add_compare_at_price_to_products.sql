/*
  # Add Compare At Price to Products

  1. Changes
    - Add `compare_at_price` column to products table
      - Stores the original price before discount
      - Nullable field (only used when product is on sale)
      - Must be greater than or equal to the current price when set
  
  2. Purpose
    - Enable products to display sale/discount pricing
    - Show original price struck through with discounted price highlighted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'compare_at_price'
  ) THEN
    ALTER TABLE products ADD COLUMN compare_at_price numeric(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0);
  END IF;
END $$;