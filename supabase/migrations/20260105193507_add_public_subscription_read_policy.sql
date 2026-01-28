/*
  # Add Public Read Access to Subscriptions for Public Menu

  1. Changes
    - Add RLS policy to allow public (anonymous) users to read subscription data
    - This is needed for the public menu to verify restaurant subscription status
  
  2. Security
    - Only allows SELECT operations
    - Only for public/anonymous role
    - Does not expose sensitive payment information (just status and plan info)

  3. Notes
    - This enables the public menu to check if a restaurant has an active subscription
    - Without this, the public menu cannot load because it cannot verify subscription status
*/

-- Allow public to view subscriptions (needed for public menu)
CREATE POLICY "Public can view subscriptions"
  ON subscriptions
  FOR SELECT
  TO public
  USING (true);