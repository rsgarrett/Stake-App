@echo off
cd /d "%~dp0"
echo Creating .env.local file...

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
) > .env.local

if exist .env.local (
    echo.
    echo SUCCESS! .env.local file created!
    echo.
    echo Location: %CD%\.env.local
    echo.
    echo Next: Add your Service Role Key from Supabase Dashboard
) else (
    echo.
    echo ERROR: Could not create .env.local
    echo Please create it manually using env.local.template
)
echo.
pause


