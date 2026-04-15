-- Verify your user session setup
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- Check if your user exists in auth.users and is confirmed
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed ✓'
    ELSE 'NOT Confirmed ✗'
  END as confirmation_status
FROM auth.users
WHERE email = 'rsgarrett@gmail.com';

-- Check if your user exists in the users table with role
SELECT 
  u.id,
  u.role,
  u.stake_id,
  s.name as stake_name,
  au.email,
  CASE 
    WHEN u.id IS NOT NULL THEN 'In users table ✓'
    ELSE 'NOT in users table ✗'
  END as user_table_status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
LEFT JOIN stakes s ON u.stake_id = s.id
WHERE au.email = 'rsgarrett@gmail.com';

-- If the user is NOT in the users table, run this:
/*
INSERT INTO users (id, role, stake_id)
SELECT 
  au.id,
  'stake_president',
  s.id
FROM auth.users au
CROSS JOIN stakes s
WHERE au.email = 'rsgarrett@gmail.com'
  AND s.name = 'Clearfield Utah North Stake'
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
*/


