@echo off
title MyTrello - Serveur de Developpement
cd /d "%~dp0"

echo.
echo ====================================
echo    LANCEMENT DU SERVEUR MYTRELLO
echo ====================================
echo.

REM Recherche de l'adresse IP
for /f "tokens=2 delims=:" %%a in ('powershell -Command "Get-NetIPAddress -AddressFamily IPv4 -PrefixOrigin Manual,WellKnown | Where-Object {$_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1 -ExpandProperty IPAddress"') do set "IP_SERVER=%%a"

if "%IP_SERVER%"=="" (
    echo ERREUR: Impossible de determiner l'adresse IP
    echo Verifiez votre connexion reseau
    pause
    exit /b 1
)

echo Le serveur demarre...
echo.
echo ====================================
echo  AUTRES UTILISATEURS: CONNECTEZ-VOUS
echo ====================================
echo.
echo    http://%IP_SERVER%:5173
echo.
echo Appuyez sur CTRL+C pour arreter le serveur
echo.

npx vite --host
pause
