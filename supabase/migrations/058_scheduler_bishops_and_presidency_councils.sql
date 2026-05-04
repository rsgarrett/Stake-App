-- Handbook-style stake scheduler options: bishops council and presidents' councils.
-- Uses DELETE + INSERT instead of ON CONFLICT so it works when meeting_type has no UNIQUE constraint.

DELETE FROM public.standard_meeting_templates
WHERE meeting_type IN (
  'bishops_council',
  'elders_quorum_presidents_council',
  'relief_society_presidents_council'
);

INSERT INTO public.standard_meeting_templates (
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
) VALUES
(
  'Bishop''s Council Meeting',
  'Meeting of bishops under the stake president''s direction to coordinate salvation and welfare work in wards (see handbook).',
  'bishops_council',
  120,
  0,
  '07:00:00'::time,
  'monthly',
  1,
  ARRAY['stake_presidency'::text, 'bishops'::text],
  'leadership',
  'Handbook — Bishop''s Council',
  FALSE
),
(
  'Elders Quorum President''s Council Meeting',
  'Council of elders quorum presidents and stake elders quorum presidency for teaching and quorum work.',
  'elders_quorum_presidents_council',
  90,
  0,
  '07:00:00'::time,
  'monthly',
  1,
  ARRAY['stake_presidency'::text, 'high_council'::text, 'elders_quorum'::text],
  'leadership',
  'Handbook — Presidents'' councils',
  FALSE
),
(
  'Relief Society President''s Council Meeting',
  'Council of ward Relief Society presidents and stake Relief Society presidency for ministering and relief society work.',
  'relief_society_presidents_council',
  90,
  0,
  '07:00:00'::time,
  'monthly',
  1,
  ARRAY['stake_presidency'::text, 'high_council'::text, 'relief_society'::text],
  'leadership',
  'Handbook — Presidents'' councils',
  FALSE
);
