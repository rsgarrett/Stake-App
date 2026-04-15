@echo off
cd /d "%~dp0"
echo ========================================
echo Creating .env.local in project root...
echo ========================================
echo.
echo Current directory: %CD%
echo.

REM Check if .env.local already exists
if exist ".env.local" (
    echo [INFO] .env.local already exists in: %CD%
    echo.
    echo Contents:
    type .env.local
    echo.
    echo If this is correct, you're all set!
    pause
    exit /b 0
)

REM Create .env.local file
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

if exist ".env.local" (
    echo [SUCCESS] .env.local created successfully!
    echo.
    echo Location: %CD%\.env.local
    echo.
    echo Contents:
    type .env.local
    echo.
    echo ⚠️  IMPORTANT: Make sure SUPABASE_SERVICE_ROLE_KEY is set!
    echo    If it says "your_service_role_key_here", you need to update it.
) else (
    echo [ERROR] Failed to create .env.local
    echo.
    echo Please create it manually:
    echo 1. Create a new file named .env.local
    echo 2. Copy content from ENV_LOCAL_FINAL.txt
)

echo.
pause


