-- Stake presidency meetings are not held on Sundays. Remove any that were
-- scheduled on a Sunday (calendar day in America/Denver for meetings; date for schedule table).

DELETE FROM meeting_agendas
WHERE meeting_id IN (
  SELECT m.id
  FROM meetings m
  WHERE m.meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
    AND EXTRACT(
      ISODOW
      FROM ((m.scheduled_date AT TIME ZONE 'America/Denver')::date)
    ) = 7
);

DELETE FROM meetings m
WHERE m.meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
  AND EXTRACT(
    ISODOW
    FROM ((m.scheduled_date AT TIME ZONE 'America/Denver')::date)
  ) = 7;

DELETE FROM stake_meeting_schedule
WHERE meeting_type = 'stake_presidency'
  AND EXTRACT(ISODOW FROM meeting_date) = 7;
