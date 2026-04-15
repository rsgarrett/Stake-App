@echo off
echo ========================================
echo Complete Setup and Push
echo ========================================
echo.

REM Initialize git if needed
if not exist .git (
    echo [1/5] Initializing git...
    git init
    echo.
)

REM Add all files
echo [2/5] Adding all files...
git add .
echo.

REM Check if we need to commit
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo [3/5] Creating commit...
    git commit -m "Initial commit - Stake President App"
    echo Commit created!
    echo.
) else (
    git rev-parse --verify HEAD >nul 2>&1
    if %errorlevel% neq 0 (
        echo [3/5] Creating initial commit...
        git commit -m "Initial commit - Stake President App" --allow-empty
        echo Commit created!
        echo.
    ) else (
        echo [3/5] Files already committed.
        echo.
    )
)

REM Set branch to main
echo [4/5] Setting branch to main...
git branch -M main
echo.

REM Set remote
echo [5/5] Setting remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://github.com/rsgarrett/Stake-App.git
echo Remote set to: https://github.com/rsgarrett/Stake-App.git
echo.

echo ========================================
echo Ready to push!
echo ========================================
echo.
echo When prompted for credentials:
echo   Username: rsgarrett
echo   Password: [Paste your Personal Access Token here]
echo.
echo (This is your Personal Access Token)
echo.
pause
echo.

echo Pushing to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Repository: https://github.com/rsgarrett/Stake-App
    echo.
) else (
    echo.
    echo ========================================
    echo Push failed. Error details above.
    echo ========================================
    echo.
    echo Troubleshooting:
    echo.
    echo 1. Token Permissions:
    echo    - Make sure the token has 'repo' scope checked
    echo    - Go to: https://github.com/settings/tokens
    echo    - Edit the token and ensure 'repo' is selected
    echo.
    echo 2. Repository Access:
    echo    - Verify the repository exists: https://github.com/rsgarrett/Stake-App
    echo    - Make sure you have push access
    echo.
    echo 3. Try running: diagnose-push-issue.bat for more details
    echo.
)

pause

