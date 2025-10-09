@echo off
setlocal enabledelayedexpansion
REM Build script for LighTouch C++ application (Windows)

echo === LighTouch Build Script ===

REM Check for CMake
where cmake >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: CMake not found in PATH
    echo Please install CMake 3.16 or later
    pause
    exit /b 1
)

REM Auto-detect available generator
echo Detecting available build system...
set GENERATOR=
set EXECUTABLE_PATH=Release\LighTouch.exe

REM Test for Ninja
where ninja >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set GENERATOR=Ninja
    set EXECUTABLE_PATH=LighTouch.exe
    echo Found: Ninja
    goto :detected
)

REM Test for MinGW
where mingw32-make >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set GENERATOR=MinGW Makefiles
    set EXECUTABLE_PATH=LighTouch.exe
    echo Found: MinGW Makefiles
    goto :detected
)

REM Test for Unix Make (Git Bash / MSYS2)
where make >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set GENERATOR=Unix Makefiles
    set EXECUTABLE_PATH=LighTouch.exe
    echo Found: Unix Makefiles
    goto :detected
)

REM Test for Visual Studio (last resort)
cmake --help | findstr /C:"Visual Studio 17" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set GENERATOR=Visual Studio 17 2022
    echo Found: Visual Studio 2022
    goto :detected
)

cmake --help | findstr /C:"Visual Studio 16" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set GENERATOR=Visual Studio 16 2019
    echo Found: Visual Studio 2019
    goto :detected
)

echo.
echo ERROR: No compatible build system found!
echo.
echo Available options (install one):
echo   1. Ninja (fastest):        winget install Ninja-build.Ninja
echo   2. MinGW:                  https://www.mingw-w64.org/
echo   3. Visual Studio 2022:     https://visualstudio.microsoft.com/
echo.
pause
exit /b 1

:detected
echo Using generator: %GENERATOR%
echo.

REM Check for Qt6
if not defined Qt6_DIR (
    echo WARNING: Qt6_DIR environment variable not set
    echo Attempting auto-detection...
    echo.
    echo If build fails, set Qt6_DIR:
    echo   set Qt6_DIR=C:\Qt\6.5.0\mingw_64
    echo   set Qt6_DIR=C:\Qt\6.5.0\msvc2019_64
    echo.
) else (
    echo Qt6_DIR: %Qt6_DIR%
    echo.
)

REM Create build directory
if exist build (
    echo Removing existing build directory...
    rmdir /s /q build
)

mkdir build
cd build

REM Configure (adjust generator as needed)
echo Configuring project...
if defined Qt6_DIR (
    cmake .. -G "%GENERATOR%" -DCMAKE_BUILD_TYPE=Release -DCMAKE_PREFIX_PATH=%Qt6_DIR%
) else (
    cmake .. -G "%GENERATOR%" -DCMAKE_BUILD_TYPE=Release
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ====================================
    echo Configuration FAILED
    echo ====================================
    echo.
    echo Possible causes:
    echo   1. Qt6 not found
    echo   2. Missing dependencies: Qt6Widgets, Qt6SerialPort
    echo.
    echo Solution:
    echo   set Qt6_DIR=C:\Qt\6.x.x\mingw_64
    echo   (or msvc2019_64 if using Visual Studio)
    echo.
    cd ..
    pause
    exit /b 1
)

REM Build
echo.
echo Building project...
cmake --build . --config Release -j8

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ====================================
    echo Build FAILED
    echo ====================================
    echo.
    cd ..
    pause
    exit /b 1
)

echo.
echo ========================================
echo ===   Build SUCCESSFUL!   ===
echo ========================================
echo.
echo Executable: %CD%\%EXECUTABLE_PATH%
echo.
echo To run the application:
echo   cd build
echo   .\LighTouch.exe
echo.
cd ..
pause
