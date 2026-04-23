@echo off
chcp 65001 >nul

echo ========================================
echo   Launcher C-PRojeTs - Mode Dev
echo   (Installation automatique Node.js)
echo ========================================
echo.

set "PROJECT_DIR=%CD%"
set "NODE_DIR=%PROJECT_DIR%\nodejs"

echo [1/3] Verification Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js non trouve. Installation automatique...
    echo.
    
    if not exist "%NODE_DIR%\node.exe" (
        echo Telechargement de Node.js...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.18.0/win-x64.zip' -OutFile '%PROJECT_DIR%\node.zip'"
        
        echo Extraction...
        powershell -Command "Expand-Archive -Path '%PROJECT_DIR%\node.zip' -DestinationPath '%PROJECT_DIR%' -Force"
        move "%PROJECT_DIR%\node-v20.18.0-win-x64" "%NODE_DIR%" >nul
        del /f "%PROJECT_DIR%\node.zip" 2>nul
    )
    
    set "PATH=%NODE_DIR%;%PROJECT_DIR%\node_modules\.bin;%PATH%"
)

echo [OK]

echo.
echo [2/3] Arret des anciens processus...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo [OK]

echo.
echo [3/3] Lancement Vite et ouverture navigateur...
echo.
cd /d "%PROJECT_DIR%"
start http://localhost:5175
timeout /t 3 >nul
call npm run dev

echo.
echo [TERMINE]
pause