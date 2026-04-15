-- Add "replaces" field to callings for tracking who the new person is replacing
ALTER TABLE callings ADD COLUMN IF NOT EXISTS replaces_person_name TEXT;

-- Mapping table: which calling names correspond to which app roles
CREATE TABLE IF NOT EXISTS calling_role_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_name TEXT NOT NULL,
  app_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the mapping with standard calling-to-role relationships
INSERT INTO calling_role_map (calling_name, app_role) VALUES
  ('Stake President', 'stake_president'),
  ('Stake President (submitted to First Presidency)', 'stake_president'),
  ('First Counselor in the Stake Presidency', 'counselor'),
  ('Second Counselor in the Stake Presidency', 'counselor'),
  ('Stake Clerk', 'clerk'),
  ('Assistant Stake Clerk', 'clerk'),
  ('Assistant Stake Clerk — Finance', 'clerk'),
  ('Assistant Stake Clerk — Membership', 'clerk'),
  ('Stake Executive Secretary', 'clerk'),
  ('Assistant Stake Executive Secretary', 'clerk'),
  ('High Councilor', 'high_council'),
  ('Bishop', 'bishop'),
  ('First Counselor in the Bishopric', 'bishop'),
  ('Second Counselor in the Bishopric', 'bishop'),
  ('Ward Clerk', 'clerk'),
  ('Assistant Ward Clerk', 'clerk'),
  ('Assistant Ward Clerk — Finance', 'clerk'),
  ('Assistant Ward Clerk — Membership', 'clerk'),
  ('Ward Executive Secretary', 'clerk'),
  ('Stake Relief Society President', 'auxiliary_leader'),
  ('Stake Young Men President', 'auxiliary_leader'),
  ('Stake Young Women President', 'auxiliary_leader'),
  ('Stake Primary President', 'auxiliary_leader'),
  ('Stake Sunday School President', 'auxiliary_leader'),
  ('Elders Quorum President', 'auxiliary_leader'),
  ('Ward Relief Society President', 'auxiliary_leader'),
  ('Ward Young Men President', 'auxiliary_leader'),
  ('Ward Young Women President', 'auxiliary_leader'),
  ('Ward Primary President', 'auxiliary_leader'),
  ('Ward Sunday School President', 'auxiliary_leader')
ON CONFLICT DO NOTHING;
