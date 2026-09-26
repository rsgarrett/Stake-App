-- Publish every table people edit together so Realtime can push row
-- changes. A short client poll still works if a table is already published.
-- Shared-document rooms named agenda:row:* and agenda:sheet:* reuse the
-- standing-agenda policies from 084 (room LIKE 'agenda:%').

DO $$
DECLARE
  tables text[] := ARRAY[
    'callings',
    'conference_sessions',
    'conference_program_items',
    'conference_ministering_visits',
    'conference_notes',
    'conference_name_suggestions',
    'special_events',
    'interviews',
    'interview_notes',
    'high_council_members',
    'hc_weekly_reports',
    'hc_report_responses',
    'mission_ready_missionaries',
    'mission_ready_progress',
    'welfare_cases',
    'self_reliance_participants',
    'standing_meeting_agendas'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
