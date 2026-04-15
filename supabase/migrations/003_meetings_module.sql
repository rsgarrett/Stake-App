-- Meetings & Conferences Module

-- Create meetings table
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  meeting_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meeting_agendas table
CREATE TABLE meeting_agendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create meeting_minutes table
CREATE TABLE meeting_minutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stake_conferences table
CREATE TABLE stake_conferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conference_speakers table
CREATE TABLE conference_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conference_id UUID REFERENCES stake_conferences(id) ON DELETE CASCADE,
  speaker_name TEXT NOT NULL,
  topic TEXT,
  session TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_meetings_stake_id ON meetings(stake_id);
CREATE INDEX idx_meetings_scheduled_date ON meetings(scheduled_date);
CREATE INDEX idx_meeting_agendas_meeting_id ON meeting_agendas(meeting_id);
CREATE INDEX idx_meeting_minutes_meeting_id ON meeting_minutes(meeting_id);
CREATE INDEX idx_stake_conferences_stake_id ON stake_conferences(stake_id);
CREATE INDEX idx_conference_speakers_conference_id ON conference_speakers(conference_id);

-- Create triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_agendas_updated_at
  BEFORE UPDATE ON meeting_agendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meeting_minutes_updated_at
  BEFORE UPDATE ON meeting_minutes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stake_conferences_updated_at
  BEFORE UPDATE ON stake_conferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conference_speakers_updated_at
  BEFORE UPDATE ON conference_speakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_meetings
  AFTER INSERT OR UPDATE OR DELETE ON meetings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_meeting_agendas
  AFTER INSERT OR UPDATE OR DELETE ON meeting_agendas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_meeting_minutes
  AFTER INSERT OR UPDATE OR DELETE ON meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_stake_conferences
  AFTER INSERT OR UPDATE OR DELETE ON stake_conferences
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_conference_speakers
  AFTER INSERT OR UPDATE OR DELETE ON conference_speakers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

