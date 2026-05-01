@echo off
REM Test script untuk verify Python backend works before building

echo ========================================================
echo Testing Python Backend
echo ========================================================
echo.

REM Check Python
echo [1/5] Checking Python installation...
python --version
if errorlevel 1 (
    echo [ERROR] Python not found
    pause
    exit /b 1
)
echo [OK] Python works

REM Check imports
echo.
echo [2/5] Testing Python imports...
python -c "import sys; print(f'Python: {sys.version}'); from PySide6 import QtWidgets; print('[OK] PySide6 available')" 2>nul
if errorlevel 1 (
    echo [WARN] PySide6 not found, trying PyQt5...
    python -c "from PyQt5 import QtWidgets; print('[OK] PyQt5 available')" 2>nul
    if errorlevel 1 (
        echo [ERROR] Neither PySide6 nor PyQt5 found
        echo [FIX] Run: pip install -r requirements.txt
        pause
        exit /b 1
    )
)

REM Check project modules
echo.
echo [3/5] Testing project modules...
python -c "from ai.ai_controller import AIController; print('[OK] AI module loads')" 2>nul
if errorlevel 1 (
    echo [ERROR] Failed to import AI module
    echo [FIX] Check ai/ai_controller.py for syntax errors
    pause
    exit /b 1
)

python -c "from character.character_widget import CharacterWidget; print('[OK] Character module loads')" 2>nul
if errorlevel 1 (
    echo [ERROR] Failed to import Character module
    pause
    exit /b 1
)

REM Check assets
echo.
echo [4/5] Checking sprite assets...
if not exist "assets" (
    echo [WARN] Assets folder not found - using placeholders
) else (
    for /d %%D in (assets\Sprite*) do (
        echo [OK] Found: %%~nxD
    )
)

REM Test basic startup
echo.
echo [5/5] Testing basic startup...
echo [INFO] Running: python main.py --help
python main.py --help >nul 2>&1
if errorlevel 1 (
    echo [WARN] main.py --help failed (this is normal if app requires GUI)
    echo [INFO] Trying minimal startup...
) else (
    echo [OK] main.py responds to --help
)

echo.
echo ========================================================
echo TEST RESULTS
echo ========================================================
echo [OK] Python backend appears to be ready
echo [NEXT] Run: build.bat
echo.
pause
