-- Each permission seat records the name of the current calling holder, so the
-- Settings roster shows who holds the office even before they have an app login.
-- The calling tracker updates these names when a calling / release is completed.

ALTER TABLE public.stake_permission_roster
  ADD COLUMN IF NOT EXISTS person_name TEXT;

COMMENT ON COLUMN public.stake_permission_roster.person_name IS
  'Current calling holder for this seat (shown even without a login). Synced by the calling tracker on completed callings/releases.';

-- ---- Seed current holders (fixed handbook offices) ----
UPDATE public.stake_permission_roster r
SET person_name = v.name
FROM (VALUES
  ('first_counselor',                   'President Chandler'),
  ('second_counselor',                  'President Williams'),
  ('stake_clerk',                       'Nathan Lee'),
  ('assistant_stake_clerk',             'Jeffery Bunderson'),
  ('executive_secretary',               'Brad Lester'),
  ('assistant_executive_secretary_1',   'Chriss Rentmeister'),
  ('assistant_executive_secretary_2',   'Darin Winegar')
) AS v(office_slug, name)
WHERE r.office_slug = v.office_slug
  AND coalesce(r.person_name, '') = '';

-- Stake president seat: take the linked account's name when present.
UPDATE public.stake_permission_roster r
SET person_name = u.full_name
FROM public.users u
WHERE r.office_slug = 'stake_president'
  AND r.assigned_user_id = u.id
  AND coalesce(r.person_name, '') = ''
  AND coalesce(u.full_name, '') <> '';

-- ---- Seed high council seats from the active HC roster (display order) ----
WITH seats AS (
  SELECT id,
         row_number() OVER (
           ORDER BY (substring(office_slug FROM 'high_council_([0-9]+)'))::int
         ) AS rn
  FROM public.stake_permission_roster
  WHERE office_slug ~ '^high_council_[0-9]+$'
    AND coalesce(person_name, '') = ''
),
members AS (
  SELECT member_name,
         row_number() OVER (ORDER BY display_order NULLS LAST, member_name) AS rn
  FROM public.high_council_members
  WHERE status = 'active'
    AND member_name NOT IN (
      SELECT person_name FROM public.stake_permission_roster WHERE coalesce(person_name, '') <> ''
    )
)
UPDATE public.stake_permission_roster r
SET person_name = m.member_name
FROM seats s
JOIN members m ON m.rn = s.rn
WHERE r.id = s.id;
