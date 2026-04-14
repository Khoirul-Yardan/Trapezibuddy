# Quick Start Guide

Panduan cepat untuk mulai menggunakan Desktop Assistant 2D dalam 5 menit.

## ⚡ Super Quick (2 menit)

### 1. Install Dependencies

```bash
pip install PySide6 pyautogui requests
```

### 2. Run Aplikasi

```bash
python main.py
```

Done! Karakter akan muncul di desktop. 🎉

---

## 📋 Step-by-Step Setup (5 menit)

### Step 1: Verify Python Installation

```bash
python --version
pip --version
```

Expected output:
```
Python 3.8.0 (or higher)
pip 21.0 (or higher)
```

If error → Download Python: https://www.python.org/downloads/

### Step 2: Install All Dependencies

```bash
cd DesktopAssistant
pip install -r requirements.txt
```

Wait untuk download & install (~2-3 menit depending internet).

### Step 3: Run Application

**Option A - Run Script (Recommended)**
```bash
run.bat
```

**Option B - Manual Run**
```bash
python main.py
```

You should see:
```
2024-01-15 10:30:45 - __main__ - INFO - ===============================================
2024-01-15 10:30:45 - __main__ - INFO - Desktop Assistant 2D - Starting
2024-01-15 10:30:45 - __main__ - INFO - ===============================================
...
2024-01-15 10:30:46 - __main__ - INFO - Window displayed
2024-01-15 10:30:46 - __main__ - INFO - Application running - Press Ctrl+C to exit
```

### Step 4: Interact dengan Character

- **Drag character** - Click and drag untuk move
- **Wait** - Character walk random setelah idle
- **Close window** - Alt+F4 atau klik close button

---

## 🎮 Testing Commands

Window akan automatically test command pada startup:

```
Demo: Processing sample command...
=> Opening Chrome...
```

Untuk manual test, edit `main.py`:

```python
# Add after window.show()
window.process_voice_command("buka notepad")
```

---

## 🏗️ Build to EXE (3 menit)

### Option A - Automatic

```bash
build.bat
```

Executable akan ada di:
```
dist/DesktopAssistant.exe
```

### Option B - Manual

```bash
pyinstaller --noconfirm --onefile --windowed --add-data "assets;assets" main.py
```

### Test .exe

1. Double-click `dist/DesktopAssistant.exe`
2. Character should appear dan work exactly seperti dari source

---

## 🎨 Customize Sprite

### Load Custom Spritesheet

1. Prepare PNG file dengan horizontal frames
   ```
   Example: 256x64 image dengan 4 frames → Each frame 64x64
   ```

2. Edit `main.py`:
   ```python
   sprite_config = {
       "idle": {
           "path": "assets/sprites/idle.png",
           "frame_width": 64,
           "frame_height": 64,
           "num_frames": 4,
           "fps": 10
       }
   }
   window.load_character_sprites(sprite_config)
   ```

3. Run again dan lihat sprite baru

---

## 🤖 Setup AI Commands

### Option 1: OpenAI (Cloud)

1. Get API key: https://platform.openai.com/api-keys
2. Set environment:
   ```bash
   set OPENAI_API_KEY=sk-...your-key...
   ```
3. Command akan auto-work

### Option 2: Local Ollama (Offline)

1. Install: https://ollama.ai
2. Start: `ollama serve`
3. Model: `ollama pull mistral`
4. Edit `config/config.py`:
   ```python
   AI_TYPE = "local"
   ```

---

## 📝 Common Commands

After setup, these commands auto-work:

| Command        | Action          |
|---|---|
| "buka chrome"  | Open Chrome |
| "buka notepad" | Open Notepad    |
| "kalkulator"   | Open Calculator |
| "search"       | Open Google     |
| "hello"        | Say hello       |

---

## ❌ Quick Troubleshooting

**Character tidak muncul?**
- Check window position di `main_window.py` line: `self.move(1600, 900)`
- Ubah ke: `self.move(100, 100)`

**Command tidak work?**
- Check AI enabled: `config/config.py` - `AI_ENABLED = True`
- Check Ollama running (jika local mode)
- Check internet (jika OpenAI mode)

**Sprite tidak load?**
- File exists? Check path: `assets/sprites/`
- File valid PNG? Test dengan image viewer
- Frame calculations benar? `width = frame_width * num_frames`

**Build error?**
- PyInstaller installed? `pip install PyInstaller`
- assets folder exists? Create if missing
- Run from source work dulu? `python main.py` must success

---

## 🚀 Next Steps

1. **Load custom sprite** - Replace placeholder dengan character Anda
2. **Customize behavior** - Edit `behavior/behavior_controller.py`
3. **Add animations** - Edit animation list
4. **Deploy .exe** - Share ke others!
5. **Extend features** - Add sound, UI, games, etc.

---

## 📚 Full Documentation

- **Setup details** → `README.md`
- **Troubleshooting** → `TROUBLESHOOTING.md`
- **API Reference** → `README.md` section "API Reference"
- **Code comments** → Read source files

---

## 💡 Pro Tips

1. **Development mode:**
   ```python
   AI_ENABLED = False  # Faster testing
   DEBUG_MODE = True   # More logs
   ```

2. **Fast build:**
   ```bash
   pyinstaller --onefile --windowed main.py
   ```

3. **Test components:**
   ```python
   python -c "from main_window import *; print('OK')"
   ```

4. **Check imports:**
   ```bash
   python -m py_compile main.py
   ```

---

**🎉 That's it! Happy coding!**

For advanced setup → Read `README.md`
