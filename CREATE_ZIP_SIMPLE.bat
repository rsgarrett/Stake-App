@echo off
echo ========================================
echo Create Clean Zip File
echo ========================================
echo.

cd /d "%~dp0"

echo This will create a zip excluding node_modules and other large folders.
echo.
echo Excluding:
echo   - node_modules/ (your dad will run npm install)
echo   - .next/ (build files - regenerated automatically)
echo   - .git/ (git history - not needed)
echo.
pause

set ZIP_FILE=Stake-App-For-Dad.zip

REM Remove old zip if exists
if exist "%ZIP_FILE%" del "%ZIP_FILE%"

echo.
echo Creating zip file (this uses PowerShell)...
echo This may take a few minutes depending on file count...
echo.

powershell -Command "$exclude = @('node_modules', '.next', '.git', '.supabase', '.env.local'); Get-ChildItem -Path . -Recurse | Where-Object { $exclude -notcontains $_.Name -and ($_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' -and $_.FullName -notmatch '\\.git\\') } | Compress-Archive -DestinationPath '%ZIP_FILE%' -Force"

if exist "%ZIP_FILE%" (
    echo.
    echo ========================================
    echo SUCCESS! Zip file created!
    echo ========================================
    echo.
    echo File: %CD%\%ZIP_FILE%
    echo.
    echo File size:
    dir "%ZIP_FILE%" | find "%ZIP_FILE%"
    echo.
    echo You can now send this to your dad!
    echo.
) else (
    echo.
    echo Error creating zip file.
    echo Try the manual method in WHAT_TO_SEND.md
    echo.
)

pause

