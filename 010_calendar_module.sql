-- Calendar & Scheduling Module

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  event_type TEXT NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_attendees table
CREATE TABLE event_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'attending' CHECK (status IN ('attending', 'not_attending', 'maybe')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create calendar_conflicts table
CREATE TABLE calendar_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event1_id UUID REFERENCES events(id) ON DELETE CASCADE,
  event2_id UUID REFERENCES events(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('time', 'location', 'resource')),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_events_stake_id ON events(stake_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON event_attendees(user_id);
CREATE INDEX idx_calendar_conflicts_event1_id ON calendar_conflicts(event1_id);
CREATE INDEX idx_calendar_conflicts_event2_id ON calendar_conflicts(event2_id);
CREATE INDEX idx_calendar_conflicts_resolved ON calendar_conflicts(resolved);

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_attendees_updated_at
  BEFORE UPDATE ON event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_conflicts_updated_at
  BEFORE UPDATE ON calendar_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_events
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_event_attendees
  AFTER INSERT OR UPDATE OR DELETE ON event_attendees
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_calendar_conflicts
  AFTER INSERT OR UPDATE OR DELETE ON calendar_conflicts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


