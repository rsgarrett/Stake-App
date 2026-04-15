# Quick Start Guide

## 🚀 Get Started in 5 Steps

### 1. Install Dependencies
Open your terminal in this directory and run:
```bash
npm install
```

### 2. Set Up Supabase
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Settings** → **API**
4. Copy your credentials:
   - **Project URL** 
   - **anon/public key**
   - **service_role key** (keep this secret!)

### 3. Create Environment File
Create a file named `.env.local` in the root directory with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ENCRYPTION_KEY=run_npm_run_generate_key_to_get_this
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate encryption key:
```bash
npm run generate-key
```
Copy the output and paste it as `ENCRYPTION_KEY` in `.env.local`

### 4. Set Up Database
Go to your Supabase project → **SQL Editor** and run all migration files in order:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_leadership_module.sql`
- ... (through 013)

Or use Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 5. Create Your Stake and User
After registering your first account, run this SQL in Supabase SQL Editor:
```sql
-- Create your stake
INSERT INTO stakes (name) VALUES ('Your Stake Name') RETURNING id;

-- Update your user (replace 'YOUR-AUTH-USER-ID' with your actual user ID from Auth > Users)
INSERT INTO users (id, role, stake_id)
SELECT 
  'YOUR-AUTH-USER-ID',
  'stake_president',
  id
FROM stakes 
WHERE name = 'Your Stake Name'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

### 6. Start the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and log in!

## 📝 Notes

- Your first user needs to be manually assigned the `stake_president` role in the database
- All sensitive data (welfare cases, interview notes) is encrypted
- Row Level Security ensures users only see data from their stake
- Check `SETUP.md` for detailed instructions

## 🆘 Need Help?

- Check `SETUP.md` for detailed setup instructions
- Review the database migrations in `supabase/migrations/`
- All modules are ready to use once the database is set up!


