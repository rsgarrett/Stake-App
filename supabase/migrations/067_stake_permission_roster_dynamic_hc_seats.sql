-- Allow any high_council_<positive integer> seat slug so leaders can add/remove HC seats
-- without a fixed cap (replaces the enumerated list from 066).

ALTER TABLE public.stake_permission_roster DROP CONSTRAINT IF EXISTS stake_permission_roster_office_slug_check;

DO $$
DECLARE
  cname text;
BEGIN
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'stake_permission_roster'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%office_slug%'
  LOOP
    EXECUTE format('ALTER TABLE public.stake_permission_roster DROP CONSTRAINT IF EXISTS %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.stake_permission_roster
  ADD CONSTRAINT stake_permission_roster_office_slug_check
  CHECK (
    office_slug IN (
      'stake_president',
      'first_counselor',
      'second_counselor',
      'stake_clerk',
      'assistant_stake_clerk',
      'executive_secretary',
      'assistant_executive_secretary_1',
      'assistant_executive_secretary_2'
    )
    OR office_slug ~ '^high_council_[0-9]+$'
  );

COMMENT ON CONSTRAINT stake_permission_roster_office_slug_check ON public.stake_permission_roster IS
  'Handbook offices are fixed slugs; high council seats use high_council_<n> (any positive integer).';
