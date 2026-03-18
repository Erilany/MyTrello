@echo off
setlocal

echo ========================================
echo   Launcher MyTrello - Mode Production
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "NODE_DIR=%PROJECT_DIR%node"
set "NODE_PORTABLE=%PROJECT_DIR%node-portable"

REM ===== Search for Node.js locally =====
if exist "%NODE_DIR%\node.exe" (
    goto :start
)

if exist "%NODE_PORTABLE%\node.exe" (
    set "NODE_DIR=%NODE_PORTABLE%"
    goto :start
)

echo [ERREUR] Node.js non trouve
echo Veuillez placer node.exe dans node\ ou node-portable\
pause
exit /b 1

:start
cd /d "%PROJECT_DIR%"

echo [INFO] Verification du build...
if not exist "%PROJECT_DIR%dist" (
    echo [INFO] Compilation du projet...
    call "%NODE_DIR%\npm.cmd" run build
)

echo [OK] Demarrage du serveur...
echo L'application sera disponible sur http://localhost:4173
echo.

call "%NODE_DIR%\npx.cmd" vite preview --port 4173

echo.
echo Appuyez sur une touche pour fermer...
pause
