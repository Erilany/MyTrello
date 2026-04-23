@echo off
chcp 65001 >nul

echo ========================================
echo   Launcher C-PRojeTs - Mode Dev
echo ========================================
echo.

set "PROJECT_DIR=%CD%"
set "PATH=%PROJECT_DIR%\node_modules\.bin;%PATH%"

echo [1/3] Verification Node.js...
node --version
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
