@echo off
echo ========================================
echo Push to GitHub with Authentication Help
echo ========================================
echo.

REM Check if remote is set
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: No remote repository configured.
    echo Please run complete-github-setup.bat first.
    pause
    exit /b 1
)

echo Current remote repository:
git remote get-url origin
echo.

REM Make sure we're on main branch
git branch -M main

echo Attempting to push to GitHub...
echo.
echo NOTE: If prompted for credentials:
echo   - Username: Your dad's GitHub username
echo   - Password: Use a Personal Access Token (NOT regular password)
echo.
echo If you don't have a token yet:
echo   1. Go to: https://github.com/settings/tokens
echo   2. Generate new token (classic)
echo   3. Select 'repo' scope
echo   4. Copy the token and use it as the password
echo.
pause
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    git remote get-url origin
    echo.
) else (
    echo.
    echo ========================================
    echo Push failed. Common issues:
    echo ========================================
    echo.
    echo 1. Authentication failed:
    echo    - Make sure you're using a Personal Access Token
    echo    - Not your regular GitHub password
    echo    - See GITHUB_AUTH_SETUP.md for detailed instructions
    echo.
    echo 2. Repository doesn't exist or no access:
    echo    - Verify the repository URL is correct
    echo    - Make sure you have push access
    echo.
    echo 3. Try using SSH instead:
    echo    - See GITHUB_AUTH_SETUP.md for SSH setup
    echo    - Use: git remote set-url origin git@github.com:USER/REPO.git
    echo.
)

pause

