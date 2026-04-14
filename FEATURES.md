# Desktop Assistant - Features Guide

## 🎮 Character Control

### Moving the Character
- **Drag with Left Mouse**: Click and drag the character to move it freely around the desktop
- The window automatically stays within screen bounds
- Animation continues smoothly while dragging

### Resizing the Character

#### Keyboard Shortcuts
- **`+` (Plus Key)**: Increase character size by 5%
- **`-` (Minus Key)**: Decrease character size by 5%
- **`Scroll Wheel`**: Scroll up to increase size, scroll down to decrease size

#### Size Range
- Minimum: 50% (half size)
- Maximum: 200% (double size)
- Default: 100% (normal size)

#### Configuration
Edit `config/config.py` to set default size:
```python
CHARACTER_SIZE = 100  # Default size percentage
CHARACTER_MIN_SIZE = 50
CHARACTER_MAX_SIZE = 200
```

---

## 💬 Dialog System

### Speech Bubbles
Character can display speech bubbles for dialogue with two types:
- **Character Dialog**: Message from the assistant (green bubble)
- **User Dialog**: Message from the user (blue bubble)

### Using Dialog Programmatically

#### Show Character Dialog
```python
window.show_character_dialog("Hello! I'm your assistant!")
# Or with custom duration (4 seconds)
window.show_character_dialog("This will stay for 4 seconds", duration=4000)
```

#### Show User Dialog
```python
window.show_user_dialog("What can I do for you?", duration=3000)
```

### Dialog Features
- **Auto-close**: Bubbles automatically disappear after duration (default: 3000ms)
- **Double-click**: Click the bubble twice to close it manually
- **Auto-position**: Always appears centered above the character
- **Customizable colors**: Different colors for different speaker types

### Configuration
Edit `config/config.py` to change dialog settings:
```python
DIALOG_BOX_DURATION = 3000  # milliseconds (default duration)
DIALOG_BOX_MAX_WIDTH = 300  # pixels (max width of bubble)
```

---

## ⌨️ Keyboard Shortcuts

### Main Controls
| Key | Action |
|-----|--------|
| `ESC` | Close application |
| `+` | Increase character size |
| `-` | Decrease character size |

### Testing Shortcuts
| Key | Action |
|-----|--------|
| `D` | Show test character dialog |
| `U` | Show test user dialog |

---

## 🔧 Customization

### Character Appearance
Modify in `config/config.py`:
- `CHARACTER_SIZE`: Default size when app starts (50-200%)
- `ANIMATION_FRAME_INTERVAL`: Speed of animation (milliseconds)
- `ANIMATION_SCALE`: Global scale factor for sprites

### Dialog Appearance
Customize in `character/bubble_dialog.py`:
- `bubble_color`: Background color of speech bubble
- `text_color`: Text color
- `border_color`: Border color
- `corner_radius`: Roundness of corners (pixels)
- `pointer_height`: Height of pointer triangle (pixels)

### Behavior
Configure in `config/config.py`:
- `IDLE_DURATION_MIN/MAX`: How long character stays idle
- `WALK_DURATION_MIN/MAX`: How long character walks
- `WALK_SPEED`: Movement speed in pixels per frame

---

## 💡 Code Examples

### Integrate Dialog with AI Response
```python
# In main_window.py or your handler
def on_ai_response(response_text):
    window.show_character_dialog(response_text, duration=5000)

# Example
on_ai_response("I understood your command!")
```

### Change Character Size Based on Emotion
```python
def react_happy():
    # Bounce character by changing size quickly
    window.character_widget.set_character_size(105)
    QTimer.singleShot(100, lambda: window.character_widget.set_character_size(100))

def react_sad():
    window.character_widget.set_character_size(90)
```

### Show Multi-line Dialog
```python
multi_line_text = "Hello there!\nHow are you doing today?"
window.show_character_dialog(multi_line_text, duration=4000)
```

---

## 🐛 Troubleshooting

### Dialog not appearing?
1. Check if window is visible: `window.isVisible()`
2. Verify window position is correct
3. Check logger output for any errors

### Character size not changing?
1. Size is clamped between `CHARACTER_MIN_SIZE` and `CHARACTER_MAX_SIZE`
2. Check `character_widget.get_character_size()` to debug
3. Verify config values are correct

### Dialog disappearing too quickly?
- Increase `DIALOG_BOX_DURATION` in config or pass custom duration to method
- Use `duration=0` for indefinite display (manual close only)

---

## 📝 API Reference

### CharacterWidget Methods
```python
# Size control
widget.set_character_size(percent)  # Set size (50-200%)
widget.increase_size(amount)        # Increase by amount
widget.decrease_size(amount)        # Decrease by amount
widget.get_character_size()         # Get current size percentage

# Animation
widget.set_animation(name)          # Switch animation
```

### DesktopAssistantWindow Methods
```python
# Dialog display
window.show_character_dialog(text, duration)  # Show assistant message
window.show_user_dialog(text, duration)       # Show user message

# Character control
window.character_widget.set_character_size(percent)
```

### BubbleDialog Methods
```python
dialog.show_text(text, duration, x, y)           # Show bubble at position
dialog.hide_bubble()                              # Hide bubble
dialog.set_colors(bubble_color, text_color, border_color)
dialog.set_character_colors("assistant" or "user")  # Use preset colors
```
