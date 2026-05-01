@echo off
echo ========================================================
echo Memulai proses build TrapeziBuddy menjadi .EXE
echo ========================================================

echo.
echo [1/3] Meng-compile program Python menjadi EXE...
call pip install pyinstaller
call pyinstaller --noconfirm --onedir --windowed --name "main" main.py

if not exist "dist\main\main.exe" (
    echo.
    echo ERROR: Gagal meng-compile Python. Silakan cek pesan error di atas.
    pause
    exit /b 1
)

echo.
echo [2/3] Mempersiapkan UI Desktop-App Electron...
cd desktop-app
call npm install

echo.
echo [3/3] Membungkus semuanya menjadi installer .EXE (Electron-Builder)...
call npm run build

echo.
echo ========================================================
echo SELESAI!
echo Installer TrapeziBuddy Anda bisa ditemukan di:
echo desktop-app\dist\TrapeziBuddy Setup 0.1.0.exe
echo ========================================================
pause
