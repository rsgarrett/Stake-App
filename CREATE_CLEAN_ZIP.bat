@echo off
echo ========================================
echo Creating Clean Zip (Without node_modules)
echo ========================================
echo.

cd /d "%~dp0"

echo This will create a zip file excluding large folders like node_modules
echo.
echo The zip will include all your code but exclude:
echo   - node_modules/ (he'll run npm install)
echo   - .next/ (build files)
echo   - .git/ (git history)
echo   - .env.local (secrets)
echo.
pause

REM Create a temporary folder structure for zipping
set TEMP_DIR=%TEMP%\Stake-App-Clean
set ZIP_FILE=%~dp0Stake-App-For-Dad.zip

REM Clean up old temp folder if it exists
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"

REM Create temp folder
mkdir "%TEMP_DIR%"

echo.
echo Copying files (this may take a moment)...
echo.

REM Copy everything except excluded folders
xcopy /E /I /H /Y /EXCLUDE:exclude_list.txt . "%TEMP_DIR%" >nul 2>&1

REM Create exclude list
(
echo node_modules
echo .next
echo .git
echo .env.local
echo .supabase
) > exclude_list.txt

REM Actually copy files (using robocopy for better exclusion)
robocopy . "%TEMP_DIR%" /E /XD node_modules .next .git .supabase /XF .env.local /NFL /NDL /NJH /NJS >nul

echo Files copied!
echo.

REM Create zip file
echo Creating zip file...
cd /d "%TEMP_DIR%"
powershell -Command "Compress-Archive -Path * -DestinationPath '%ZIP_FILE%' -Force"

REM Clean up temp folder
cd /d "%~dp0"
rmdir /s /q "%TEMP_DIR%"
del exclude_list.txt >nul 2>&1

echo.
echo ========================================
echo SUCCESS! Zip file created!
echo ========================================
echo.
echo File location: %ZIP_FILE%
echo.
echo You can now send this file to your dad.
echo It should be much smaller and faster to transfer!
echo.

pause

