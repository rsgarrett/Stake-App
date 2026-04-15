-- Generic meeting agendas table for all meeting types
CREATE TABLE IF NOT EXISTS meeting_agendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_type TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TEXT DEFAULT '8:00 AM',
  presiding TEXT DEFAULT '',
  conducting TEXT DEFAULT '',
  opening_hymn TEXT DEFAULT '',
  opening_prayer TEXT DEFAULT '',
  closing_prayer TEXT DEFAULT '',
  stake_vision TEXT DEFAULT 'Stake Vision',
  handbook_trainer TEXT DEFAULT '',
  handbook_topic TEXT DEFAULT '',
  calendar_items JSONB DEFAULT '[]'::jsonb,
  attendees JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  training JSONB DEFAULT '[]'::jsonb,
  discussion_items JSONB DEFAULT '[]'::jsonb,
  closing_remarks TEXT DEFAULT '',
  general_notes TEXT DEFAULT '',
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_type, meeting_date)
);

CREATE INDEX IF NOT EXISTS idx_meeting_agendas_type_date ON meeting_agendas(meeting_type, meeting_date);
CREATE INDEX IF NOT EXISTS idx_meeting_agendas_date ON meeting_agendas(meeting_date);

CREATE TRIGGER update_meeting_agendas_updated_at
  BEFORE UPDATE ON meeting_agendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
