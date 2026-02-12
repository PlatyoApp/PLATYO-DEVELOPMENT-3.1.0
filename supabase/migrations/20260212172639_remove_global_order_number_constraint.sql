/*
  # Remove Global Order Number Constraint

  ## Problem
  - There is an old global unique constraint `orders_order_number_key` on the `order_number` column
  - This conflicts with the new per-restaurant unique constraint `orders_restaurant_id_order_number_key`
  - Causing 409 Conflict errors when creating orders in different restaurants with the same order number

  ## Solution
  - Remove the old global constraint `orders_order_number_key`
  - Keep only the per-restaurant constraint which allows different restaurants to have the same order numbers
  
  ## Security
  - No RLS changes needed
  - This only affects the uniqueness constraint scope
*/

-- Remove the old global unique constraint on order_number
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_number_key;
