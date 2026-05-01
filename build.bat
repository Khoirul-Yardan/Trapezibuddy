@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo Memulai proses build TrapeziBuddy Desktop App
echo ========================================================

REM Get the directory where this script is located
set "PROJECT_ROOT=%~dp0"
set "DESKTOP_APP_DIR=%PROJECT_ROOT%desktop-app"
set "DIST_DIR=%PROJECT_ROOT%dist"
set "BACKEND_DIR=%DIST_DIR%\main"

echo [INFO] Project root: %PROJECT_ROOT%
echo [INFO] Desktop-app dir: %DESKTOP_APP_DIR%

echo.
echo ===== PRE-BUILD CHECKS =====
echo.

REM Check Python is installed
echo [1/7] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)
python --version
echo [OK] Python is installed

REM Check main.py exists
echo.
echo [2/7] Checking main.py exists...
if not exist "%PROJECT_ROOT%main.py" (
    echo [ERROR] main.py not found at %PROJECT_ROOT%
    pause
    exit /b 1
)
echo [OK] main.py found

REM Check assets folder exists
echo.
echo [3/7] Checking assets folder...
if not exist "%PROJECT_ROOT%assets" (
    echo [WARN] Assets folder not found - sprites may be missing
    echo [WARN] Continuing anyway - placeholders will be used
) else (
    echo [OK] Assets folder found
    dir "%PROJECT_ROOT%assets" /b | find /c /v "" >nul
)

echo.
echo ===== BUILDING PYTHON BACKEND =====
echo.

REM Install PyInstaller
echo [4/7] Installing PyInstaller...
pip install pyinstaller --quiet
if errorlevel 1 (
    echo [ERROR] Failed to install PyInstaller
    pause
    exit /b 1
)
echo [OK] PyInstaller ready

REM Compile Python to EXE
echo.
echo [5/7] Compiling Python with PyInstaller...
echo [INFO] Command: pyinstaller --noconfirm main.spec
cd /d "%PROJECT_ROOT%"
call pyinstaller --noconfirm main.spec
if errorlevel 1 (
    echo.
    echo [ERROR] PyInstaller failed. Check errors above.
    pause
    exit /b 1
)

REM Verify Python executable exists
echo.
echo [6/7] Verifying Python executable...
if not exist "%BACKEND_DIR%\main.exe" (
    echo [ERROR] Build failed - main.exe not found at: %BACKEND_DIR%
    echo [INFO] Check dist folder:
    dir "%DIST_DIR%" /s /b
    pause
    exit /b 1
)

REM Show file size
for /f "usebackq" %%A in ('%BACKEND_DIR%\main.exe') do (
    set /a size_mb=%%~zA/1024/1024
    echo [OK] main.exe built successfully (!size_mb! MB)
)

echo.
echo ===== BUILDING ELECTRON APP =====
echo.

REM Navigate to desktop-app
echo [7/7] Building Electron installer...
cd /d "%DESKTOP_APP_DIR%"
if errorlevel 1 (
    echo [ERROR] Failed to change to desktop-app directory
    pause
    exit /b 1
)

REM Install npm dependencies
echo [INFO] Installing npm dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    cd /d "%PROJECT_ROOT%"
    pause
    exit /b 1
)

REM Build with electron-builder
echo [INFO] Running electron-builder...
call npm run build
if errorlevel 1 (
    echo [ERROR] electron-builder failed
    cd /d "%PROJECT_ROOT%"
    pause
    exit /b 1
)

REM Navigate back
cd /d "%PROJECT_ROOT%"

echo.
echo ========================================================
echo BUILD COMPLETE!
echo ========================================================
echo.

REM Check installer exists
if exist "%DESKTOP_APP_DIR%\dist\TrapeziBuddy Setup 0.1.0.exe" (
    echo [OK] Installer created successfully!
    for /f "usebackq" %%A in ('%DESKTOP_APP_DIR%\dist\TrapeziBuddy Setup 0.1.0.exe') do (
        set /a size_mb=%%~zA/1024/1024
        echo [OK] Installer size: !size_mb! MB
        echo [OK] Location: %DESKTOP_APP_DIR%\dist\TrapeziBuddy Setup 0.1.0.exe
    )
) else (
    echo [WARN] Installer not found at expected location
    echo [INFO] Checking dist folder:
    dir "%DESKTOP_APP_DIR%\dist\*.exe" 2>nul || echo [WARN] No .exe files found
)

echo.
echo [INFO] Build Details:
echo   - Python backend: %BACKEND_DIR%\main.exe
echo   - Python assets: %PROJECT_ROOT%assets (included in backend)
echo   - Electron UI: %DESKTOP_APP_DIR%\src
echo   - Final installer: %DESKTOP_APP_DIR%\dist\
echo.
echo [TIP] To install: Double-click the .exe file
echo [TIP] To test before installing: cd desktop-app ^& npm run dev
echo.
pause
