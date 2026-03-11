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

REM ===== Telechargement de Node.js portable =====
echo [%YELLOW%INFO%RESET%] Telechargement de Node.js portable...
if exist "%NODE_DIR%\node.exe" (
    echo [%GREEN%OK%RESET%] Node.js deja present
    goto :setup_node_path
)

echo [%YELLOW%INFO%RESET%] Cette operation peut prendre quelques minutes...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-%NODE_ARCH%.zip' -OutFile '%PROJECT_DIR%node.zip'"

if not exist "%PROJECT_DIR%node.zip" (
    echo [%RED%ERREUR%RESET%] Echec du telechargement de Node.js
    echo Verifiez votre connexion internet
    pause
    exit /b 1
)

echo [%GREEN%OK%RESET%] Extraction de Node.js...
powershell -Command "Expand-Archive -Path '%PROJECT_DIR%node.zip' -DestinationPath '%PROJECT_DIR%' -Force"

REM Rename folder
if exist "%PROJECT_DIR%node-%NODE_VERSION%-%NODE_ARCH%" (
    move /y "%PROJECT_DIR%node-%NODE_VERSION%-%NODE_ARCH%" "%NODE_DIR%" >nul 2>nul
)

del /f /q "%PROJECT_DIR%node.zip" 2>nul

if not exist "%NODE_DIR%\node.exe" (
    echo [%RED%ERREUR%RESET%] Echec de l'installation de Node.js
    pause
    exit /b 1
)

:setup_node_path
set "PATH=%NODE_DIR%;%NODE_DIR%\node_modules\npm\bin;%PATH%"

:install_deps
echo.
echo ========================================
echo   Installation des dependances
echo ========================================
echo.

cd /d "%PROJECT_DIR%"

set "PATH=%NODE_DIR%;%NODE_DIR%\node_modules\npm\bin;%PATH%"

echo [%YELLOW%INFO%RESET%] Installation de npm...
call "%NODE_DIR%\npm.cmd" install --legacy-peer-deps

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

call "%NODE_DIR%\npm.cmd" run dev

pause
