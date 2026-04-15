-- Training & Resources Module

-- Create training_modules table
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  module_type TEXT NOT NULL,
  content_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_completions table
CREATE TABLE training_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('completed', 'in_progress')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Create handbook_sections table
CREATE TABLE handbook_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_number TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create policy_updates table
CREATE TABLE policy_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  effective_date DATE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_training_modules_module_type ON training_modules(module_type);
CREATE INDEX idx_training_completions_user_id ON training_completions(user_id);
CREATE INDEX idx_training_completions_module_id ON training_completions(module_id);
CREATE INDEX idx_handbook_sections_category ON handbook_sections(category);
CREATE INDEX idx_handbook_sections_section_number ON handbook_sections(section_number);
CREATE INDEX idx_policy_updates_category ON policy_updates(category);
CREATE INDEX idx_policy_updates_effective_date ON policy_updates(effective_date);

-- Create triggers for updated_at
CREATE TRIGGER update_training_modules_updated_at
  BEFORE UPDATE ON training_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_completions_updated_at
  BEFORE UPDATE ON training_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handbook_sections_updated_at
  BEFORE UPDATE ON handbook_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policy_updates_updated_at
  BEFORE UPDATE ON policy_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER audit_training_modules
  AFTER INSERT OR UPDATE OR DELETE ON training_modules
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_training_completions
  AFTER INSERT OR UPDATE OR DELETE ON training_completions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_handbook_sections
  AFTER INSERT OR UPDATE OR DELETE ON handbook_sections
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_policy_updates
  AFTER INSERT OR UPDATE OR DELETE ON policy_updates
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();


