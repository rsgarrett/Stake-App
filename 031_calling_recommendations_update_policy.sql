-- Migration 031: Fix Convert to Calling - Add missing UPDATE policy for calling_recommendations
-- The Convert to Calling button was failing because RLS allowed SELECT and INSERT but not UPDATE.
-- Elevated roles (stake presidency, counselors, clerks) need to update recommendation status to 'converted'.

DROP POLICY IF EXISTS "Elevated roles can update recommendations" ON calling_recommendations;
CREATE POLICY "Elevated roles can update recommendations" ON calling_recommendations
  FOR UPDATE
  USING (
    stake_id = get_user_stake_id()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('stake_president', 'counselor', 'clerk', 'high_council')
    )
  )
  WITH CHECK (
    stake_id = get_user_stake_id()
  );
