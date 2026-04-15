@echo off
cd /d "%~dp0"
echo ========================================
echo   RESTARTING SERVER (EASY MODE)
echo ========================================
echo.

REM Try to find and kill any process on port 3000
echo [1/3] Checking for processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Found process using port 3000, PID: %%a
    echo [INFO] Stopping process...
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo [SUCCESS] Process stopped
    ) else (
        echo [INFO] Process may have already stopped
    )
)

echo.
echo [2/3] Waiting 2 seconds for port to be free...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Starting development server...
echo.
echo ========================================
echo   SERVER STARTING...
echo ========================================
echo.
echo Your app will be available at: http://localhost:3000
echo.
echo (Press Ctrl+C to stop the server)
echo.

call npm run dev


