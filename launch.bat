@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Launcheur MyTrello - Installation
echo ========================================
echo.

REM ===== Configuration =====
set "NODE_VERSION=v20.18.1"
set "NODE_ARCH=win-x64"
set "PROJECT_DIR=%~dp0"
set "NODE_DIR=%PROJECT_DIR%node-portable"

REM ===== Couleurs =====
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

:check_node
echo [%GREEN%INFO%RESET%] Verification de Node.js...
where node >nul 2>nul
if %errorlevel%==0 (
    echo [%GREEN%OK%RESET%] Node.js est deja installe
    goto :install_deps
)

REM ===== Node.js non trouve ======
echo [%RED%ERREUR%RESET%] Node.js n'est pas installe
echo Veuillez installer Node.js depuis https://nodejs.org
pause
exit /b 1

:install_deps
echo.
echo ========================================
echo   Installation des dependances
echo ========================================
echo.

cd /d "%PROJECT_DIR%"

echo [%YELLOW%INFO%RESET%] Nettoyage des processus node...
taskkill /F /IM node.exe 2>nul

echo [%YELLOW%INFO%RESET%] Nettoyage du cache Vite...
if exist "%PROJECT_DIR%node_modules\.vite" (
    rmdir /s /q "%PROJECT_DIR%node_modules\.vite"
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [%RED%ERREUR%RESET%] npm non trouve
    pause
    exit /b 1
)

echo [%YELLOW%INFO%RESET%] Installation de npm...
call npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo [%RED%ERREUR%RESET%] Echec de l'installation des dependances
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Lancement de MyTrello
echo ========================================
echo.
echo L'application va demarrer dans votre navigateur
echo Appuyez sur Ctrl+C pour arreter
echo.

call npm run dev

pause
