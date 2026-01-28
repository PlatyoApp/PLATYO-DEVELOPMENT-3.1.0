/*
  # Add INSERT Policy for Subscriptions

  1. Changes
    - Add INSERT policy to allow restaurant owners to create initial subscription during registration
    
  2. Security
    - Users can only create subscriptions for restaurants they own
    - Validates that the user's restaurant_id matches the subscription's restaurant_id
*/

-- Allow restaurant owners to create subscriptions for their own restaurant
CREATE POLICY "Restaurant owners can create own subscription"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.restaurant_id = subscriptions.restaurant_id
    )
  );
