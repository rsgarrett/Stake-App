-- Live (Google-Docs-style) standing meeting agendas.
--
-- 1. The standalone agenda templates (High Council, Stake Council, Missionary /
--    Temple & FH / RS coordination, Stake Presidency template) were writing to
--    `meeting_agendas`, but that table is the per-meeting agenda-items table
--    (meeting_id, item_order, title, ...) — every save silently failed. Give
--    these agendas their own backup table keyed by (meeting_type, meeting_date).
--
-- 2. The live layer persists Yjs docs in `yjs_documents` under rooms named
--    `agenda:{meeting_type}:{date}` (and `agenda:sp:{date}`), but the RLS
--    policies from 078 only allow `mtg:{meeting_uuid}:*` rooms. Add policies
--    for the standing-agenda rooms so restore + persistence work.

-- ---- 1. Backup table -------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.standing_meeting_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TEXT,
  presiding TEXT,
  conducting TEXT,
  opening_hymn TEXT,
  opening_prayer TEXT,
  closing_prayer TEXT,
  stake_vision TEXT,
  handbook_trainer TEXT,
  handbook_topic TEXT,
  calendar_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  training JSONB NOT NULL DEFAULT '[]'::jsonb,
  discussion_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  closing_remarks TEXT,
  general_notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_type, meeting_date)
);

DROP TRIGGER IF EXISTS update_standing_meeting_agendas_updated_at ON public.standing_meeting_agendas;
CREATE TRIGGER update_standing_meeting_agendas_updated_at
  BEFORE UPDATE ON public.standing_meeting_agendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.standing_meeting_agendas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "standing_agendas_select_authenticated" ON public.standing_meeting_agendas;
CREATE POLICY "standing_agendas_select_authenticated"
  ON public.standing_meeting_agendas FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "standing_agendas_insert_elevated" ON public.standing_meeting_agendas;
CREATE POLICY "standing_agendas_insert_elevated"
  ON public.standing_meeting_agendas FOR INSERT
  WITH CHECK (public.has_elevated_role());

DROP POLICY IF EXISTS "standing_agendas_update_elevated" ON public.standing_meeting_agendas;
CREATE POLICY "standing_agendas_update_elevated"
  ON public.standing_meeting_agendas FOR UPDATE
  USING (public.has_elevated_role())
  WITH CHECK (public.has_elevated_role());

DROP POLICY IF EXISTS "standing_agendas_delete_elevated" ON public.standing_meeting_agendas;
CREATE POLICY "standing_agendas_delete_elevated"
  ON public.standing_meeting_agendas FOR DELETE
  USING (public.has_elevated_role());

-- ---- 2. One Stake Presidency agenda per Thursday (enables autosave upsert) --

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'sp_meeting_agendas_meeting_date_key'
  ) THEN
    ALTER TABLE public.sp_meeting_agendas
      ADD CONSTRAINT sp_meeting_agendas_meeting_date_key UNIQUE (meeting_date);
  END IF;
END $$;

-- ---- 3. Yjs rooms for standing agendas ------------------------------------

DROP POLICY IF EXISTS "yjs_documents_select_standing_agenda" ON public.yjs_documents;
CREATE POLICY "yjs_documents_select_standing_agenda"
  ON public.yjs_documents FOR SELECT
  TO authenticated
  USING (room LIKE 'agenda:%');

DROP POLICY IF EXISTS "yjs_documents_insert_standing_agenda" ON public.yjs_documents;
CREATE POLICY "yjs_documents_insert_standing_agenda"
  ON public.yjs_documents FOR INSERT
  WITH CHECK (room LIKE 'agenda:%' AND public.has_elevated_role());

DROP POLICY IF EXISTS "yjs_documents_update_standing_agenda" ON public.yjs_documents;
CREATE POLICY "yjs_documents_update_standing_agenda"
  ON public.yjs_documents FOR UPDATE
  USING (room LIKE 'agenda:%' AND public.has_elevated_role())
  WITH CHECK (room LIKE 'agenda:%' AND public.has_elevated_role());
