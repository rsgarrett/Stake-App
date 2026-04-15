-- Leadership Management Module

-- Create callings table
CREATE TABLE callings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_name TEXT NOT NULL,
  calling_name TEXT NOT NULL,
  organization TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  ward_id UUID, -- Optional, references ward if applicable
  extended_date DATE,
  released_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leadership_positions table
CREATE TABLE leadership_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_type TEXT NOT NULL CHECK (position_type IN ('bishopric', 'high_council', 'auxiliary')),
  organization TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  ward_id UUID, -- Optional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_records table
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  training_type TEXT NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('completed', 'in_progress', 'not_started')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calling_history table
CREATE TABLE calling_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_id UUID REFERENCES callings(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  calling_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('extended', 'released', 'changed')),
  action_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_callings_stake_id ON callings(stake_id);
CREATE INDEX idx_callings_status ON callings(status);
CREATE INDEX idx_leadership_positions_stake_id ON leadership_positions(stake_id);
CREATE INDEX idx_training_records_user_id ON training_records(user_id);
CREATE INDEX idx_calling_history_calling_id ON calling_history(calling_id);

-- Create triggers for updated_at
CREATE TRIGGER update_callings_updated_at
  BEFORE UPDATE ON callings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leadership_positions_updated_at
  BEFORE UPDATE ON leadership_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_records_updated_at
  BEFORE UPDATE ON training_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_callings
  AFTER INSERT OR UPDATE OR DELETE ON callings
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_leadership_positions
  AFTER INSERT OR UPDATE OR DELETE ON leadership_positions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_training_records
  AFTER INSERT OR UPDATE OR DELETE ON training_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


