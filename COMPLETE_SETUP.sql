-- Complete setup: Confirm user AND assign role
-- Run this all at once in Supabase SQL Editor

-- Step 1: Confirm your email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'rsgarrett@gmail.com';

-- Step 2: Get your user ID and assign role
INSERT INTO users (id, role, stake_id)
SELECT 
  u.id,
  'stake_president',
  s.id
FROM auth.users u
CROSS JOIN stakes s
WHERE u.email = 'rsgarrett@gmail.com'
  AND s.name = 'Clearfield Utah North Stake'
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;

-- Step 3: Verify everything worked
SELECT 
  u.id as user_id,
  u.email,
  u.email_confirmed_at,
  us.role,
  s.name as stake_name
FROM auth.users u
LEFT JOIN users us ON u.id = us.id
LEFT JOIN stakes s ON us.stake_id = s.id
WHERE u.email = 'rsgarrett@gmail.com';


