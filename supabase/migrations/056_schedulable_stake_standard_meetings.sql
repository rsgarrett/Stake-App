-- Narrow catalog labeling + stake finance meeting for calendar scheduling UX.
-- Aligns handbook template titles with stake coordinating-council wording.

INSERT INTO standard_meeting_templates (
  title,
  description,
  meeting_type,
  default_duration_minutes,
  default_day_of_week,
  default_time_of_day,
  default_recurrence_type,
  default_recurrence_interval,
  viewable_by_roles,
  category,
  handbook_reference,
  is_required
)
VALUES (
  'Stake Finance Meeting',
  'Stake coordinating council on finances, budgeting, auditing, and related matters.',
  'stake_finance_meeting',
  90,
  0,
  '07:00:00',
  'monthly',
  1,
  ARRAY['stake_presidency', 'bishops']::text[],
  'leadership',
  'Handbook 34',
  TRUE
)
ON CONFLICT (meeting_type)
DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

UPDATE standard_meeting_templates SET title = 'High Council Meeting'
WHERE meeting_type = 'high_council_meeting';

UPDATE standard_meeting_templates SET title = 'Stake Relief Society Coordination Meeting'
WHERE meeting_type = 'stake_relief_society_presidency';

UPDATE standard_meeting_templates SET title = 'Stake Missionary Correlation Meeting'
WHERE meeting_type = 'missionary_correlation';

UPDATE standard_meeting_templates SET title = 'Stake Temple and Family History Correlation Meeting'
WHERE meeting_type = 'temple_family_history';
