-- calling_role_map was created by an ad-hoc script (root 045_calling_permissions_sync.sql)
-- that never moved into supabase/migrations. Recreate it idempotently here and fix
-- stale role mappings (exec sec / assistants were mapped to `clerk`).

ALTER TABLE callings ADD COLUMN IF NOT EXISTS replaces_person_name TEXT;

CREATE TABLE IF NOT EXISTS calling_role_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calling_name TEXT NOT NULL,
  app_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dedupe before adding the unique constraint (table may have been seeded more than once).
DELETE FROM calling_role_map a
USING calling_role_map b
WHERE a.calling_name = b.calling_name
  AND a.created_at > b.created_at;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calling_role_map_calling_name_key'
  ) THEN
    ALTER TABLE calling_role_map
      ADD CONSTRAINT calling_role_map_calling_name_key UNIQUE (calling_name);
  END IF;
END $$;

INSERT INTO calling_role_map (calling_name, app_role) VALUES
  ('Stake President', 'stake_president'),
  ('Stake President (submitted to First Presidency)', 'stake_president'),
  ('First Counselor in the Stake Presidency', 'counselor'),
  ('Second Counselor in the Stake Presidency', 'counselor'),
  ('Stake Clerk', 'clerk'),
  ('Assistant Stake Clerk', 'assistant_clerk'),
  ('Assistant Stake Clerk — Finance', 'assistant_clerk'),
  ('Assistant Stake Clerk — Membership', 'assistant_clerk'),
  ('Stake Executive Secretary', 'executive_secretary'),
  ('Assistant Stake Executive Secretary', 'assistant_executive_secretary'),
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
ON CONFLICT (calling_name) DO UPDATE SET app_role = EXCLUDED.app_role;

-- Lock the table down: only elevated leaders ever read it (route uses service role),
-- so plain authenticated users get read-only.
ALTER TABLE calling_role_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read calling role map" ON calling_role_map;
CREATE POLICY "Authenticated users can read calling role map"
  ON calling_role_map FOR SELECT
  TO authenticated
  USING (true);
