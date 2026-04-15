-- Conferences & Special Events Module

-- Create special_events table
CREATE TABLE special_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT,
  event_type TEXT NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_speakers table
CREATE TABLE event_speakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
  speaker_name TEXT NOT NULL,
  topic TEXT,
  session TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_music table
CREATE TABLE event_music (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
  music_type TEXT NOT NULL CHECK (music_type IN ('hymn', 'special_musical_number', 'choir')),
  title TEXT NOT NULL,
  performers TEXT,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_special_events_stake_id ON special_events(stake_id);
CREATE INDEX idx_special_events_status ON special_events(status);
CREATE INDEX idx_special_events_start_date ON special_events(start_date);
CREATE INDEX idx_event_speakers_event_id ON event_speakers(event_id);
CREATE INDEX idx_event_music_event_id ON event_music(event_id);

-- Create triggers for updated_at
CREATE TRIGGER update_special_events_updated_at
  BEFORE UPDATE ON special_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_speakers_updated_at
  BEFORE UPDATE ON event_speakers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_music_updated_at
  BEFORE UPDATE ON event_music
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_special_events
  AFTER INSERT OR UPDATE OR DELETE ON special_events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_event_speakers
  AFTER INSERT OR UPDATE OR DELETE ON event_speakers
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_event_music
  AFTER INSERT OR UPDATE OR DELETE ON event_music
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

