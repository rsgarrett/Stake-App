-- 061_meetings_presiding_conducting.sql
--
-- Adds free-text "presiding" and "conducting" columns to the meetings table
-- so the Presiding / Conducting fields shown above the agenda on the meeting
-- detail page can actually be persisted (and autosaved). These were
-- previously rendered as unbound inputs that lost their value on reload.
--
-- Idempotent: uses IF NOT EXISTS so it is safe to re-run.

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS presiding TEXT,
  ADD COLUMN IF NOT EXISTS conducting TEXT;

COMMENT ON COLUMN public.meetings.presiding IS
  'Free-text name of the person presiding over this meeting (e.g. "President Smith"). '
  'Optional; only used by meeting types whose handbook template defines a presiding field.';

COMMENT ON COLUMN public.meetings.conducting IS
  'Free-text name of the person conducting this meeting. Optional; only used by '
  'meeting types whose handbook template defines a conducting field.';
