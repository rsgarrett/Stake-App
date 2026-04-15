# .env.local File Setup

## ✅ I've Created Multiple Ways to Set Up Your .env.local File:

### Option 1: Use the Template File (Easiest)
1. **Rename** `env.local.template` to `.env.local`
2. Or run `copy-env.bat` to copy it automatically

### Option 2: Run the Simple Batch File
Double-click `create-env-simple.bat` - it will create `.env.local` for you

### Option 3: Run the Node.js Script
Open terminal in this folder and run:
```bash
node write-env.js
```

### Option 4: Manual Copy
1. Open `env.local.template`
2. Copy all content
3. Create new file named `.env.local`
4. Paste the content

## 📝 Your Credentials Are Already Set:

- ✅ **Supabase URL**: https://gqqbllsbukcipczrdjma.supabase.co
- ✅ **Anon Key**: (already in template)
- ✅ **Encryption Key**: 7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e
- ⚠️ **Service Role Key**: You need to add this from Supabase Dashboard

## 🔑 To Get Your Service Role Key:

1. Go to: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
2. Click **Settings** (gear icon) → **API**
3. Copy the **service_role** key (the long one, keep it secret!)
4. Open `.env.local` and replace `your_service_role_key_here`

## ✅ After .env.local is Set Up:

1. Run `npm install` (if not done yet)
2. Create your stake in Supabase (see CREATE_STAKE.sql)
3. Run `npm run dev` to start the app!


