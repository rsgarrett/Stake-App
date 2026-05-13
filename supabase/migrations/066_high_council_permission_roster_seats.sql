-- High council roster seats: stake leaders assign app role `high_council` via Settings
-- (meetings remain read/write-gated separately; HC is not added to has_elevated_role()).

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
      'assistant_executive_secretary_2',
      'high_council_1',
      'high_council_2',
      'high_council_3',
      'high_council_4',
      'high_council_5',
      'high_council_6',
      'high_council_7',
      'high_council_8',
      'high_council_9',
      'high_council_10',
      'high_council_11',
      'high_council_12'
    )
  );

INSERT INTO public.stake_permission_roster (stake_id, sort_order, office_slug)
SELECT s.id AS stake_id,
  v.sort_order,
  v.office_slug::text
FROM public.stakes s
CROSS JOIN (
  VALUES
    (9, 'high_council_1'),
    (10, 'high_council_2'),
    (11, 'high_council_3'),
    (12, 'high_council_4'),
    (13, 'high_council_5'),
    (14, 'high_council_6'),
    (15, 'high_council_7'),
    (16, 'high_council_8'),
    (17, 'high_council_9'),
    (18, 'high_council_10'),
    (19, 'high_council_11'),
    (20, 'high_council_12')
) AS v(sort_order, office_slug)
ON CONFLICT (stake_id, office_slug) DO NOTHING;
