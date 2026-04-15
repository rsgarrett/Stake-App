# Manual Setup Instructions

Since the batch file had permission issues, follow these steps:

## Step 1: Create .env.local File

**Option A: Copy from file**
1. Open `ENV_LOCAL_CONTENT.txt`
2. Copy all the content
3. Create a new file named `.env.local` in your project root
4. Paste the content

**Option B: Create manually**
Create a file named `.env.local` with this content:

```
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Add Service Role Key

1. Go to: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
2. Click **Settings** → **API**
3. Copy the **service_role** key
4. Open `.env.local` and replace `your_service_role_key_here` with your actual key

## Step 3: Install Dependencies

Open PowerShell or Command Prompt **in your project folder** and run:

```bash
npm install
```

**If you get permission errors:**
- Right-click PowerShell/CMD → "Run as Administrator"
- Or run: `npm install --force`

## Step 4: Create Your Stake

In Supabase SQL Editor, run:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name');
```

## Step 5: Start the App

```bash
npm run dev
```

## Step 6: Register & Setup

1. Go to http://localhost:3000/register
2. Create your account
3. Get your user ID from Supabase → Authentication → Users
4. Run this SQL (replace YOUR-USER-ID):
```sql
INSERT INTO users (id, role, stake_id)
SELECT 'YOUR-USER-ID', 'stake_president', id FROM stakes LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

## Step 7: Log In!

Go to http://localhost:3000 and log in! 🎉


