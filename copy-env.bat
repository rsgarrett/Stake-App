@echo off
cd /d "%~dp0"
echo Copying env.local.template to .env.local...
copy /Y "env.local.template" ".env.local" >nul
if exist ".env.local" (
    echo ✅ .env.local file created successfully!
    echo.
    echo ⚠️  Don't forget to add your Service Role Key:
    echo    1. Go to Supabase Dashboard → Settings → API
    echo    2. Copy the service_role key
    echo    3. Replace "your_service_role_key_here" in .env.local
) else (
    echo ❌ Failed to create .env.local
)
echo.
pause


