# Complete Setup Instructions

## ✅ Step 1: Create .env.local File

Create a file named `.env.local` in your project root with this content:

```
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENCRYPTION_KEY=generate_this_with_npm_run_generate_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**
- Get your `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API
- Generate `ENCRYPTION_KEY` by running: `npm run generate-key`

## ✅ Step 2: Install Dependencies

Run in your terminal:
```bash
npm install
```

## ✅ Step 3: Generate Encryption Key

Run:
```bash
npm run generate-key
```

Copy the generated key and replace `ENCRYPTION_KEY` in your `.env.local` file.

## ✅ Step 4: Set Up Database

1. Go to your Supabase project: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `SUPABASE_SETUP.sql` file
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

This will create all tables, indexes, triggers, and RLS policies.

## ✅ Step 5: Create Your Stake

After the database is set up, run this SQL in Supabase SQL Editor:

```sql
-- Create your stake (replace 'Your Stake Name' with your actual stake name)
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;
```

## ✅ Step 6: Register Your First User

1. Start the app: `npm run dev`
2. Go to http://localhost:3000/register
3. Create your account
4. Note your user ID from Supabase Dashboard → Authentication → Users

## ✅ Step 7: Assign Your User Role

After registering, run this SQL (replace `YOUR-USER-ID` with your actual user ID from step 6):

```sql
-- Get your stake ID first
SELECT id FROM stakes LIMIT 1;

-- Then insert/update your user (replace YOUR-USER-ID and use the stake_id from above)
INSERT INTO users (id, role, stake_id)
SELECT 
  'YOUR-USER-ID',
  'stake_president',
  id
FROM stakes 
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

## ✅ Step 8: Get Service Role Key

1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** key (not the anon key)
3. Add it to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

## ✅ Step 9: Start the App

```bash
npm run dev
```

Visit http://localhost:3000 and log in!

## 🎉 You're Done!

Your app is now fully set up and ready to use!


