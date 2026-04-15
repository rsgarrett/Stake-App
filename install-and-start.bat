@echo off
cd /d "%~dp0"
echo ========================================
echo Installing Dependencies...
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
echo Starting Development Server...
echo ========================================
echo.
echo The app will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run dev


