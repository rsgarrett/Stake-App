-- Confirm your user account manually
-- This sets the email_confirmed_at timestamp so you can log in

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'rsgarrett@gmail.com';

-- Verify it worked (optional - you can run this to check)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'rsgarrett@gmail.com';


