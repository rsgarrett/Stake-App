-- Publish the remaining shared tables so Realtime pushes row changes
-- (permissions roster, training compliance, notifications, workflow log).
-- Same idempotent pattern as 085; safe to run more than once.

DO $$
DECLARE
  tables text[] := ARRAY[
    'stake_permission_roster',
    'users',
    'training_completions',
    'calling_notifications',
    'calling_workflow_log',
    'handbook_sections'
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
