# Troubleshooting Guide

## Installation Issues

### Q: "pip: command not found"
**A:** Python tidak di PATH. Reinstall Python dengan "Add to PATH" checked.
- Download: https://www.python.org/downloads/
- Atau gunakan full path: `C:\Python311\Scripts\pip install ...`

### Q: "ModuleNotFoundError: No module named 'PySide6'"
**A:** Dependencies tidak installed.
```bash
pip install -r requirements.txt
```

### Q: Virtual environment tidak activate
**A:** Gunakan full path atau pastikan berada di correct directory:
```bash
cd DesktopAssistant
venv\Scripts\activate.bat
```

---

## Runtime Issues

### Q: Character tidak muncul di desktop
**A:** Beberapa kemungkinan:
1. Window mungkin di luar screen. Edit `main_window.py`:
   ```python
   self.move(100, 100)  # Visible position
   ```
2. Transparency tidak berfungsi. Cek GPU/driver support untuk transparency.
3. Test dengan spawn window lebih kecil untuk confirm visibility.

### Q: Mouse drag tidak working
**A:** Pastikan:
1. QtCore dan mouse event imported dengan benar
2. Widget memiliki focus - klik terlebih dahulu sebelum drag
3. Transparent areas tidak bisa di-drag. Drag dari character sprite saja.

### Q: Animation tidak smooth
**A:** Check:
1. Reduce `ANIMATION_FRAME_INTERVAL` (default 150ms):
   ```python
   ANIMATION_FRAME_INTERVAL = 100
   ```
2. Sprite resolution terlalu tinggi. Gunakan 64x64 atau 128x128
3. CPU usage tinggi. Close background apps.

### Q: AI tidak responding
**A:** 
1. **OpenAI mode:**
   - Check API key: `echo %OPENAI_API_KEY%`
   - Verify API key valid
   - Check internet connection
   - Check API quota
   
2. **Ollama mode:**
   - Confirm Ollama running: `ollama serve`
   - Check Ollama URL: `http://localhost:11434`
   - Install model: `ollama pull mistral`
   - Fallback ke local parsing jika error

### Q: Chrome / Notepad tidak open dari command
**A:** Application path might different:
```python
# Edit system/action_executor.py
chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Users\YourUsername\AppData\Local\Google\Chrome\Application\chrome.exe",
]
```

---

## Build Issues

### Q: "PyInstaller not found"
**A:** Install PyInstaller:
```bash
pip install PyInstaller
```

### Q: Build tapi .exe tidak berjalan
**A:** 
1. Check error: Run `dist\DesktopAssistant.exe` dari command prompt untuk see error
2. Dependencies tidak ter-bundle: Add ke PyInstaller command:
   ```bash
   --add-data "assets;assets"
   --add-data "config;config"
   ```
3. Hidden imports: Add jika ada module tidak terdeteksi:
   ```bash
   --hidden-import=PySide6
   ```

### Q: .exe terlalu besar (~300+ MB)
**A:** Normal untuk PySide6. Gunakan `--onefile` untuk single file.
Atau gunakan `--optimize=2` untuk compression.

### Q: .exe crash saat run
**A:**
1. Test dari source terlebih dahulu: `python main.py` harus work
2. Check manifest requirements
3. Add more debug info:
   ```bash
   pyinstaller ... --debug=all
   ```

---

## Performance Issues

### Q: High CPU usage
**A:**
1. Reduce animation update frequency:
   ```python
   ANIMATION_FRAME_INTERVAL = 200  # Increase dari 150
   ```
2. Disable AI:
   ```python
   AI_ENABLED = False
   ```
3. Reduce behavior update rate
4. Close background application

### Q: Sprite animation jerky/stuttering
**A:**
1. Sprite resolution terlalu tinggi
2. Frame rate tidak consistent
3. Timer jitter - ensure system not under heavy load

---

## AI / Command Issues

### Q: "Cannot connect to Ollama"
**A:**
1. Install Ollama: https://ollama.ai
2. Run: `ollama serve`
3. Download model: `ollama pull mistral`
4. Check URL di config: `OLLAMA_URL = "http://localhost:11434"`

### Q: OpenAI error "invalid_api_key"
**A:**
1. Generate new API key: https://platform.openai.com/api-keys
2. Set environment: `set OPENAI_API_KEY=sk-...`
3. Atau set di config.py
4. Restart application

### Q: Command tidak recognized
**A:**
1. Check local parsing fallback work
2. Debug dengan:
   ```python
   from ai.ai_controller import AIController
   ai = AIController()
   result = ai.process_command("test command")
   print(result)
   ```

---

## File / Asset Issues

### Q: "Sprite file not found"
**A:**
1. Check path ada:
   ```bash
   dir assets\sprites\
   ```
2. Use full path jika perlu:
   ```python
   "assets/sprites/idle.png"
   ```
3. File format valid (PNG/JPG)

### Q: Assets tidak ter-include saat build
**A:**
1. Add ke PyInstaller command:
   ```bash
   --add-data "assets;assets"
   ```
2. Place assets di folder yang benar
3. Verify .exe bisa akses assets

---

## Windows-Specific Issues

### Q: Window muncul tapi tidak "always on top"
**A:** Window flags mungkin tidak support:
```python
self.setWindowFlags(
    Qt.WindowStaysOnTopHint |
    Qt.FramelessWindowHint |
    Qt.Tool
)
self.raise_()
self.activateWindow()
```

### Q: Click-through transparency tidak work
**A:** Transparency support depend pada GPU/driver.
Workaround - gunakan border color key:
```python
self.setAttribute(Qt.WA_TranslucentBackground, True)
```

### Q: Minimized saat run aplikasi lain
**A:** Window tidak stay on top properly.
Force bring to front:
```python
self.setWindowState(self.windowState() & ~Qt.WindowMinimized | Qt.WindowActive)
self.raise_()
self.activateWindow()
```

---

## Debug Workflow

### 1. Enable Debug Mode
```python
# config/config.py
DEBUG_MODE = True
LOG_LEVEL = "DEBUG"
```

### 2. Run with console output
```bash
python main.py 2>&1 | tee output.log
```

### 3. Test individual components
```python
# Test animation
from character.animation import AnimationController
ac = AnimationController()
print("Animation controller working")

# Test behavior
from behavior import BehaviorController
bc = BehaviorController()
print("Behavior controller working")

# Test AI
from ai import AIController
ai = AIController()
result = ai.process_command("test")
print(result)
```

### 4. Add breakpoints / print statements
```python
logger.debug(f"Variable value: {some_var}")
```

---

## Common Error Messages

### "QXcbConnection: Could not connect to display"
**Issue:** Headless environment. Tidak bisa run GUI.
**Solution:** Run di graphical environment (desktop)

### "AttributeError: 'QWidget' object has no attribute 'move'"
**Issue:** Parent class tidak QMainWindow
**Solution:** Ensure CharacterWidget parent adalah QMainWindow

### "TypeError: unsupported operand type"
**Issue:** Signal parameter type mismatch
**Solution:** Connect dengan proper types:
```python
signal.connect(lambda x: handle(int(x)))
```

---

## Getting More Help

1. **Check logs:**
   ```bash
   python main.py > error.log 2>&1
   cat error.log
   ```

2. **Test in isolation:**
   ```python
   # Create minimal test
   from PySide6.QtWidgets import QApplication
   app = QApplication([])
   # ... test code
   ```

3. **Search online:**
   - PySide6 documentation: https://doc.qt.io/qtforpython/
   - Python docs: https://docs.python.org/3/
   - Stack Overflow: Search error message

4. **Check requirements versions:**
   ```bash
   pip list
   ```

---

**Still stuck? Check console output carefully for: line number, module name, actual error message.**
