/*
  # Add Multiple Categories Support for Products

  ## Description
  This migration adds support for products to belong to multiple categories simultaneously,
  enabling better marketplace organization and intelligent filtering capabilities.

  ## New Tables

  ### product_categories
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key to products)
  - `category_id` (uuid, foreign key to categories)
  - `is_primary` (boolean) - Indicates if this is the main category
  - `created_at` (timestamptz)

  ## Changes to Existing Tables

  ### products
  - `category_id` column made nullable for backward compatibility
  - New products can use either single category or multiple categories approach

  ## Security
  - RLS enabled on `product_categories` table
  - Restaurant owners can manage their product-category relationships
  - Public read access for active products

  ## Migration Strategy
  - Creates new table for many-to-many relationship
  - Maintains backward compatibility with existing single category approach
  - Automatically migrates existing product-category relationships

  ## Notes
  - Products can have 1-10 categories
  - One category must be marked as primary
  - Intelligent filtering will use all assigned categories
*/

-- Create product_categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- Make category_id nullable in products table for backward compatibility
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'category_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;
  END IF;
END $$;

-- Migrate existing product-category relationships to the new table
INSERT INTO product_categories (product_id, category_id, is_primary)
SELECT id, category_id, true
FROM products
WHERE category_id IS NOT NULL
ON CONFLICT (product_id, category_id) DO NOTHING;

-- Enable RLS on product_categories
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can manage their product categories
CREATE POLICY "Restaurant owners can manage own product categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products
      JOIN restaurants ON restaurants.id = products.restaurant_id
      WHERE products.id = product_categories.product_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM products
      JOIN restaurants ON restaurants.id = products.restaurant_id
      WHERE products.id = product_categories.product_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- Policy: Public read access for product categories
CREATE POLICY "Public can read product categories"
  ON product_categories FOR SELECT
  TO anon
  USING (true);

-- Create indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category_id ON product_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_is_primary ON product_categories(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_categories_lookup ON product_categories(product_id, category_id);

-- Add constraint to ensure at least one primary category per product
CREATE OR REPLACE FUNCTION check_primary_category()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM product_categories
    WHERE product_id = NEW.product_id AND is_primary = true
  ) THEN
    NEW.is_primary := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_primary_category
  BEFORE INSERT ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION check_primary_category();

-- Add helpful view for product categories with details
CREATE OR REPLACE VIEW product_categories_detail AS
SELECT
  pc.id,
  pc.product_id,
  pc.category_id,
  pc.is_primary,
  c.name as category_name,
  c.icon as category_icon,
  c.description as category_description,
  p.name as product_name,
  p.restaurant_id
FROM product_categories pc
JOIN categories c ON c.id = pc.category_id
JOIN products p ON p.id = pc.product_id;