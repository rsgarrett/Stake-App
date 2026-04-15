@echo off
echo Setting up Git repository and preparing to push to GitHub...
echo.

REM Initialize git if not already done
if not exist .git (
    echo Initializing git repository...
    git init
)

REM Add all files
echo Adding all files to git...
git add .

REM Check if there are any changes to commit
git diff --cached --quiet
if %errorlevel% neq 0 (
    echo Creating initial commit...
    git commit -m "Initial commit - Stake President App"
    echo.
    echo Commit created successfully!
) else (
    echo No changes to commit.
)

echo.
echo ========================================
echo Git repository is ready!
echo.
echo Next steps to push to your dad's GitHub:
echo.
echo 1. Create a new repository on GitHub (or use an existing one)
echo    - Go to https://github.com and sign in
echo    - Click the "+" icon and select "New repository"
echo    - Name it (e.g., "stake-president-app")
echo    - Don't initialize with README, .gitignore, or license
echo    - Click "Create repository"
echo.
echo 2. Copy the repository URL (it will look like:
echo    https://github.com/USERNAME/REPO-NAME.git
echo.
echo 3. Run these commands (replace with your dad's repo URL):
echo    git remote add origin https://github.com/USERNAME/REPO-NAME.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo Or run: setup-github-remote.bat after creating the repository
echo ========================================
pause

