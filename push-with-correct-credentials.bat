@echo off
title Push to GitHub - rsgarrett/Stake-App
cd /d "%~dp0"

echo ========================================
echo Pushing to rsgarrett/Stake-App
echo ========================================
echo.

REM Clear any cached credentials first
echo [0/5] Clearing old credentials...
git credential reject <<EOF
protocol=https
host=github.com
EOF
echo.

REM Stage all files
echo [1/5] Adding all files...
git add .
echo.

REM Commit changes
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo [2/5] Committing changes...
    git commit -m "Initial commit - Stake President App"
    echo Commit created!
    echo.
) else (
    echo [2/5] Checking for commits...
    git rev-parse --verify HEAD >nul 2>&1
    if %errorlevel% neq 0 (
        echo [2/5] Creating initial commit...
        git commit -m "Initial commit - Stake President App" --allow-empty
        echo Initial commit created!
        echo.
    ) else (
        echo [2/5] Already committed.
        echo.
    )
)

REM Set branch to main
echo [3/5] Setting branch to main...
git branch -M main
echo.

REM Set remote
echo [4/5] Setting remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://rsgarrett@github.com/rsgarrett/Stake-App.git
echo Remote set to: https://github.com/rsgarrett/Stake-App.git
echo.

REM Push to GitHub
echo [5/5] Pushing to GitHub...
echo.
echo You will be prompted for credentials:
echo   Username: rsgarrett (should be pre-filled)
echo   Password: [Paste the Personal Access Token here - NOT your password!]
echo.
echo IMPORTANT: 
echo   - Username MUST be: rsgarrett
echo   - Password MUST be the Personal Access Token (not the GitHub password)
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
    echo Repository: https://github.com/rsgarrett/Stake-App
    echo.
    echo Your dad can now:
    echo   1. Go to: https://github.com/rsgarrett/Stake-App
    echo   2. Click the green "Code" button
    echo   3. Copy the URL
    echo   4. On his laptop, run: git clone https://github.com/rsgarrett/Stake-App.git
    echo.
) else (
    echo.
    echo ========================================
    echo Push failed. Please check the error above.
    echo ========================================
    echo.
    echo Common issues:
    echo   1. Wrong username - Make sure you entered: rsgarrett
    echo   2. Used password instead of token - Must use Personal Access Token
    echo   3. Token doesn't have 'repo' scope - Check token permissions
    echo   4. Old credentials cached - Try running fix-git-credentials.bat first
    echo.
)

pause

