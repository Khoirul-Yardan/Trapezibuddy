# AI Integration Guide - Dialog with Natural Responses

## ✅ Fixes & New Features

### 1. Dialog Mengikuti Character (Fixed)
Bubble dialog sekarang akan terus mengikuti posisi character saat bergerak, bukan tetap di tempat lama.

### 2. Tombol Minus (-) Sekarang Bekerja (Fixed)
Keyboard handling sudah di-improve untuk menangani various keyboard input, termasuk minus key dari numpad.

### 3. AI Integration dengan Natural Dialog (New)
AI response sekarang menampilkan:
- **Thinking stage** - karakter "berpikir" sebelum menjawab
- **Variable messages** - respon yang variatif agar terasa natural
- **Character reactions** - happy, sad, excited reactions saat bicara
- **Multi-message responses** - split long responses jadi beberapa message

---

## 🎯 Usage Examples

### Simple AI Response with Thinking
```python
from main_window import DesktopAssistantWindow
from system.dialog_manager import DialogManager

window = DesktopAssistantWindow()
window.show()

manager = DialogManager(window)

# Show user message, then thinking, then AI response
manager.show_ai_response_natural(
    user_message="Berapa 2+2?",
    ai_response="2+2 sama dengan 4!"
)
```

### AI Response with Character Reaction
```python
# Happy reaction
manager.show_ai_response_with_reaction(
    user_message="Bantu aku!",
    ai_response="Tentu! Dengan senang hati! 😊",
    reaction="happy"
)

# Sad reaction
manager.show_ai_response_with_reaction(
    user_message="Saya sedih...",
    ai_response="Aku mengerti. Semoga segera membaik.",
    reaction="sad"
)

# Excited reaction
manager.show_ai_response_with_reaction(
    user_message="Kita menang!",
    ai_response="Wow! Itu luar biasa! 🎉",
    reaction="excited"
)
```

### Multi-Part Response (More Natural)
```python
# Panjang response di-split jadi beberapa part
messages = [
    "Itu pertanyaan yang menarik!",
    "Jadi begini...",
    "Kesimpulannya: Aku akan membantu kamu!"
]

manager.show_multi_message_response(
    user_message="Bagaimana cara kamu membantu?",
    ai_messages=messages
)
```

### Using show_ai_response (Auto-handle timing)
```python
# Automatic - akan ambil AI response dari AI controller
window.show_ai_response("Halo, siapa namamu?")

# Atau dengan custom response
window.show_ai_response(
    user_input="Halo!",
    ai_response="Hai! Aku adalah assistant desktop kamu"
)
```

---

## 📝 Keyboard Controls (Updated)

| Key | Action |
|-----|--------|
| `+` | Increase size |
| `-` | Decrease size (NOW WORKS!) |
| `Scroll Wheel` | Resize |
| `D` | Test character dialog |
| `U` | Test user dialog |
| `ESC` | Exit |

Test dengan mengetik minus/hyphen di keyboard!

---

## 🔧 Dialog Manager API

### `show_ai_response_natural(user_message, ai_response)`
Menampilkan user input → thinking → AI response dengan timing natural.

### `show_ai_response_with_reaction(user_message, ai_response, reaction)`
- `reaction`: "happy", "sad", "excited", atau "none"

### `show_multi_message_response(user_message, ai_messages)`
- `ai_messages`: List of strings untuk di-display satu per satu

### Character Reactions
```python
manager.character_react_happy()      # Lompat senang
manager.character_react_sad()        # Kuruh sedih
manager.character_react_excited()    # Lompat berkali-kali
```

---

## 🎬 Complete Demo

```python
#!/usr/bin/env python3
import sys
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QTimer
from main_window import DesktopAssistantWindow
from system.dialog_manager import DialogManager
from utils.asset_generator import generate_all_placeholder_sprites, get_sprite_config

app = QApplication(sys.argv)

# Setup window
window = DesktopAssistantWindow()
generate_all_placeholder_sprites()
sprite_config = get_sprite_config()
window.load_character_sprites(sprite_config)
window.show()

# Create dialog manager
manager = DialogManager(window)

# Demo sequence
def demo_sequence():
    # 1. Natural greeting
    QTimer.singleShot(1000, lambda: manager.show_ai_response_natural(
        "Halo!",
        "Halo juga! Apa kabar?"
    ))
    
    # 2. Excited response
    QTimer.singleShot(5000, lambda: manager.show_ai_response_with_reaction(
        "Mereka bilang aku bagus!",
        "Wow! Selamat! Itu awesome! 🎉",
        reaction="excited"
    ))
    
    # 3. Multi-part response
    QTimer.singleShot(9000, lambda: manager.show_multi_message_response(
        "Bisa bantu aku tidak?",
        [
            "Tentu saja!",
            "Apa yang bisa aku bantu?",
            "Aku siap membantu sekarang"
        ]
    ))
    
    # 4. Happy reaction
    QTimer.singleShot(13000, lambda: manager.show_ai_response_with_reaction(
        "Terima kasih!",
        "Sama-sama! Senang membantu 😊",
        reaction="happy"
    ))

# Start demo
QTimer.singleShot(500, demo_sequence)

sys.exit(app.exec())
```

---

## 🎨 Customization

### Ubah Thinking Messages
```python
manager.thinking_messages = [
    "Mari saya pikir...",
    "Tunggu sebentar...",
    "Hmm interesting...",
]
```

### Ubah Processing Messages
```python
manager.processing_messages = [
    "Sedang diproses...",
    "Loading...",
    "Please wait...",
]
```

---

## 🏃 Real-time Movement Test

```bash
# Test di terminal
python main.py

# Kemudian:
1. Klik dan drag character di desktop
2. Lihat bubble dialog TETAP MENGIKUTI character
3. Tekan D untuk show dialog saat dragging
4. Dialog akan terus bergerak bersama character!
```

---

## 📚 Technical Details

### Dialog Following Implementation
- `BubbleDialog.follow_timer` - Update position every 50ms
- `MainWindow.position_update_timer` - Sync dengan window movement
- `BubbleDialog.update_position()` - Real-time position recalculation

### Keyboard Handling Improvement
- Handle `Qt.Key_Minus` + `event.text() == '-'`
- Check `event.isAutoRepeat()` untuk avoid duplicate triggers
- Support both standard minus dan numpad minus

### AI Integration Flow
1. User input → `show_ai_response()` atau `show_ai_response_natural()`
2. Automatic timing:
   - User dialog: 2000ms
   - Break: 500ms
   - Thinking: 1000ms
   - AI response: 3500ms
3. Dialog terus follow character movement
4. Character bisa punya reactions

---

## 🐛 Troubleshooting

**Q: Dialog masih tidak follow saat character bergerak?**
A: Pastikan `position_update_timer` sudah di-start. Check logger untuk debug info.

**Q: Minus key masih tidak bekerja?**
A: Coba tekan minus dari numpad. Atau cek dengan `event.text()` untuk debugging.

**Q: AI response tidak muncul?**
A: Check AI controller configuration di `config/config.py`. Pastikan `AI_ENABLED = True`.

**Q: Thinking message tidak muncul?**
A: Seharusnya muncul 500ms setelah user dialog. Jika tidak, check timing di `show_ai_response_natural()`.
