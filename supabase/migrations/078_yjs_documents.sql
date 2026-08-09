-- Free Docs-style collaboration: Yjs document persistence for @supabase-labs/y-supabase.
-- Rooms use mtg:{meeting_id}:minutes and mtg:{meeting_id}:agenda.

CREATE TABLE IF NOT EXISTS public.yjs_documents (
  room text PRIMARY KEY,
  state text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.yjs_room_meeting_id(room text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN room ~* '^mtg:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:'
    THEN substring(room from 5 for 36)::uuid
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.touch_yjs_documents_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS yjs_documents_touch_updated_at ON public.yjs_documents;
CREATE TRIGGER yjs_documents_touch_updated_at
  BEFORE UPDATE ON public.yjs_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_yjs_documents_updated_at();

ALTER TABLE public.yjs_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "yjs_documents_select_visible_meeting" ON public.yjs_documents;
CREATE POLICY "yjs_documents_select_visible_meeting"
  ON public.yjs_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = public.yjs_room_meeting_id(yjs_documents.room)
        AND m.stake_id = public.get_user_stake_id()
        AND (
          NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'high_council')
          OR public.high_council_can_view_meeting_type(m.meeting_type)
        )
    )
  );

DROP POLICY IF EXISTS "yjs_documents_insert_elevated" ON public.yjs_documents;
CREATE POLICY "yjs_documents_insert_elevated"
  ON public.yjs_documents FOR INSERT
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = public.yjs_room_meeting_id(room)
        AND m.stake_id = public.get_user_stake_id()
    )
  );

DROP POLICY IF EXISTS "yjs_documents_update_elevated" ON public.yjs_documents;
CREATE POLICY "yjs_documents_update_elevated"
  ON public.yjs_documents FOR UPDATE
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = public.yjs_room_meeting_id(yjs_documents.room)
        AND m.stake_id = public.get_user_stake_id()
    )
  )
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = public.yjs_room_meeting_id(yjs_documents.room)
        AND m.stake_id = public.get_user_stake_id()
    )
  );

DROP POLICY IF EXISTS "yjs_documents_delete_elevated" ON public.yjs_documents;
CREATE POLICY "yjs_documents_delete_elevated"
  ON public.yjs_documents FOR DELETE
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = public.yjs_room_meeting_id(yjs_documents.room)
        AND m.stake_id = public.get_user_stake_id()
    )
  );
