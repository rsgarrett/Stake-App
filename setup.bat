@echo off
echo ========================================
echo Stake President App - Setup Script
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    echo Please make sure Node.js is installed.
    pause
    exit /b 1
)

echo.
echo Step 2: Generating encryption key...
call npm run generate-key

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create a Supabase project at https://supabase.com
echo 2. Copy your credentials to .env.local
echo 3. Run the database migrations in Supabase SQL Editor
echo 4. Run 'npm run dev' to start the app
echo.
echo See QUICK_START.md for detailed instructions.
echo.
pause


