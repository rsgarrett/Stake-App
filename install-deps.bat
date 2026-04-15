@echo off
cd /d "%~dp0"
echo ========================================
echo Installing dependencies...
echo ========================================
echo Current directory: %CD%
echo.

call npm install

if %errorlevel% equ 0 (
    echo.
    echo ✅ Dependencies installed successfully!
) else (
    echo.
    echo ❌ Installation failed. Try running as Administrator.
)
echo.
pause


