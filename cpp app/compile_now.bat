@echo off
echo ========================================
echo Configuration et compilation LighTouch
echo ========================================
echo.

REM Définir les chemins Qt
set QT_DIR=C:\Qt\6.9.3\mingw_64
set CMAKE_PATH=C:\Qt\Tools\CMake_64\bin\cmake.exe
set NINJA_PATH=C:\Qt\Tools\Ninja\ninja.exe
set MINGW_DIR=C:\Qt\Tools\mingw1310_64\bin

REM Ajouter MinGW et Ninja au PATH
set PATH=%MINGW_DIR%;%QT_DIR%\bin;C:\Qt\Tools\Ninja;C:\Qt\Tools\CMake_64\bin;%PATH%

REM Aller dans le dossier build
cd /d "C:\Users\Arnaud\Desktop\repo-git\epitech projects\EIP\Software\cpp app\build"

echo Etape 1 : Configuration CMake...
echo MinGW: %MINGW_DIR%
echo Qt: %QT_DIR%
echo.

"%CMAKE_PATH%" .. -G "Ninja" -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH="%QT_DIR%"

if %ERRORLEVEL% NEQ 0 (
    echo ERREUR : Configuration CMake echouee !
    pause
    exit /b 1
)

echo.
echo Etape 2 : Compilation...
"%CMAKE_PATH%" --build . --config Release

if %ERRORLEVEL% NEQ 0 (
    echo ERREUR : Compilation echouee !
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCES : Compilation terminee !
echo ========================================
echo Executable : build\LighTouch.exe
echo.
pause

