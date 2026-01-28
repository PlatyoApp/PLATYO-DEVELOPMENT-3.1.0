/*
  # Fix Support Tickets Delete Policy

  1. Changes
    - Add DELETE policy for superadmins to delete support tickets
    
  2. Security
    - Only superadmins can delete tickets
    - Maintains RLS protection
*/

-- Add delete policy for superadmins
CREATE POLICY "Superadmins can delete tickets"
  ON support_tickets
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'superadmin'
    )
  );
