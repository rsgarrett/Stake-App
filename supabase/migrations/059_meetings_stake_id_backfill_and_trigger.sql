-- Auto-populate meetings.stake_id and backfill historical NULLs.
--
-- Symptom this fixes:
--   "new row violates row-level security policy for table 'meeting_agendas'"
-- when an elevated user clicks an existing meeting and the app tries to
-- auto-seed the handbook agenda. The RLS policy from 057 requires
--   meetings.stake_id = get_user_stake_id()
-- and was failing because some `meetings` rows had stake_id = NULL.
--
-- This migration:
--   1. Backfills NULL meetings.stake_id from the row's created_by user, then
--      from the first stake as a fallback (single-stake deployment).
--   2. Adds a BEFORE INSERT/UPDATE trigger so future rows inserted without an
--      explicit stake_id automatically inherit the inserting user's stake_id.

-- ---- 1. Backfill NULL stake_id ---------------------------------------------

UPDATE public.meetings m
SET stake_id = u.stake_id
FROM public.users u
WHERE m.stake_id IS NULL
  AND m.created_by IS NOT NULL
  AND m.created_by = u.id
  AND u.stake_id IS NOT NULL;

DO $$
DECLARE
  default_stake_id UUID;
BEGIN
  SELECT id INTO default_stake_id
  FROM public.stakes
  ORDER BY created_at ASC
  LIMIT 1;

  IF default_stake_id IS NOT NULL THEN
    UPDATE public.meetings
    SET stake_id = default_stake_id
    WHERE stake_id IS NULL;
  END IF;
END $$;

-- ---- 2. Trigger to auto-populate stake_id from the inserting user ----------
-- SECURITY DEFINER so it can read public.users even from a session that has
-- restricted SELECT on users.

CREATE OR REPLACE FUNCTION public.set_meeting_stake_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid_stake_id UUID;
  default_stake_id UUID;
BEGIN
  IF NEW.stake_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT u.stake_id INTO uid_stake_id
    FROM public.users u
    WHERE u.id = auth.uid();
    IF uid_stake_id IS NOT NULL THEN
      NEW.stake_id := uid_stake_id;
      RETURN NEW;
    END IF;
  END IF;

  -- Last-resort fallback for a single-stake deployment.
  SELECT id INTO default_stake_id
  FROM public.stakes
  ORDER BY created_at ASC
  LIMIT 1;

  IF default_stake_id IS NOT NULL THEN
    NEW.stake_id := default_stake_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_meetings_set_stake_id ON public.meetings;
CREATE TRIGGER trg_meetings_set_stake_id
BEFORE INSERT ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.set_meeting_stake_id_from_user();
