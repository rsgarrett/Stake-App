-- Expand conference_program_items so the app can insert the full program
-- (prelude_music, breakout, closing_remarks, speaker_primary/youth, completed status).
--
-- Run once in Supabase → SQL → New query → Run.
-- The DO blocks drop whatever CHECK constraints exist on these columns (names can vary).

-- item_type
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'conference_program_items'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%item_type%'
  ) LOOP
    EXECUTE format('ALTER TABLE conference_program_items DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE conference_program_items ADD CONSTRAINT conference_program_items_item_type_check
  CHECK (item_type IN (
    'presiding', 'conducting', 'organist', 'pianist', 'music_leader',
    'prelude_music', 'opening_hymn', 'closing_hymn', 'intermediate_hymn',
    'invocation', 'benediction',
    'speaker', 'speaker_primary', 'speaker_youth',
    'instruction', 'testimony', 'breakout', 'discussion', 'closing_remarks',
    'special_musical_number', 'stake_business', 'other'
  ));

-- invite_status
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'conference_program_items'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%invite_status%'
  ) LOOP
    EXECUTE format('ALTER TABLE conference_program_items DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE conference_program_items ADD CONSTRAINT conference_program_items_invite_status_check
  CHECK (invite_status IN ('not_invited', 'invited', 'accepted', 'declined', 'completed'));
