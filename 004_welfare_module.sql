-- Welfare & Self-Reliance Module

-- Create welfare_cases table (sensitive data - will be encrypted)
CREATE TABLE welfare_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_number TEXT UNIQUE NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  ward_id UUID, -- Optional
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  case_notes TEXT, -- Encrypted field
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create self_reliance_participants table
CREATE TABLE self_reliance_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  start_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'dropped')),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employment_services table
CREATE TABLE employment_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_type TEXT NOT NULL,
  description TEXT,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_welfare_cases_stake_id ON welfare_cases(stake_id);
CREATE INDEX idx_welfare_cases_status ON welfare_cases(status);
CREATE INDEX idx_self_reliance_participants_stake_id ON self_reliance_participants(stake_id);
CREATE INDEX idx_self_reliance_participants_status ON self_reliance_participants(status);
CREATE INDEX idx_employment_services_stake_id ON employment_services(stake_id);

-- Create triggers for updated_at
CREATE TRIGGER update_welfare_cases_updated_at
  BEFORE UPDATE ON welfare_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_self_reliance_participants_updated_at
  BEFORE UPDATE ON self_reliance_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employment_services_updated_at
  BEFORE UPDATE ON employment_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_welfare_cases
  AFTER INSERT OR UPDATE OR DELETE ON welfare_cases
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_self_reliance_participants
  AFTER INSERT OR UPDATE OR DELETE ON self_reliance_participants
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_employment_services
  AFTER INSERT OR UPDATE OR DELETE ON employment_services
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


