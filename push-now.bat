@echo off
echo ========================================
echo Push to GitHub
echo ========================================
echo.

REM Make sure remote is set correctly (not the token)
git remote remove origin >nul 2>&1
git remote add origin https://github.com/rsgarrett/Stake-App.git

echo Remote repository: https://github.com/rsgarrett/Stake-App.git
echo.

REM Make sure we're on main branch
git branch -M main

echo Pushing code to GitHub...
echo.
echo When prompted for credentials:
echo   Username: rsgarrett
echo   Password: [Paste your Personal Access Token here]
echo.
echo (The password is your Personal Access Token)
echo.
pause
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Your code has been pushed to GitHub!
    echo ========================================
    echo.
    echo View it at: https://github.com/rsgarrett/Stake-App
    echo.
) else (
    echo.
    echo ========================================
    echo Push failed. Please check:
    echo ========================================
    echo.
    echo 1. Make sure you entered the token correctly as the password
    echo 2. Make sure the repository exists and you have access
    echo 3. Try running this script again
    echo.
)

pause

