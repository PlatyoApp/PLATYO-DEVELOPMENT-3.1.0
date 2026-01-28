/*
  # Add missing columns to orders table

  1. Changes
    - Add order_number column (unique identifier for orders)
    - Add items column (JSONB to store order items)
    - Add delivery_address column (for delivery orders)
    - Add table_number column (for dine-in orders)
    - Add subtotal column (order subtotal before delivery)
    - Add delivery_cost column (delivery fee)
    - Add special_instructions column (customer notes)
    - Add whatsapp_sent column (track if WhatsApp notification sent)
    - Rename total_amount to total for consistency
*/

-- Add missing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'items'
  ) THEN
    ALTER TABLE orders ADD COLUMN items jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'table_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN table_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric(10,2) DEFAULT 0 CHECK (subtotal >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_cost'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_cost numeric(10,2) DEFAULT 0 CHECK (delivery_cost >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'special_instructions'
  ) THEN
    ALTER TABLE orders ADD COLUMN special_instructions text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'whatsapp_sent'
  ) THEN
    ALTER TABLE orders ADD COLUMN whatsapp_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'total'
  ) THEN
    ALTER TABLE orders ADD COLUMN total numeric(10,2) DEFAULT 0 CHECK (total >= 0);
  END IF;
END $$;