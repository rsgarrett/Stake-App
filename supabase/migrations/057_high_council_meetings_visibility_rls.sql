-- High councilors: SELECT only High Council + Stake Council meetings (and related agendas/minutes).
-- Writes on meetings / meeting_agendas / meeting_minutes: stake presidency, counselors, clerks only (has_elevated_role).
-- Replaces permissive "Allow authenticated users to manage meetings" from 015.

CREATE OR REPLACE FUNCTION public.normalized_meeting_type_slug(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(regexp_replace(trim(coalesce(p, '')), '[\s-]+', '_', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.high_council_can_view_meeting_type(p_meeting_type text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.normalized_meeting_type_slug(p_meeting_type) = ANY (ARRAY[
    'high_council_meeting',
    'high_council',
    'stake_council',
    'stake_council_meeting'
  ]::text[]);
$$;

-- ---- meetings ----
DROP POLICY IF EXISTS "Allow authenticated users to manage meetings" ON public.meetings;
DROP POLICY IF EXISTS "Elevated roles can manage meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can view meetings in their stake" ON public.meetings;

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

-- ---- meeting_agendas ----
DROP POLICY IF EXISTS "Users can view agendas for meetings in their stake" ON public.meeting_agendas;
DROP POLICY IF EXISTS "Elevated roles can manage agendas" ON public.meeting_agendas;

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

-- ---- meeting_minutes ----
DROP POLICY IF EXISTS "Users can view minutes for meetings in their stake" ON public.meeting_minutes;
DROP POLICY IF EXISTS "Elevated roles can manage minutes" ON public.meeting_minutes;

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
