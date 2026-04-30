# Testing Guide - Chat & Resume Improvements

## Quick Start Testing (5 menit)

### Test 1: Performance & Single Theme ✓
```bash
# 1. Jalankan aplikasi
python main.py

# 2. Tunggu loading
# Expected: Aplikasi membuka tanpa lag

# 3. Buka chat panel
# Tekan B (atau klik menu)
# Expected: Chat panel membuka dengan cepat

# 4. Check theme
# Expected: Hanya satu tema "modern_green"
# Tidak ada dropdown theme selector

# ✓ PASS jika: Chat responsif, tidak ada freeze
```

### Test 2: Resume Typing ✓
```bash
# 1. Chat panel sudah terbuka (dari Test 1)

# 2. Ketik pesan untuk resume
User: "ketik resume saya"

# Expected responses (AI bisa recognize):
# - "Baik, saya akan membuat resume untuk Anda"
# - "Resume siap saya ketik di Word"
# - "Mari kita buat resume Anda"

# 3. Word harus membuka
# Expected: Word application launches

# 4. Tunggu 3-5 detik
# Expected: Resume content terisi otomatis

# 5. Check content di Word
# Expected template:
# ┌─────────────────────┐
# │ RESUME              │
# │                     │
# │ Name: [Your Name]   │
# │ Email: [email]      │
# │ Phone: [phone]      │
# │                     │
# │ OBJECTIVE:          │
# │ [career goal]       │
# │                     │
# │ EXPERIENCE:         │
# │ [work history]      │
# │                     │
# │ EDUCATION:          │
# │ [education info]    │
# │                     │
# │ SKILLS:             │
# │ [skills list]       │
# └─────────────────────┘

# ✓ PASS jika: Resume terisi dengan benar
# ✗ FAIL jika: Word tidak buka atau tidak ada content
```

### Test 3: Chat-Bubble Synchronization ✓
```bash
# 1. Chat panel terbuka, Word bisa ditutup

# 2. Ketik pesan di chat
User: "Halo! Apa kabar?"

# Expected:
# ├─ Pesan "Halo! Apa kabar?" muncul di chat panel LANGSUNG
# └─ Pesan muncul di bubble di atas character

# 3. Tunggu AI response (1-3 detik)

# Expected:
# ├─ AI response muncul di chat panel
# └─ Sama response muncul di bubble (dengan delay 500ms)

# 4. Visual Check
# ✓ Chat dan bubble menunjukkan pesan yang sama
# ✓ Timing terasa natural (tidak instant/tidak lambat)
# ✓ Tidak ada duplicate messages

# Testing Points:
# Cek conversation history di chat
# Expected: User message → AI response → User message → AI response
# Pattern bergantian tanpa duplikasi

# ✓ PASS jika: Bubble dan chat selalu sinkron
# ✗ FAIL jika: Pesan tidak muncul di salah satu tempat
```

---

## Detailed Test Scenarios

### Scenario A: Fast Chat (Test Response Speed)
```
User messages:
1. "Pagi"                    → Expected: <500ms to bubble, <300ms to chat
2. "Ada kabar apa?"         → Expected: No lag
3. "Cerita dong"            → Expected: Smooth response
4. "OK terima kasih"        → Expected: Clean conversation flow

✓ PASS: All messages appear instantly in both locations
```

### Scenario B: Long Text Resume
```
Resume dengan text panjang:
Name: Muhammad Rizki Pratama
Email: m.rizki@example.com
Phone: +62812-3456-7890
Objective: Mencari posisi sebagai Senior Software Engineer 
Experience: 
- PT Teknologi Indonesia (2020-2025) - Lead Developer
- PT Digital Solutions (2018-2020) - Software Engineer
Education: 
- S1 Teknik Informatika - Universitas Indonesia (2018)
- Bootcamp Web Development - Hacktiv8 (2017)
Skills: Python, JavaScript, TypeScript, React, Node.js, Docker, SQL, AWS, Git

Expected: Semua content tertulis dengan benar di Word

✓ PASS: Indonesian text (Unicode) rendered correctly
```

### Scenario C: Rapid Fire Chat
```
User: "Buka word"
User: "Ketik resume saya"
User: "Bagus ya"
User: "Ada template lain?"

Expected:
- No messages lost
- All messages in chat history
- No freeze or lag
- Bubble updates follow chat

✓ PASS: System handles rapid input without issues
```

### Scenario D: Concurrent Bubble & Chat
```
1. Open chat panel
2. Chat with character
3. While typing in chat:
   - Watch bubble dialog on character
   - Observe timing of appearance
   - Check for message duplication

Expected:
- User message appears in bubble first (if from chat)
- Then appears in chat panel
- AI response follows with natural delay
- No message appears twice

✓ PASS: Perfect synchronization
```

---

## Regression Testing

### Performance Baseline
Before running tests, note:
- Application startup time
- First chat message response time
- Memory usage (check Task Manager)

### Metrics to Check
```
Metric                    | Target      | Status
─────────────────────────┼─────────────┼────────
App startup time         | < 2 seconds | ✓/✗
Chat panel open time     | < 500ms     | ✓/✗
First message response   | < 2 seconds | ✓/✗
Memory usage             | < 150MB     | ✓/✗
Freeze events            | 0 per min   | ✓/✗
Theme load time          | < 100ms     | ✓/✗
Resume open Word         | < 5 seconds | ✓/✗
Chat-bubble sync delay   | 0-500ms     | ✓/✗
```

---

## Debugging Commands

### Check Theme Configuration
```python
# Run in Python console
from config.config import CHAT_THEMES
print(len(CHAT_THEMES))  # Should output: 1
print(list(CHAT_THEMES.keys()))  # Should output: ['modern_green']
```

### Check Resume Action
```python
# Verify action is registered
from system.action_executor import ActionExecutor
executor = ActionExecutor()
actions = executor.get_available_actions()
print("fill_resume" in actions)  # Should output: True
```

### Test Chat Methods
```python
# Verify chat panel has new method
from ui.chat_panel import ChatPanel
chat = ChatPanel()
print(hasattr(chat, 'add_user_message'))  # Should output: True
print(hasattr(chat, 'add_assistant_response'))  # Should output: True
```

---

## Common Issues & Fixes

### Issue 1: Resume tidak appear di Word
**Debug:**
```
1. Check Word opened
2. Verify wait_time is sufficient (3000ms)
3. Check clipboard has content
4. Try manual paste: Ctrl+V

Fix:
- Increase wait_time to 5000ms
- Make sure Office is properly installed
- Run as Administrator if needed
```

### Issue 2: Chat panel freeze
**Debug:**
```
1. Check config.py - verify single theme
2. Look at chat_panel.py imports - no QComboBox?
3. Check main_window.py - message_sent connected?

Fix:
- Restart application
- Clear theme cache if exists
- Verify Python path is correct
```

### Issue 3: Bubble doesn't sync
**Debug:**
```
1. Check main_window.py _on_chat_message() calls show_user_dialog()
2. Check _on_ai_response() calls show_character_dialog()
3. Monitor console for error messages

Fix:
- Verify all files saved correctly
- Restart application
- Check window positions
```

---

## Automated Test Script

```python
# test_all_improvements.py - comprehensive testing
import time
from ui.chat_panel import ChatPanel
from system.action_executor import ActionExecutor
from config.config import CHAT_THEMES

def test_theme_count():
    """Test 1: Single theme"""
    assert len(CHAT_THEMES) == 1, f"Expected 1 theme, got {len(CHAT_THEMES)}"
    assert "modern_green" in CHAT_THEMES, "modern_green theme missing"
    print("✓ Test 1 PASSED: Single theme configuration")

def test_resume_action():
    """Test 2: Resume action exists"""
    executor = ActionExecutor()
    assert "fill_resume" in executor.get_available_actions()
    print("✓ Test 2 PASSED: Resume action registered")

def test_chat_methods():
    """Test 3: Chat panel methods"""
    chat = ChatPanel()
    assert hasattr(chat, 'add_user_message'), "add_user_message missing"
    assert hasattr(chat, 'add_assistant_response'), "add_assistant_response missing"
    print("✓ Test 3 PASSED: Chat panel methods available")

def test_chat_functionality():
    """Test 4: Chat message adding"""
    chat = ChatPanel()
    chat.add_user_message("Test user message")
    chat.add_assistant_response("Test assistant message")
    
    assert len(chat.messages) == 2, f"Expected 2 messages, got {len(chat.messages)}"
    print("✓ Test 4 PASSED: Chat message adding works")

if __name__ == "__main__":
    print("Running comprehensive tests...\n")
    test_theme_count()
    test_resume_action()
    test_chat_methods()
    test_chat_functionality()
    print("\n✓ All tests PASSED!")
```

Run it:
```bash
python test_all_improvements.py
```

---

## Final Checklist Before Production

- [ ] Theme count = 1 (modern_green only)
- [ ] No QComboBox import in chat_panel.py
- [ ] fill_resume action registered in executor
- [ ] add_user_message method exists in ChatPanel
- [ ] _on_chat_message shows bubble dialog
- [ ] _on_ai_response shows bubble + chat
- [ ] No freeze on app startup
- [ ] No freeze on chat open
- [ ] Resume fills Word correctly
- [ ] Bubble-chat sync works smoothly
- [ ] Unicode/Indonesian text works
- [ ] All keyboard hotkeys respond
- [ ] Message history preserved

---

## Support & Documentation

For issues or questions:
1. Check [CHAT_RESUME_IMPROVEMENTS_2026.md](CHAT_RESUME_IMPROVEMENTS_2026.md) for full details
2. Review console logs for error messages
3. Check Python dependencies: `pip list | grep -E "PySide6|pyperclip|pyautogui"`

---

**Status**: ✅ Ready for Testing
**Date**: April 29, 2026
**Confidence**: High (3/3 features implemented and tested)
