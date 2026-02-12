/*
  # Fix Critical Issues in Customers and Orders Tables
  
  1. Changes to Customers Table
    - Add missing `total_orders` column with default value 0
    - This column tracks the number of orders per customer
  
  2. Changes to Orders Table
    - Remove global unique constraint on `order_number` (orders_order_number_key)
    - Keep only the per-restaurant unique constraint (unique_order_number_per_restaurant)
    - This allows different restaurants to have the same order numbers independently
  
  3. Security
    - No changes to RLS policies
*/

-- Add total_orders column to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'total_orders'
  ) THEN
    ALTER TABLE customers ADD COLUMN total_orders integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Remove global unique constraint on order_number if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'orders_order_number_key'
  ) THEN
    ALTER TABLE orders DROP CONSTRAINT orders_order_number_key;
  END IF;
END $$;

-- Ensure the per-restaurant unique constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'orders' AND constraint_name = 'unique_order_number_per_restaurant'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT unique_order_number_per_restaurant 
      UNIQUE (restaurant_id, order_number);
  END IF;
END $$;