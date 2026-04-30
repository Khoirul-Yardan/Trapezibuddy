# GEMINI AI INTEGRATION - QUICK START

Selamat! Desktop Assistant Anda sekarang menggunakan Google Gemini AI!

## Apa yang Berubah?

### Sebelumnya (OLLAMA):
- Local AI model (offline)
- Terbatas pada kemampuan model lokal
- Respons lambat (2-30 detik)
- Hanya bisa menjalankan task sederhana

### Sekarang (Gemini AI):
✓ Cloud-based AI yang powerful
✓ Dapat menjawab pertanyaan APAPUN dengan akurat
✓ Respons cepat (1-3 detik)
✓ Character bisa membuka aplikasi dan membuat document
✓ Lebih interaktif dan fungsional

## Perubahan Teknis

### File yang Diupdate:
1. `config/config.py` - AI_TYPE sekarang "gemini"
2. `ai/ai_controller.py` - Ditambah _process_gemini() method
3. `system/action_executor.py` - Ditambah open_word, open_excel, open_powerpoint
4. `requirements.txt` - Ditambah google-generativeai dan pyperclip

### File Baru:
- `GEMINI_SETUP_GUIDE.md` - Panduan lengkap setup
- `test_gemini_integration.py` - Test script untuk verifikasi

## Langkah 1: Set API Key (PENTING!)

### Windows PowerShell:
```powershell
$env:GEMINI_API_KEY = "YOUR_API_KEY_HERE"
```

### Windows Command Prompt:
```cmd
setx GEMINI_API_KEY "YOUR_API_KEY_HERE"
```

⚠️ **Ganti "YOUR_API_KEY_HERE" dengan API key Anda dari https://aistudio.google.com/**

## Langkah 2: Install Dependencies

```bash
pip install -r requirements.txt
```

## Langkah 3: Test Setup

```bash
python test_gemini_integration.py
```

Jika semua test PASS, lanjut ke langkah berikutnya!

## Langkah 4: Jalankan Aplikasi

```bash
python main.py
```

## Fitur Baru yang Bisa Digunakan

### 1. Menjawab Pertanyaan Kompleks
```
User: "Jelaskan tentang machine learning dan neural network"
Character: Memberikan penjelasan detail dengan contoh
```

### 2. Membuka Aplikasi & Membuat Document
```
User: "Buatkan saya resume tentang animasi character di Word"
Character:
- Membuka Microsoft Word
- Mengetik resume otomatis
- Siap untuk Anda edit lebih lanjut
```

### 3. Web Search & Browsing
```
User: "Buka Chrome dan cari tutorial Blender 3D"
Character:
- Membuka Chrome
- Melakukan search otomatis
```

### 4. Complex Task Execution
```
User: "Buka Excel dan buat tracking sheet untuk project"
Character:
- Membuka Excel
- Membuat template tracking
```

## Mendapatkan Gemini API Key

1. Buka: https://aistudio.google.com/
2. Login dengan Google account
3. Klik "Get API Key"
4. Copy API key yang ditampilkan
5. Set ke environment variable (lihat Langkah 1)

**Note**: Free tier Google Gemini cukup untuk development dan personal use!

## Troubleshooting

### Error: API key not configured
```
Solution: Pastikan GEMINI_API_KEY sudah di-set sebagai environment variable
         Restart terminal/IDE setelah set
```

### Error: google-generativeai not installed
```
Solution: pip install google-generativeai
```

### Character tidak merespon
```
Check:
1. AI_ENABLED = True (config/config.py)
2. AI_TYPE = "gemini" (config/config.py)
3. API key sudah di-set
4. Check log files di folder logs/
```

## Contoh Command Interaktif

Ketika buka chat panel (tekan B):

```
User: "Jelaskan perbedaan UI dan UX"
Character: Memberikan penjelasan lengkap

User: "Buatkan saya proposal di Word tentang game design"
Character: Membuka Word dan membuat proposal

User: "Cari di YouTube video tentang game development"
Character: Membuka Chrome dan search YouTube

User: "Buka Excel dan buat budget tracker"
Character: Membuka Excel dan membuat spreadsheet
```

## Settings

File konfigurasi: `config/config.py`

```python
# AI Settings
AI_ENABLED = True              # Enable/disable AI
AI_TYPE = "gemini"             # Type: gemini, openai, local
AI_API_KEY = os.getenv("GEMINI_API_KEY", "")
AI_MODEL = "gemini-pro"        # Model yang digunakan
```

## Next Steps

1. ✅ Set GEMINI_API_KEY
2. ✅ Install dependencies
3. ✅ Test dengan: `python test_gemini_integration.py`
4. ✅ Run: `python main.py`
5. ✅ Enjoy interactive AI character!

## Support Resources

- **Setup Guide**: `GEMINI_SETUP_GUIDE.md`
- **Test Script**: `test_gemini_integration.py`
- **Gemini Docs**: https://ai.google.dev/
- **Issues/Bugs**: Check project GitHub

---

**Created**: April 28, 2026
**Status**: Production Ready ✅
**Version**: 1.0
