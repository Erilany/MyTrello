@echo off
chcp 65001 >nul

echo ========================================
echo   Launcher C-PRojeTs - Mode Dev
echo   (Dossier Node local)
echo ========================================
echo.

set "PROJECT_DIR=%CD%"
set "NODE_DIR=%PROJECT_DIR%\Node"

echo [1/3] Verification Node.js...
if not exist "%NODE_DIR%\node.exe" (
    echo Node.js non trouve dans %NODE_DIR%
    echo Veuillez placer les fichiers Node.js dans le dossier 'Node' du projet
    pause
    exit /b 1
)

set "PATH=%NODE_DIR%"
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Erreur: Node.js ne fonctionne pas correctement
    pause
    exit /b 1
)
echo [OK]

echo.
echo [2/3] Arret des anciens processus et verification des dependances...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

if not exist "%PROJECT_DIR%\node_modules" (
    echo Installation des dependances...
    cd /d "%PROJECT_DIR%"
    call "%NODE_DIR%\npm.cmd" install
    if %errorlevel% neq 0 (
        echo Erreur lors de l'installation des dependances
        pause
        exit /b 1
    )
)
echo [OK]

echo.
echo [3/3] Lancement Vite et ouverture navigateur...
echo.
cd /d "%PROJECT_DIR%"
set "PATH=%NODE_DIR%;%PROJECT_DIR%\node_modules\.bin"
start http://localhost:5175
timeout /t 3 >nul
call "%NODE_DIR%\npm.cmd" run dev

echo.
echo [TERMINE]
pause