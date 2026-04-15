-- Mission Ready Tracker
-- Per-missionary checklist tracking 20 preparation steps through the mission readiness process
-- Each missionary gets their own copy of the standard checklist with completion tracking

-- Standard preparation tasks (the template)
CREATE TABLE IF NOT EXISTS mission_ready_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_number INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  additional_resource TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual missionary tracker (one row per missionary being prepared)
CREATE TABLE IF NOT EXISTS mission_ready_missionaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  missionary_name TEXT NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'papers_submitted', 'call_received', 'set_apart', 'serving', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Per-missionary task progress (one row per task per missionary)
CREATE TABLE IF NOT EXISTS mission_ready_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  missionary_id UUID NOT NULL REFERENCES mission_ready_missionaries(id) ON DELETE CASCADE,
  task_number INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_date DATE,
  notes TEXT,
  additional_resource TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(missionary_id, task_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mission_ready_tasks_stake_id ON mission_ready_tasks(stake_id);
CREATE INDEX IF NOT EXISTS idx_mission_ready_missionaries_stake_id ON mission_ready_missionaries(stake_id);
CREATE INDEX IF NOT EXISTS idx_mission_ready_missionaries_status ON mission_ready_missionaries(status);
CREATE INDEX IF NOT EXISTS idx_mission_ready_progress_missionary_id ON mission_ready_progress(missionary_id);

-- Triggers for updated_at
CREATE TRIGGER update_mission_ready_tasks_updated_at
  BEFORE UPDATE ON mission_ready_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_ready_missionaries_updated_at
  BEFORE UPDATE ON mission_ready_missionaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mission_ready_progress_updated_at
  BEFORE UPDATE ON mission_ready_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_mission_ready_tasks
  AFTER INSERT OR UPDATE OR DELETE ON mission_ready_tasks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_mission_ready_missionaries
  AFTER INSERT OR UPDATE OR DELETE ON mission_ready_missionaries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_mission_ready_progress
  AFTER INSERT OR UPDATE OR DELETE ON mission_ready_progress
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Insert default preparation tasks
INSERT INTO mission_ready_tasks (task_number, task_name, additional_resource, is_default) VALUES
  (1, 'Read The Book of Mormon', 'For the Strength of Youth Guide', TRUE),
  (2, 'D&C 121', NULL, TRUE),
  (3, 'Missionary Growth Path', 'Emotional Resilience Manual', TRUE),
  (4, 'Melchizedek Priesthood', 'Missionary Preparation', TRUE),
  (5, 'Endowment', 'Supplemental Information', TRUE),
  (6, 'Submit name to work in the temple', NULL, TRUE),
  (7, 'Fulfill Your Missionary Purpose (PMG chp. 1)', 'The District Video Series', TRUE),
  (8, 'Adjusting to Missionary Life', 'Serve and Prepare Videos', TRUE),
  (9, 'Missionary Standards for Disciples of Jesus Christ', 'Mission Ready Talks', TRUE),
  (10, 'The Fourth Missionary', NULL, TRUE),
  (11, 'Growth Mindset', NULL, TRUE),
  (12, 'Using Technology Wisely and Righteously', NULL, TRUE),
  (13, 'Study & Teach the Gospel (PMG chp. 3)', NULL, TRUE),
  (14, 'Teach to Build Faith (PMG chp. 10)', NULL, TRUE),
  (15, 'Help People Make & Keep Commitments (PMG chp. 11)', NULL, TRUE),
  (16, 'Accomplish the Work through Goals and Plans (PMG chp. 8)', NULL, TRUE),
  (17, 'Papers Submitted', NULL, TRUE),
  (18, 'Call Received', NULL, TRUE),
  (19, 'Setting Apart Scheduled', NULL, TRUE),
  (20, 'Seek Christlike Attributes (PMG chp. 6)', NULL, TRUE)
ON CONFLICT DO NOTHING;
