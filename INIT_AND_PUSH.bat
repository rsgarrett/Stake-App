@echo off
title Initialize and Push to GitHub
cd /d "%~dp0"

echo ========================================
echo Initializing Git and Pushing to GitHub
echo ========================================
echo.

REM Check if git is initialized
if not exist .git (
    echo Git not initialized. Initializing now...
    git init
    echo.
)

REM Add all files
echo Adding all files...
git add .
echo.

REM Commit
echo Creating commit...
git commit -m "Initial commit - Stake President App"
echo.

REM Set branch to main
echo Setting branch to main...
git branch -M main
echo.

REM Set remote
echo Setting remote repository...
git remote remove origin >nul 2>&1
git remote add origin https://rsgarrett@github.com/rsgarrett/Stake-App.git
echo Remote set to: https://github.com/rsgarrett/Stake-App.git
echo.

REM Push
echo ========================================
echo Ready to push!
echo ========================================
echo.
echo When prompted for credentials:
echo   Password: [Paste Personal Access Token]
echo   (Username rsgarrett is in the URL)
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
) else (
    echo.
    echo Push failed. Make sure you used the Personal Access Token.
    echo.
)

pause

