/*
  # Fix Final Two RLS Policies

  1. Fix remaining unoptimized policies:
    - Superadmins can delete restaurants
    - Superadmins can manage plans
  
  2. Ensure SELECT wraps auth.jwt() call directly, not the entire expression
*/

-- ============================================================================
-- RESTAURANTS TABLE - Fix Delete Policy
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can delete restaurants" ON restaurants;

CREATE POLICY "Superadmins can delete restaurants"
  ON restaurants FOR DELETE
  TO authenticated
  USING (((SELECT auth.jwt())->>'role') = 'superadmin');

-- ============================================================================
-- SUBSCRIPTION_PLANS TABLE - Fix Manage Policy
-- ============================================================================

DROP POLICY IF EXISTS "Superadmins can manage plans" ON subscription_plans;

CREATE POLICY "Superadmins can manage plans"
  ON subscription_plans FOR ALL
  TO authenticated
  USING (((SELECT auth.jwt())->>'role') = 'superadmin')
  WITH CHECK (((SELECT auth.jwt())->>'role') = 'superadmin');
