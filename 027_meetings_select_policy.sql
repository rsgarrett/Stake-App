-- Allow viewing meetings when user has no stake context (e.g., auth disabled during development)
-- Previously: only meetings where stake_id = get_user_stake_id() were visible
-- When get_user_stake_id() is NULL, no meetings with a stake_id were shown
-- Now: also show all meetings when get_user_stake_id() IS NULL (development/anon case)

DROP POLICY IF EXISTS "Users can view meetings in their stake" ON meetings;

CREATE POLICY "Users can view meetings in their stake"
  ON meetings FOR SELECT
  USING (
    stake_id = get_user_stake_id()
    OR get_user_stake_id() IS NULL
  );

-- Same fix for meeting_agendas so agenda items are visible for imported meetings
DROP POLICY IF EXISTS "Users can view agendas for meetings in their stake" ON meeting_agendas;

CREATE POLICY "Users can view agendas for meetings in their stake"
  ON meeting_agendas FOR SELECT
  USING (
    get_user_stake_id() IS NULL
    OR EXISTS (
      SELECT 1 FROM meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = get_user_stake_id()
    )
  );
