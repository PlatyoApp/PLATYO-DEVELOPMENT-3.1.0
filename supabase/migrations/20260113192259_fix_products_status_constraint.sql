/*
  # Fix products status constraint

  1. Changes
    - Drop the existing status check constraint
    - Add new status check constraint with all needed values: 'active', 'inactive', 'out_of_stock', 'archived', 'draft'
  
  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'products_status_check'
    AND table_name = 'products'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_status_check;
  END IF;
END $$;

-- Add the new constraint with all status values
ALTER TABLE products ADD CONSTRAINT products_status_check 
  CHECK (status IN ('active', 'inactive', 'out_of_stock', 'archived', 'draft'));