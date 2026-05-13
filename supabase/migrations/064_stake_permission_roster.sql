-- Stake Leadership permission roster + extended app roles for stake presidency clerical team.
-- Exposes who's in which calling and maps seated users to public.users.role for RLS (has_elevated_role).

-- Optional profile columns consumed by Settings / Training UIs (idempotent).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- New PostgreSQL roles (assignments map from stake_permission_roster to users.role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'assistant_clerk'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'assistant_clerk';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'executive_secretary'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'executive_secretary';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'assistant_executive_secretary'
  ) THEN
    ALTER TYPE user_role ADD VALUE 'assistant_executive_secretary';
  END IF;
END $$;

COMMENT ON COLUMN public.users.email IS 'Optional display/email cache for roster UX; may mirror auth.';
COMMENT ON COLUMN public.users.full_name IS 'Optional display name for roster and messaging.';

-- Elevated leaders: presidency, clerks, executive assistants (meetings/scheduling/workflows).
CREATE OR REPLACE FUNCTION public.has_elevated_role()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN (
        'stake_president',
        'counselor',
        'clerk',
        'assistant_clerk',
        'executive_secretary',
        'assistant_executive_secretary'
      )
  );
$$;

CREATE TABLE IF NOT EXISTS public.stake_permission_roster (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  office_slug TEXT NOT NULL CHECK (office_slug IN (
    'stake_president',
    'first_counselor',
    'second_counselor',
    'stake_clerk',
    'assistant_stake_clerk',
    'executive_secretary',
    'assistant_executive_secretary_1',
    'assistant_executive_secretary_2'
  )),
  assigned_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stake_id, office_slug)
);

CREATE INDEX IF NOT EXISTS idx_stake_permission_roster_stake_id ON public.stake_permission_roster(stake_id);
CREATE INDEX IF NOT EXISTS idx_stake_permission_roster_assigned_user ON public.stake_permission_roster(assigned_user_id);

DROP TRIGGER IF EXISTS update_stake_permission_roster_updated_at ON public.stake_permission_roster;
CREATE TRIGGER update_stake_permission_roster_updated_at
  BEFORE UPDATE ON public.stake_permission_roster
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.stake_permission_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stake members can view permission roster" ON public.stake_permission_roster;
CREATE POLICY "Stake members can view permission roster"
  ON public.stake_permission_roster
  FOR SELECT
  TO authenticated
  USING (stake_id = public.get_user_stake_id());

DROP POLICY IF EXISTS "Elevated stake leaders manage permission roster" ON public.stake_permission_roster;
CREATE POLICY "Elevated stake leaders manage permission roster"
  ON public.stake_permission_roster
  FOR ALL
  TO authenticated
  USING (public.has_elevated_role() AND stake_id = public.get_user_stake_id())
  WITH CHECK (public.has_elevated_role() AND stake_id = public.get_user_stake_id());

-- Let elevated leaders update other users' role (same stake) for seating / rotation.
DROP POLICY IF EXISTS "Elevated leaders update stake user roles" ON public.users;
CREATE POLICY "Elevated leaders update stake user roles"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.has_elevated_role()
    AND stake_id IS NOT DISTINCT FROM public.get_user_stake_id()
    AND EXISTS (SELECT 1 FROM public.users me WHERE me.id = auth.uid() AND me.stake_id = users.stake_id)
  )
  WITH CHECK (
    stake_id IS NOT DISTINCT FROM public.get_user_stake_id()
    AND EXISTS (SELECT 1 FROM public.users me WHERE me.id = auth.uid() AND me.stake_id IS NOT DISTINCT FROM users.stake_id)
  );

-- Seed one row per office per stake (idempotent).
INSERT INTO public.stake_permission_roster (stake_id, sort_order, office_slug)
SELECT s.id AS stake_id,
  v.sort_order,
  v.office_slug::text
FROM public.stakes s
CROSS JOIN (
  VALUES
    (1, 'stake_president'),
    (2, 'first_counselor'),
    (3, 'second_counselor'),
    (4, 'stake_clerk'),
    (5, 'assistant_stake_clerk'),
    (6, 'executive_secretary'),
    (7, 'assistant_executive_secretary_1'),
    (8, 'assistant_executive_secretary_2')
) AS v(sort_order, office_slug)
ON CONFLICT (stake_id, office_slug) DO NOTHING;

COMMENT ON TABLE public.stake_permission_roster IS 'Maps handbook stake leadership offices to app users.roles for quick Settings roster + audits.';

CREATE OR REPLACE FUNCTION public.can_schedule_interviews()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN (
        'stake_president',
        'counselor',
        'clerk',
        'assistant_clerk',
        'executive_secretary',
        'assistant_executive_secretary',
        'bishop',
        'high_council',
        'auxiliary_leader'
      )
  );
$$;
