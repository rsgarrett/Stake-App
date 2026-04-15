-- Conference Planner Upgrade: theme, new item types, notes field
-- Run this in Supabase SQL Editor

ALTER TABLE special_events ADD COLUMN IF NOT EXISTS theme TEXT;

ALTER TABLE conference_program_items ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS session_date DATE;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS equipment_notes TEXT;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS announcements TEXT;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS broadcast_url TEXT;

ALTER TABLE special_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_program_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_ministering_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_name_suggestions DISABLE ROW LEVEL SECURITY;
