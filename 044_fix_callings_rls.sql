-- Fix callings RLS policies to allow updates/deletes when stake_id is NULL
-- (matches the pattern used for meetings in 027_meetings_select_policy.sql)

DROP POLICY IF EXISTS "Users can update callings based on role" ON callings;
DROP POLICY IF EXISTS "Users can delete callings based on role" ON callings;

CREATE POLICY "Users can update callings based on role" ON callings
  FOR UPDATE USING (
    (stake_id IS NULL OR get_user_stake_id() IS NULL OR stake_id = get_user_stake_id()) AND (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('stake_president', 'counselor', 'clerk', 'bishop', 'auxiliary_leader')
      ) OR
      (submitted_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete callings based on role" ON callings
  FOR DELETE USING (
    (stake_id IS NULL OR get_user_stake_id() IS NULL OR stake_id = get_user_stake_id()) AND (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('stake_president', 'counselor', 'clerk')
      ) OR
      (submitted_by = auth.uid())
    )
  );
