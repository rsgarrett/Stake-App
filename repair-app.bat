@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   FORCE REINSTALL & REPAIR
echo ========================================
echo.
echo This will delete node_modules and package-lock.json
echo and reinstall everything fresh.
echo.
echo Press Ctrl+C to cancel, or any key to continue...
pause >nul

echo.
echo [1/4] Removing package-lock.json...
if exist "package-lock.json" del /f /q "package-lock.json"

echo [2/4] Removing node_modules (this may take a minute)...
if exist "node_modules" rmdir /s /q "node_modules"

echo [3/4] Clearing npm cache...
call npm cache clean --force

echo [4/4] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Reinstall failed!
    echo Try running this script as Administrator.
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Repair complete!
echo You can now run start-app.bat
echo.
pause


