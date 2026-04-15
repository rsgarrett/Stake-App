-- Dinner session planning: people invited, who provides meal, expected guest count
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS dinner_group_invited TEXT;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS dinner_provided_by TEXT;
ALTER TABLE conference_sessions ADD COLUMN IF NOT EXISTS dinner_guest_count INTEGER;
