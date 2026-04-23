@echo off
chcp 65001 >nul

echo ========================================
echo   Installation Node.js Complet
echo ========================================
echo.

set "PROJECT_DIR=%CD%"
set "NODE_DIR=%PROJECT_DIR%\Node"

echo Arret processus node...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 >nul

echo.
echo Suppression ancien Node...
if exist "%NODE_DIR%" (
    for /d %%i in ("%NODE_DIR%\*") do rmdir /s /q "%%i" 2>nul
    del /f /q "%NODE_DIR%\*" 2>nul
)

echo.
echo Telechargement Node.js v20.18.0...
powershell -NoProfile -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip' -OutFile '%PROJECT_DIR%\node.zip'}"
if %errorlevel% neq 0 (
    echo Erreur telechargement
    pause
    exit /b 1
)

echo.
echo Extraction...
powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('%PROJECT_DIR%\node.zip', '%PROJECT_DIR%')"

echo.
echo Deplacement...
xcopy /s /e /y "%PROJECT_DIR%\node-v20.18.0-win-x64\*" "%NODE_DIR%\"
rmdir /s /q "%PROJECT_DIR%\node-v20.18.0-win-x64"
del /f /q "%PROJECT_DIR%\node.zip"

echo.
echo Verification...
if exist "%NODE_DIR%\node.exe" (echo Node.exe OK) else (echo ERREUR node.exe)
if exist "%NODE_DIR%\node_modules\npm\bin\npm-cli.js" (echo npm OK) else (echo ERREUR npm)

echo.
echo Termine.
pause