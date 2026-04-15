@echo off
echo ========================================
echo Testing Git Connection
echo ========================================
echo.

echo Testing basic git setup...
echo.

echo [1] Git version:
git --version
echo.

echo [2] Current directory:
cd
echo.

echo [3] Is this a git repository?
if exist .git (
    echo   YES - Git repository found
) else (
    echo   NO - Not a git repository yet
)
echo.

echo [4] Remote configuration:
git remote -v 2>nul
if %errorlevel% neq 0 (
    echo   No remote configured
)
echo.

echo [5] Current branch:
git branch 2>nul
if %errorlevel% neq 0 (
    echo   No branches found
)
echo.

echo [6] Commit status:
git log --oneline -1 2>nul
if %errorlevel% neq 0 (
    echo   No commits found
)
echo.

echo [7] Testing connection to GitHub...
echo   (This will show authentication errors if any)
echo.
git ls-remote https://github.com/rsgarrett/Stake-App.git 2>&1
echo.

echo ========================================
echo Test complete. Check output above.
echo ========================================
echo.
echo If you see authentication errors, the token might need:
echo - 'repo' scope enabled
echo - Or the repository might not exist/be accessible
echo.
pause

