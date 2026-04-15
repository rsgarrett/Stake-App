-- Conference Handbook Alignment: presiding authority, stake business, stand seating, streaming
-- Run this in Supabase SQL Editor

ALTER TABLE special_events ADD COLUMN IF NOT EXISTS presiding_authority TEXT;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS include_sustaining BOOLEAN DEFAULT false;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS stand_seating TEXT;
ALTER TABLE special_events ADD COLUMN IF NOT EXISTS streaming_notes TEXT;
