@echo off
title C-PRojeTs - Launcher
cd /d "C:\Users\eric-\Documents\GitHub\MyTrello\local"

echo ========================================
echo   C-PRojeTs - Mode Dev Electron
echo ========================================
echo.

echo [1/4] Verification Node.js...
node --version
echo [OK]

echo.
echo [2/4] Arret des anciens processus...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM electron.exe >nul 2>&1
timeout /t 2 >nul
echo [OK]
echo.

echo [2.5/4] Verification des dependances...
if not exist node_modules (
    echo Installation des dependances...
    call npm install
) else (
    echo Les dependances sont deja installees.
)
echo [OK]
echo.

echo [3/4] Lancement application avec Electron...
echo.
start /b "" npm run electron:dev

echo.
echo [TERMINE] - La fenetre Electron va s'ouvrir automatiquement
pause
