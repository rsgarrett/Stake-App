# 🚀 Quick Setup - Run This Now!

## Option 1: Use the Batch File (Easiest)

**Double-click `setup-complete.bat`** - it will:
- ✅ Create your `.env.local` file
- ✅ Install all dependencies
- ✅ Set up everything automatically

Then just add your Service Role Key to `.env.local`

## Option 2: Manual Setup

### Step 1: Create .env.local

Create a file named `.env.local` in your project root and paste this:

```
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Get Service Role Key

1. Go to: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
2. Settings → API
3. Copy the **service_role** key
4. Replace `your_service_role_key_here` in `.env.local`

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Create Your Stake

In Supabase SQL Editor, run:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name');
```

### Step 5: Start App

```bash
npm run dev
```

### Step 6: Register & Assign Role

1. Register at http://localhost:3000/register
2. Get your user ID from Supabase → Authentication → Users
3. Run this SQL (replace YOUR-USER-ID):
```sql
INSERT INTO users (id, role, stake_id)
SELECT 'YOUR-USER-ID', 'stake_president', id FROM stakes LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

### Step 7: Log In!

Go to http://localhost:3000 and log in! 🎉


