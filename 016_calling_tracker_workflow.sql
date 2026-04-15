-- Migration 016: Calling Tracker Workflow Fields
-- Adds workflow approval tracking fields to match Google Sheet tracker

ALTER TABLE callings
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('Calling', 'Release', 'Assignment', 'MP')),
ADD COLUMN IF NOT EXISTS ward TEXT, -- Ward name/number (e.g., "18th", "17th")
ADD COLUMN IF NOT EXISTS bishop_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS presidency_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS high_council_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calling_extended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS previous_release_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assigned_to_extend TEXT, -- Person assigned to extend call/release
ADD COLUMN IF NOT EXISTS sustained_date DATE,
ADD COLUMN IF NOT EXISTS set_apart_date DATE,
ADD COLUMN IF NOT EXISTS updated_in_lcr BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ratified_in_stake_conference BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS protecting_children_training_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stake_training_complete BOOLEAN DEFAULT FALSE;

-- Update existing records to have default type
UPDATE callings SET type = 'Calling' WHERE type IS NULL;

-- Create index for workflow filtering
CREATE INDEX IF NOT EXISTS idx_callings_type ON callings(type);
CREATE INDEX IF NOT EXISTS idx_callings_ward ON callings(ward);
CREATE INDEX IF NOT EXISTS idx_callings_assigned_to ON callings(assigned_to_extend);
