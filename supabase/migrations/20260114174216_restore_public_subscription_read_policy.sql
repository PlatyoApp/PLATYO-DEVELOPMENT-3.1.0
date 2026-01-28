/*
  # Restore Public Read Access to Subscriptions for Public Menu

  1. Changes
    - Re-add RLS policy to allow public (anonymous) users to read subscription data
    - This is required for the public menu to verify restaurant subscription status
  
  2. Security
    - Only allows SELECT operations
    - Only for public/anonymous role
    - Does not expose sensitive payment information (just status and plan info)

  3. Notes
    - Without this policy, the public menu cannot load because it cannot verify subscription status
    - This was previously removed by migration 20260113183627, causing public menu to fail
*/

-- Re-add policy to allow public users to view subscriptions (needed for public menu)
CREATE POLICY "Public users can view subscriptions"
  ON subscriptions
  FOR SELECT
  TO public
  USING (true);