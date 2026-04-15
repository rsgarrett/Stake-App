-- Youth Programs Module

-- Create youth_programs table
CREATE TABLE youth_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_name TEXT NOT NULL,
  program_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('active', 'completed', 'planned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create youth_conferences table
CREATE TABLE youth_conferences (
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

-- Create priesthood_advancements table
CREATE TABLE priesthood_advancements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_name TEXT NOT NULL,
  advancement_type TEXT NOT NULL CHECK (advancement_type IN ('deacon', 'teacher', 'priest', 'elder')),
  advancement_date DATE NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  ward_id UUID, -- Optional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create youth_activities table
CREATE TABLE youth_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_name TEXT NOT NULL,
  activity_date DATE NOT NULL,
  location TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_youth_programs_stake_id ON youth_programs(stake_id);
CREATE INDEX idx_youth_programs_status ON youth_programs(status);
CREATE INDEX idx_youth_conferences_stake_id ON youth_conferences(stake_id);
CREATE INDEX idx_priesthood_advancements_stake_id ON priesthood_advancements(stake_id);
CREATE INDEX idx_priesthood_advancements_advancement_type ON priesthood_advancements(advancement_type);
CREATE INDEX idx_youth_activities_stake_id ON youth_activities(stake_id);
CREATE INDEX idx_youth_activities_activity_date ON youth_activities(activity_date);

-- Create triggers for updated_at
CREATE TRIGGER update_youth_programs_updated_at
  BEFORE UPDATE ON youth_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_conferences_updated_at
  BEFORE UPDATE ON youth_conferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_priesthood_advancements_updated_at
  BEFORE UPDATE ON priesthood_advancements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_activities_updated_at
  BEFORE UPDATE ON youth_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_youth_programs
  AFTER INSERT OR UPDATE OR DELETE ON youth_programs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_youth_conferences
  AFTER INSERT OR UPDATE OR DELETE ON youth_conferences
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_priesthood_advancements
  AFTER INSERT OR UPDATE OR DELETE ON priesthood_advancements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_youth_activities
  AFTER INSERT OR UPDATE OR DELETE ON youth_activities
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


