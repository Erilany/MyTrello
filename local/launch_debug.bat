@echo off

set LOGFILE=%TEMP%\CProjets_CAPTURE.txt

echo ========================================
echo   MODE DEBUG - CAPTURE LANCEUR
echo ========================================
echo.
echo Le log sera ici :
echo %LOGFILE%
echo.

pause

:: === LANCEMENT AVEC CAPTURE ===
cmd /k launch.bat > "%LOGFILE%" 2>&1