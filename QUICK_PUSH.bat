@echo off
title Quick Push to GitHub
cd /d "%~dp0"

echo ========================================
echo Quick Push - Using rsgarrett username
echo ========================================
echo.

REM Clear old credentials
echo Clearing old credentials...
cmdkey /list | findstr github.com
if %errorlevel% equ 0 (
    cmdkey /delete:git:https://github.com 2>nul
    cmdkey /delete:github.com 2>nul
)
echo.

REM Add files and commit
git add .
git diff --cached --quiet
if %errorlevel% neq 0 (
    git commit -m "Initial commit - Stake President App"
) else (
    git rev-parse --verify HEAD >nul 2>&1
    if %errorlevel% neq 0 (
        git commit -m "Initial commit - Stake President App" --allow-empty
    )
)

REM Set branch and remote with username in URL
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://rsgarrett@github.com/rsgarrett/Stake-App.git

echo.
echo Ready to push!
echo.
echo When prompted:
echo   Password: [Paste Personal Access Token]
echo   (Username rsgarrett is already in the URL)
echo.
pause

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed!
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

