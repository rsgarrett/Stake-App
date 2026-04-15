@echo off
echo ========================================
echo Push to Dad's GitHub Account
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM Stage all changes
echo [1/4] Adding all files...
git add .
echo.

REM Commit changes if there are any
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo [2/4] Committing changes...
    git commit -m "Update Stake App - %date% %time%"
    echo.
) else (
    echo [2/4] No changes to commit.
    echo.
)

REM Set branch to main
echo [3/4] Ensuring branch is 'main'...
git branch -M main
echo.

REM Get repository URL from user
echo [4/4] Setting up GitHub remote...
echo.
echo Please enter your dad's GitHub repository URL.
echo Example: https://github.com/dad-username/repo-name.git
echo.
set /p REPO_URL="Repository URL: "

if "%REPO_URL%"=="" (
    echo.
    echo Error: Repository URL cannot be empty!
    pause
    exit /b 1
)

REM Remove existing remote and add new one
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo Remote repository set to: %REPO_URL%
echo.

REM Push to GitHub
echo ========================================
echo Pushing to GitHub...
echo ========================================
echo.
echo You will be prompted for credentials:
echo   - Username: Your dad's GitHub username
echo   - Password: Your dad's Personal Access Token (not password!)
echo.
echo If your dad doesn't have a Personal Access Token:
echo   1. Go to: https://github.com/settings/tokens
echo   2. Click "Generate new token (classic)"
echo   3. Check "repo" scope
echo   4. Copy the token and use it as the password
echo.
pause
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to your dad's GitHub!
    echo ========================================
    echo.
    echo Repository: %REPO_URL%
    echo.
    echo Your dad can now:
    echo   1. Go to: %REPO_URL%
    echo   2. Click "Code" button
    echo   3. Copy the URL
    echo   4. On his laptop, run: git clone [URL]
    echo.
) else (
    echo.
    echo ========================================
    echo Push failed. Please check the error above.
    echo ========================================
    echo.
    echo Common solutions:
    echo.
    echo 1. Authentication:
    echo    - Make sure you're using a Personal Access Token, not a password
    echo    - Create one at: https://github.com/settings/tokens
    echo    - Ensure it has "repo" scope checked
    echo.
    echo 2. Repository Access:
    echo    - Make sure the repository exists: %REPO_URL%
    echo    - Ensure your dad has created the repository on GitHub first
    echo    - You need push access to the repository
    echo.
    echo 3. Try again:
    echo    - Run this script again
    echo    - Or push manually: git push -u origin main
    echo.
)

pause

