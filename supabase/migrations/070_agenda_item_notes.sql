-- Per-section meeting notes/minutes. The stake's perpetual agenda captures
-- "Notes:" (the green minutes) under every section; this column lets each
-- agenda item hold those notes directly, separate from the structured field
-- content stored in `description`.

ALTER TABLE meeting_agendas ADD COLUMN IF NOT EXISTS notes TEXT;
