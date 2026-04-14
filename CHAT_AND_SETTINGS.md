# Chat & Settings - Complete Guide

## 🎯 New Features

### 1️⃣ **Initial Settings Panel**
Shows on first run with:
- Character size slider (30% - 200%)
- Clean UI for quick configuration
- Apply settings before starting app

### 2️⃣ **Chat Panel** 
Interactive chat with character:
- Full conversation history
- Real-time message display
- AI-powered responses
- Toggle with **B key** for clean interface

### 3️⃣ **Enhanced AI Dialog**
More variations:
- 8+ thinking messages
- 8+ processing messages
- Friendly greetings
- Confused response options
- Helpful responses
- Positive affirmations

### 4️⃣ **Smaller Default Size**
- Default: 60% (was 100%)
- Minimum: 30% (was 50%)
- Better on-screen proportions

---

## 🚀 Running the Application

```bash
# First run - shows settings panel
python main.py
```

**First Time Setup:**
1. Adjust character size with slider
2. Click "Start Application ✓"
3. Application begins with your settings

---

## ⌨️ Keyboard Controls

| Key | Action |
|-----|--------|
| `B` | **Toggle chat panel** (NEW!) |
| `+` | Increase character size |
| `-` | Decrease character size |
| `🖱️` | Mouse wheel to resize |
| `D` | Test character dialog |
| `U` | Test user dialog |
| `ESC` | Exit |

---

## 💬 Using Chat Panel

### Open Chat Panel
**Press B** → Panel appears on right side of screen

### Send Message
1. Type in text input field
2. Press **Enter** or click **Send** button
3. Message appears in chat history
4. Character responds automatically

### Features
- **Thinking indicator** - Shows "Thinking..." while AI processes
- **Conversation history** - See all past messages
- **Natural responses** - Uses 30+ variation messages
- **Quick close** - Click ✕ button or press B again

### Example Chat

```
You: Como estás?
[Assistant thinking...]
🤖 Assistant: I'm doing great, thanks for asking! How about you? 😊

You: Can you help me?
[Assistant thinking...]
🤖 Assistant: Of course! That's what I'm here for! What do you need? 💪
```

---

## 🎨 Settings Panel Details

### Character Size Slider
- **Drag left** → Character shrinks
- **Drag right** → Character grows
- **Show percentage** → Real-time size display
- **Preview info** → Small | Normal | Large reference

### Layout
- Clean, modern design
- Green accent colors
- Rounded corners
- Clear instructions

---

## 📝 Chat Panel Interface

### Chat Display Area
- Scrollable message history
- Color-coded messages:
  - 👤 You: Blue text
  - 🤖 Assistant: Green text
- Automatic scroll to latest

### Input Section
- Input field with placeholder
- Send button (green)
- Enter key support
- Auto-focus after send

### Header
- Title: "💬 Chat with Assistant"
- Close button (red X)
- Minimize without closing

---

## 🤖 AI Response Variations

### Thinking Messages (Natural delay)
```python
[
    "Hmm, let me think...",
    "One moment...",
    "Let me consider that...",
    "Interesting question...",
    "Thinking about it...",
    "Analyzing your request...",
]
```

### Helpful Responses
```python
[
    "Tentu! Aku akan membantu kamu 😊",
    "Of course! Itu pekerjaan ku!",
    "Boleh banget! Mari kita coba bersama...",
    "Dengan senang hati! Mari mulai...",
]
```

### Positive Affirmations
```python
[
    "That's awesome! 🎉",
    "Great! I love that! 👍",
    "Excellent choice!",
    "Perfect! You're doing great!",
]
```

---

## 🔧 API Reference

### Main Window Methods

```python
# Chat panel control
window.chat_panel.toggle_panel()     # Toggle visibility
window.chat_panel.show_panel()       # Show
window.chat_panel.hide_panel()       # Hide

# Add messages to chat
window.chat_panel.add_assistant_response(text)
window.chat_panel.add_thinking()
window.chat_panel.clear_messages()
```

### Handling Chat Messages

```python
def _on_chat_message(self, message: str):
    """Automatically called when user sends message"""
    # Show thinking
    self.chat_panel.add_thinking()
    
    # Get AI response
    result = self.ai_controller.process_command(message)
    response = result.get('response', '...')
    
    # Add to chat after delay
    QTimer.singleShot(1500, lambda: 
        self.chat_panel.add_assistant_response(response)
    )
```

### Settings Panel

```python
from ui.settings_panel import SettingsPanel

# Show settings
panel = SettingsPanel()
if panel.exec() == SettingsPanel.Accepted:
    settings = panel.get_settings()
    size = settings['character_size']  # 30-200
```

---

## 📋 Configuration

### Character Size Defaults
**config/config.py:**
```python
CHARACTER_SIZE = 60          # Default: 60% (reduced from 100)
CHARACTER_MIN_SIZE = 30      # Min: 30% (reduced from 50)
CHARACTER_MAX_SIZE = 200     # Max: 200%
```

### Dialog Duration
```python
DIALOG_BOX_DURATION = 3000   # 3 seconds
```

---

## 🎯 Workflow Example

```python
from main_window import DesktopAssistantWindow
from ui.settings_panel import SettingsPanel

# 1. Show settings
settings_panel = SettingsPanel()
settings_panel.exec()

# 2. Create window
window = DesktopAssistantWindow()
window.character_widget.set_character_size(settings['character_size'])
window.show()

# 3. User presses B to open chat
# 4. Chat panel appears
# 5. User types message
# 6. AI responds automatically
# 7. Both displayed in chat history
```

---

## 💡 Tips & Tricks

### Quick Size Adjustment
- Use mouse wheel while hovering character for quick resize
- Or use `+` / `-` keys

### Chat Panel Positioning
- Panel default: Right side, near top
- Drag to reposition
- Position saved during session

### Long Conversations
- Chat history scrolls automatically
- Can scroll back to read past messages
- Clear with `chat_panel.clear_messages()`

### AI Response Customization
- Modify `thinking_messages` list in DialogManager
- Add custom responses
- Import and extend DialogManager

---

## 🐛 Troubleshooting

**Q: Settings panel doesn't show?**
A: Check that `SettingsPanel` is properly imported in main.py

**Q: Chat panel position wrong?**
A: Chat positions itself on screen right. Can be dragged to reposition.

**Q: AI responses seem repetitive?**
A: Responses vary from 30+ messages. Try different questions.

**Q: Chat messages not appearing?**
A: Ensure `_on_chat_message` is connected to signal in `__init__`

**Q: Think delay too long?**
A: Modify in `main_window.py` `_on_chat_message()` method:
```python
QTimer.singleShot(1500, ...)  # Change 1500 to desired ms
```

---

## 📁 New Files

- `ui/settings_panel.py` - Initial settings dialog
- `ui/chat_panel.py` - Chat interface widget
- `ui/__init__.py` - UI package exports

## Modified Files

- `config/config.py` - Reduced default sizes
- `main_window.py` - Chat panel integration + B key
- `main.py` - Settings panel on startup
- `system/dialog_manager.py` - Added 30+ variation messages

---

## 🎬 Demo

```bash
# Run with everything
python main.py

# Full demo with chat
python examples.py --example ai_integration
```

Then:
1. Adjust character size in settings
2. Click "Start Application"
3. Press **B** to open chat
4. Type a message and press Enter
5. Watch character respond! 🤖

---

**Enjoy your enhanced desktop assistant! 🚀**
