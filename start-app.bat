@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   STAKE STEWARD APP LAUNCHER
echo ========================================
echo.

:: Check if .env.local exists
if not exist ".env.local" (
    echo [ERROR] .env.local file not found!
    echo Please create it first using the template or instructions.
    pause
    exit /b 1
)

:: Check if node_modules exists, if not install
if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        echo Try running this script as Administrator.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Dependencies found.
)

:: Clear Next.js cache to avoid conflicts
if exist ".next" (
    echo [INFO] Clearing temporary cache...
    rmdir /s /q ".next" >nul 2>&1
)

echo.
echo ========================================
echo   STARTING APPLICATION...
echo ========================================
echo.
echo Open your browser to: http://localhost:3000
echo.
echo (Press Ctrl+C to stop the server)
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Application crashed or failed to start.
    pause
)


