@echo off
echo ========================================
echo Deploiement des DLLs Qt pour LighTouch
echo ========================================
echo.

set QT_DIR=C:\Qt\6.9.3\mingw_64
set MINGW_DIR=C:\Qt\Tools\mingw1310_64\bin
set BUILD_DIR=C:\Users\Arnaud\Desktop\repo-git\epitech projects\EIP\Software\cpp app\build

REM Ajouter Qt au PATH
set PATH=%QT_DIR%\bin;%MINGW_DIR%;%PATH%

cd /d "%BUILD_DIR%"

echo Verification de l'executable...
if not exist LighTouch.exe (
    echo ERREUR : LighTouch.exe introuvable !
    pause
    exit /b 1
)

echo Copie des DLLs Qt necessaires avec windeployqt...
echo.
"%QT_DIR%\bin\windeployqt.exe" --release --no-translations --no-system-d3d-compiler LighTouch.exe

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERREUR lors du deploiement !
    pause
    exit /b 1
)

echo.
echo Copie des DLLs MinGW...
copy "%MINGW_DIR%\libgcc_s_seh-1.dll" . >nul 2>&1
copy "%MINGW_DIR%\libstdc++-6.dll" . >nul 2>&1
copy "%MINGW_DIR%\libwinpthread-1.dll" . >nul 2>&1

echo.
echo ========================================
echo Deploiement termine avec succes !
echo ========================================
echo.
echo Vous pouvez maintenant lancer LighTouch.exe
echo.
pause

