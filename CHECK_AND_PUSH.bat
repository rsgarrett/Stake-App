@echo off
echo ========================================
echo Checking Repository Status
echo ========================================
echo.

cd /d "%~dp0"

echo Checking git status...
git status

echo.
echo ========================================
echo If you see "Untracked files" above, run:
echo   git add .
echo   git commit -m "Initial commit"
echo   git push -u origin main
echo ========================================
echo.

pause

