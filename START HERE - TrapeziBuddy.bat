@echo off
setlocal enabledelayedexpansion

REM ================================================================
REM  TrapeziBuddy - Run Script
REM  Frontend: Electron (desktop-app) | Backend: Python via Electron
REM ================================================================

REM ----------------------------------------------------------------
REM  [OPSIONAL] Isi API key di sini agar tidak perlu input setiap kali
REM  Kosongkan (biarkan "") kalau mau input manual saat dijalankan
REM ----------------------------------------------------------------
set "GEMINI_API_KEY="
REM ----------------------------------------------------------------

echo.
echo  ===============================================
echo   TrapeziBuddy - Desktop Companion
echo  ===============================================
echo.

REM ----------------------------------------------------------------
REM  CEK API KEY - tanya jika belum diisi
REM ----------------------------------------------------------------
if "%GEMINI_API_KEY%"=="" (
    echo  Gemini API key tidak ditemukan.
    echo  Dapatkan API key gratis di: https://aistudio.google.com/
    echo.
    set /p GEMINI_API_KEY="  Masukkan API key kamu (atau tekan Enter untuk skip): "
    echo.
)

if "%GEMINI_API_KEY%"=="" (
    echo  [INFO] Melanjutkan tanpa API key.
    echo  Fitur chatbot AI tidak akan berfungsi.
    echo  Fitur lain ^(tasks, focus timer, karakter^) tetap berjalan normal.
    echo.
) else (
    echo  [OK] API key loaded.
)

REM ----------------------------------------------------------------
REM  CEK PYTHON
REM ----------------------------------------------------------------
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Python tidak ditemukan!
    echo  Download dari: https://www.python.org/downloads/
    echo  Pastikan centang "Add Python to PATH" saat install.
    echo.
    pause
    exit /b 1
)
echo  [OK] Python ditemukan.

REM ----------------------------------------------------------------
REM  CEK NODE.JS
REM ----------------------------------------------------------------
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Node.js tidak ditemukan!
    echo  Download dari: https://nodejs.org/ ^(pilih versi LTS^)
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js ditemukan.

REM ----------------------------------------------------------------
REM  SETUP VIRTUAL ENVIRONMENT (hanya sekali)
REM ----------------------------------------------------------------
if not exist "venv" (
    echo.
    echo  [SETUP] Membuat virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

REM ----------------------------------------------------------------
REM  INSTALL DEPENDENCIES (hanya jika belum pernah)
REM ----------------------------------------------------------------
if not exist ".installed" (
    echo.
    echo  [SETUP] Pertama kali dijalankan, menginstall dependencies...
    echo  Mohon tunggu, ini hanya dilakukan sekali saja.
    echo.

    pip install -q -r requirements.txt
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo  [ERROR] Gagal install Python packages.
        echo  Coba jalankan manual: pip install -r requirements.txt
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Python packages berhasil diinstall.

    if not exist "desktop-app\node_modules" (
        echo  [SETUP] Menginstall Electron packages...
        cd desktop-app
        call npm install --silent
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo  [ERROR] Gagal install Electron packages.
            echo.
            cd ..
            pause
            exit /b 1
        )
        cd ..
        echo  [OK] Electron packages berhasil diinstall.
    )

    echo installed > .installed
    echo.
    echo  [OK] Setup selesai!
    echo.
) else (
    echo  [OK] Dependencies sudah terinstall, langsung jalankan.
)

REM ----------------------------------------------------------------
REM  JALANKAN APLIKASI
REM ----------------------------------------------------------------
echo.
echo  Memulai TrapeziBuddy...
echo  Tutup window ini untuk keluar dari aplikasi.
echo.

cd desktop-app
call npm run dev

cd ..
echo.
echo  TrapeziBuddy telah ditutup.
pause