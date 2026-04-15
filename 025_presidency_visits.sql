-- Stake Presidency Visits & Teaching Schedule
-- Weekly Sunday schedule showing where each presidency member visits or teaches

CREATE TABLE IF NOT EXISTS presidency_visit_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  week_number INT,
  -- Each presidency member's assignment for the week
  president_assignment TEXT,
  first_counselor_assignment TEXT,
  second_counselor_assignment TEXT,
  -- Type: visit, teaching, ward_conference, stake_conference, general_conference, high_council, stake_council
  entry_type TEXT NOT NULL DEFAULT 'visit' CHECK (entry_type IN (
    'visit', 'teaching', 'ward_conference', 'stake_conference',
    'general_conference', 'high_council_meeting', 'stake_council_meeting'
  )),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presidency_visits_stake ON presidency_visit_schedule(stake_id);
CREATE INDEX IF NOT EXISTS idx_presidency_visits_date ON presidency_visit_schedule(visit_date);
CREATE INDEX IF NOT EXISTS idx_presidency_visits_type ON presidency_visit_schedule(entry_type);

DROP TRIGGER IF EXISTS update_presidency_visits_updated_at ON presidency_visit_schedule;
CREATE TRIGGER update_presidency_visits_updated_at
  BEFORE UPDATE ON presidency_visit_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS audit_presidency_visits ON presidency_visit_schedule;
CREATE TRIGGER audit_presidency_visits
  AFTER INSERT OR UPDATE OR DELETE ON presidency_visit_schedule
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Import 2026 Sunday Visit Schedule
DO $$
DECLARE
  v_stake_id UUID;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  INSERT INTO presidency_visit_schedule (stake_id, visit_date, week_number, president_assignment, first_counselor_assignment, second_counselor_assignment, entry_type) VALUES
    -- Feb 2026
    (v_stake_id, '2026-02-15', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-02-15', 3, '18th', '12th', '22nd', 'visit'),
    (v_stake_id, '2026-02-22', 4, '18th Ward Conference', NULL, NULL, 'ward_conference'),
    -- Mar 2026
    (v_stake_id, '2026-03-01', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-03-01', 1, '17th', '12th', '8th', 'visit'),
    (v_stake_id, '2026-03-08', 2, '18th Ward Teach Relief Society', '18th Ward Teach Youth', '19th Ward Teach Elder''s Quorum', 'teaching'),
    (v_stake_id, '2026-03-15', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-03-15', 3, '12th', '8th', '23rd', 'visit'),
    (v_stake_id, '2026-03-22', 4, '19th Ward Conference', NULL, NULL, 'ward_conference'),
    (v_stake_id, '2026-03-29', 5, '8th', '12th', '22nd', 'visit'),
    -- Apr 2026
    (v_stake_id, '2026-04-05', 1, 'General Conference', NULL, NULL, 'general_conference'),
    (v_stake_id, '2026-04-12', 2, '17th Ward Teach Relief Society', '19th Ward Teach Youth', '22nd Ward Teach Elder''s Quorum', 'teaching'),
    (v_stake_id, '2026-04-19', 3, 'Stake Conference', NULL, NULL, 'stake_conference'),
    (v_stake_id, '2026-04-26', 4, '19th Ward Teach Relief Society', '22nd Ward Teach Youth', '23rd Ward Teach Elder''s Quorum', 'teaching'),
    -- May 2026
    (v_stake_id, '2026-05-03', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-05-03', 1, '17th', '18th', '19th', 'visit'),
    (v_stake_id, '2026-05-10', 2, '22nd Ward Teach Relief Society', '23rd Ward Teach Youth', '8th Ward Teach Elder''s Quorum', 'teaching'),
    (v_stake_id, '2026-05-17', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-05-17', 3, '18th', '19th', '17th', 'visit'),
    (v_stake_id, '2026-05-24', 4, '8th Ward Teach Elder''s Quorum', '12th Ward Teach Youth', '17th Ward Teach Relief Society', 'teaching'),
    (v_stake_id, '2026-05-31', 5, '19th', '17th', '22nd', 'visit'),
    -- Jun 2026
    (v_stake_id, '2026-06-07', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-06-07', 1, '22nd', '12th', '23rd', 'visit'),
    (v_stake_id, '2026-06-14', 2, '23rd Ward Conference', NULL, NULL, 'ward_conference'),
    (v_stake_id, '2026-06-21', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-06-21', 3, '23rd', '8th', '12th', 'visit'),
    (v_stake_id, '2026-06-28', 4, '12th Ward Teach Elder''s Quorum', '8th Ward Teach Youth', '18th Ward Teach Relief Society', 'teaching'),
    -- Jul 2026
    (v_stake_id, '2026-07-05', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-07-05', 1, '18th', '22nd', '8th', 'visit'),
    (v_stake_id, '2026-07-12', 2, '17th Ward Teach Elder''s Quorum', '18th Ward Teach Youth', '19th Ward Teach Relief Society', 'teaching'),
    (v_stake_id, '2026-07-19', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-07-19', 3, '18th', '12th', '12th', 'visit'),
    (v_stake_id, '2026-07-26', 4, '18th Ward Teach Elder''s Quorum', '19th Ward Teach Youth', '22nd Ward Teach Relief Society', 'teaching'),
    -- Aug 2026
    (v_stake_id, '2026-08-02', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-08-02', 1, '19th', '22nd', '23rd', 'visit'),
    (v_stake_id, '2026-08-09', 2, '17th Ward Teach Relief Society', '12th Ward Teach Youth', '17th Ward Teach Elder''s Quorum', 'teaching'),
    (v_stake_id, '2026-08-16', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-08-16', 3, '22nd', '23rd', '8th', 'visit'),
    (v_stake_id, '2026-08-23', 4, '17th Ward Conference', NULL, NULL, 'ward_conference'),
    (v_stake_id, '2026-08-30', 5, '18th', '12th', '22nd', 'visit'),
    -- Sep 2026
    (v_stake_id, '2026-09-06', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-09-06', 1, '12th', '22nd', '8th', 'visit'),
    (v_stake_id, '2026-09-13', 2, '22nd Ward Conference', NULL, NULL, 'ward_conference'),
    (v_stake_id, '2026-09-20', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-09-20', 3, '23rd', '8th', '12th', 'visit'),
    (v_stake_id, '2026-09-27', 4, '19th Ward Teach Elder''s Quorum', '22nd Ward Teach Youth', '23rd Ward Teach Relief Society', 'teaching'),
    -- Oct 2026
    (v_stake_id, '2026-10-04', 1, 'General Conference', NULL, NULL, 'general_conference'),
    (v_stake_id, '2026-10-11', 2, '22nd Ward Teach Elder''s Quorum', '23rd Ward Teach Youth', '8th Ward Teach Relief Society', 'teaching'),
    (v_stake_id, '2026-10-18', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-10-18', 3, '8th', '12th', '17th', 'visit'),
    (v_stake_id, '2026-10-25', 4, '23rd Ward Teach Elder''s Quorum', '8th Ward Teach Youth', '12th Ward Teach Relief Society', 'teaching'),
    -- Nov 2026
    (v_stake_id, '2026-11-01', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-11-01', 1, '17th', '18th', '19th', 'visit'),
    (v_stake_id, '2026-11-08', 2, '12th Ward Conference', NULL, NULL, 'ward_conference'),
    (v_stake_id, '2026-11-15', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-11-15', 3, '12th', '17th', '18th', 'visit'),
    (v_stake_id, '2026-11-22', 4, '8th Ward Teach Relief Society', '17th Ward Teach Youth', '19th Ward Teach Elder''s Quorum', 'teaching'),
    (v_stake_id, '2026-11-29', 5, '19th', '22nd', '23rd', 'visit'),
    -- Dec 2026
    (v_stake_id, '2026-12-06', NULL, NULL, NULL, NULL, 'high_council_meeting'),
    (v_stake_id, '2026-12-06', 1, 'Stake Conference', NULL, NULL, 'stake_conference'),
    (v_stake_id, '2026-12-13', 2, '8th', '17th', '19th', 'visit'),
    (v_stake_id, '2026-12-20', NULL, NULL, NULL, NULL, 'stake_council_meeting'),
    (v_stake_id, '2026-12-20', 3, '18th', '12th', '22nd', 'visit'),
    (v_stake_id, '2026-12-27', 4, '22nd', '23rd', '8th', 'visit');

END $$;
