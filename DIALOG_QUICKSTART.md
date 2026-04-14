# Quick Start - Dialog & Size Control

## 🚀 Try It Now

### Run the Dialog Example
```bash
python examples.py --example dialog
```

This will show:
1. Welcome message
2. Multi-turn conversation
3. Character reactions (happy, excited)

### Keyboard Controls
- **`D`** - Show character dialog (test)
- **`U`** - Show user dialog (test)
- **`+`** - Increase character size
- **`-`** - Decrease character size
- **Mouse Wheel** - Scroll to resize
- **ESC** - Exit

---

## 💬 Use Dialog in Your Code

### Simple Dialog
```python
from main_window import DesktopAssistantWindow

window = DesktopAssistantWindow()
window.show()

# Show character message
window.show_character_dialog("Hello there! How can I help?")

# Show user message
window.show_user_dialog("What's the time?", duration=2000)
```

### Multi-Turn Conversation
```python
from system.dialog_manager import DialogManager

manager = DialogManager(window)

turns = [
    {'speaker': 'character', 'text': 'Hello!'},
    {'speaker': 'user', 'text': 'Hi there!'},
    {'speaker': 'character', 'text': 'How are you?'},
]

manager.show_multi_turn_dialog(turns)
```

### Character Reactions
```python
manager.character_react_happy()      # Bounce animation
manager.character_react_sad()        # Shrink animation
manager.character_react_excited()    # Multiple bounces
```

---

## 🎮 Size Control

### Keyboard
- **`+`** (Plus): Increase by 5%
- **`-`** (Minus): Decrease by 5%
- **Scroll Wheel**: Fine control

### Programmatically
```python
widget = window.character_widget

# Set size (50-200%)
widget.set_character_size(120)

# Adjust
widget.increase_size(10)
widget.decrease_size(5)

# Get current
current_size = widget.get_character_size()
print(f"Size: {current_size}%")
```

### Configuration
```python
# config/config.py
CHARACTER_SIZE = 100        # Default size
CHARACTER_MIN_SIZE = 50     # Minimum allowed
CHARACTER_MAX_SIZE = 200    # Maximum allowed
```

---

## 📝 Complete Example

```python
#!/usr/bin/env python3
from PySide6.QtWidgets import QApplication
from PySide6.QtCore import QTimer
from main_window import DesktopAssistantWindow
from system.dialog_manager import DialogManager
from utils.asset_generator import generate_all_placeholder_sprites

# Setup
app = QApplication([])
window = DesktopAssistantWindow()

# Load sprites
generate_all_placeholder_sprites()
from utils.asset_generator import get_sprite_config
sprite_config = get_sprite_config()
window.load_character_sprites(sprite_config)

# Show window
window.show()

# Create dialog manager
manager = DialogManager(window)

# Schedule events
def show_demo():
    # Show greeting
    manager.show_character_response("Hello! Welcome back!")
    
    # Happy reaction after 1 second
    QTimer.singleShot(1000, manager.character_react_happy)
    
    # Conversation after 2 seconds
    def start_conversation():
        turns = [
            {'speaker': 'user', 'text': 'How are you?'},
            {'speaker': 'character', 'text': 'I\'m doing great!'},
        ]
        manager.show_multi_turn_dialog(turns)
    
    QTimer.singleShot(2000, start_conversation)
    
    # Change size after 6 seconds
    def change_size():
        window.character_widget.set_character_size(130)
    
    QTimer.singleShot(6000, change_size)

QTimer.singleShot(500, show_demo)

# Run
app.exec()
```

---

## 🔧 API Reference

### window.show_character_dialog()
```python
window.show_character_dialog(
    text="Hello!",           # String to display
    duration=3000            # Milliseconds (0 = no auto-close)
)
```

### window.show_user_dialog()
```python
window.show_user_dialog(
    text="Hi there!",        # String to display
    duration=2000            # Milliseconds
)
```

### manager.show_multi_turn_dialog()
```python
manager.show_multi_turn_dialog([
    {
        'speaker': 'character|user',
        'text': 'Message text',
        'duration': 3000  # Optional
    },
    # ... more turns
])
```

### widget.set_character_size()
```python
widget.set_character_size(percent)  # 50-200
widget.increase_size(amount)        # Default: 5
widget.decrease_size(amount)        # Default: 5
widget.get_character_size()         # Returns current %
```

---

## 📚 Files Created/Modified

### New Files
- `character/bubble_dialog.py` - Speech bubble widget
- `system/dialog_manager.py` - Dialog management helper
- `FEATURES.md` - Full features documentation

### Modified Files
- `config/config.py` - Added character size and dialog settings
- `character/character_widget.py` - Added size control and mouse wheel
- `main_window.py` - Added dialog integration and keyboard shortcuts
- `examples.py` - Added dialog examples
- `system/__init__.py` - Exported DialogManager

---

## 🎯 Next Steps

1. **Try the examples**: `python examples.py --example dialog`
2. **Integrate with AI**: Use `show_character_dialog()` to display AI responses
3. **Add more reactions**: Check `DialogManager` for more animation options
4. **Customize colors**: Modify `BubbleDialog.set_colors()` for custom look
5. **Create conversations**: Build conversation flows with `show_multi_turn_dialog()`

---

## ❓ FAQ

**Q: How do I make the dialog stay longer?**
A: Use `duration=0` for indefinite, or increase the duration value (in milliseconds)

**Q: Can I change bubble colors?**
A: Yes! Call `bubble_dialog.set_colors()` or use `set_character_colors("user"/"assistant")`

**Q: Character size keeps resetting?**
A: Check that `CHARACTER_MIN_SIZE` and `CHARACTER_MAX_SIZE` allow your size value

**Q: How do I integrate with text-to-speech?**
A: Call `show_character_dialog()` right after TTS starts, it will auto-close at the right time
