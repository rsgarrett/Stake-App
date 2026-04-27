-- High council calendar events from visit_schedule should be 6:00 AM local (America/Denver),
-- not 9:00 AM like other Sunday presidency schedule items.

UPDATE meetings m
SET scheduled_date = (
  (m.scheduled_date AT TIME ZONE 'America/Denver')::date + time '06:00:00'
) AT TIME ZONE 'America/Denver'
WHERE m.source_type = 'visit_schedule'
  AND m.meeting_type = 'high_council';
