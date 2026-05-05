-- Consolidate every legacy meetings / meeting_agendas / meeting_minutes RLS
-- policy down to one canonical policy per (table, command). Older migrations
-- (013, 015, 057) layered policies and some deployments still have the
-- permissive ones around. Postgres OR's all policies for the same operation,
-- so a permissive SELECT can mask a strict INSERT failure — exactly the case
-- we hit with the silent agenda auto-seed:
--   meetings SELECT works (legacy permissive policy)
--   meeting_agendas INSERT fails (only the strict 057 policy applies)
--
-- This migration:
--   1. Backfills users.stake_id NULLs from the only stake (single-stake deploy).
--   2. Drops every known legacy/duplicate policy on the three tables.
--   3. Re-applies the canonical 057 policies idempotently.

-- ---- 1. Backfill users.stake_id NULLs --------------------------------------
DO $$
DECLARE
  default_stake_id UUID;
BEGIN
  SELECT id INTO default_stake_id
  FROM public.stakes
  ORDER BY created_at ASC
  LIMIT 1;

  IF default_stake_id IS NOT NULL THEN
    UPDATE public.users
    SET stake_id = default_stake_id
    WHERE stake_id IS NULL;
  END IF;
END $$;

-- ---- 2. Drop every known policy on the three tables -----------------------
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('meetings', 'meeting_agendas', 'meeting_minutes')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
                   pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ---- 3. Re-apply canonical 057 policies -----------------------------------

-- meetings
CREATE POLICY "meetings_select_by_role"
  ON public.meetings FOR SELECT
  USING (
    stake_id = public.get_user_stake_id()
    AND (
      NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'high_council')
      OR public.high_council_can_view_meeting_type(meetings.meeting_type)
    )
  );

CREATE POLICY "meetings_insert_elevated_stake"
  ON public.meetings FOR INSERT
  WITH CHECK (
    public.has_elevated_role()
    AND stake_id = public.get_user_stake_id()
  );

CREATE POLICY "meetings_update_elevated_stake"
  ON public.meetings FOR UPDATE
  USING (public.has_elevated_role() AND stake_id = public.get_user_stake_id())
  WITH CHECK (public.has_elevated_role() AND stake_id = public.get_user_stake_id());

CREATE POLICY "meetings_delete_elevated_stake"
  ON public.meetings FOR DELETE
  USING (public.has_elevated_role() AND stake_id = public.get_user_stake_id());

-- meeting_agendas
CREATE POLICY "meeting_agendas_select_visible_meeting"
  ON public.meeting_agendas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = public.get_user_stake_id()
      AND (
        NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'high_council')
        OR public.high_council_can_view_meeting_type(m.meeting_type)
      )
    )
  );

CREATE POLICY "meeting_agendas_insert_elevated"
  ON public.meeting_agendas FOR INSERT
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  );

CREATE POLICY "meeting_agendas_update_elevated"
  ON public.meeting_agendas FOR UPDATE
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  )
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  );

CREATE POLICY "meeting_agendas_delete_elevated"
  ON public.meeting_agendas FOR DELETE
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_agendas.meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  );

-- meeting_minutes
CREATE POLICY "meeting_minutes_select_visible_meeting"
  ON public.meeting_minutes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_minutes.meeting_id
      AND m.stake_id = public.get_user_stake_id()
      AND (
        NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'high_council')
        OR public.high_council_can_view_meeting_type(m.meeting_type)
      )
    )
  );

CREATE POLICY "meeting_minutes_insert_elevated"
  ON public.meeting_minutes FOR INSERT
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  );

CREATE POLICY "meeting_minutes_update_elevated"
  ON public.meeting_minutes FOR UPDATE
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_minutes.meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  )
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_minutes.meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  );

CREATE POLICY "meeting_minutes_delete_elevated"
  ON public.meeting_minutes FOR DELETE
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_minutes.meeting_id
      AND m.stake_id = public.get_user_stake_id()
    )
  );
