# 🚀 Setup Instructions for Dad

This is a Next.js/TypeScript project. Follow these steps to get it running.

## 📋 Prerequisites

Before starting, make sure you have:
- **Node.js** installed (version 18 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: Open terminal and run `node --version`
- **npm** (comes with Node.js)
  - Verify: Run `npm --version`

## 🏁 Quick Start Steps

### 1. Extract the Files
- Extract the zip file to a folder (e.g., `C:\Users\YourName\Stake-App`)
- Open that folder in Cursor (File → Open Folder)

### 2. Install Dependencies
**Important:** The `node_modules/` folder was excluded from the zip to keep file size small.

In the terminal (in Cursor, press `` Ctrl+` `` to open terminal), run:

```bash
npm install
```

This will:
- Download and install all required packages
- Create the `node_modules/` folder
- May take 2-5 minutes depending on internet speed

### 3. Set Up Environment Variables

Create a file named `.env.local` in the root directory (same folder as `package.json`).

The file should contain:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption Key (generate a new one)
ENCRYPTION_KEY=generate_a_32_character_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**To get Supabase credentials:**
1. Go to https://supabase.com and sign in (or create an account)
2. Create a new project (or use existing one)
3. Go to Settings → API
4. Copy the Project URL and keys

**To generate encryption key:**
Run this in terminal:
```bash
npm run generate-key
```
Copy the output and paste it as `ENCRYPTION_KEY` in `.env.local`

### 4. Set Up the Database

You need to run the database migrations:

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Run each migration file in order from `supabase/migrations/`:
   - Start with `001_initial_schema.sql`
   - Then `002_leadership_module.sql`
   - Continue through `015_fix_meetings_rls.sql`
   - Run them one at a time, in numerical order

### 5. Create Your Stake

After setting up the database, you need to create your stake:

1. Run this SQL in Supabase SQL Editor:
```sql
INSERT INTO stakes (name) VALUES ('Your Stake Name Here');
```

2. Register your first user account at http://localhost:3000/register

3. Get your user ID from Supabase → Authentication → Users

4. Assign yourself as stake president:
```sql
INSERT INTO users (id, role, stake_id)
SELECT 
  'YOUR-USER-ID-FROM-AUTH',
  'stake_president',
  id
FROM stakes 
WHERE name = 'Your Stake Name Here'
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'stake_president', stake_id = EXCLUDED.stake_id;
```

### 6. Start the Development Server

In the terminal, run:

```bash
npm run dev
```

The app will start at: **http://localhost:3000**

Open that URL in your browser and log in!

## 📁 Project Structure

- `app/` - Next.js app router pages and API routes
- `components/` - React components
- `lib/` - Utility functions and Supabase clients
- `supabase/migrations/` - Database migration files
- `types/` - TypeScript type definitions
- `package.json` - Project dependencies and scripts

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run generate-key` - Generate encryption key for .env.local

## ⚠️ Important Notes

1. **Never commit `.env.local`** - It contains secrets and is already in `.gitignore`
2. **The `node_modules/` folder** - This wasn't included in the zip. Always run `npm install` after extracting/cloning
3. **Database migrations** - Must be run in order (001, 002, 003, etc.)
4. **First user** - Must be manually assigned `stake_president` role in the database

## 🐛 Troubleshooting

**"npm: command not found"**
- Install Node.js from https://nodejs.org/

**"Module not found" errors**
- Run `npm install` again

**Can't connect to Supabase**
- Check your `.env.local` file has correct credentials
- Make sure your Supabase project is running

**Port 3000 already in use**
- Stop other applications using port 3000
- Or change the port: `npm run dev -- -p 3001`

## 📚 Additional Resources

- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
- TypeScript Docs: https://www.typescriptlang.org/docs

---

**Need help?** Check the other `.md` files in the project root for more detailed information!

