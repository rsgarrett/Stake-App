-- Interviews: stake scoping + RLS so bishops and other leaders can schedule,
-- not only stake_president / counselor / clerk.

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS stake_id UUID REFERENCES stakes(id) ON DELETE SET NULL;

UPDATE interviews i
SET stake_id = u.stake_id
FROM users u
WHERE i.interviewer_id = u.id
  AND u.stake_id IS NOT NULL
  AND (i.stake_id IS NULL OR i.stake_id IS DISTINCT FROM u.stake_id);

CREATE OR REPLACE FUNCTION can_schedule_interviews()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
      AND role IN (
        'stake_president',
        'counselor',
        'clerk',
        'bishop',
        'high_council',
        'auxiliary_leader'
      )
  );
$$;

DROP POLICY IF EXISTS "Elevated roles can manage interviews" ON interviews;
DROP POLICY IF EXISTS "Users can view interviews they conducted or were interviewed for" ON interviews;

CREATE POLICY "Users can view interviews in their stake"
  ON interviews
  FOR SELECT
  TO authenticated
  USING (
    interviewer_id = auth.uid()
    OR (stake_id IS NOT NULL AND stake_id = get_user_stake_id())
  );

CREATE POLICY "Stake leaders manage interviews in their stake"
  ON interviews
  FOR ALL
  TO authenticated
  USING (
    stake_id IS NOT NULL
    AND stake_id = get_user_stake_id()
    AND (
      has_elevated_role()
      OR (can_schedule_interviews() AND interviewer_id = auth.uid())
    )
  )
  WITH CHECK (
    stake_id IS NOT NULL
    AND stake_id = get_user_stake_id()
    AND (
      has_elevated_role()
      OR (can_schedule_interviews() AND interviewer_id = auth.uid())
    )
  );

-- Interview schedules: same leaders who can touch the parent interview
DROP POLICY IF EXISTS "Elevated roles can manage interview schedules" ON interview_schedules;

CREATE POLICY "Stake leaders manage interview schedules"
  ON interview_schedules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM interviews i
      WHERE i.id = interview_schedules.interview_id
        AND i.stake_id IS NOT NULL
        AND i.stake_id = get_user_stake_id()
        AND (
          has_elevated_role()
          OR (can_schedule_interviews() AND i.interviewer_id = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM interviews i
      WHERE i.id = interview_schedules.interview_id
        AND i.stake_id IS NOT NULL
        AND i.stake_id = get_user_stake_id()
        AND (
          has_elevated_role()
          OR (can_schedule_interviews() AND i.interviewer_id = auth.uid())
        )
    )
  );
