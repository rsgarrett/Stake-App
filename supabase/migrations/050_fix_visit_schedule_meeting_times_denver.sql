-- Visit-schedule meetings (Sunday ward visits, teaching, etc.) were inserted as
--   (visit_date || ' 09:00:00')::timestamptz
-- which PostgreSQL treats as 09:00 **UTC**. In US Mountain that reads as 3:00 AM local.
-- Re-anchor 9:00 AM to **America/Denver** (stake default) for rows still at 09:00 UTC.
--
-- Idempotent: only rows whose UTC wall-clock time is exactly 09:00 are updated; after
-- update they no longer match and won't be changed again.

UPDATE meetings m
SET scheduled_date = (
  (m.scheduled_date::date + interval '9 hours')::timestamp
  AT TIME ZONE 'America/Denver'
)
WHERE m.source_type = 'visit_schedule'
  AND ((m.scheduled_date AT TIME ZONE 'UTC')::time = time '09:00:00');
