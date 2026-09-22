-- Stake presidency meetings belong on Thursday nights (8:00 PM Denver), matching
-- Stake Presidency Trainings and Visits + stake_meeting_schedule.
-- Migration 051/054 incorrectly placed "council prep" meetings on Wednesday 7:30 PM.

-- Drop Wednesday prep rows that would duplicate an existing Thursday SP meeting.
DELETE FROM public.meetings c
WHERE c.source_type = 'council_prep'
  AND c.meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
  AND EXISTS (
    SELECT 1
    FROM public.meetings o
    WHERE o.id <> c.id
      AND o.meeting_type IN ('stake_presidency', 'stake_presidency_meeting')
      AND o.source_type IS DISTINCT FROM 'council_prep'
      AND (o.scheduled_date AT TIME ZONE 'UTC')::date
        = ((c.scheduled_date AT TIME ZONE 'America/Denver')::date + 1)
  );

-- Remaining Wednesday 7:30 PM Denver rows → Thursday 8:00 PM Denver.
UPDATE public.meetings
SET
  scheduled_date = (
    ((scheduled_date AT TIME ZONE 'America/Denver')::date + 1)
    + time '20:00'
  ) AT TIME ZONE 'America/Denver',
  description = 'Weekly stake presidency meeting (Thursday 8:00 PM).',
  source_type = 'sp_schedule'
WHERE source_type = 'council_prep'
  AND meeting_type IN ('stake_presidency', 'stake_presidency_meeting');
