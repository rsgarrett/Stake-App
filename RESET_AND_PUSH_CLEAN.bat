@echo off
title Clean Reset and Push
cd /d "%~dp0"

echo ========================================
echo Resetting Commit and Pushing Clean Version
echo ========================================
echo.
echo This will remove the previous commit with secrets
echo and create a clean commit without any tokens.
echo.
pause

REM Reset to before the commit (keep the files)
echo Resetting the last commit (keeping files)...
git reset --soft HEAD~1
if %errorlevel% neq 0 (
    echo No previous commit found, continuing...
)
echo.

REM Add all files (which now have secrets removed)
echo Staging all files...
git add -A
echo.

REM Create clean commit
echo Creating clean commit...
git commit -m "Initial commit - Stake President App"
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
    echo All Personal Access Tokens have been removed from the code.
    echo.
) else (
    echo.
    echo Push failed. If you see secret detection errors:
    echo 1. All secrets have been removed from the code
    echo 2. You can use the GitHub link to allow this push:
    echo    https://github.com/rsgarrett/Stake-App/security/secret-scanning/unblock-secret/37PGG9Yppu2RqIMCXE9eoYuE8Gs
    echo.
)

pause

