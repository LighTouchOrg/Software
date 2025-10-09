@echo off
REM Script de compilation simplifié - LighTouch

echo === LighTouch Build Script ===
echo.

REM Définir Qt6_DIR et forcer CMake Windows
set Qt6_DIR=C:\Qt\6.9.3\mingw_64
set PATH=C:\Program Files\CMake\bin;C:\Qt\Tools\CMake_64\bin;C:\Qt\Tools\mingw1310_64\bin;C:\Qt\6.9.3\mingw_64\bin;%PATH%

REM Utiliser le CMake de Qt si disponible
if exist "C:\Qt\Tools\CMake_64\bin\cmake.exe" (
    set CMAKE_EXE=C:\Qt\Tools\CMake_64\bin\cmake.exe
) else if exist "C:\Program Files\CMake\bin\cmake.exe" (
    set CMAKE_EXE=C:\Program Files\CMake\bin\cmake.exe
) else (
    set CMAKE_EXE=cmake.exe
)

echo Qt6_DIR: %Qt6_DIR%
echo Compilateur: MinGW 13.1.0
echo CMake: %CMAKE_EXE%
echo.

REM Nettoyer build (si dossier vide OK, sinon on ignore l'erreur)
if exist build (
    echo Nettoyage build...
    rd /s /q build 2>nul
)

REM Créer build
mkdir build
cd build

REM Configurer
echo Configuring project...
"%CMAKE_EXE%" .. -G "Ninja" -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH=%Qt6_DIR%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERREUR Configuration
    cd ..
    pause
    exit /b 1
)

REM Compiler
echo.
echo Building project...
ninja -j8

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERREUR Compilation
    cd ..
    pause
    exit /b 1
)

echo.
echo ========================================
echo === BUILD REUSSI ! ===
echo ========================================
echo.
echo Executable: %CD%\LighTouch.exe
echo.
cd ..
pause
