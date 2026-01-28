-- Add estimated_time column to orders table if it doesn't exist
-- Run this SQL in your Supabase SQL Editor if you encounter errors creating orders

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'estimated_time'
  ) THEN
    ALTER TABLE orders ADD COLUMN estimated_time text DEFAULT '';
    RAISE NOTICE 'Column estimated_time added successfully';
  ELSE
    RAISE NOTICE 'Column estimated_time already exists';
  END IF;
END $$;
