/*
  # Remove last_order_at column from customers table
  
  1. Changes to Customers Table
    - Remove `last_order_at` column that was added by mistake
  
  2. Security
    - No changes to RLS policies
*/

-- Remove last_order_at column from customers table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'last_order_at'
  ) THEN
    ALTER TABLE customers DROP COLUMN last_order_at;
  END IF;
END $$;