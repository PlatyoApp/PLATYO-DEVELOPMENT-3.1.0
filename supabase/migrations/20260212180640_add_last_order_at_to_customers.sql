/*
  # Add last_order_at column to customers table
  
  1. Changes to Customers Table
    - Add `last_order_at` column to track the last time customer placed an order
    - This column is used for customer analytics and order management
  
  2. Security
    - No changes to RLS policies
*/

-- Add last_order_at column to customers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'last_order_at'
  ) THEN
    ALTER TABLE customers ADD COLUMN last_order_at timestamptz DEFAULT now();
  END IF;
END $$;