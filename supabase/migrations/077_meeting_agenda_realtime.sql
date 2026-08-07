-- Enable realtime so multiple leaders watching the same meeting see agenda
-- edits (notes, items, openings) without refreshing.

ALTER TABLE public.meeting_agendas REPLICA IDENTITY FULL;
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.meeting_minutes REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'meeting_agendas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_agendas;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'meetings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'meeting_minutes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_minutes;
  END IF;
END $$;
