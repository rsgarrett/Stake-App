@echo off
echo ========================================
echo Fixing Git Credentials
echo ========================================
echo.
echo This will clear cached GitHub credentials so you can use
echo the correct username (rsgarrett) and Personal Access Token.
echo.
pause

REM Clear cached credentials using git credential manager
echo Clearing cached GitHub credentials...
git credential-manager-core erase
echo.
echo host=github.com
echo protocol=https
echo.
echo [Press Ctrl+Z then Enter to finish, or just Enter]
echo.
git credential-manager-core erase <<EOF
host=github.com
protocol=https
EOF

echo.
echo Credentials cleared!
echo.
echo Now when you push, it will ask for:
echo   Username: rsgarrett
echo   Password: [Personal Access Token]
echo.
pause

