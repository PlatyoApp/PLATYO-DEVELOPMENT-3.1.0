/*
  # Add Foreign Key Indexes and Cleanup Unused Indexes

  ## Description
  This migration addresses performance and security issues by:
  1. Adding missing indexes on foreign key columns
  2. Removing unused indexes

  ## Changes Made

  ### New Indexes Added
  1. `idx_categories_restaurant_id` - Index on categories.restaurant_id foreign key
  2. `idx_orders_restaurant_id` - Index on orders.restaurant_id foreign key
  3. `idx_products_category_id` - Index on products.category_id foreign key
  4. `idx_products_restaurant_id` - Index on products.restaurant_id foreign key
  5. `idx_restaurants_user_id` - Index on restaurants.user_id foreign key
  6. `idx_subscriptions_restaurant_id` - Index on subscriptions.restaurant_id foreign key
  7. `idx_support_tickets_restaurant_id` - Index on support_tickets.restaurant_id foreign key

  ### Indexes Removed
  1. `idx_product_categories_category_id_v2` - Unused index on product_categories table

  ## Performance Impact
  - Foreign key indexes will significantly improve JOIN performance
  - Foreign key indexes will speed up CASCADE operations
  - Foreign key indexes will improve referential integrity checks
  - Removing unused indexes reduces storage overhead and INSERT/UPDATE costs

  ## Notes
  - All indexes are created with IF NOT EXISTS to prevent errors on rerun
  - Unused index is dropped with IF EXISTS for safety
*/

-- Add index for categories.restaurant_id foreign key
CREATE INDEX IF NOT EXISTS idx_categories_restaurant_id 
ON public.categories(restaurant_id);

-- Add index for orders.restaurant_id foreign key
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id 
ON public.orders(restaurant_id);

-- Add index for products.category_id foreign key
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON public.products(category_id);

-- Add index for products.restaurant_id foreign key
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id 
ON public.products(restaurant_id);

-- Add index for restaurants.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id 
ON public.restaurants(user_id);

-- Add index for subscriptions.restaurant_id foreign key
CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant_id 
ON public.subscriptions(restaurant_id);

-- Add index for support_tickets.restaurant_id foreign key
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant_id 
ON public.support_tickets(restaurant_id);

-- Remove unused index
DROP INDEX IF EXISTS public.idx_product_categories_category_id_v2;