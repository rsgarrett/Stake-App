@echo off
cd /d "%~dp0"
echo ========================================
echo Creating .env.local file...
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Create .env.local file
(
echo NEXT_PUBLIC_SUPABASE_URL=https://gqqbllsbukcipczrdjma.supabase.co
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxcWJsbHNidWtjaXBjenJkam1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2OTU5NDIsImV4cCI6MjA4MjI3MTk0Mn0.774KEVczMY_sa2krSB96zeohCelZTp_JoGIc1N1sUkw
echo SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
echo ENCRYPTION_KEY=7f3a9b2e8d1c4f6a5b9e2d7c1a4f8b3e
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
) > "%CD%\.env.local"

echo ✅ .env.local file created!
echo.
echo ⚠️  IMPORTANT: You still need to:
echo    1. Get your Service Role Key from Supabase Dashboard
echo    2. Replace "your_service_role_key_here" in .env.local
echo.
echo ========================================
echo Installing dependencies...
echo ========================================
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env.local and add your Service Role Key
echo 2. Create your stake in Supabase (see CREATE_STAKE.sql)
echo 3. Run 'npm run dev' to start the app
echo.
pause

