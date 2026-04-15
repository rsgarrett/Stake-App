# ✅ Database Setup Complete! Next Steps:

## Step 1: Create .env.local File

Create a file named `.env.local` in your project root with this content:

```
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENCRYPTION_KEY=generate_this_next
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To get your Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
2. Click **Settings** (gear icon) → **API**
3. Copy the **service_role** key (keep it secret!)
4. Replace `your_service_role_key_here` in `.env.local`

## Step 2: Install Dependencies

Open terminal in this folder and run:
```bash
npm install
```

## Step 3: Generate Encryption Key

Run:
```bash
npm run generate-key
```

Copy the generated key and replace `ENCRYPTION_KEY=generate_this_next` in your `.env.local` file.

## Step 4: Create Your Stake

Go to Supabase SQL Editor and run:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;
```
(Replace 'Your Stake Name' with your actual stake name)

## Step 5: Start the App

```bash
npm run dev
```

## Step 6: Register Your Account

1. Open http://localhost:3000
2. Click "Register" or go to http://localhost:3000/register
3. Create your account with email and password
4. **Note your user ID** from Supabase Dashboard → Authentication → Users

## Step 7: Assign Your Role

After registering, go back to Supabase SQL Editor and run:
```sql
-- Replace 'YOUR-USER-ID' with the actual UUID from Authentication → Users
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

## Step 8: Log In!

Go back to http://localhost:3000 and log in with your credentials.

## 🎉 You're Done!

Your app is now fully functional! You can:
- Access all 11 modules from the dashboard
- Start managing your stake operations
- Import data from Google Sheets via Settings
- Add more users and assign roles

---

**Quick Checklist:**
- [ ] Created `.env.local` with all credentials
- [ ] Installed dependencies (`npm install`)
- [ ] Generated encryption key
- [ ] Created stake in database
- [ ] Started app (`npm run dev`)
- [ ] Registered account
- [ ] Assigned stake_president role
- [ ] Logged in successfully


