@echo off
echo ========================================
echo Push to GitHub with Error Logging
echo ========================================
echo.

REM Make sure everything is set up
if not exist .git (
    git init
)

git add . >nul 2>&1
git commit -m "Initial commit - Stake President App" >nul 2>&1
git branch -M main >nul 2>&1

REM Set remote
git remote remove origin >nul 2>&1
git remote add origin https://github.com/rsgarrett/Stake-App.git

echo Current setup:
echo   Remote: https://github.com/rsgarrett/Stake-App.git
echo   Branch: main
echo   Commits: 
git log --oneline -1
echo.

echo ========================================
echo Attempting to push...
echo ========================================
echo.
echo When prompted:
echo   Username: rsgarrett
echo   Password: [Paste your Personal Access Token here]
echo.
echo (Pushing now - check for error messages below...)
echo.

REM Push and capture both stdout and stderr
git push -u origin main 2>&1 | tee push-error.log

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Code pushed to GitHub!
    echo ========================================
    del push-error.log >nul 2>&1
) else (
    echo.
    echo ========================================
    echo ERROR OCCURRED - Full details saved to push-error.log
    echo ========================================
    echo.
    echo The error message is also shown above.
    echo Please share the error message so we can fix it.
    echo.
    type push-error.log
    echo.
)

pause

