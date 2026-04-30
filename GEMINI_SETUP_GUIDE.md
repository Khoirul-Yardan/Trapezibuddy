# Gemini AI Integration Guide

Panduan lengkap untuk mengintegrasikan Google Gemini AI ke dalam Desktop Assistant.

## 1. Apa itu Gemini AI?

Gemini adalah AI model dari Google yang:
- **Powerful** - Dapat menjawab pertanyaan kompleks dengan akurat
- **Gratis** - Ada free tier untuk development
- **Multimodal** - Dapat memproses teks, gambar, dan data lainnya
- **Fast** - Response yang cepat untuk desktop assistant

## 2. Mendapatkan Gemini API Key

### Langkah-Langkah:

1. **Buka Google AI Studio**
   - Kunjungi: https://aistudio.google.com/
   - Login dengan akun Google Anda

2. **Buat API Key**
   - Klik "Get API Key" atau "Create API Key"
   - Pilih "Create new secret key"
   - API key akan ditampilkan (copy dan simpan dengan aman)

3. **Format API Key**
   - API key terlihat seperti: `AIzaSyC...` (string panjang)
   - Jangan bagikan ke siapa pun!

## 3. Setup Environment Variable

### Windows PowerShell (Recommended):

```powershell
# Set temporary (session only)
$env:GEMINI_API_KEY = "YOUR_API_KEY_HERE"

# Set permanent (untuk semua session)
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "YOUR_API_KEY_HERE", "User")

# Verify
$env:GEMINI_API_KEY
```

### Windows Command Prompt:

```cmd
# Set temporary
set GEMINI_API_KEY=YOUR_API_KEY_HERE

# Set permanent
setx GEMINI_API_KEY "YOUR_API_KEY_HERE"

# Verify
echo %GEMINI_API_KEY%
```

### File .env (Alternative):

Buat file `.env` di root project:
```
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Kemudian install python-dotenv:
```bash
pip install python-dotenv
```

## 4. Install Dependencies

```bash
# Install semua dependencies
pip install -r requirements.txt

# Atau install manual:
pip install google-generativeai==0.3.0
pip install PySide6==6.7.1
pip install pyautogui==0.9.53
pip install Pillow==10.2.0
pip install pyperclip==1.8.2
```

## 5. Verifikasi Setup

Jalankan test script untuk memastikan semuanya terinstall:

```bash
python -c "import google.generativeai as genai; print('Gemini AI berhasil terinstall!')"
```

## 6. Menggunakan Desktop Assistant dengan Gemini

### Buka aplikasi:
```bash
python main.py
```

### Fitur yang sekarang bisa dilakukan:

1. **Menjawab Pertanyaan Kompleks**
   ```
   User: "Jelaskan tentang machine learning"
   Character: Memberikan penjelasan detail tentang ML
   ```

2. **Membuka Aplikasi & Membuat Document**
   ```
   User: "Buatkan saya resume tentang animasi character di Word"
   Character: 
   - Membuka Microsoft Word
   - Membuat document dengan konten resume
   - Siap untuk editing lebih lanjut
   ```

3. **Web Search & Browsing**
   ```
   User: "Buka Chrome dan cari tutorial animasi 3D"
   Character:
   - Membuka Chrome
   - Melakukan search otomatis
   ```

4. **Complex Task Execution**
   ```
   User: "Buka Excel dan buat spreadsheet tracking project"
   Character: Membuka Excel dan membuat template tracking
   ```

## 7. Troubleshooting

### Error: "API key not configured"
- Pastikan GEMINI_API_KEY environment variable sudah di-set
- Restart terminal/IDE setelah set environment variable
- Verify dengan: `echo $env:GEMINI_API_KEY` (PowerShell)

### Error: "google-generativeai not installed"
```bash
pip install --upgrade google-generativeai
```

### Error: "Connection timeout"
- Cek koneksi internet
- Coba tunggu beberapa detik
- Cek status API di: https://status.cloud.google.com/

### Character tidak merespon
- Check log file di: `logs/` folder
- Pastikan AI_ENABLED = True di config.py
- Pastikan AI_TYPE = "gemini" di config.py

## 8. Advanced Configuration

### File: `config/config.py`

```python
# AI Settings
AI_ENABLED = True
AI_TYPE = "gemini"  # gemini, openai, atau local
AI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_MODEL = "gemini-pro"  # Bisa juga "gemini-pro-vision"

GEMINI_SAFETY_SETTINGS = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_NONE",
    },
    # ... safety settings lainnya
]
```

## 9. Tips & Tricks

### Untuk Performa Terbaik:
1. Gunakan prompt yang clear dan spesifik
2. Delay_ms untuk timing action yang tepat
3. Character bisa menjalankan multiple tasks sekaligus

### Custom Prompts:
Edit `_get_system_prompt()` di `ai/ai_controller.py` untuk custom behavior

### Testing:
```bash
python test_chat_performance.py
python test_features.py
```

## 10. Free Tier Limits

Google Gemini Free Tier:
- **Requests**: 60 per menit (cukup untuk desktop assistant)
- **Requests per day**: 1500
- **No billing required** untuk tier free

Jika perlu lebih banyak requests, upgrade ke paid plan di Google Cloud Console.

## 11. Contoh Penggunaan

### Membuat Resume di Word:
```
User: "Buatkan resume tentang web development"

Character akan:
1. Buka Microsoft Word
2. Ketik resume otomatis dengan Gemini AI
3. Format dengan baik
4. Siap untuk modifikasi
```

### Mencari Info & Membuka:
```
User: "Cari di YouTube video tentang game development"

Character akan:
1. Buka Chrome
2. Search "game development" di YouTube
3. Tampilkan hasil di browser
```

### Menjawab Pertanyaan:
```
User: "Apa perbedaan antara UI dan UX?"

Character akan:
1. Gunakan Gemini AI untuk menjawab
2. Memberikan penjelasan detail
3. Contoh-contoh praktis
```

## 12. Support & Resources

- **Gemini Documentation**: https://ai.google.dev/
- **GitHub Issues**: Report bug di project GitHub
- **Stack Overflow**: Tag `google-generativeai`

---

**Last Updated**: April 28, 2026
**Version**: 1.0
**Status**: Production Ready
