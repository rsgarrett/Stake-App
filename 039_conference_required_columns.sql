-- Run this in Supabase SQL Editor to fix "column not found" and RLS errors when creating events
-- Adds all columns required by the conference planner and disables RLS on conference tables

-- special_events
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS theme TEXT;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS presiding_authority TEXT;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS include_sustaining BOOLEAN DEFAULT false;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS stand_seating TEXT;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS streaming_notes TEXT;

-- ministering visits: add ward
ALTER TABLE conference_ministering_visits ADD COLUMN IF NOT EXISTS ward TEXT;

-- Disable RLS so authenticated users can create and manage conference events
ALTER TABLE special_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_program_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_ministering_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE conference_name_suggestions DISABLE ROW LEVEL SECURITY;
