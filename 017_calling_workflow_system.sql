-- Migration 017: Comprehensive Calling Workflow System
-- Based on Handbook of Instructions protocol

-- Add workflow fields to callings table
ALTER TABLE callings
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('Calling', 'Release', 'Assignment', 'MP')),
ADD COLUMN IF NOT EXISTS ward TEXT,
ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS submitted_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS bishop_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bishop_approval_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bishop_approval_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS presidency_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS presidency_approval_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS presidency_approval_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS high_council_approval BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS high_council_approval_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS high_council_approval_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS calling_extended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS calling_extended_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS calling_extended_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS previous_release_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS assigned_to_extend TEXT,
ADD COLUMN IF NOT EXISTS sustained_date DATE,
ADD COLUMN IF NOT EXISTS sustained_in_ward BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sustained_in_stake BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS set_apart_date DATE,
ADD COLUMN IF NOT EXISTS set_apart_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS updated_in_lcr BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_in_lcr_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_in_lcr_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS ratified_in_stake_conference BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS protecting_children_training_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stake_training_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS workflow_status TEXT DEFAULT 'submitted' CHECK (workflow_status IN (
  'submitted',
  'bishop_review',
  'presidency_review',
  'high_council_review',
  'ready_to_extend',
  'extended',
  'sustained',
  'set_apart',
  'completed',
  'rejected'
)),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejected_date TIMESTAMPTZ;

-- Create calling_recommendations table for submissions
CREATE TABLE IF NOT EXISTS calling_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('Calling', 'Release', 'Assignment', 'MP')),
  person_name TEXT NOT NULL,
  ward TEXT NOT NULL,
  calling_name TEXT NOT NULL,
  organization TEXT,
  reason TEXT, -- Why this person is being recommended
  submitted_by UUID REFERENCES users(id) NOT NULL,
  submitted_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  bishop_notes TEXT,
  presidency_notes TEXT,
  high_council_notes TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calling_workflow_log table for tracking all workflow actions
CREATE TABLE IF NOT EXISTS calling_workflow_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_id UUID REFERENCES callings(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES calling_recommendations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'submitted', 'bishop_approved', 'presidency_approved', etc.
  performed_by UUID REFERENCES users(id),
  performed_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  previous_status TEXT,
  new_status TEXT
);

-- Create notifications table for workflow alerts
CREATE TABLE IF NOT EXISTS calling_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_id UUID REFERENCES callings(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES calling_recommendations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) NOT NULL,
  notification_type TEXT NOT NULL, -- 'approval_needed', 'status_change', 'action_required'
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_callings_workflow_status ON callings(workflow_status);
CREATE INDEX IF NOT EXISTS idx_callings_submitted_by ON callings(submitted_by);
CREATE INDEX IF NOT EXISTS idx_callings_type ON callings(type);
CREATE INDEX IF NOT EXISTS idx_callings_ward ON callings(ward);
CREATE INDEX IF NOT EXISTS idx_calling_recommendations_status ON calling_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_calling_recommendations_submitted_by ON calling_recommendations(submitted_by);
CREATE INDEX IF NOT EXISTS idx_calling_workflow_log_calling_id ON calling_workflow_log(calling_id);
CREATE INDEX IF NOT EXISTS idx_calling_notifications_user_id ON calling_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_calling_notifications_read ON calling_notifications(read);

-- Create triggers
CREATE TRIGGER update_calling_recommendations_updated_at
  BEFORE UPDATE ON calling_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update workflow status
CREATE OR REPLACE FUNCTION update_calling_workflow_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine workflow status based on approvals
  IF NEW.rejected_by IS NOT NULL THEN
    NEW.workflow_status = 'rejected';
  ELSIF NEW.set_apart_date IS NOT NULL THEN
    NEW.workflow_status = 'set_apart';
  ELSIF NEW.sustained_date IS NOT NULL THEN
    NEW.workflow_status = 'sustained';
  ELSIF NEW.calling_extended = TRUE THEN
    NEW.workflow_status = 'extended';
  ELSIF NEW.high_council_approval = TRUE AND NEW.presidency_approval = TRUE AND NEW.bishop_approval = TRUE THEN
    NEW.workflow_status = 'ready_to_extend';
  ELSIF NEW.presidency_approval = TRUE AND NEW.bishop_approval = TRUE THEN
    NEW.workflow_status = 'high_council_review';
  ELSIF NEW.bishop_approval = TRUE THEN
    NEW.workflow_status = 'presidency_review';
  ELSE
    NEW.workflow_status = 'bishop_review';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_calling_workflow_status_trigger
  BEFORE INSERT OR UPDATE ON callings
  FOR EACH ROW
  EXECUTE FUNCTION update_calling_workflow_status();
