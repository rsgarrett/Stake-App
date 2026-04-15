@echo off
echo ========================================
echo Fix Remote Repository URL
echo ========================================
echo.
echo IMPORTANT: Your Personal Access Token was set as the remote URL.
echo This is incorrect and a security risk!
echo.
echo The remote should be the GitHub repository URL, not the token.
echo.
echo Current (incorrect) remote:
git remote get-url origin
echo.
echo ========================================
echo.
set /p REPO_URL="Enter the CORRECT GitHub repository URL (e.g., https://github.com/username/repo-name.git): "
echo.

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty!
    pause
    exit /b 1
)

echo Updating remote URL...
git remote set-url origin %REPO_URL%

echo.
echo New remote URL:
git remote get-url origin
echo.
echo ========================================
echo Remote URL fixed!
echo.
echo SECURITY NOTE: Since your token was exposed, you should:
echo 1. Go to: https://github.com/settings/tokens
echo 2. Find and revoke any exposed tokens
echo 3. Click "Revoke" to delete it
echo 4. Create a NEW token and use it as the PASSWORD when pushing
echo.
echo Now you can push with: push-with-auth.bat
echo ========================================
pause

