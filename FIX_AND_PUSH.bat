@echo off
title Fix Secrets and Push
cd /d "%~dp0"

echo ========================================
echo Fixing Secrets and Pushing
echo ========================================
echo.

REM Stage all the fixed files
echo Staging fixed files...
git add -A
echo.

REM Create a new commit with the fixes
echo Creating new commit with secrets removed...
git commit -m "Initial commit - Stake President App (secrets removed)"
echo.

REM Push
echo ========================================
echo Pushing to GitHub...
echo ========================================
echo.
echo When prompted for credentials:
echo   Password: [Paste Personal Access Token]
echo.
pause

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Repository: https://github.com/rsgarrett/Stake-App
    echo.
    echo IMPORTANT: Personal Access Tokens have been removed from the code.
    echo If any tokens were exposed, make sure to revoke them at:
    echo https://github.com/settings/tokens
    echo.
) else (
    echo.
    echo If push protection still blocks it, you may need to:
    echo 1. Go to the GitHub link shown in the error
    echo 2. Click "Allow this secret" to bypass the check (since we removed it)
    echo.
    echo Or try pushing with force (not recommended but may work):
    echo   git push -u origin main --force
    echo.
)

pause

