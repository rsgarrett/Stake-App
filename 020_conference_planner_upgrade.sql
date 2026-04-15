-- Conference Planner Upgrade
-- Adds session-based program planning, ministering visits, and post-conference notes
-- Mirrors the Stake Conference Planner spreadsheet workflow

-- Conference sessions (Leadership Session, Adult Session, General Session, etc.)
CREATE TABLE IF NOT EXISTS conference_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES special_events(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN (
    'ministering_visits', 'presidency_meeting', 'leadership_session',
    'dinner', 'adult_session', 'general_session', 'other'
  )),
  session_label TEXT NOT NULL,
  session_date DATE,
  start_time TIME,
  end_time TIME,
  broadcast_url TEXT,
  equipment_notes TEXT,
  announcements TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program items within a session (unified: speakers, hymns, prayers, conducting, etc.)
CREATE TABLE IF NOT EXISTS conference_program_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES conference_sessions(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN (
    'presiding', 'conducting', 'organist', 'pianist', 'music_leader',
    'opening_hymn', 'closing_hymn', 'intermediate_hymn',
    'invocation', 'benediction',
    'speaker', 'instruction', 'testimony', 'discussion',
    'special_musical_number', 'stake_business',
    'other'
  )),
  assigned_to TEXT,
  topic TEXT,
  hymn_number TEXT,
  duration_minutes INTEGER DEFAULT 0,
  invite_status TEXT NOT NULL DEFAULT 'not_invited' CHECK (invite_status IN (
    'not_invited', 'invited', 'accepted', 'declined'
  )),
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ministering visits (time-slotted visits assigned to presidency members)
CREATE TABLE IF NOT EXISTS conference_ministering_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES special_events(id) ON DELETE CASCADE,
  visit_date DATE,
  start_time TIME,
  end_time TIME,
  presidency_member TEXT NOT NULL,
  visitee_name TEXT NOT NULL,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-conference notes
CREATE TABLE IF NOT EXISTS conference_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES special_events(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'followup', 'feedback')),
  content TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Name suggestions for future conferences
CREATE TABLE IF NOT EXISTS conference_name_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES special_events(id) ON DELETE CASCADE,
  suggested_name TEXT NOT NULL,
  suggested_role TEXT,
  suggested_by TEXT,
  used BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conference_sessions_event_id ON conference_sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_program_items_session_id ON conference_program_items(session_id);
CREATE INDEX IF NOT EXISTS idx_conference_ministering_visits_event_id ON conference_ministering_visits(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_notes_event_id ON conference_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_conference_name_suggestions_event_id ON conference_name_suggestions(event_id);

-- Triggers for updated_at
CREATE TRIGGER update_conference_sessions_updated_at
  BEFORE UPDATE ON conference_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conference_program_items_updated_at
  BEFORE UPDATE ON conference_program_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conference_ministering_visits_updated_at
  BEFORE UPDATE ON conference_ministering_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conference_notes_updated_at
  BEFORE UPDATE ON conference_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conference_name_suggestions_updated_at
  BEFORE UPDATE ON conference_name_suggestions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_conference_sessions
  AFTER INSERT OR UPDATE OR DELETE ON conference_sessions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_conference_program_items
  AFTER INSERT OR UPDATE OR DELETE ON conference_program_items
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_conference_ministering_visits
  AFTER INSERT OR UPDATE OR DELETE ON conference_ministering_visits
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_conference_notes
  AFTER INSERT OR UPDATE OR DELETE ON conference_notes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_conference_name_suggestions
  AFTER INSERT OR UPDATE OR DELETE ON conference_name_suggestions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
