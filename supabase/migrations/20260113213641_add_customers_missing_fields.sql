/*
  # Add missing fields to customers table

  1. Changes
    - Add `is_vip` boolean field to track VIP customers
    - Add `delivery_instructions` text field for delivery notes
    
  2. Notes
    - Uses IF NOT EXISTS to prevent errors if columns already exist
    - Sets default value for is_vip to false
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'is_vip'
  ) THEN
    ALTER TABLE customers ADD COLUMN is_vip boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'customers' AND column_name = 'delivery_instructions'
  ) THEN
    ALTER TABLE customers ADD COLUMN delivery_instructions text DEFAULT '';
  END IF;
END $$;