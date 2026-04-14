@echo off
REM Desktop Assistant 2D - Build Script for Windows
REM Creates standalone .exe file

echo.
echo ===============================================
echo Desktop Assistant 2D - Build to EXE
echo ===============================================
echo.

REM Check if PyInstaller is installed
where pyinstaller >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: PyInstaller not found. Install with:
    echo pip install PyInstaller
    exit /b 1
)

REM Build executable
echo Building executable...
echo.

pyinstaller ^
    --noconfirm ^
    --onefile ^
    --windowed ^
    --name "DesktopAssistant" ^
    --add-data "assets;assets" ^
    --add-data "config;config" ^
    --icon "assets\icon.ico" ^
    --distpath "dist" ^
    --buildpath "build" ^
    --specpath "specs" ^
    "main.py"

if %ERRORLEVEL% NEQ 0 (
    echo Error: Build failed!
    exit /b 1
)

echo.
echo ===============================================
echo Build completed successfully!
echo.
echo Executable: dist\DesktopAssistant.exe
echo.
echo To run:
echo   dist\DesktopAssistant.exe
echo.
echo ===============================================
echo.

pause
