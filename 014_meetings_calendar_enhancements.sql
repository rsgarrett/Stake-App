-- Enhancements for Meetings Calendar System
-- Adds recurrence, permissions, and better time management

-- Add new columns to meetings table
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('none', 'daily', 'weekly', 'monthly', 'yearly', 'custom')),
ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
ADD COLUMN IF NOT EXISTS recurrence_days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS recurrence_day_of_month INTEGER,
ADD COLUMN IF NOT EXISTS recurrence_week_of_month INTEGER,
ADD COLUMN IF NOT EXISTS viewable_by_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS editable_by_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- Create meeting_recurrence_exceptions table for handling exceptions to recurring meetings
CREATE TABLE IF NOT EXISTS meeting_recurrence_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_cancelled BOOLEAN DEFAULT FALSE,
  modified_title TEXT,
  modified_location TEXT,
  modified_start_time TIMESTAMPTZ,
  modified_end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, exception_date)
);

-- Create meeting_permissions table for fine-grained permission control
CREATE TABLE IF NOT EXISTS meeting_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN (
    'stake_presidency', 
    'high_council', 
    'bishops', 
    'elders_quorum', 
    'relief_society', 
    'young_men', 
    'young_women', 
    'primary', 
    'sunday_school', 
    'ward_councils',
    'stake_council',
    'all'
  )),
  can_view BOOLEAN DEFAULT TRUE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, role_type)
);

-- Create standard_meeting_templates table for General Handbook meetings
CREATE TABLE IF NOT EXISTS standard_meeting_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  meeting_type TEXT NOT NULL,
  default_duration_minutes INTEGER DEFAULT 60,
  default_day_of_week INTEGER CHECK (default_day_of_week IS NULL OR (default_day_of_week >= 0 AND default_day_of_week <= 6)),
  default_time_of_day TIME,
  default_recurrence_type TEXT NOT NULL DEFAULT 'weekly',
  default_recurrence_interval INTEGER DEFAULT 1,
  default_location TEXT,
  handbook_reference TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  viewable_by_roles TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_type)
);

-- Insert standard stake meetings from General Handbook
INSERT INTO standard_meeting_templates (title, description, meeting_type, default_duration_minutes, default_day_of_week, default_time_of_day, default_recurrence_type, default_recurrence_interval, viewable_by_roles, category, handbook_reference, is_required) VALUES
-- ============================================================================
-- STAKE PRESIDENCY AND LEADERSHIP MEETINGS
-- ============================================================================
('Stake Presidency Meeting', 'Weekly coordination meeting of the stake presidency', 'stake_presidency_meeting', 120, 0, '07:00:00', 'weekly', 1, ARRAY['stake_presidency'], 'leadership', 'Handbook 29.3', TRUE),
('Stake Council Meeting', 'Monthly meeting of stake presidency, high council, and stake auxiliary leaders', 'stake_council', 180, 0, '08:00:00', 'monthly', 1, ARRAY['stake_presidency', 'high_council', 'bishops', 'stake_council'], 'leadership', 'Handbook 29.3.1', TRUE),
('Stake High Council Meeting', 'Monthly meeting of stake presidency with high council', 'high_council_meeting', 120, 0, '08:00:00', 'monthly', 1, ARRAY['stake_presidency', 'high_council'], 'leadership', 'Handbook 29.2', TRUE),
('Stake Priesthood Leadership Meeting', 'Quarterly meeting for stake and ward priesthood leaders', 'priesthood_leadership', 120, 0, '08:00:00', 'monthly', 3, ARRAY['stake_presidency', 'high_council', 'bishops', 'elders_quorum'], 'leadership', 'Handbook 29.3.2', TRUE),
('Stake Presidency PPI', 'Personal Priesthood Interview with stake presidency members', 'stake_presidency_ppi', 30, NULL, NULL, 'monthly', 1, ARRAY['stake_presidency'], 'leadership', 'Handbook 29.3.3', FALSE),

-- ============================================================================
-- WARD/BRANCH LEADERSHIP MEETINGS
-- ============================================================================
('Ward Council Meeting', 'Weekly ward council meeting with bishopric and auxiliary leaders', 'ward_council', 90, 0, '07:00:00', 'weekly', 1, ARRAY['bishops', 'ward_councils'], 'leadership', 'Handbook 29.3.4', TRUE),
('Bishopric Meeting', 'Weekly bishopric coordination meeting', 'bishopric_meeting', 60, 0, '06:30:00', 'weekly', 1, ARRAY['bishops'], 'leadership', 'Handbook 29.3.5', TRUE),
('Bishopric PEC (Priesthood Executive Committee)', 'Monthly priesthood executive committee meeting', 'pec', 90, 0, '07:00:00', 'monthly', 1, ARRAY['bishops', 'elders_quorum'], 'leadership', 'Handbook 29.3.6', TRUE),
('Branch Presidency Meeting', 'Weekly branch presidency coordination meeting', 'branch_presidency_meeting', 60, 0, '07:00:00', 'weekly', 1, ARRAY['bishops'], 'leadership', 'Handbook 29.3.7', FALSE),

-- ============================================================================
-- STAKE AUXILIARY PRESIDENCY MEETINGS
-- ============================================================================
('Stake Relief Society Presidency Meeting', 'Monthly stake Relief Society presidency meeting', 'stake_relief_society_presidency', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'relief_society'], 'auxiliary', 'Handbook 9.4.1', TRUE),
('Stake Young Women Presidency Meeting', 'Monthly stake Young Women presidency meeting', 'stake_young_women_presidency', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'young_women'], 'auxiliary', 'Handbook 10.4.1', TRUE),
('Stake Young Men Presidency Meeting', 'Monthly stake Young Men presidency meeting', 'stake_young_men_presidency', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'young_men'], 'auxiliary', 'Handbook 11.4.1', TRUE),
('Stake Primary Presidency Meeting', 'Monthly stake Primary presidency meeting', 'stake_primary_presidency', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'primary'], 'auxiliary', 'Handbook 12.4.1', TRUE),
('Stake Sunday School Presidency Meeting', 'Monthly stake Sunday School presidency meeting', 'stake_sunday_school_presidency', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'sunday_school'], 'auxiliary', 'Handbook 13.4.1', TRUE),

-- ============================================================================
-- WARD AUXILIARY PRESIDENCY MEETINGS
-- ============================================================================
('Relief Society Presidency Meeting', 'Weekly Relief Society presidency meeting', 'relief_society_presidency', 60, 0, '07:00:00', 'weekly', 1, ARRAY['relief_society'], 'auxiliary', 'Handbook 9.4', TRUE),
('Elders Quorum Presidency Meeting', 'Weekly Elders Quorum presidency meeting', 'elders_quorum_presidency', 60, 0, '07:00:00', 'weekly', 1, ARRAY['elders_quorum'], 'auxiliary', 'Handbook 8.4', TRUE),
('Young Men Presidency Meeting', 'Weekly Young Men presidency meeting', 'young_men_presidency', 60, 0, '07:00:00', 'weekly', 1, ARRAY['young_men'], 'auxiliary', 'Handbook 11.4', TRUE),
('Young Women Presidency Meeting', 'Weekly Young Women presidency meeting', 'young_women_presidency', 60, 0, '07:00:00', 'weekly', 1, ARRAY['young_women'], 'auxiliary', 'Handbook 10.4', TRUE),
('Primary Presidency Meeting', 'Weekly Primary presidency meeting', 'primary_presidency', 60, 0, '07:00:00', 'weekly', 1, ARRAY['primary'], 'auxiliary', 'Handbook 12.4', TRUE),
('Sunday School Presidency Meeting', 'Weekly Sunday School presidency meeting', 'sunday_school_presidency', 60, 0, '07:00:00', 'weekly', 1, ARRAY['sunday_school'], 'auxiliary', 'Handbook 13.4', TRUE),

-- ============================================================================
-- STAKE CONFERENCES AND SPECIAL MEETINGS
-- ============================================================================
('Stake Conference', 'Semi-annual stake conference - Sunday session', 'stake_conference', 180, 0, '10:00:00', 'monthly', 6, ARRAY['all'], 'conference', 'Handbook 29.4', TRUE),
('Stake Conference - Saturday Evening Session', 'Saturday evening session of stake conference', 'stake_conference_saturday', 120, 5, '19:00:00', 'monthly', 6, ARRAY['all'], 'conference', 'Handbook 29.4.1', TRUE),
('Stake Conference - Leadership Session', 'Leadership session before stake conference', 'stake_conference_leadership', 90, 0, '08:00:00', 'monthly', 6, ARRAY['stake_presidency', 'high_council', 'bishops', 'ward_councils'], 'conference', 'Handbook 29.4.2', TRUE),
('Stake Conference - Priesthood Session', 'Priesthood session of stake conference', 'stake_conference_priesthood', 90, 5, '19:00:00', 'monthly', 6, ARRAY['stake_presidency', 'high_council', 'elders_quorum', 'young_men'], 'conference', 'Handbook 29.4.3', TRUE),
('Stake Conference - Youth Session', 'Youth session of stake conference', 'stake_conference_youth', 90, 5, '17:00:00', 'monthly', 6, ARRAY['young_men', 'young_women'], 'conference', 'Handbook 29.4.4', FALSE),
('Stake Business Meeting', 'Stake business meeting for sustaining and releases', 'stake_business', 30, 0, '10:30:00', 'monthly', 6, ARRAY['all'], 'conference', 'Handbook 29.4.5', TRUE),

-- ============================================================================
-- TRAINING MEETINGS
-- ============================================================================
('Stake Leadership Training', 'Quarterly stake leadership training meeting', 'leadership_training', 180, 5, '09:00:00', 'monthly', 3, ARRAY['stake_presidency', 'high_council', 'bishops', 'ward_councils'], 'training', 'Handbook 29.5', TRUE),
('Bishop Training Meeting', 'Monthly training meeting for bishops', 'bishop_training', 120, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'bishops'], 'training', 'Handbook 29.5.1', TRUE),
('Stake Auxiliary Training', 'Quarterly training for stake auxiliary leaders', 'stake_auxiliary_training', 120, 5, '09:00:00', 'monthly', 3, ARRAY['stake_presidency', 'relief_society', 'young_women', 'young_men', 'primary', 'sunday_school'], 'training', 'Handbook 29.5.2', FALSE),
('New Member and Leader Training', 'Training for new members and leaders', 'new_member_training', 90, 5, '10:00:00', 'monthly', 1, ARRAY['stake_presidency', 'ward_councils'], 'training', 'Handbook 29.5.3', FALSE),

-- ============================================================================
-- WELFARE AND SELF-RELIANCE
-- ============================================================================
('Stake Welfare Meeting', 'Monthly welfare and self-reliance coordination meeting', 'welfare_meeting', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'bishops'], 'welfare', 'Handbook 22.2', TRUE),
('Stake Self-Reliance Committee', 'Self-reliance committee meeting', 'self_reliance_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'bishops'], 'welfare', 'Handbook 22.2.1', FALSE),
('Stake Humanitarian Meeting', 'Humanitarian and service coordination meeting', 'humanitarian_meeting', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'relief_society'], 'welfare', 'Handbook 22.2.2', FALSE),
('Ward Welfare Meeting', 'Monthly ward welfare coordination meeting', 'ward_welfare_meeting', 60, 0, '07:00:00', 'monthly', 1, ARRAY['bishops', 'relief_society'], 'welfare', 'Handbook 22.2.3', FALSE),

-- ============================================================================
-- MISSIONARY
-- ============================================================================
('Stake Missionary Coordination Meeting', 'Monthly missionary correlation meeting', 'missionary_correlation', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'bishops'], 'missionary', 'Handbook 23.2', TRUE),
('Stake Missionary Committee', 'Stake missionary committee meeting', 'stake_missionary_committee', 90, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'bishops', 'young_men', 'young_women'], 'missionary', 'Handbook 23.2.1', FALSE),
('Ward Missionary Coordination Meeting', 'Monthly ward missionary correlation meeting', 'ward_missionary_correlation', 60, 0, '07:00:00', 'monthly', 1, ARRAY['bishops', 'elders_quorum'], 'missionary', 'Handbook 23.2.2', FALSE),
('Missionary Preparation Class', 'Class for preparing future missionaries', 'missionary_prep', 60, 0, '19:00:00', 'weekly', 1, ARRAY['young_men', 'young_women'], 'missionary', 'Handbook 23.2.3', FALSE),

-- ============================================================================
-- TEMPLE AND FAMILY HISTORY
-- ============================================================================
('Stake Temple and Family History Meeting', 'Monthly temple and family history coordination meeting', 'temple_family_history', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'temple', 'Handbook 25.2', TRUE),
('Stake Temple Committee', 'Stake temple committee meeting', 'stake_temple_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'temple', 'Handbook 25.2.1', FALSE),
('Stake Family History Committee', 'Stake family history committee meeting', 'family_history_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency', 'high_council'], 'temple', 'Handbook 25.2.2', FALSE),
('Ward Temple and Family History Meeting', 'Monthly ward temple and family history meeting', 'ward_temple_family_history', 60, 0, '07:00:00', 'monthly', 1, ARRAY['bishops'], 'temple', 'Handbook 25.2.3', FALSE),

-- ============================================================================
-- YOUTH MEETINGS
-- ============================================================================
('Stake Youth Council', 'Monthly stake youth council meeting', 'stake_youth_council', 90, 5, '19:00:00', 'monthly', 1, ARRAY['stake_presidency', 'young_men', 'young_women'], 'youth', 'Handbook 29.6', TRUE),
('Stake Youth Activities Committee', 'Planning meeting for stake youth activities', 'stake_youth_activities', 90, 5, '19:00:00', 'monthly', 1, ARRAY['young_men', 'young_women'], 'youth', 'Handbook 29.6.1', FALSE),
('Stake Young Men Meeting', 'Monthly stake young men meeting', 'stake_young_men_meeting', 90, 0, '19:00:00', 'monthly', 1, ARRAY['young_men'], 'youth', 'Handbook 11.5', FALSE),
('Stake Young Women Meeting', 'Monthly stake young women meeting', 'stake_young_women_meeting', 90, 0, '19:00:00', 'monthly', 1, ARRAY['young_women'], 'youth', 'Handbook 10.5', FALSE),
('Stake Youth Conference', 'Annual stake youth conference', 'stake_youth_conference', 480, 5, '08:00:00', 'yearly', 1, ARRAY['young_men', 'young_women'], 'youth', 'Handbook 29.6.2', FALSE),
('Stake Youth Fireside', 'Monthly stake youth fireside', 'stake_youth_fireside', 60, 5, '19:00:00', 'monthly', 1, ARRAY['young_men', 'young_women'], 'youth', 'Handbook 29.6.3', FALSE),

-- ============================================================================
-- INTERVIEWS AND SETTINGS APART
-- ============================================================================
('Stake Presidency Interviews', 'Scheduled interviews with stake presidency', 'stake_presidency_interviews', 15, NULL, NULL, 'weekly', 1, ARRAY['stake_presidency'], 'interviews', 'Handbook 29.7', FALSE),
('Temple Recommend Interviews', 'Temple recommend renewal interviews', 'temple_recommend_interviews', 15, NULL, NULL, 'weekly', 1, ARRAY['stake_presidency', 'bishops'], 'interviews', 'Handbook 26.3', FALSE),
('Calling Extensions', 'Extending callings to members', 'calling_extensions', 30, NULL, NULL, 'weekly', 1, ARRAY['stake_presidency', 'bishops'], 'interviews', 'Handbook 30.1', FALSE),
('Setting Apart Appointments', 'Setting apart for new callings', 'setting_apart', 15, NULL, NULL, 'weekly', 1, ARRAY['stake_presidency', 'bishops'], 'interviews', 'Handbook 18.11', FALSE),

-- ============================================================================
-- ADDITIONAL STAKE MEETINGS
-- ============================================================================
('Stake PEF Committee', 'Perpetual Education Fund committee meeting', 'stake_pef_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 31.2', FALSE),
('Stake Employment Committee', 'Employment and career services committee', 'employment_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 31.2.1', FALSE),
('Stake Addiction Recovery', 'Addiction recovery support meeting', 'addiction_recovery', 90, 5, '19:00:00', 'weekly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 31.2.2', FALSE),
('Stake Single Adult Committee', 'Single adult activities and coordination', 'single_adult_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 31.2.3', FALSE),
('Stake Senior Missionary Committee', 'Senior missionary service coordination', 'senior_missionary_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 31.2.4', FALSE),
('Stake Communications Meeting', 'Stake communications and media coordination', 'stake_communications', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 29.8', FALSE),
('Stake Technology Committee', 'Technology and meetinghouse support', 'technology_committee', 60, 0, '07:00:00', 'monthly', 1, ARRAY['stake_presidency'], 'other', 'Handbook 29.9', FALSE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meetings_recurrence_type ON meetings(recurrence_type);
CREATE INDEX IF NOT EXISTS idx_meetings_recurrence_end_date ON meetings(recurrence_end_date);
CREATE INDEX IF NOT EXISTS idx_meeting_recurrence_exceptions_meeting_id ON meeting_recurrence_exceptions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_recurrence_exceptions_date ON meeting_recurrence_exceptions(exception_date);
CREATE INDEX IF NOT EXISTS idx_meeting_permissions_meeting_id ON meeting_permissions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_permissions_role_type ON meeting_permissions(role_type);
CREATE INDEX IF NOT EXISTS idx_standard_meeting_templates_category ON standard_meeting_templates(category);

-- Create triggers for updated_at (drop first if they exist)
DROP TRIGGER IF EXISTS update_meeting_recurrence_exceptions_updated_at ON meeting_recurrence_exceptions;
CREATE TRIGGER update_meeting_recurrence_exceptions_updated_at
  BEFORE UPDATE ON meeting_recurrence_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meeting_permissions_updated_at ON meeting_permissions;
CREATE TRIGGER update_meeting_permissions_updated_at
  BEFORE UPDATE ON meeting_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_standard_meeting_templates_updated_at ON standard_meeting_templates;
CREATE TRIGGER update_standard_meeting_templates_updated_at
  BEFORE UPDATE ON standard_meeting_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers (drop first if they exist)
DROP TRIGGER IF EXISTS audit_meeting_recurrence_exceptions ON meeting_recurrence_exceptions;
CREATE TRIGGER audit_meeting_recurrence_exceptions
  AFTER INSERT OR UPDATE OR DELETE ON meeting_recurrence_exceptions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_meeting_permissions ON meeting_permissions;
CREATE TRIGGER audit_meeting_permissions
  AFTER INSERT OR UPDATE OR DELETE ON meeting_permissions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_standard_meeting_templates ON standard_meeting_templates;
CREATE TRIGGER audit_standard_meeting_templates
  AFTER INSERT OR UPDATE OR DELETE ON standard_meeting_templates
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

