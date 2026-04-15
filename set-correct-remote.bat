@echo off
echo ========================================
echo Setting Correct Remote Repository URL
echo ========================================
echo.

REM Remove the incorrect remote (the token)
git remote remove origin

REM Add the correct remote URL (HTTPS version for easier authentication)
echo Setting remote to: https://github.com/rsgarrett/Stake-App.git
git remote add origin https://github.com/rsgarrett/Stake-App.git

echo.
echo Remote URL updated successfully!
echo.
echo Current remote:
git remote get-url origin
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Make sure you have a Personal Access Token:
echo    - Go to: https://github.com/settings/tokens
echo    - Create a new token with 'repo' scope
echo    - Copy the token
echo.
echo 2. Run: push-with-auth.bat
echo    - When asked for username: Enter rsgarrett
echo    - When asked for password: Paste your Personal Access Token
echo.
echo ========================================
pause

