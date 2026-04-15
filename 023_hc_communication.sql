-- High Council Communication Module
-- Weekly return & report system with roster management and presidency responses
-- Replaces the Google Form + Spreadsheet workflow

-- High Council Roster (active members with turnover support)
CREATE TABLE IF NOT EXISTS high_council_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_name TEXT NOT NULL,
  email TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  assigned_wards TEXT,
  stewardships TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released')),
  called_date DATE,
  released_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Reports (one per high councilor per reporting week)
CREATE TABLE IF NOT EXISTS hc_weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES high_council_members(id) ON DELETE CASCADE,
  reporting_week DATE NOT NULL,
  meetings_attended TEXT,
  stewardship_report TEXT,
  followup_needed TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Presidency Responses to reports
CREATE TABLE IF NOT EXISTS hc_report_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES hc_weekly_reports(id) ON DELETE CASCADE,
  responder_name TEXT,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hc_members_stake_id ON high_council_members(stake_id);
CREATE INDEX IF NOT EXISTS idx_hc_members_status ON high_council_members(status);
CREATE INDEX IF NOT EXISTS idx_hc_weekly_reports_member_id ON hc_weekly_reports(member_id);
CREATE INDEX IF NOT EXISTS idx_hc_weekly_reports_reporting_week ON hc_weekly_reports(reporting_week);
CREATE INDEX IF NOT EXISTS idx_hc_report_responses_report_id ON hc_report_responses(report_id);

-- Triggers for updated_at
CREATE TRIGGER update_hc_members_updated_at
  BEFORE UPDATE ON high_council_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hc_weekly_reports_updated_at
  BEFORE UPDATE ON hc_weekly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hc_report_responses_updated_at
  BEFORE UPDATE ON hc_report_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_hc_members
  AFTER INSERT OR UPDATE OR DELETE ON high_council_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_hc_weekly_reports
  AFTER INSERT OR UPDATE OR DELETE ON hc_weekly_reports
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_hc_report_responses
  AFTER INSERT OR UPDATE OR DELETE ON hc_report_responses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Import current high councilors from the spreadsheet
DO $$
DECLARE
  v_stake_id UUID;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  INSERT INTO high_council_members (member_name, email, stake_id, stewardships, status, display_order) VALUES
    ('Matt Anderson', 'bostonmatt12@gmail.com', v_stake_id, '8th Ward, Stake Music, Stake Sports, Stake Service, Stake Audit', 'active', 1),
    ('John Bates', 'batesjfoct22@gmail.com', v_stake_id, 'Ward Mission, 8th Ward, 12th Ward', 'active', 2),
    ('Daniel Monroy', 'thunderdan078@gmail.com', v_stake_id, 'Stake Music, Ordinations', 'active', 3),
    ('Gaylan Colledge', 'gaylan@colledge.net', v_stake_id, 'Temple & Family History', 'active', 4),
    ('Ryan Garff', 'rhgarff419@gmail.com', v_stake_id, 'Stake YM Presidency', 'active', 5),
    ('Matt Youngman', 'matt.youngman76@gmail.com', v_stake_id, 'FSY, Mini MTC', 'active', 6),
    ('Jim Hansen', 'jambhan11@gmail.com', v_stake_id, 'YSA', 'active', 7),
    ('Mike Arave', 'mparave08@gmail.com', v_stake_id, '12th Ward', 'active', 8);
END $$;
