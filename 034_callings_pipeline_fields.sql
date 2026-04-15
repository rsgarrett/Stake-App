-- Migration 034: Add all calling pipeline fields
-- Run this in Supabase SQL Editor to add the workflow columns needed for the 6-stage calling pipeline.
-- Safe to run multiple times (uses IF NOT EXISTS).

ALTER TABLE callings ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS ward TEXT;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS submitted_by UUID;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS submitted_date TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE callings ADD COLUMN IF NOT EXISTS bishop_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS bishop_approval_date TIMESTAMPTZ;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS presidency_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS presidency_approval_date TIMESTAMPTZ;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS high_council_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS high_council_approval_date TIMESTAMPTZ;

ALTER TABLE callings ADD COLUMN IF NOT EXISTS calling_extended BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS previous_release_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS assigned_to_extend TEXT;

ALTER TABLE callings ADD COLUMN IF NOT EXISTS sustained_date DATE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS set_apart_date DATE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS set_apart_by TEXT DEFAULT '';

ALTER TABLE callings ADD COLUMN IF NOT EXISTS updated_in_lcr BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS ratified_in_stake_conference BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS protecting_children_training_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE callings ADD COLUMN IF NOT EXISTS stake_training_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE callings ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'submitted';

ALTER TABLE callings ADD COLUMN IF NOT EXISTS extend_authority TEXT DEFAULT '';
ALTER TABLE callings ADD COLUMN IF NOT EXISTS set_apart_authority TEXT DEFAULT '';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_callings_type ON callings(type);
CREATE INDEX IF NOT EXISTS idx_callings_ward ON callings(ward);
CREATE INDEX IF NOT EXISTS idx_callings_workflow_status ON callings(workflow_status);

-- Also ensure the recommendations and workflow log tables exist
CREATE TABLE IF NOT EXISTS calling_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'Calling',
  person_name TEXT NOT NULL,
  ward TEXT NOT NULL DEFAULT 'Stake',
  calling_name TEXT NOT NULL,
  organization TEXT,
  notes TEXT,
  submitted_by UUID,
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  stake_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calling_workflow_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_id UUID,
  recommendation_id UUID,
  action TEXT NOT NULL,
  performed_by UUID,
  performed_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  previous_status TEXT,
  new_status TEXT
);

CREATE TABLE IF NOT EXISTS calling_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_id UUID,
  recommendation_id UUID,
  user_id UUID,
  notification_type TEXT NOT NULL DEFAULT 'status_change',
  title TEXT,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on these tables so the app works without policy setup
ALTER TABLE callings DISABLE ROW LEVEL SECURITY;
ALTER TABLE calling_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE calling_workflow_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE calling_notifications DISABLE ROW LEVEL SECURITY;
