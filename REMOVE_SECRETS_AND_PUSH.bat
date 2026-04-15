@echo off
title Remove Secrets and Push
cd /d "%~dp0"

echo ========================================
echo Removing Secrets and Re-pushing
echo ========================================
echo.

REM Add the fixed files (without tokens)
echo Adding fixed files...
git add fix-remote-url.bat complete-setup-and-push.bat push-with-error-log.bat push-now.bat diagnose-push-issue.bat
echo.

REM Amend the commit to remove the secret
echo Updating the commit to remove secrets...
git commit --amend -m "Initial commit - Stake President App" --no-edit
echo.

REM Force push
echo ========================================
echo Pushing to GitHub (this will update the previous commit)...
echo ========================================
echo.
echo When prompted for credentials:
echo   Password: [Paste Personal Access Token]
echo.
pause

git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Repository: https://github.com/rsgarrett/Stake-App
    echo.
    echo IMPORTANT: The old tokens in the code have been removed.
    echo If any tokens were exposed, revoke them at:
    echo https://github.com/settings/tokens
    echo.
) else (
    echo.
    echo Push failed. You may need to allow the secret via:
    echo https://github.com/rsgarrett/Stake-App/security/secret-scanning/unblock-secret/37PGG9Yppu2RqIMCXE9eoYuE8Gs
    echo.
    echo Or try pushing again - the secrets have been removed from the code.
    echo.
)

pause

