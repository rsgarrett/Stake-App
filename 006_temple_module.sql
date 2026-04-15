-- Temple & Family History Module

-- Create temple_attendance table
CREATE TABLE temple_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_date DATE NOT NULL,
  attendance_count INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create temple_interviews table (sensitive data - notes will be encrypted)
CREATE TABLE temple_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interviewee_name TEXT NOT NULL,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('temple_recommend', 'calling', 'worthiness')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  conducted_date TIMESTAMPTZ,
  interviewer_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT, -- Encrypted field
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create temple_assignments table
CREATE TABLE temple_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_date DATE NOT NULL,
  assignment_type TEXT NOT NULL,
  assigned_to TEXT, -- Person name or user_id
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create family_history_activities table
CREATE TABLE family_history_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_temple_attendance_stake_id ON temple_attendance(stake_id);
CREATE INDEX idx_temple_attendance_event_date ON temple_attendance(event_date);
CREATE INDEX idx_temple_interviews_interviewer_id ON temple_interviews(interviewer_id);
CREATE INDEX idx_temple_interviews_scheduled_date ON temple_interviews(scheduled_date);
CREATE INDEX idx_temple_interviews_status ON temple_interviews(status);
CREATE INDEX idx_temple_assignments_stake_id ON temple_assignments(stake_id);
CREATE INDEX idx_family_history_activities_stake_id ON family_history_activities(stake_id);

-- Create triggers for updated_at
CREATE TRIGGER update_temple_attendance_updated_at
  BEFORE UPDATE ON temple_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temple_interviews_updated_at
  BEFORE UPDATE ON temple_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_temple_assignments_updated_at
  BEFORE UPDATE ON temple_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_history_activities_updated_at
  BEFORE UPDATE ON family_history_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_temple_attendance
  AFTER INSERT OR UPDATE OR DELETE ON temple_attendance
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_temple_interviews
  AFTER INSERT OR UPDATE OR DELETE ON temple_interviews
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_temple_assignments
  AFTER INSERT OR UPDATE OR DELETE ON temple_assignments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_family_history_activities
  AFTER INSERT OR UPDATE OR DELETE ON family_history_activities
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


