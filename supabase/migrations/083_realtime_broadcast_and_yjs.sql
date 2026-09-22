-- Live Google-Docs-style agendas: allow authenticated Realtime Broadcast /
-- Presence, and replicate yjs_documents so a missed broadcast still lands
-- within about a second via postgres_changes.

-- 1. Authenticated users may send/receive Broadcast and Presence on private channels.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime'
      AND tablename = 'messages'
      AND policyname = 'authenticated_can_receive_broadcast'
  ) THEN
    CREATE POLICY authenticated_can_receive_broadcast
      ON realtime.messages
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'realtime'
      AND tablename = 'messages'
      AND policyname = 'authenticated_can_send_broadcast'
  ) THEN
    CREATE POLICY authenticated_can_send_broadcast
      ON realtime.messages
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- 2. Persist Yjs rooms to Realtime so other tabs can apply the latest snapshot
--    even if Broadcast frames are dropped.
ALTER TABLE public.yjs_documents REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'yjs_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.yjs_documents;
  END IF;
END $$;
