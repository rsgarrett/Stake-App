@echo off
echo ========================================
echo Diagnosing Push Issue
echo ========================================
echo.

echo [1] Checking git status...
git status
echo.

echo [2] Checking if we have commits...
git log --oneline -1
if %errorlevel% neq 0 (
    echo ERROR: No commits found! Need to commit files first.
    echo.
    echo Let's commit the files now...
    git add .
    git commit -m "Initial commit - Stake President App"
    echo.
)
echo.

echo [3] Checking remote configuration...
git remote -v
echo.

echo [4] Checking current branch...
git branch
echo.

echo [5] Setting branch to main...
git branch -M main
echo.

echo [6] Attempting to push with verbose output...
echo.
echo When prompted:
echo   Username: rsgarrett
echo   Password: [Paste your Personal Access Token here]
echo.
pause

git push -u origin main -v

echo.
echo ========================================
echo Push attempt completed.
echo ========================================
echo.
echo If it failed, the error message above should tell us why.
echo Common issues:
echo - Authentication failed: Check token permissions
echo - Repository not found: Check repository name/access
echo - No commits: Need to commit files first
echo.
pause

