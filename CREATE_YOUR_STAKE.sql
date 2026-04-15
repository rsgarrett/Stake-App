-- Create your stake
-- IMPORTANT: The stake name MUST be in single quotes!

INSERT INTO stakes (name) VALUES ('Clearfield Utah North Stake') RETURNING id;

-- After you register your account, run this to assign your role:
-- (Replace 'YOUR-USER-ID' with your actual user ID from Authentication → Users)

-- INSERT INTO users (id, role, stake_id)
-- SELECT 
--   'YOUR-USER-ID',
--   'stake_president',
--   id
-- FROM stakes 
-- WHERE name = 'Clearfield Utah North Stake'
-- LIMIT 1
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'stake_president', stake_id = EXCLUDED.stake_id;


