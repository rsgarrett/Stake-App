@echo off
cd /d "%~dp0"
echo Updating .env.local file...
echo.

(
echo # Supabase Configuration
echo NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
echo.
echo # Encryption Key
echo ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e
echo.
echo # App Configuration
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
) > "%CD%\.env.local"

if exist "%CD%\.env.local" (
    echo ✅ .env.local file updated successfully!
    echo.
    echo ⚠️  Don't forget to add your Service Role Key:
    echo    1. Go to Supabase Dashboard → Settings → API
    echo    2. Copy the service_role key
    echo    3. Replace "your_service_role_key_here" in .env.local
) else (
    echo ❌ Failed to update .env.local
)
echo.
pause


