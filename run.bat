@echo off
REM TrapeziBuddy - Run Script
REM Frontend: Electron (desktop-app) | Backend: Python spawned by Electron

echo.
echo ===============================================
echo Desktop Assistant 2D - Running
echo ===============================================
echo.

REM Check Python is installed
python --version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python not found. Please install Python 3.8+
    echo Download from: https://www.python.org/downloads/
    exit /b 1
)

REM Check if venv exists, create if not
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate venv
call venv\Scripts\activate.bat

REM Install requirements
echo Installing dependencies...
pip install -q -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install dependencies
    exit /b 1
)

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js not found. Please install Node.js 18+
    echo Download from: https://nodejs.org/
    exit /b 1
)

REM Ensure desktop-app dependencies
if not exist "desktop-app\node_modules" (
    echo Installing Electron dependencies...
    cd desktop-app
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install desktop-app dependencies
        exit /b 1
    )
    cd ..
)

REM Run Electron frontend (this will spawn Python backend when Start Application is clicked)
echo.
echo Starting TrapeziBuddy Electron frontend...
echo.
cd desktop-app
call npm run dev

pause
