-- Editable High Council training content (one row per stake, JSON payload)
-- Same as supabase/migrations/046_high_council_training_content.sql

CREATE TABLE IF NOT EXISTS high_council_training_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stake_id UUID NOT NULL REFERENCES stakes(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stake_id)
);

CREATE INDEX IF NOT EXISTS idx_high_council_training_stake_id ON high_council_training_content(stake_id);

DROP TRIGGER IF EXISTS update_high_council_training_content_updated_at ON high_council_training_content;
CREATE TRIGGER update_high_council_training_content_updated_at
  BEFORE UPDATE ON high_council_training_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE high_council_training_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read high council training in my stake" ON high_council_training_content;
DROP POLICY IF EXISTS "Elevated roles manage high council training content" ON high_council_training_content;

CREATE POLICY "Read high council training in my stake"
  ON high_council_training_content
  FOR SELECT
  TO authenticated
  USING (stake_id = get_user_stake_id());

CREATE POLICY "Elevated roles manage high council training content"
  ON high_council_training_content
  FOR ALL
  TO authenticated
  USING (has_elevated_role() AND stake_id = get_user_stake_id())
  WITH CHECK (has_elevated_role() AND stake_id = get_user_stake_id());
