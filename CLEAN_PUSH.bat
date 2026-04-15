@echo off
title Clean Push - Secrets Removed
cd /d "%~dp0"

echo ========================================
echo Cleaning Up and Pushing
echo ========================================
echo.

REM Stage all changes (including the files where we removed tokens)
git add -A

REM Amend the previous commit to include the fixes
echo Updating commit to remove secrets...
git commit --amend -m "Initial commit - Stake President App" --no-edit

echo.
echo ========================================
echo Pushing to GitHub...
echo ========================================
echo.
pause

git push -u origin main --force-with-lease

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed!
    echo ========================================
    echo Repository: https://github.com/rsgarrett/Stake-App
    echo.
) else (
    echo.
    echo If still blocked, use this link to allow:
    echo https://github.com/rsgarrett/Stake-App/security/secret-scanning/unblock-secret/37PGG9Yppu2RqIMCXE9eoYuE8Gs
    echo.
    echo Then try: git push -u origin main --force
    echo.
)

pause

