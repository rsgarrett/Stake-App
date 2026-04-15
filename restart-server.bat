@echo off
cd /d "%~dp0"
echo ========================================
echo   RESTARTING DEVELOPMENT SERVER
echo ========================================
echo.
echo [INFO] This will stop any running Next.js server
echo        and start a fresh one.
echo.
echo Press Ctrl+C in the terminal where npm run dev is running,
echo then run this script, OR just run: npm run dev
echo.
echo ========================================
echo   Starting fresh server...
echo ========================================
echo.

REM Kill any existing node processes on port 3000 (optional)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo [INFO] Found process on port 3000, PID: %%a
    echo [INFO] You may need to stop it manually with: taskkill /PID %%a /F
)

echo.
echo Starting development server...
echo Open http://localhost:3000 when ready
echo.
echo (Press Ctrl+C to stop)
echo.

call npm run dev


