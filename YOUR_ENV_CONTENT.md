# Your .env.local File Content

Since I can't directly edit your .env.local file, here's the exact content you need:

## Copy this entire block into your .env.local file:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Encryption Key
ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## What's Already Set:
- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ Encryption Key (generated)
- ✅ App URL

## What You Still Need:
- ⚠️ **Service Role Key** - Get it from:
  1. Go to: https://supabase.com/dashboard/project/gqqbllsbukcipczrdjma
  2. Click **Settings** → **API**
  3. Copy the **service_role** key (the long one)
  4. Replace `your_service_role_key_here` in your `.env.local` file

## Quick Update Options:

**Option 1:** Run `update-env.ps1` in PowerShell (right-click → Run with PowerShell)

**Option 2:** Open `.env.local` and replace the content with the block above

**Option 3:** Use `update-env.bat` (double-click it)


