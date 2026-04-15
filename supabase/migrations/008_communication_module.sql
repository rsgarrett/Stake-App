-- Communication Module

-- Create announcements table
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('stake', 'ward', 'leaders', 'youth')),
  publish_date TIMESTAMPTZ,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create messages table (secure messaging)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create newsletters table
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  publish_date TIMESTAMPTZ,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_announcements_stake_id ON announcements(stake_id);
CREATE INDEX idx_announcements_publish_date ON announcements(publish_date);
CREATE INDEX idx_messages_from_user_id ON messages(from_user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_read ON messages(read);
CREATE INDEX idx_newsletters_stake_id ON newsletters(stake_id);
CREATE INDEX idx_newsletters_publish_date ON newsletters(publish_date);

-- Create triggers for updated_at
CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_announcements
  AFTER INSERT OR UPDATE OR DELETE ON announcements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_messages
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_newsletters
  AFTER INSERT OR UPDATE OR DELETE ON newsletters
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


