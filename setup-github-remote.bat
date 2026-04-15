@echo off
echo ========================================
echo Setting up GitHub remote repository
echo ========================================
echo.
set /p REPO_URL="Enter your dad's GitHub repository URL (e.g., https://github.com/username/repo-name.git): "
echo.

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty!
    pause
    exit /b 1
)

echo Adding remote repository...
git remote add origin %REPO_URL%
if %errorlevel% neq 0 (
    echo.
    echo Note: Remote might already exist. Updating it instead...
    git remote set-url origin %REPO_URL%
)

echo.
echo Setting branch to 'main'...
git branch -M main

echo.
echo ========================================
echo Ready to push!
echo.
echo Pushing code to GitHub...
echo ========================================
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Your code has been pushed to GitHub!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo There was an error pushing to GitHub.
    echo.
    echo Common issues:
    echo - Make sure you're authenticated with GitHub
    echo - Check that the repository URL is correct
    echo - You may need to set up authentication (Personal Access Token or SSH)
    echo.
    echo For authentication help, visit:
    echo https://docs.github.com/en/authentication
    echo ========================================
)

pause

