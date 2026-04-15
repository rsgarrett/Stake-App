-- Initial Setup Script
-- Run this after creating your Supabase project and running all migrations

-- Step 1: Create a stake (replace 'Your Stake Name' with your actual stake name)
INSERT INTO stakes (name) 
VALUES ('Your Stake Name') 
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 2: After you register a user, update this query with your auth user ID
-- You can find your auth user ID in Supabase Dashboard > Authentication > Users
-- Replace 'your-auth-user-id-here' with the actual UUID from auth.users

-- First, get your stake ID (run the query above first to get the ID)
-- Then run this with your actual values:

/*
UPDATE users 
SET 
  role = 'stake_president',
  stake_id = (SELECT id FROM stakes WHERE name = 'Your Stake Name' LIMIT 1)
WHERE id = 'your-auth-user-id-here';

-- If the user doesn't exist in the users table yet, insert it:
INSERT INTO users (id, role, stake_id)
SELECT 
  'your-auth-user-id-here',
  'stake_president',
  id
FROM stakes 
WHERE name = 'Your Stake Name'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET 
  role = 'stake_president',
  stake_id = EXCLUDED.stake_id;
*/

-- Step 3: Verify your setup
SELECT 
  u.id,
  u.role,
  s.name as stake_name,
  au.email
FROM users u
JOIN stakes s ON u.stake_id = s.id
JOIN auth.users au ON u.id = au.id
WHERE u.id = 'your-auth-user-id-here';


