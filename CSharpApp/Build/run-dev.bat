@echo off
echo Starting LighTouch in Development Mode...
echo.

REM Copy frontend files
echo Copying frontend files...
powershell -ExecutionPolicy Bypass -File "%~dp0copy-frontend.ps1"
if errorlevel 1 (
    echo Error copying frontend files!
    pause
    exit /b 1
)
echo.

REM Return to project root and run the application
cd "%~dp0.."
echo Starting application...
dotnet run
