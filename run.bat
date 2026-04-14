@echo off
REM Desktop Assistant 2D - Run Script
REM Runs the application from source (no build needed)

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

REM Run application
echo.
echo Starting Desktop Assistant...
echo.
python main.py

pause
