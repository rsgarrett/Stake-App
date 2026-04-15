-- Missionary Work Module

-- Create missionary_applications table
CREATE TABLE missionary_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_name TEXT NOT NULL,
  application_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'submitted', 'rejected')),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create full_time_missionaries table
CREATE TABLE full_time_missionaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  missionary_name TEXT NOT NULL,
  mission_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'serving' CHECK (status IN ('serving', 'returned', 'released')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create member_missionary_efforts table
CREATE TABLE member_missionary_efforts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_name TEXT NOT NULL,
  effort_type TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create convert_integration table
CREATE TABLE convert_integration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convert_name TEXT NOT NULL,
  baptism_date DATE NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE,
  ward_id UUID, -- Optional
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'integrated', 'needs_followup')),
  followup_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_missionary_applications_stake_id ON missionary_applications(stake_id);
CREATE INDEX idx_missionary_applications_status ON missionary_applications(status);
CREATE INDEX idx_full_time_missionaries_stake_id ON full_time_missionaries(stake_id);
CREATE INDEX idx_full_time_missionaries_status ON full_time_missionaries(status);
CREATE INDEX idx_member_missionary_efforts_stake_id ON member_missionary_efforts(stake_id);
CREATE INDEX idx_convert_integration_stake_id ON convert_integration(stake_id);
CREATE INDEX idx_convert_integration_status ON convert_integration(status);

-- Create triggers for updated_at
CREATE TRIGGER update_missionary_applications_updated_at
  BEFORE UPDATE ON missionary_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_full_time_missionaries_updated_at
  BEFORE UPDATE ON full_time_missionaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_missionary_efforts_updated_at
  BEFORE UPDATE ON member_missionary_efforts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_convert_integration_updated_at
  BEFORE UPDATE ON convert_integration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_missionary_applications
  AFTER INSERT OR UPDATE OR DELETE ON missionary_applications
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_full_time_missionaries
  AFTER INSERT OR UPDATE OR DELETE ON full_time_missionaries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_member_missionary_efforts
  AFTER INSERT OR UPDATE OR DELETE ON member_missionary_efforts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_convert_integration
  AFTER INSERT OR UPDATE OR DELETE ON convert_integration
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


