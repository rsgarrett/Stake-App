-- Structured responsibility fields on high_council_members (Stake App HC roster UI).
-- stewardships          = principal assignment title(s)
-- assigned_wards        = ward / coordinating context (spreadsheet ward columns)
-- presidency_oversight  = presidency member(s) supervising that assignment row
-- program_assignment    = ALC, YLC, ALC/YLC, etc.
-- stewardship_notes     = supplementary duties (building scheduler, ushering, seminary, …)

ALTER TABLE public.high_council_members
  ADD COLUMN IF NOT EXISTS presidency_oversight TEXT,
  ADD COLUMN IF NOT EXISTS program_assignment TEXT,
  ADD COLUMN IF NOT EXISTS stewardship_notes TEXT;

COMMENT ON COLUMN public.high_council_members.presidency_oversight IS 'Stake presidency steward over this assignment line.';
COMMENT ON COLUMN public.high_council_members.program_assignment IS 'Program label e.g. ALC, YLC, ALC/YLC.';
COMMENT ON COLUMN public.high_council_members.stewardship_notes IS 'Additional duties notes (building scheduler, ushering, seminary, etc.).';

-- Backfill: updates existing rows matched by normalized name.
UPDATE public.high_council_members SET
  presidency_oversight = 'President Garrett',
  stewardships = 'Missionary Work',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 12th Ward',
  stewardship_notes = NULL
WHERE lower(trim(member_name)) = lower(trim('John Bates'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Garrett',
  stewardships = 'Temple & Family History Work',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 23rd Ward',
  stewardship_notes = NULL
WHERE lower(trim(member_name)) = lower(trim('Gaylan Colledge'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Garrett',
  stewardships = 'Physical Facilities Representative',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 18th Ward; ALC group 19th Ward',
  stewardship_notes = 'Building scheduler · Ushering for stake meetings'
WHERE lower(trim(member_name)) = lower(trim('Daniel Monroy'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Chandler',
  stewardships = 'Stake Young Men Presidency',
  program_assignment = 'YLC',
  assigned_wards = 'Coordinating 17th Ward',
  stewardship_notes = NULL
WHERE lower(trim(member_name)) = lower(trim('Ryan Garff'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Williams',
  stewardships = 'Elders Quorum Presidency Work',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 19th Ward; ALC group 8th Ward',
  stewardship_notes = NULL
WHERE lower(trim(member_name)) = lower(trim('Mike Arave'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Williams',
  stewardships = 'Self-Reliance & Employment Services',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 23rd Ward; ALC group 12th Ward',
  stewardship_notes = NULL
WHERE lower(trim(member_name)) = lower(trim('Kent Jensen'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Williams',
  stewardships = 'Young Single Adults',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 23rd Ward',
  stewardship_notes = 'Single adult wards / programs as assigned.'
WHERE lower(trim(member_name)) = lower(trim('Steve Huff'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Williams',
  stewardships = 'Stake Music Coordinator',
  program_assignment = 'ALC',
  assigned_wards = 'Coordinating 8th Ward; ALC group 12th Ward',
  stewardship_notes = 'Stake assignments where applicable (temple, cannery, blood drive, CSM, etc.). Preparedness/city liaison (as directed).'
WHERE lower(trim(member_name)) = lower(trim('James Reed'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Chandler & President Williams',
  stewardships = 'Activities Committee Chairman',
  program_assignment = 'ALC / YLC',
  assigned_wards = 'Coordinating 22nd Ward; wards in group 23rd',
  stewardship_notes = NULL
WHERE lower(trim(member_name)) = lower(trim('Rick Smith'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Chandler',
  stewardships = 'Stake Primary Representative',
  program_assignment = 'YLC',
  assigned_wards = 'Coordinating 17th Ward; wards in group 8th',
  stewardship_notes = 'Ward baptisms coordination as directed.'
WHERE lower(trim(member_name)) = lower(trim('Kyle Young'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Chandler',
  stewardships = 'Young Women Advisor Work',
  program_assignment = 'YLC',
  assigned_wards = 'Coordinating 12th Ward; wards in group 23rd',
  stewardship_notes = 'Stake camp · FSY conference'
WHERE lower(trim(member_name)) = lower(trim('Matt Youngman'));

UPDATE public.high_council_members SET
  presidency_oversight = 'President Chandler',
  stewardships = 'Stake Sunday School President',
  program_assignment = 'YLC',
  assigned_wards = 'Coordinating 8th Ward',
  stewardship_notes = 'Communications committee · Seminary · missionary preparation instruction · institute & adult religion classes as assigned.'
WHERE lower(trim(member_name)) = lower(trim('New HC'));

-- Insert roster rows that are not present yet (idempotent by name).
DO $$
DECLARE
  v_stake_id UUID;
  v_ord INTEGER;
BEGIN
  SELECT id INTO v_stake_id FROM public.stakes ORDER BY created_at NULLS LAST LIMIT 1;
  IF v_stake_id IS NULL THEN
    RAISE NOTICE '063: no stake row found — skipping HC inserts.';
    RETURN;
  END IF;

  SELECT COALESCE(MAX(display_order), 0) INTO v_ord FROM public.high_council_members WHERE stake_id = v_stake_id;

  INSERT INTO public.high_council_members (
    member_name, email, stake_id,
    stewardships, stewardship_notes, presidency_oversight, program_assignment, assigned_wards,
    status, called_date, display_order
  )
  SELECT z.*
  FROM (
    SELECT 'Kent Jensen'::text AS member_name,
      NULL::text AS email,
      v_stake_id AS stake_id,
      'Self-Reliance & Employment Services'::text,
      NULL::text,
      'President Williams'::text,
      'ALC'::text,
      'Coordinating 23rd Ward; ALC group 12th Ward'::text,
      'active'::text,
      CURRENT_DATE,
      v_ord + 1
    UNION ALL
    SELECT 'Steve Huff', NULL, v_stake_id, 'Young Single Adults', 'Single adult wards / programs as assigned.',
      'President Williams', 'ALC', 'Coordinating 23rd Ward', 'active', CURRENT_DATE, v_ord + 2
    UNION ALL
    SELECT 'James Reed', NULL, v_stake_id, 'Stake Music Coordinator',
      'Stake assignments where applicable (temple, cannery, blood drive, CSM, etc.). Preparedness/city liaison (as directed).',
      'President Williams', 'ALC', 'Coordinating 8th Ward; ALC group 12th Ward', 'active', CURRENT_DATE, v_ord + 3
    UNION ALL
    SELECT 'Rick Smith', NULL, v_stake_id, 'Activities Committee Chairman', NULL,
      'President Chandler & President Williams', 'ALC / YLC', 'Coordinating 22nd Ward; wards in group 23rd', 'active', CURRENT_DATE, v_ord + 4
    UNION ALL
    SELECT 'Kyle Young', NULL, v_stake_id, 'Stake Primary Representative', 'Ward baptisms coordination as directed.',
      'President Chandler', 'YLC', 'Coordinating 17th Ward; wards in group 8th', 'active', CURRENT_DATE, v_ord + 5
    UNION ALL
    SELECT 'New HC', NULL, v_stake_id, 'Stake Sunday School President',
      'Communications committee · Seminary · missionary preparation instruction · institute & adult religion classes as assigned.',
      'President Chandler', 'YLC', 'Coordinating 8th Ward', 'active', CURRENT_DATE, v_ord + 6
  ) AS z(member_name, email, stake_id, stewardships, stewardship_notes, presidency_oversight, program_assignment, assigned_wards, status, called_date, display_order)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.high_council_members h
    WHERE lower(trim(h.member_name)) = lower(trim(z.member_name))
      AND COALESCE(h.stake_id, v_stake_id) = v_stake_id
  );
END $$;
