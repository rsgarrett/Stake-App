-- Welcome & Announcements sheet per conference session + "Attended by" line
-- for the doc-style conducting sheets.

ALTER TABLE conference_sessions
  ADD COLUMN IF NOT EXISTS welcome_script TEXT,
  ADD COLUMN IF NOT EXISTS attended_by TEXT;

COMMENT ON COLUMN conference_sessions.welcome_script IS 'Edited welcome/announcements script; NULL means use the auto-generated draft.';
COMMENT ON COLUMN conference_sessions.attended_by IS 'Who attends this session (printed on the conducting sheet).';
