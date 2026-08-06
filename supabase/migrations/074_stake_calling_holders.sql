-- Stake-wide roster of who currently holds each calling. Powers the
-- "Replaces" dropdown on the submit-name form so it only shows people
-- currently called to the selected calling. Updated automatically when
-- the calling tracker completes a calling or release.

CREATE TABLE IF NOT EXISTS public.stake_calling_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  organization TEXT,
  calling_name TEXT NOT NULL,
  person_name TEXT NOT NULL,
  ward TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'released')),
  source_calling_id UUID REFERENCES public.callings(id) ON DELETE SET NULL,
  called_date DATE,
  released_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stake_calling_holders_active_idx
  ON public.stake_calling_holders (stake_id, calling_name)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS stake_calling_holders_person_idx
  ON public.stake_calling_holders (stake_id, person_name);

COMMENT ON TABLE public.stake_calling_holders IS
  'Current (and released) holders of stake callings — drives Replaces dropdown filtering.';

ALTER TABLE public.stake_calling_holders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stake_calling_holders_select ON public.stake_calling_holders;
CREATE POLICY stake_calling_holders_select ON public.stake_calling_holders
  FOR SELECT TO authenticated
  USING (
    stake_id IN (SELECT stake_id FROM public.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS stake_calling_holders_write ON public.stake_calling_holders;
CREATE POLICY stake_calling_holders_write ON public.stake_calling_holders
  FOR ALL TO authenticated
  USING (
    public.has_elevated_role()
    AND stake_id IN (SELECT stake_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    public.has_elevated_role()
    AND stake_id IN (SELECT stake_id FROM public.users WHERE id = auth.uid())
  );

-- ---- Seed from active high councilors ----
INSERT INTO public.stake_calling_holders (
  stake_id, organization, calling_name, person_name, status, called_date
)
SELECT
  h.stake_id,
  'High Council',
  'High Councilor',
  h.member_name,
  'active',
  h.called_date
FROM public.high_council_members h
WHERE h.status = 'active'
  AND coalesce(trim(h.member_name), '') <> ''
  AND NOT EXISTS (
    SELECT 1 FROM public.stake_calling_holders x
    WHERE x.stake_id = h.stake_id
      AND x.status = 'active'
      AND x.calling_name = 'High Councilor'
      AND lower(x.person_name) = lower(h.member_name)
  );

-- ---- Seed from permission roster seats (never stake president) ----
INSERT INTO public.stake_calling_holders (
  stake_id, organization, calling_name, person_name, status
)
SELECT
  r.stake_id,
  CASE
    WHEN r.office_slug LIKE 'high_council_%' THEN 'High Council'
    ELSE 'Stake Presidency'
  END,
  CASE r.office_slug
    WHEN 'first_counselor' THEN 'First Counselor in the Stake Presidency'
    WHEN 'second_counselor' THEN 'Second Counselor in the Stake Presidency'
    WHEN 'stake_clerk' THEN 'Stake Clerk'
    WHEN 'assistant_stake_clerk' THEN 'Assistant Stake Clerk'
    WHEN 'executive_secretary' THEN 'Stake Executive Secretary'
    WHEN 'assistant_executive_secretary_1' THEN 'Assistant Stake Executive Secretary'
    WHEN 'assistant_executive_secretary_2' THEN 'Assistant Stake Executive Secretary'
    ELSE 'High Councilor'
  END,
  trim(r.person_name),
  'active'
FROM public.stake_permission_roster r
WHERE coalesce(trim(r.person_name), '') <> ''
  AND r.office_slug <> 'stake_president'
  AND NOT EXISTS (
    SELECT 1 FROM public.stake_calling_holders x
    WHERE x.stake_id = r.stake_id
      AND x.status = 'active'
      AND lower(x.person_name) = lower(trim(r.person_name))
      AND x.calling_name = CASE r.office_slug
        WHEN 'first_counselor' THEN 'First Counselor in the Stake Presidency'
        WHEN 'second_counselor' THEN 'Second Counselor in the Stake Presidency'
        WHEN 'stake_clerk' THEN 'Stake Clerk'
        WHEN 'assistant_stake_clerk' THEN 'Assistant Stake Clerk'
        WHEN 'executive_secretary' THEN 'Stake Executive Secretary'
        WHEN 'assistant_executive_secretary_1' THEN 'Assistant Stake Executive Secretary'
        WHEN 'assistant_executive_secretary_2' THEN 'Assistant Stake Executive Secretary'
        ELSE 'High Councilor'
      END
  );

-- ---- Seed from completed/active callings already in the tracker ----
INSERT INTO public.stake_calling_holders (
  stake_id, organization, calling_name, person_name, ward, status,
  source_calling_id, called_date
)
SELECT
  c.stake_id,
  c.organization,
  c.calling_name,
  c.person_name,
  c.ward,
  'active',
  c.id,
  coalesce(c.set_apart_date, c.sustained_date, c.created_at::date)
FROM public.callings c
WHERE c.status = 'active'
  AND coalesce(trim(c.person_name), '') <> ''
  AND coalesce(trim(c.calling_name), '') <> ''
  AND c.stake_id IS NOT NULL
  AND lower(c.calling_name) NOT LIKE '%stake president%'
  AND NOT EXISTS (
    SELECT 1 FROM public.stake_calling_holders x
    WHERE x.stake_id = c.stake_id
      AND x.status = 'active'
      AND lower(x.person_name) = lower(c.person_name)
      AND lower(x.calling_name) = lower(c.calling_name)
  );
