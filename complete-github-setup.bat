@echo off
echo ========================================
echo Complete GitHub Setup
echo ========================================
echo.

REM Initialize git if not already done
if not exist .git (
    echo [1/4] Initializing git repository...
    git init
    echo.
) else (
    echo [1/4] Git repository already initialized.
    echo.
)

REM Add all files
echo [2/4] Adding all files to git...
git add .
echo.

REM Check if we need to commit
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo [3/4] Creating initial commit...
    git commit -m "Initial commit - Stake President App"
    echo Commit created successfully!
    echo.
) else (
    REM Check if there are any commits
    git rev-parse --verify HEAD >nul 2>&1
    if %errorlevel% equ 0 (
        echo [3/4] Files already committed.
        echo.
    ) else (
        echo [3/4] Creating initial commit...
        git commit -m "Initial commit - Stake President App" --allow-empty
        echo Commit created successfully!
        echo.
    )
)

REM Set branch to main
git branch -M main

REM Get repository URL
echo [4/4] Setting up GitHub remote...
echo.
set /p REPO_URL="Enter your dad's GitHub repository URL (e.g., https://github.com/username/repo-name.git): "
echo.

if "%REPO_URL%"=="" (
    echo Error: Repository URL cannot be empty!
    pause
    exit /b 1
)

REM Remove existing remote if it exists, then add new one
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
if %errorlevel% neq 0 (
    echo Error: Could not add remote repository. Please check the URL.
    pause
    exit /b 1
)

echo Remote repository added successfully!
echo.

REM Push to GitHub
echo Pushing code to GitHub...
echo (You may be prompted for authentication)
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo SUCCESS! Your code has been pushed to GitHub!
    echo ========================================
    echo.
    echo You can view it at: %REPO_URL%
    echo.
) else (
    echo.
    echo ========================================
    echo There was an error pushing to GitHub.
    echo ========================================
    echo.
    echo Common solutions:
    echo.
    echo 1. Authentication required:
    echo    - GitHub no longer accepts passwords
    echo    - You need a Personal Access Token (PAT)
    echo    - Create one at: https://github.com/settings/tokens
    echo    - Use the token as your password when prompted
    echo.
    echo 2. Or use SSH instead:
    echo    - Set up SSH keys on GitHub
    echo    - Use the SSH URL instead (git@github.com:username/repo.git)
    echo.
    echo 3. Make sure the repository exists and you have access
    echo.
    echo Try running this script again, or push manually with:
    echo   git push -u origin main
    echo.
)

pause

