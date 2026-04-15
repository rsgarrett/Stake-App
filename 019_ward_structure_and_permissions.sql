-- Migration 019: Ward Structure and Role-Based Permissions
-- Based on General Handbook - Stake with 7 wards

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  number TEXT NOT NULL UNIQUE, -- "8th", "12th", "17th", etc.
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE NOT NULL,
  bishop_id UUID REFERENCES users(id), -- Current bishop
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add ward_id to users table for bishops and ward leaders
ALTER TABLE users
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Create ward_leadership table to track all ward leadership positions
CREATE TABLE IF NOT EXISTS ward_leadership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  position TEXT NOT NULL, -- 'bishop', 'counselor', 'clerk', 'executive_secretary', etc.
  calling_id UUID REFERENCES callings(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ward_id, user_id, position, is_active) WHERE is_active = TRUE
);

-- Update callings to properly link to wards
ALTER TABLE callings
ADD COLUMN IF NOT EXISTS ward_id UUID REFERENCES wards(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wards_stake_id ON wards(stake_id);
CREATE INDEX IF NOT EXISTS idx_wards_number ON wards(number);
CREATE INDEX IF NOT EXISTS idx_users_ward_id ON users(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_leadership_ward_id ON ward_leadership(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_leadership_user_id ON ward_leadership(user_id);
CREATE INDEX IF NOT EXISTS idx_callings_ward_id ON callings(ward_id);

-- Insert the 7 wards for the stake
-- Note: Replace 'YOUR_STAKE_ID' with actual stake ID when running
DO $$
DECLARE
  stake_uuid UUID;
BEGIN
  -- Get the first stake (or you can specify by name)
  SELECT id INTO stake_uuid FROM stakes LIMIT 1;
  
  IF stake_uuid IS NOT NULL THEN
    INSERT INTO wards (name, number, stake_id) VALUES
      ('8th Ward', '8th', stake_uuid),
      ('12th Ward', '12th', stake_uuid),
      ('17th Ward', '17th', stake_uuid),
      ('18th Ward', '18th', stake_uuid),
      ('19th Ward', '19th', stake_uuid),
      ('22nd Ward', '22nd', stake_uuid),
      ('23rd Ward', '23rd', stake_uuid)
    ON CONFLICT (number) DO NOTHING;
  END IF;
END $$;

-- Helper function to get user's ward_id
CREATE OR REPLACE FUNCTION get_user_ward_id()
RETURNS UUID AS $$
  SELECT ward_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user can access ward
CREATE OR REPLACE FUNCTION can_access_ward(target_ward_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_val user_role;
  user_ward_id_val UUID;
  user_stake_id_val UUID;
  target_stake_id_val UUID;
BEGIN
  -- Get user's role and ward
  SELECT role, ward_id, stake_id INTO user_role_val, user_ward_id_val, user_stake_id_val
  FROM users WHERE id = auth.uid();
  
  -- Stake presidency, counselors, clerks, high council can see all wards in their stake
  IF user_role_val IN ('stake_president', 'counselor', 'clerk', 'high_council') THEN
    SELECT stake_id INTO target_stake_id_val FROM wards WHERE id = target_ward_id;
    RETURN target_stake_id_val = user_stake_id_val;
  END IF;
  
  -- Bishops can only see their own ward
  IF user_role_val = 'bishop' THEN
    RETURN user_ward_id_val = target_ward_id;
  END IF;
  
  -- Auxiliary leaders and viewers can see their own ward
  IF user_role_val IN ('auxiliary_leader', 'viewer') THEN
    RETURN user_ward_id_val = target_ward_id;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for wards
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view wards in their stake or their own ward" ON wards
  FOR SELECT USING (
    stake_id = get_user_stake_id() OR
    id = get_user_ward_id() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('stake_president', 'counselor', 'clerk', 'high_council')
      AND stake_id = wards.stake_id
    )
  );

-- Update callings RLS to respect ward boundaries
DROP POLICY IF EXISTS "Users can view callings in their stake" ON callings;
DROP POLICY IF EXISTS "Elevated roles can insert callings" ON callings;
DROP POLICY IF EXISTS "Elevated roles can update callings" ON callings;
DROP POLICY IF EXISTS "Elevated roles can delete callings" ON callings;

-- New callings policies with ward restrictions
CREATE POLICY "Users can view callings based on role and ward" ON callings
  FOR SELECT USING (
    -- Stake leadership can see all callings in their stake
    (stake_id = get_user_stake_id() AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('stake_president', 'counselor', 'clerk', 'high_council')
    )) OR
    -- Ward leaders can see callings in their ward
    (ward_id = get_user_ward_id() AND ward_id IS NOT NULL) OR
    -- Users can see callings they submitted
    (submitted_by = auth.uid())
  );

CREATE POLICY "Users can insert callings based on role" ON callings
  FOR INSERT WITH CHECK (
    stake_id = get_user_stake_id() AND (
      -- Stake leadership can create any calling
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('stake_president', 'counselor', 'clerk')
      ) OR
      -- Ward leaders can create callings in their ward
      (ward_id = get_user_ward_id() AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('bishop', 'auxiliary_leader')
      ))
    )
  );

CREATE POLICY "Users can update callings based on role" ON callings
  FOR UPDATE USING (
    stake_id = get_user_stake_id() AND (
      -- Stake leadership can update any calling
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('stake_president', 'counselor', 'clerk')
      ) OR
      -- Ward leaders can update callings in their ward
      (ward_id = get_user_ward_id() AND EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('bishop', 'auxiliary_leader')
      )) OR
      -- Users can update callings they submitted
      (submitted_by = auth.uid())
    )
  );

CREATE POLICY "Users can delete callings based on role" ON callings
  FOR DELETE USING (
    stake_id = get_user_stake_id() AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('stake_president', 'counselor', 'clerk')
    )
  );

-- Update calling_recommendations RLS
ALTER TABLE calling_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recommendations based on role" ON calling_recommendations
  FOR SELECT USING (
    stake_id = get_user_stake_id() AND (
      -- Stake leadership can see all
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('stake_president', 'counselor', 'clerk', 'high_council')
      ) OR
      -- Ward leaders can see recommendations for their ward
      (ward = (SELECT number FROM wards WHERE id = get_user_ward_id())) OR
      -- Users can see their own recommendations
      (submitted_by = auth.uid())
    )
  );

CREATE POLICY "Users can submit recommendations" ON calling_recommendations
  FOR INSERT WITH CHECK (
    stake_id = get_user_stake_id() AND (
      submitted_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('stake_president', 'counselor', 'clerk', 'bishop', 'auxiliary_leader')
      )
    )
  );

-- Update notifications to respect ward boundaries
DROP POLICY IF EXISTS "Users can view their own notifications" ON calling_notifications;

CREATE POLICY "Users can view their own notifications" ON calling_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Create triggers
CREATE TRIGGER update_wards_updated_at
  BEFORE UPDATE ON wards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ward_leadership_updated_at
  BEFORE UPDATE ON ward_leadership
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
