-- High councilors: own-seat R&R only; no calling tracker or interviews access.
-- Presidency / clerks / exec secs (has_elevated_role) keep full R&R + those modules.

-- ---- helpers ----
CREATE OR REPLACE FUNCTION public.is_high_council_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role::text = 'high_council'
  );
$$;

COMMENT ON FUNCTION public.is_high_council_role() IS
  'True when the signed-in user has the high_council app role.';

-- Direct HC roster rows for the current user (email, name, or permission seat person_name).
CREATE OR REPLACE FUNCTION public.hc_matched_member_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.id
  FROM public.high_council_members h
  INNER JOIN public.users u ON u.id = auth.uid()
  WHERE u.stake_id IS NOT NULL
    AND h.stake_id = u.stake_id
    AND (
      (
        u.email IS NOT NULL
        AND h.email IS NOT NULL
        AND lower(trim(u.email)) = lower(trim(h.email))
      )
      OR (
        u.full_name IS NOT NULL
        AND lower(trim(u.full_name)) = lower(trim(h.member_name))
      )
      OR EXISTS (
        SELECT 1
        FROM public.stake_permission_roster r
        WHERE r.assigned_user_id = u.id
          AND r.stake_id = u.stake_id
          AND r.office_slug LIKE 'high_council_%'
          AND r.person_name IS NOT NULL
          AND lower(trim(r.person_name)) = lower(trim(h.member_name))
      )
    );
$$;

-- Own seat + predecessor history (replaced_member_id chain) for reading past R&R.
CREATE OR REPLACE FUNCTION public.hc_own_seat_member_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE seat AS (
    SELECT h.id, h.replaced_member_id
    FROM public.high_council_members h
    WHERE h.id IN (SELECT public.hc_matched_member_ids())
    UNION ALL
    SELECT pred.id, pred.replaced_member_id
    FROM public.high_council_members pred
    INNER JOIN seat s ON pred.id = s.replaced_member_id
  )
  SELECT id FROM seat;
$$;

-- ---- high_council_members ----
ALTER TABLE public.high_council_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS high_council_members_select ON public.high_council_members;
DROP POLICY IF EXISTS high_council_members_write ON public.high_council_members;
DROP POLICY IF EXISTS "Allow authenticated users to manage high_council_members" ON public.high_council_members;
DROP POLICY IF EXISTS "Users can view high council members in their stake" ON public.high_council_members;

CREATE POLICY high_council_members_select ON public.high_council_members
  FOR SELECT TO authenticated
  USING (
    stake_id = public.get_user_stake_id()
    AND (
      public.has_elevated_role()
      OR id IN (SELECT public.hc_own_seat_member_ids())
    )
  );

CREATE POLICY high_council_members_write ON public.high_council_members
  FOR ALL TO authenticated
  USING (
    public.has_elevated_role()
    AND stake_id = public.get_user_stake_id()
  )
  WITH CHECK (
    public.has_elevated_role()
    AND stake_id = public.get_user_stake_id()
  );

-- ---- hc_weekly_reports ----
ALTER TABLE public.hc_weekly_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hc_weekly_reports_select ON public.hc_weekly_reports;
DROP POLICY IF EXISTS hc_weekly_reports_insert ON public.hc_weekly_reports;
DROP POLICY IF EXISTS hc_weekly_reports_update ON public.hc_weekly_reports;
DROP POLICY IF EXISTS hc_weekly_reports_delete ON public.hc_weekly_reports;
DROP POLICY IF EXISTS "Allow authenticated users to manage hc_weekly_reports" ON public.hc_weekly_reports;

CREATE POLICY hc_weekly_reports_select ON public.hc_weekly_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.high_council_members h
      WHERE h.id = hc_weekly_reports.member_id
        AND h.stake_id = public.get_user_stake_id()
        AND (
          public.has_elevated_role()
          OR h.id IN (SELECT public.hc_own_seat_member_ids())
        )
    )
  );

-- HC may submit only for their matched (current) seat — not predecessor ids.
CREATE POLICY hc_weekly_reports_insert ON public.hc_weekly_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.high_council_members h
      WHERE h.id = member_id
        AND h.stake_id = public.get_user_stake_id()
        AND (
          public.has_elevated_role()
          OR h.id IN (SELECT public.hc_matched_member_ids())
        )
    )
  );

CREATE POLICY hc_weekly_reports_update ON public.hc_weekly_reports
  FOR UPDATE TO authenticated
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.high_council_members h
      WHERE h.id = hc_weekly_reports.member_id
        AND h.stake_id = public.get_user_stake_id()
    )
  )
  WITH CHECK (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.high_council_members h
      WHERE h.id = member_id
        AND h.stake_id = public.get_user_stake_id()
    )
  );

CREATE POLICY hc_weekly_reports_delete ON public.hc_weekly_reports
  FOR DELETE TO authenticated
  USING (
    public.has_elevated_role()
    AND EXISTS (
      SELECT 1 FROM public.high_council_members h
      WHERE h.id = hc_weekly_reports.member_id
        AND h.stake_id = public.get_user_stake_id()
    )
  );

-- ---- hc_report_responses (presidency responses) ----
ALTER TABLE public.hc_report_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hc_report_responses_select ON public.hc_report_responses;
DROP POLICY IF EXISTS hc_report_responses_write ON public.hc_report_responses;
DROP POLICY IF EXISTS "Allow authenticated users to manage hc_report_responses" ON public.hc_report_responses;

CREATE POLICY hc_report_responses_select ON public.hc_report_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.hc_weekly_reports r
      INNER JOIN public.high_council_members h ON h.id = r.member_id
      WHERE r.id = hc_report_responses.report_id
        AND h.stake_id = public.get_user_stake_id()
        AND (
          public.has_elevated_role()
          OR h.id IN (SELECT public.hc_own_seat_member_ids())
        )
    )
  );

CREATE POLICY hc_report_responses_write ON public.hc_report_responses
  FOR ALL TO authenticated
  USING (public.has_elevated_role())
  WITH CHECK (public.has_elevated_role());

-- ---- callings: high councilors cannot read the tracker ----
DROP POLICY IF EXISTS "Users can view callings in their stake" ON public.callings;
DROP POLICY IF EXISTS callings_select_stake_non_hc ON public.callings;

CREATE POLICY callings_select_stake_non_hc ON public.callings
  FOR SELECT TO authenticated
  USING (
    stake_id = public.get_user_stake_id()
    AND NOT public.is_high_council_role()
  );

-- ---- interviews: remove high council access ----
CREATE OR REPLACE FUNCTION public.can_schedule_interviews()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role::text IN (
        'stake_president',
        'counselor',
        'clerk',
        'assistant_clerk',
        'executive_secretary',
        'assistant_executive_secretary',
        'bishop',
        'auxiliary_leader'
      )
  );
$$;

DROP POLICY IF EXISTS "Users can view interviews in their stake" ON public.interviews;
CREATE POLICY "Users can view interviews in their stake"
  ON public.interviews
  FOR SELECT
  TO authenticated
  USING (
    NOT public.is_high_council_role()
    AND (
      interviewer_id = auth.uid()
      OR (stake_id IS NOT NULL AND stake_id = public.get_user_stake_id())
    )
  );

DROP POLICY IF EXISTS "Interview notes for interviewer or stake leaders" ON public.interview_notes;
CREATE POLICY "Interview notes for interviewer or stake leaders"
  ON public.interview_notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.interviews i
      WHERE i.id = interview_notes.interview_id
        AND NOT public.is_high_council_role()
        AND (
          i.interviewer_id = auth.uid()
          OR (
            i.stake_id IS NOT NULL
            AND i.stake_id = public.get_user_stake_id()
            AND (
              public.has_elevated_role()
              OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                  AND u.role::text IN ('bishop', 'auxiliary_leader')
              )
            )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.interviews i
      WHERE i.id = interview_notes.interview_id
        AND NOT public.is_high_council_role()
        AND (
          i.interviewer_id = auth.uid()
          OR (
            i.stake_id IS NOT NULL
            AND i.stake_id = public.get_user_stake_id()
            AND (
              public.has_elevated_role()
              OR EXISTS (
                SELECT 1 FROM public.users u
                WHERE u.id = auth.uid()
                  AND u.role::text IN ('bishop', 'auxiliary_leader')
              )
            )
          )
        )
    )
  );
