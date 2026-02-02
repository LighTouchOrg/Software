@echo off
echo Building LighTouch C# Application...
echo.

REM Copy frontend files
echo Step 1: Copying frontend files...
powershell -ExecutionPolicy Bypass -File "%~dp0copy-frontend.ps1"
if errorlevel 1 (
    echo Error copying frontend files!
    pause
    exit /b 1
)
echo.

REM Return to project root
cd "%~dp0.."

REM Restore NuGet packages
echo Step 2: Restoring NuGet packages...
dotnet restore
if errorlevel 1 (
    echo Error restoring packages!
    pause
    exit /b 1
)
echo.

REM Build the application
echo Step 3: Building application in Release mode...
dotnet build -c Release
if errorlevel 1 (
    echo Error building application!
    pause
    exit /b 1
)
echo.

REM Publish the application
echo Step 4: Publishing self-contained executable...
dotnet publish -c Release -r win-x64 --self-contained true /p:IncludeNativeLibrariesForSelfExtract=true /p:EnableCompressionInSingleFile=true
if errorlevel 1 (
    echo Error publishing application!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Build completed successfully!
echo.
echo Executable location:
echo bin\Release\net10.0-windows\win-x64\publish\LighTouch.exe
echo ========================================
echo.
pause
