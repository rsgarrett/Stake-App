-- Allow interview notes by the assigned interviewer OR stake-scoped leaders
-- (matches who can manage interviews after stake_id / elevated RLS).

DROP POLICY IF EXISTS "Only interviewers can view their interview notes" ON interview_notes;
DROP POLICY IF EXISTS "Only interviewers can manage their interview notes" ON interview_notes;

CREATE POLICY "Interview notes for interviewer or stake leaders"
  ON interview_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM interviews i
      WHERE i.id = interview_notes.interview_id
        AND (
          i.interviewer_id = auth.uid()
          OR (
            i.stake_id IS NOT NULL
            AND i.stake_id = get_user_stake_id()
            AND (
              has_elevated_role()
              OR EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid()
                  AND u.role IN ('bishop', 'high_council', 'auxiliary_leader')
              )
            )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM interviews i
      WHERE i.id = interview_notes.interview_id
        AND (
          i.interviewer_id = auth.uid()
          OR (
            i.stake_id IS NOT NULL
            AND i.stake_id = get_user_stake_id()
            AND (
              has_elevated_role()
              OR EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid()
                  AND u.role IN ('bishop', 'high_council', 'auxiliary_leader')
              )
            )
          )
        )
    )
  );
