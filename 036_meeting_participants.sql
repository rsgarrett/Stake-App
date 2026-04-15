-- Add participants array to meetings for tracking who is involved
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}';

-- Index for searching by participant
CREATE INDEX IF NOT EXISTS idx_meetings_participants ON meetings USING GIN (participants);
