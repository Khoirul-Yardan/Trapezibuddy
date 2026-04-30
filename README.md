# Desktop Assistant 2D

Desktop overlay assistant dengan sprite 2D karakter, behavior system FSM, dan integrasi AI.

![Status](https://img.shields.io/badge/status-working-brightgreen) ![Python](https://img.shields.io/badge/python-3.8+-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

✅ **Frameless Overlay Window**
- Window tanpa border yang selalu di atas (always-on-top)
- Background transparan
- Tidak muncul di taskbar Windows
- Support click & drag karakter

✅ **Character Animation**
- Frame-based animation dari spritesheet
- Multiple animasi (idle, walk_left, walk_right)
- Configurable frame rate
- QTimer loop untuk smooth rendering

✅ **Behavior System (FSM)**
- Finite State Machine untuk karakter behavior
- State: IDLE, WALK_LEFT, WALK_RIGHT, INTERACT
- Automatic state transitions
- Random walking pattern

✅ **AI Integration**
- **Google Gemini AI** (Recommended - Default)
- Support OpenAI API (gpt-4)
- Support local Ollama (offline)
- Multi-language support
- Intent parsing dan action mapping
- Can create documents (Word, Excel, PowerPoint)
- Answer any question with high accuracy

✅ **OS Control**
- Buka aplikasi Windows (Chrome, Notepad, Calculator)
- Kontrol mouse & keyboard
- Window management (maximize, minimize, close)
- Media control (volume up/down)

✅ **Build to EXE**
- PyInstaller untuk standalone executable
- Asset bundling otomatis
- Tidak perlu Python terinstall pada target machine

---

## Requirements

- **Python:** 3.8+
- **OS:** Windows 10/11
- **RAM:** Minimum 512 MB
- **Disk:** ~100 MB untuk executable

---

## Installation

### 1. Clone atau Download Project

```bash
cd DesktopAssistant
```

### 2. Setup Virtual Environment (Optional tapi Recommended)

```bash
python -m venv venv
venv\Scripts\activate.bat
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup Gemini AI (Default - Recommended)

1. Get API Key dari: https://aistudio.google.com/
2. Set environment variable (PowerShell):
   ```powershell
   $env:GEMINI_API_KEY = "YOUR_API_KEY_HERE"
   ```
3. Atau Command Prompt:
   ```cmd
   setx GEMINI_API_KEY "YOUR_API_KEY_HERE"
   ```

Untuk detail lengkap, baca: **GEMINI_SETUP_GUIDE.md**

### 5. (Optional) Setup OpenAI API Key

Jika ingin gunakan OpenAI (bukan Gemini):

```bash
set OPENAI_API_KEY=sk-...your-key...
```

Atau edit `config/config.py`:
```python
AI_TYPE = "openai"
AI_API_KEY = "sk-...your-key..."
```

### 6. (Optional) Setup Local Ollama

Untuk offline AI, install Ollama:
1. Download: https://ollama.ai
2. Run: `ollama pull mistral`
3. Di `config/config.py`, ubah:
```python
AI_TYPE = "local"  # Bukan "gemini"
```

---

## Quick Start

### Run dari Source Code

```bash
python main.py
```

Atau gunakan script batch:
```bash
run.bat
```

### Build ke EXE

```bash
pyinstaller --noconfirm --onefile --windowed --add-data "assets;assets" main.py
```

Atau gunakan script batch:
```bash
build.bat
```

Executable akan ada di folder `dist/`:
```
dist/
├── DesktopAssistant.exe
└── (dependencies)
```

Double-click `.exe` untuk run!

---

## Project Structure

```
DesktopAssistant/
│
├── main.py                    # Entry point
├── main_window.py            # Main application window
├── requirements.txt          # Python dependencies
├── run.bat                   # Run script
├── build.bat                 # Build script
├── README.md                 # Documentation
│
├── config/
│   ├── __init__.py
│   └── config.py            # Configuration settings
│
├── character/               # Character rendering
│   ├── __init__.py
│   ├── animation.py        # Animation & spritesheet system
│   └── character_widget.py # Qt widget untuk display
│
├── behavior/               # AI behavior system
│   ├── __init__.py
│   ├── fsm.py             # Finite State Machine
│   └── behavior_controller.py # FSM controller
│
├── ai/                    # AI integration
│   ├── __init__.py
│   └── ai_controller.py  # OpenAI / Ollama
│
├── system/               # OS control & actions
│   ├── __init__.py
│   └── action_executor.py # Execute system commands
│
├── utils/               # Utilities
│   ├── __init__.py
│   └── logger.py       # Logging system
│
└── assets/
    └── sprites/        # Sprite files (PNG, spritesheet)
```

---

## Configuration

Edit `config/config.py` untuk customize:

### Window Settings
```python
WINDOW_WIDTH = 256          # Width karakter
WINDOW_HEIGHT = 256         # Height karakter
WINDOW_TITLE = "Desktop Assistant"
```

### Animation
```python
ANIMATION_FRAME_INTERVAL = 150  # ms antara frame update
ANIMATION_SCALE = 1.0          # Scaling factor
```

### Behavior
```python
IDLE_DURATION_MIN = 2000      # Min 2 detik idle
IDLE_DURATION_MAX = 5000      # Max 5 detik idle
WALK_SPEED = 2                # Pixel per frame
```

### AI
```python
AI_ENABLED = True             # Enable/disable AI
AI_TYPE = "local"             # "openai" atau "local"
OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "mistral"
```

---

## Usage Examples

### 1. Run Aplikasi

```bash
python main.py
```

Karakter akan muncul di desktop, berjalan random, bisa di-drag.

### 2. Process Command

```python
from main_window import DesktopAssistantWindow

window = DesktopAssistantWindow()
window.show()

# Process voice/text command
window.process_voice_command("buka chrome")
```

Response:
```
=> AI Intent: open_app
=> Action: open_chrome
=> Chrome opened
```

### 3. Load Custom Sprite

```python
sprite_config = {
    "idle": {
        "path": "assets/sprites/idle.png",
        "frame_width": 64,
        "frame_height": 64,
        "num_frames": 4,
        "fps": 10
    },
    "walk_left": {
        "path": "assets/sprites/walk.png",
        "frame_width": 64,
        "frame_height": 64,
        "num_frames": 8,
        "fps": 12
    }
}

window.load_character_sprites(sprite_config)
```

### 4. Custom Behavior

```python
from behavior.behavior_controller import BehaviorController
from behavior.fsm import State

behavior = BehaviorController()

# Listen to animation changes
behavior.animation_changed.connect(lambda anim: print(f"Animation: {anim}"))

# Force state change
behavior.force_state(State.WALK_RIGHT)
```

---

## Common Issues & Solutions

### Error: "ModuleNotFoundError: No module named 'PySide6'"

**Solution:**
```bash
pip install PySide6
```

### Error: "Cannot connect to Ollama at http://localhost:11434"

**Solution:**
- Install Ollama: https://ollama.ai
- Run Ollama: `ollama serve`
- Atau ubah ke OpenAI: `AI_TYPE = "openai"`

### Error: "Could not find Chrome"

**Solution:**
Chrome paths mungkin berbeda. Edit `system/action_executor.py`:
```python
chrome_paths = [
    r"C:\path\to\chrome.exe",  # Add your chrome path
]
```

### Sprite tidak muncul

**Solusi:**
Gunakan placeholder: aplikasi membuat dummy animation jika no spritesheet found.
Load spritesheet dengan path yang benar:
```python
window.character_widget.load_spritesheet(
    "idle",
    "assets/sprites/idle.png",
    64, 64, 4  # frame_width, height, num_frames
)
```

### Window tidak responsive / lag

**Solusi:**
- Kurangi `ANIMATION_FRAME_INTERVAL`
- Gunakan smaller spritesheet resolution
- Close background applications

---

## Building to EXE

### Method 1: Automatic (using script)

```bash
build.bat
```

### Method 2: Manual PyInstaller

```bash
pyinstaller \
    --noconfirm \
    --onefile \
    --windowed \
    --add-data "assets;assets" \
    --add-data "config;config" \
    --name "DesktopAssistant" \
    main.py
```

### After Build

Executable akan ada di:
```
dist/DesktopAssistant.exe
```

Share file ini - tidak perlu Python terinstall!

---

## AI Commands Examples

### OpenAI / Ollama

```
User: "buka chrome"
=> Action: open_chrome

User: "buka notepad"
=> Action: open_notepad

User: "search google"
=> Action: open_browser
=> URL: https://www.google.com

User: "tik mouse"
=> Action: mouse_click

User: "naikkan volume"
=> Action: volume_up
```

---

## API Reference

### BehaviorController

```python
controller = BehaviorController()

# Signals
controller.animation_changed.connect(callback)
controller.position_changed.connect(callback)

# Methods
controller.force_state(State.IDLE)
controller.set_position(x, y)
controller.get_current_position()
controller.cleanup()
```

### AIController

```python
ai = AIController()

result = ai.process_command("buka chrome")
# Returns: {
#     "intent": "open_app",
#     "action": "open_chrome",
#     "parameters": {},
#     "response": "Membuka Chrome..."
# }
```

### ActionExecutor

```python
executor = ActionExecutor()

executor.execute("open_chrome")
executor.execute("mouse_click", {"x": 100, "y": 100})
executor.execute("type_text", {"text": "Hello"})
```

---

## Performance Tips

1. **Reduce frame rate** untuk more FPS:
   ```python
   ANIMATION_FRAME_INTERVAL = 100  # Default 150ms
   ```

2. **Use optimized sprites** (PNG, compressed)

3. **Disable AI** untuk offline mode:
   ```python
   AI_ENABLED = False
   ```

4. **Close unnecessary apps** untuk smooth performance

---

## Extension Ideas

- 🎨 Add more animations (jump, dance, etc.)
- 🗣️ Text-to-speech untuk character dialogue
- 🎵 Sound effects untuk actions
- 🌐 Weather widget
- ⏰ Clock / reminders
- 🎮 Interactive mini-games
- 💬 Chat bubble UI
- 🎨 Skin customization

---

## Troubleshooting

### Debug Mode

Enable debug logging:
```python
# config/config.py
DEBUG_MODE = True
LOG_LEVEL = "DEBUG"
```

### Check Logs

Logs print ke console. Gunakan:
```bash
python main.py > log.txt 2>&1
```

### Test Components Individually

```python
# Test animation
from character.animation import AnimationController
anim = AnimationController()

# Test behavior
from behavior.behavior_controller import BehaviorController
behavior = BehaviorController()

# Test AI
from ai.ai_controller import AIController
ai = AIController()
result = ai.process_command("test")
print(result)

# Test actions
from system.action_executor import ActionExecutor
executor = ActionExecutor()
executor.execute("open_notepad")
```

---

## License

MIT License - Free to use and modify

---

## Support & Contact

For issues atau questions, lihat file `TROUBLESHOOTING.md`

---

**Happy coding! 🎉**
