-- Stake Meeting Schedule
-- Full year schedule for SP Meetings, HC/SC Meetings, and Coordination Meetings
-- Tracks date, time, conducting, prayers, handbook training assignments, and topics

CREATE TABLE IF NOT EXISTS stake_meeting_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN (
    'stake_presidency', 'high_council', 'coordination_council'
  )),
  meeting_date DATE NOT NULL,
  meeting_time TEXT,
  conducting TEXT,
  opening_prayer TEXT,
  closing_prayer TEXT,
  goal TEXT,
  handbook_trainer TEXT,
  handbook_topic TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stake_meeting_schedule_stake_id ON stake_meeting_schedule(stake_id);
CREATE INDEX IF NOT EXISTS idx_stake_meeting_schedule_date ON stake_meeting_schedule(meeting_date);
CREATE INDEX IF NOT EXISTS idx_stake_meeting_schedule_type ON stake_meeting_schedule(meeting_type);

-- Triggers
DROP TRIGGER IF EXISTS update_stake_meeting_schedule_updated_at ON stake_meeting_schedule;
CREATE TRIGGER update_stake_meeting_schedule_updated_at
  BEFORE UPDATE ON stake_meeting_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS audit_stake_meeting_schedule ON stake_meeting_schedule;
CREATE TRIGGER audit_stake_meeting_schedule
  AFTER INSERT OR UPDATE OR DELETE ON stake_meeting_schedule
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Import 2026 Stake Presidency Meeting Schedule
DO $$
DECLARE
  v_stake_id UUID;
BEGIN
  SELECT id INTO v_stake_id FROM stakes LIMIT 1;

  INSERT INTO stake_meeting_schedule (stake_id, meeting_type, meeting_date, meeting_time, conducting, opening_prayer, closing_prayer, goal, handbook_trainer, handbook_topic) VALUES
    (v_stake_id, 'stake_presidency', '2026-01-01', '8:00 PM', 'President Garrett', 'Brother Lester', 'Brother Hoffman', 'Stake Vision', 'Brother Lee', '1.0. Introduction / 1.1. God''s Plan of Happiness'),
    (v_stake_id, 'stake_presidency', '2026-01-08', '8:00 PM', 'President Garrett', 'Brother Lee', 'Brother Rentmeister', 'Stake Vision', 'Brother Hoffman', '1.2. God''s Work of Salvation and Exaltation'),
    (v_stake_id, 'stake_presidency', '2026-01-15', '8:00 PM', 'President Garrett', 'Brother Hoffman', 'Brother Bunderson', 'Stake Vision', 'Brother Rentmeister', '1.2.1. Living the Gospel of Jesus Christ'),
    (v_stake_id, 'stake_presidency', '2026-01-18', '6:00 AM', 'President Garrett', 'Brother Rentmeister', 'President Garrett', 'Stake Vision', 'Brother Bunderson', '1.2.2. Caring for Those in Need'),
    (v_stake_id, 'stake_presidency', '2026-01-25', '6:00 AM', 'President Garrett', 'Brother Bunderson', 'President Williams', 'Stake Vision', 'President Garrett', '1.2.3. Inviting All to Receive the Gospel'),
    (v_stake_id, 'stake_presidency', '2026-02-01', '6:00 AM', 'President Garrett', 'President Garrett', 'Brother Lester', 'Stake Vision', 'President Williams', '1.2.4. Uniting Families for Eternity'),
    (v_stake_id, 'stake_presidency', '2026-02-08', '6:00 AM', 'President Garrett', 'President Williams', 'Brother Lee', 'Stake Vision', 'President Garrett', '1.3. The Purpose of the Church'),
    (v_stake_id, 'stake_presidency', '2026-02-19', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Hoffman', 'Stake Vision', 'Brother Lester', '1.3.1. Priesthood Authority and Keys'),
    (v_stake_id, 'stake_presidency', '2026-02-26', '8:00 PM', 'President Garrett', 'Brother Lester', 'Brother Rentmeister', 'Stake Vision', 'Brother Lee', '1.3.2. Covenants and Ordinances'),
    (v_stake_id, 'stake_presidency', '2026-03-05', '8:00 PM', 'President Garrett', 'Brother Lee', 'Brother Bunderson', 'Stake Vision', 'Brother Hoffman', '1.3.3. Prophetic Direction'),
    (v_stake_id, 'stake_presidency', '2026-03-12', '8:00 PM', 'President Garrett', 'Brother Hoffman', 'President Garrett', 'Stake Vision', 'Brother Rentmeister', '1.3.4. Scriptures'),
    (v_stake_id, 'stake_presidency', '2026-03-19', '8:00 PM', 'President Garrett', 'Brother Rentmeister', 'President Williams', 'Stake Vision', 'Brother Bunderson', '1.3.5. Gospel Learning and Teaching Support'),
    (v_stake_id, 'stake_presidency', '2026-03-26', '8:00 PM', 'President Garrett', 'Brother Bunderson', 'Brother Lester', 'Stake Vision', 'President Garrett', '1.3.6. Service and Leadership Opportunities'),
    (v_stake_id, 'stake_presidency', '2026-04-02', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Lee', 'Stake Vision', 'President Williams', '1.3.7. A Community of Saints'),
    (v_stake_id, 'stake_presidency', '2026-04-09', '8:00 PM', 'President Garrett', 'President Williams', 'Brother Hoffman', 'Stake Vision', 'President Garrett', '1.4. Your Role in God''s Work'),
    (v_stake_id, 'stake_presidency', '2026-04-16', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Rentmeister', 'Stake Vision', 'Brother Lester', '2.0 & 2.1. The Role of the Family in God''s Plan'),
    (v_stake_id, 'stake_presidency', '2026-04-19', '6:00 AM', 'President Garrett', 'Brother Lester', 'Brother Bunderson', 'Stake Vision', 'Brother Lee', '2.1.1. Eternal Families'),
    (v_stake_id, 'stake_presidency', '2026-04-26', '6:00 AM', 'President Garrett', 'Brother Lee', 'President Garrett', 'Stake Vision', 'Brother Hoffman', '2.1.2. Husband and Wife'),
    (v_stake_id, 'stake_presidency', '2026-05-03', '6:00 AM', 'President Garrett', 'Brother Hoffman', 'President Williams', 'Stake Vision', 'Brother Rentmeister', '2.1.3. Parents and Children'),
    (v_stake_id, 'stake_presidency', '2026-05-10', '6:00 AM', 'President Garrett', 'Brother Rentmeister', 'President Garrett', 'Stake Vision', 'Brother Bunderson', '2.2. God''s Work of Salvation and Exaltation in the Home'),
    (v_stake_id, 'stake_presidency', '2026-05-21', '8:00 PM', 'President Garrett', 'Brother Bunderson', 'Brother Lester', 'Stake Vision', 'President Garrett', '2.3. The Relationship between the Home and the Church'),
    (v_stake_id, 'stake_presidency', '2026-05-28', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Lee', 'Stake Vision', 'President Williams', '3.0 & 3.1. Restoration of the Priesthood'),
    (v_stake_id, 'stake_presidency', '2026-06-04', '8:00 PM', 'President Garrett', 'President Williams', 'Brother Hoffman', 'Stake Vision', 'President Garrett', '3.2. Blessings of the Priesthood'),
    (v_stake_id, 'stake_presidency', '2026-06-11', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Rentmeister', 'Stake Vision', 'Brother Lester', '3.3. Melchizedek Priesthood and Aaronic Priesthood'),
    (v_stake_id, 'stake_presidency', '2026-06-18', '8:00 PM', 'President Garrett', 'Brother Lester', 'Brother Bunderson', 'Stake Vision', 'Brother Lee', '3.4. Priesthood Authority'),
    (v_stake_id, 'stake_presidency', '2026-06-25', '8:00 PM', 'President Garrett', 'Brother Lee', 'President Garrett', 'Stake Vision', 'Brother Hoffman', '3.5. Priesthood Power'),
    (v_stake_id, 'stake_presidency', '2026-07-02', '8:00 PM', 'President Garrett', 'Brother Hoffman', 'President Williams', 'Stake Vision', 'Brother Rentmeister', '3.6. The Priesthood and the Home'),
    (v_stake_id, 'stake_presidency', '2026-07-09', '8:00 PM', 'President Garrett', 'Brother Rentmeister', 'President Garrett', 'Stake Vision', 'Brother Bunderson', '4.0 & 4.1. The Purpose of Leadership in the Church'),
    (v_stake_id, 'stake_presidency', '2026-07-16', '8:00 PM', 'President Garrett', 'Brother Bunderson', 'Brother Lester', 'Stake Vision', 'President Garrett', '4.2. Principles of Leadership in the Church'),
    (v_stake_id, 'stake_presidency', '2026-07-23', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Lee', 'Stake Vision', 'President Williams', '4.2.1. Prepare Spiritually'),
    (v_stake_id, 'stake_presidency', '2026-07-30', '8:00 PM', 'President Garrett', 'President Williams', 'Brother Hoffman', 'Stake Vision', 'President Garrett', '4.2.2. Minister to All of God''s Children'),
    (v_stake_id, 'stake_presidency', '2026-08-06', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Rentmeister', 'Stake Vision', 'Brother Lester', '4.2.3. Teach the Gospel of Jesus Christ'),
    (v_stake_id, 'stake_presidency', '2026-08-13', '8:00 PM', 'President Garrett', 'Brother Lester', 'Brother Bunderson', 'Stake Vision', 'Brother Lee', '4.2.4. Preside in Righteousness'),
    (v_stake_id, 'stake_presidency', '2026-08-16', '6:00 AM', 'President Garrett', 'Brother Lee', 'President Garrett', 'Stake Vision', 'Brother Hoffman', '4.2.5. Delegate Responsibility and Ensure Accountability'),
    (v_stake_id, 'stake_presidency', '2026-08-23', '6:00 AM', 'President Garrett', 'Brother Hoffman', 'President Williams', 'Stake Vision', 'Brother Rentmeister', '4.2.6. Prepare Others to Be Leaders and Teachers'),
    (v_stake_id, 'stake_presidency', '2026-08-30', '6:00 AM', 'President Garrett', 'Brother Rentmeister', 'President Garrett', 'Stake Vision', 'Brother Bunderson', '4.2.7. Plan Meetings, Lessons, and Activities with Clear Purposes'),
    (v_stake_id, 'stake_presidency', '2026-09-10', '8:00 PM', 'President Garrett', 'Brother Bunderson', 'Brother Lester', 'Stake Vision', 'President Garrett', '4.2.8. Evaluating Your Efforts'),
    (v_stake_id, 'stake_presidency', '2026-09-17', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Lee', 'Stake Vision', 'President Williams', '4.3. Councils in the Church'),
    (v_stake_id, 'stake_presidency', '2026-09-20', '6:00 AM', 'President Garrett', 'President Williams', 'Brother Hoffman', 'Stake Vision', 'President Garrett', '4.4. Principles of Effective Councils'),
    (v_stake_id, 'stake_presidency', '2026-10-01', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Rentmeister', 'Stake Vision', 'Brother Lester', '4.4.1. Purposes of Councils'),
    (v_stake_id, 'stake_presidency', '2026-10-08', '8:00 PM', 'President Garrett', 'Brother Lester', 'Brother Bunderson', 'Stake Vision', 'Brother Lee', '4.4.2. Preparation for Council Meetings'),
    (v_stake_id, 'stake_presidency', '2026-10-15', '8:00 PM', 'President Garrett', 'Brother Lee', 'President Garrett', 'Stake Vision', 'Brother Hoffman', '4.4.3. Discussion and Decisions'),
    (v_stake_id, 'stake_presidency', '2026-10-22', '8:00 PM', 'President Garrett', 'Brother Hoffman', 'President Williams', 'Stake Vision', 'Brother Rentmeister', '4.4.4. Unity'),
    (v_stake_id, 'stake_presidency', '2026-10-25', '6:00 AM', 'President Garrett', 'Brother Rentmeister', 'President Garrett', 'Stake Vision', 'Brother Bunderson', '4.4.5. Action and Accountability'),
    (v_stake_id, 'stake_presidency', '2026-11-05', '8:00 PM', 'President Garrett', 'Brother Bunderson', 'Brother Lester', 'Stake Vision', 'President Garrett', '4.4.6. Confidentiality'),
    (v_stake_id, 'stake_presidency', '2026-11-08', '6:00 AM', 'President Garrett', 'President Garrett', 'Brother Lee', 'Stake Vision', 'President Williams', '4.4.6. Confidentiality'),
    (v_stake_id, 'stake_presidency', '2026-11-15', '6:00 AM', 'President Garrett', 'President Williams', 'Brother Hoffman', 'Stake Vision', 'President Garrett', NULL),
    (v_stake_id, 'stake_presidency', '2026-11-26', '8:00 PM', 'President Garrett', 'President Garrett', 'Brother Rentmeister', 'Stake Vision', 'Brother Lester', NULL),
    (v_stake_id, 'stake_presidency', '2026-11-29', '6:00 AM', 'President Garrett', 'Brother Lester', 'Brother Bunderson', 'Stake Vision', 'Brother Lee', NULL),
    (v_stake_id, 'stake_presidency', '2026-12-10', '8:00 PM', 'President Garrett', 'Brother Lee', 'President Garrett', 'Stake Vision', 'Brother Hoffman', NULL),
    (v_stake_id, 'stake_presidency', '2026-12-17', '8:00 PM', 'President Garrett', 'Brother Hoffman', 'President Williams', 'Stake Vision', 'Brother Rentmeister', NULL),
    (v_stake_id, 'stake_presidency', '2026-12-24', '8:00 PM', 'President Garrett', 'Brother Rentmeister', 'President Garrett', 'Stake Vision', 'Brother Bunderson', NULL),
    (v_stake_id, 'stake_presidency', '2026-12-31', '8:00 PM', 'President Garrett', NULL, NULL, NULL, NULL, NULL);

END $$;
