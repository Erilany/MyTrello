@echo off
title C-PRojeTs - Launcher
setlocal enabledelayedexpansion

cd /d "C:\Users\duranderi\Documents\GitHub\MyTrello\local"

echo ========================================
echo   C-PRojeTs - Launcher
echo ========================================
echo.

echo [1/5] Verification Node.js...
node --version
echo.

echo [2/5] Arret des anciens processus...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 >nul
echo [OK]
echo.

echo [3/5] Verification des dependances...
if not exist node_modules (
    echo Installation des dependances...
    call npm install
) else (
    echo Les dependances sont deja installees.
)
echo [OK]
echo.

echo [4/5] Lancement du serveur Vite...
start /b "" npm run dev
echo.

echo [5/5] Attente du serveur Vite...
:wait_loop
timeout /t 1 >nul
netstat -ano | findstr ":5175" >nul
if errorlevel 1 (
    echo   Serveur pas encore pret...
    goto wait_loop
)
echo [OK] Serveur pret sur localhost:5175
echo.

echo Ouverture du navigateur...
start http://localhost:5175
echo.

echo ========================================
echo   Application ouverte: http://localhost:5175
echo ========================================
echo.
echo Appuyez sur une touche pour quitter...
pause >nul
