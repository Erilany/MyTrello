@echo off

echo ========================================
echo   Launcher D-ProjeT - Mode Dev Electron
echo ========================================
echo.

set "PROJECT_DIR=%CD%"
set "NODE_DIR=%PROJECT_DIR%\node"
set "PATH=%NODE_DIR%;%PATH%"

echo Debug - PROJECT_DIR: %PROJECT_DIR%
echo Debug - NODE_DIR: %NODE_DIR%
echo.

echo [1/4] Verification Node.js...
"%NODE_DIR%\node.exe" --version
echo [OK]

echo.
echo [2/4] Arret des anciens processus...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 2 >nul
echo [OK]

echo.
echo [3/4] Lancement application avec Electron...
echo.
cd /d "%PROJECT_DIR%"
start /b "" "%NODE_DIR%\npm.cmd" run electron:dev

echo.
echo [TERMINE] - La fenetre Electron va s'ouvrir automatiquement
pause
