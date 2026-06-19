-- Fix operator-precedence bug in welfare_cases SELECT policy:
-- `a OR b AND c` evaluates as `a OR (b AND c)`, which let a stake_president
-- read welfare cases from ANY stake. Welfare cases stay presidency-only.

DROP POLICY IF EXISTS "Only stake presidents and counselors can view welfare cases" ON welfare_cases;

CREATE POLICY "Only stake presidents and counselors can view welfare cases"
  ON welfare_cases FOR SELECT
  USING (
    (check_user_role('stake_president') OR check_user_role('counselor'))
    AND stake_id = get_user_stake_id()
  );
