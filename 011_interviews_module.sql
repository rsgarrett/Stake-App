-- Interviews Module

-- Create interviews table (sensitive data - notes will be encrypted)
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interviewee_name TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  conducted_date TIMESTAMPTZ,
  interviewer_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT, -- Encrypted field
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interview_schedules table
CREATE TABLE interview_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  time_slot TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create interview_notes table (sensitive data - encrypted)
CREATE TABLE interview_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  note_content TEXT NOT NULL, -- Encrypted field
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_interviews_interviewer_id ON interviews(interviewer_id);
CREATE INDEX idx_interviews_scheduled_date ON interviews(scheduled_date);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_interview_schedules_interview_id ON interview_schedules(interview_id);
CREATE INDEX idx_interview_notes_interview_id ON interview_notes(interview_id);

-- Create triggers for updated_at
CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_schedules_updated_at
  BEFORE UPDATE ON interview_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_notes_updated_at
  BEFORE UPDATE ON interview_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_interviews
  AFTER INSERT OR UPDATE OR DELETE ON interviews
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_interview_schedules
  AFTER INSERT OR UPDATE OR DELETE ON interview_schedules
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_interview_notes
  AFTER INSERT OR UPDATE OR DELETE ON interview_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


