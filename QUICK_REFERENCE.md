# QUICK REFERENCE - Desktop Assistant New Features

## 🚀 Quick Start

### 1. Run the Application
```bash
python main.py
```

### 2. Open Chat Panel
Press **Hotkey: B**

### 3. Try a Command
```
"buka chatgpt dan tanyakan tentang dijkstra algorithm"
```

---

## 📋 Command Examples

### Microsoft Word
```
✓ "buatkan saya resume tentang dijkstra algorithm di word"
✓ "buka word dan ketik resume saya"
✓ "buat resume di word tentang machine learning"
✓ "word, buatkan resume untuk aplikasi pekerjaan"
```

### ChatGPT (Tanya Pertanyaan)
```
✓ "buka chatgpt dan jelaskan dijkstra algorithm"
✓ "chatgpt, tanyakan tentang machine learning"
✓ "buka chatgpt dan tanya cara membuat resume"
✓ "chatgpt explain python generators with examples"
```

### YouTube (Video Search)
```
✓ "cari tutorial python di youtube"
✓ "youtube search tutorial animasi 3d"
✓ "buka youtube dan cari tutorial unity game development"
✓ "youtube, find beginner react tutorial"
```

### Google Search
```
✓ "buka google dan cari django tutorial"
✓ "google search best practices clean code"
✓ "cari cara setup nodejs di google"
✓ "google, find pytorch documentation"
```

### Wikipedia
```
✓ "buka wikipedia dan cari dijkstra algorithm"
✓ "wikipedia search machine learning"
✓ "cari informasi tentang neural networks di wikipedia"
```

### Stack Overflow
```
✓ "stackoverflow, cari python lambda error"
✓ "buka stack overflow dan cari javascript async"
✓ "stackoverflow search react hooks"
```

---

## 🎯 Feature Matrix

| Fitur | Sebelumnya | Sekarang |
|-------|-----------|---------|
| **Buka Word** | Manual Backstage | ✓ Automatic |
| **Ketik di Word** | Manual click | ✓ Automatic |
| **Buka ChatGPT** | ✗ Tidak bisa | ✓ Otomatis |
| **Tanya ChatGPT** | ✗ Tidak bisa | ✓ Otomatis ketik |
| **YouTube Search** | ✗ Tidak bisa | ✓ Otomatis |
| **Google Search** | ✗ Tidak bisa | ✓ Otomatis |
| **Wikipedia Search** | ✗ Tidak bisa | ✓ Otomatis |
| **Stack Overflow** | ✗ Tidak bisa | ✓ Otomatis |

---

## 🌐 Supported Websites

### Search Engines
- Google ✓
- Bing ✓

### AI/Coding
- **ChatGPT** ✓
- GitHub ✓
- Stack Overflow ✓

### Video/Social
- **YouTube** ✓
- Reddit ✓
- Twitter ✓
- Instagram ✓
- Facebook ✓

### Email
- Gmail ✓
- Outlook ✓

### Reference
- **Wikipedia** ✓

### E-Commerce
- Amazon ✓
- eBay ✓

### Professional
- LinkedIn ✓

---

## 💻 Code Usage Examples

### Python - Open Word
```python
from system.action_executor import ActionExecutor

executor = ActionExecutor()
executor.open_word_blank(wait_time=4)  # Opens with blank document
executor.type_text(text="My Resume Content")
```

### Python - Open ChatGPT
```python
executor.open_website(website="chatgpt")
# Opens ChatGPT in browser
```

### Python - Search on Website
```python
executor.search_on_website(
    website="youtube",
    search_query="tutorial python untuk pemula"
)
```

### Python - Google Search
```python
executor.search_on_website(
    website="google", 
    search_query="django rest framework tutorial"
)
```

### Python - Fill Resume
```python
executor.fill_resume(
    name="John Doe",
    email="john@example.com",
    phone="0812-345-6789",
    objective="Looking for Python developer role",
    experience="5 years at Startup XYZ",
    education="S1 Informatika",
    skills="Python, JavaScript, React, Django"
)
```

---

## ⚙️ Configuration

### Word Wait Time
```python
# Default: 4 seconds
open_word_blank(wait_time=4)

# Increase if Word is slow
open_word_blank(wait_time=5)
```

### Browser Wait Time
- Automatic: 2-3 seconds per action
- Page load: 3-4 seconds
- Message send: 0.5 seconds

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Word tidak membuka | Pastikan MS Word installed |
| Word langsung close | Increase wait_time |
| ChatGPT tidak login | Login dulu, baru try command |
| YouTube search blank | Tunggu 2-3 detik, page loading |
| Google search error | Check internet connection |
| Text tidak bisa diketik | Ensure application focused |

---

## 📊 Timing Reference

| Action | Default Delay |
|--------|--------------|
| Open Word | 4000ms (4 sec) |
| Open Website | 3000ms (3 sec) |
| Type Text | 500ms (0.5 sec) |
| Press Key | 100ms (0.1 sec) |
| Page Load | 2000-3000ms |
| Message Send | 500ms |

---

## 🧪 Testing

### Run Test Script
```bash
python test_new_features_2026.py
```

### Run Validation
```bash
python validate_new_features.py
```

### Manual Testing
1. `python main.py`
2. Press **B** to open chat
3. Type command example
4. Watch the magic happen! ✨

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `system/action_executor.py` | New actions implementation |
| `ai/ai_controller.py` | System prompt with examples |
| `test_new_features_2026.py` | Feature testing |
| `validate_new_features.py` | Validation suite |
| `IMPLEMENTATION_GUIDE_NEW_FEATURES.md` | Full documentation |
| `IMPROVEMENTS_SUMMARY_SESSION_6.md` | Summary & usage |

---

## 🎓 Learning Resources

### How It Works:
1. User types command in chat
2. AI analyzes command
3. AI returns JSON with actions
4. ActionExecutor executes actions
5. Browser/Word receives commands
6. Magic happens! 🪄

### Action Flow:
```
User Input 
  ↓
AI Controller (Gemini/OpenAI/Ollama)
  ↓
JSON Parser
  ↓
ActionExecutor
  ↓
PyAutoGUI (Mouse/Keyboard)
  ↓
Application (Word/Browser)
  ↓
Result shown to user
```

---

## ✨ Key Features

✓ **Smart Backstage Handling** - Word opens ready to type
✓ **Multi-Website Support** - ChatGPT, Google, YouTube, etc
✓ **Automatic Navigation** - No manual clicking needed
✓ **Smart Timing** - Proper delays between actions
✓ **Error Recovery** - Fallback options if primary fails
✓ **AI-Powered** - Understands natural language commands
✓ **Fully Integrated** - Works with existing chat system

---

## 🎯 Common Use Cases

### Use Case 1: Quick Resume Creation
```
"buatkan resume saya di word tentang software engineering"
↓
Resume auto-created in Word with formatting
```

### Use Case 2: Research & Learning
```
"cari tutorial python di youtube"
↓
YouTube opens with search results
```

### Use Case 3: Get Expert Answers
```
"buka chatgpt dan jelaskan algorithm dijkstra dengan contoh"
↓
ChatGPT explains with code examples
```

### Use Case 4: Quick Information
```
"wikipedia, cari tentang machine learning"
↓
Wikipedia article opens automatically
```

### Use Case 5: Problem Solving
```
"stackoverflow, cari error module not found"
↓
Stack Overflow search results displayed
```

---

## 🚀 Next Commands to Try

1. **Start Simple:**
   ```
   "buka google"
   ```

2. **Try Website:**
   ```
   "buka youtube"
   ```

3. **Search Something:**
   ```
   "cari tutorial python di youtube"
   ```

4. **Use ChatGPT:**
   ```
   "buka chatgpt dan tanyakan hello"
   ```

5. **Complex Task:**
   ```
   "buatkan resume saya di word tentang machine learning engineer"
   ```

---

## 📞 Support

For issues or questions:
1. Check `IMPLEMENTATION_GUIDE_NEW_FEATURES.md`
2. Run `validate_new_features.py` to verify
3. Check `test_new_features_2026.py` for examples
4. Review logs in console output

---

**Last Updated:** April 29, 2026  
**Status:** ✓ Production Ready  
**Version:** 2.0

Happy Automating! 🎉
