# 🎨 Chat Design & 🌍 Gravity System - Complete Guide

## Part 1: Chat Panel Themes & Design Improvements

### Available Themes 🎨

Desktop Assistant sekarang dilengkapi dengan **5 built-in color themes**:

#### 1. **Modern Green** (Default)
```
Primary: #4CAF50 (Green)
Ideal for: Natural, fresh look
Best for: Day use
```

#### 2. **Dark Blue**
```
Primary: #1E88E5 (Blue)
Background: Dark (Dark mode friendly)
Ideal for: Night use, less eye strain
Best for: Long chatting sessions
```

#### 3. **Light Purple**
```
Primary: #7C4DFF (Purple)
Ideal for: Creative, artistic vibe
Best for: Personalized experience
```

#### 4. **Vibrant**
```
Primary: #FF6B6B (Red/Pink)
Ideal for: Bold, energetic look
Best for: Dynamic interaction
```

#### 5. **Ocean**
```
Primary: #00BCD4 (Cyan)
Ideal for: Calm, peaceful atmosphere
Best for: Relaxing sessions
```

### How to Change Theme 🎯

**Option 1: From Chat Panel**
1. Buka chat panel (Press B)
2. Lihat dropdown "Theme:" di bagian atas
3. Pilih theme yang diinginkan
4. Chat colors langsung berubah

**Option 2: From Config**
```python
# config/config.py
CHAT_THEME = "modern_green"  # Change ke theme lain
```

### Chat Design Features ✨

- 🎨 **Real-time theme switching** - Ubah theme tanpa restart
- 📱 **Modern UI** - Clean, minimalist design
- 🔄 **Auto-render** - Chat history re-rendered saat theme berubah
- 🎯 **Color-coded messages** - User messages vs Assistant messages
- 📜 **Auto-scroll** - Chat otomatis scroll ke message terbaru
- ⌨️ **Keyboard support** - Enter untuk send message

### Custom Colors (Advanced) 🔧

Tambah custom theme di `config/config.py`:

```python
CHAT_THEMES = {
    "my_custom_theme": {
        "primary_color": "#YOUR_COLOR",
        "secondary_color": "#YOUR_COLOR",
        "background": "rgba(R, G, B, 0.95)",
        "text_color": "#YOUR_COLOR",
        "user_color": "#YOUR_COLOR",
        "assistant_color": "#YOUR_COLOR",
        "border_color": "#YOUR_COLOR",
        "input_bg": "#YOUR_COLOR",
        "panel_bg": "#YOUR_COLOR"
    }
}

# Then set it as active
CHAT_THEME = "my_custom_theme"
```

---

## Part 2: Gravity System 🌍

### Apa itu Gravity? 

Character sekarang memiliki **physics system** yang membuat dia jatuh ke bawah seperti dunia nyata!

**Fitur**:
- ✅ Character jatuh ke ground level saat di-drag ke atas
- ✅ Character tetap bebas bergerak kiri/kanan
- ✅ Character bisa naik dengan W key (melawan gravity)
- ✅ Smooth fall animation dengan acceleration
- ✅ Bisa disable jika tidak diinginkan

### Gravity Configuration ⚙️

Di `config/config.py`:

```python
# Physics Settings - Gravity System
GRAVITY_ENABLED = True                # On/Off gravity
GRAVITY_ACCELERATION = 0.5            # Kecepatan jatuh (0.5 pixels/frame²)
MAX_FALL_SPEED = 15                   # Kecepatan maksimal jatuh
GROUND_LEVEL_OFFSET = 100             # Jarak dari bawah desktop (pixel)
```

### Cara Kerja Gravity 🎯

```
1. Character di posisi atas (Y = 100)
2. Gravity system deteksi: 100 < ground_level (500)
3. Apply gravity: velocity += 0.5 pixels/frame
4. Character Y += velocity
5. Repeat sampai Y >= ground_level
6. Character berhenti di ground level
```

### Default Ground Level

```
Desktop Height = 1080 pixel
GROUND_LEVEL_OFFSET = 100 pixel
Ground Level = 1080 - 100 = 980 pixel

Character akan berhenti di Y = 980 (100 pixel dari bawah)
```

### Menggunakan Gravity System 🕹️

#### **Saat Drag Character**:
```
1. Klik + drag character ke atas
2. Lepas mouse
3. Character jatuh ke ground level
4. Smooth animation dengan acceleration
```

#### **Saat Pakai Hotkey**:
```
W Key (3x) → Character naik 60 pixel
(lepas) → Character jatuh dengan gravity
```

#### **Automatic AI Movement**:
```
AI command: "Gerakkan character ke atas"
→ Character naik
→ Lepas command
→ Character jatuh
→ Settle di ground level
```

### Disable Gravity ⚡

Jika ingin karakter tidak jatuh:

```python
# config/config.py
GRAVITY_ENABLED = False
```

Sekarang character bisa bergerak ke mana saja tanpa jatuh.

### Physics Constants Explained 🔬

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `GRAVITY_ACCELERATION` | 0.5 | Berapa banyak velocity bertambah per frame |
| `MAX_FALL_SPEED` | 15 | Kecepatan jatuh maksimum (terminal velocity) |
| `GROUND_LEVEL_OFFSET` | 100 | Jarak dari bawah desktop |

**Tips Tuning**:
- Increase `GRAVITY_ACCELERATION` = Lebih cepat jatuh
- Increase `MAX_FALL_SPEED` = Jatuh lebih cepat (tapi bisa 1-2 frame saja)
- Decrease `GROUND_LEVEL_OFFSET` = Ground lebih rendah (character bisa lebih dekat ke bawah)

---

## Part 3: Ollama Integration & AI Setup 🤖

### Apa itu Ollama?

**Ollama** adalah local AI model runner yang memungkinkan:
- ✅ Jalankan AI models locally (tidak perlu internet cloud)
- ✅ Private: Semua data tetap di computer Anda
- ✅ Gratis dan open source
- ✅ Support berbagai models (Mistral, Llama, dll)

### Setup Ollama

#### **Step 1: Download & Install**

Kunjungi: https://ollama.ai

Download sesuai OS Anda:
- **Windows**: Download `.exe`
- **Mac**: Download `.dmg`
- **Linux**: Gunakan install script

#### **Step 2: Install Model**

Buka terminal/command prompt:

```bash
# Download Mistral model (recommended, ~7GB)
ollama pull mistral

# Or download Llama 2 (recommended, ~4GB)
ollama pull llama2

# Or download Neural Chat (smaller, ~3GB)
ollama pull neural-chat
```

#### **Step 3: Verify Installation**

```bash
# Start Ollama server
ollama serve

# Dalam terminal baru, test model
ollama run mistral
> Halo! Apa kabar?
```

Jika berhasil, Ollama berjalan di `http://localhost:11434`

### Configure Desktop Assistant untuk Ollama 🔧

Edit `config/config.py`:

```python
# AI Settings
AI_ENABLED = True
AI_TYPE = "local"              # ← Menggunakan Ollama (local)
OLLAMA_URL = "http://localhost:11434"  # Default Ollama URL
OLLAMA_MODEL = "mistral"       # Model yang digunakan

# Atau ganti dengan model lain
# OLLAMA_MODEL = "llama2"
# OLLAMA_MODEL = "neural-chat"
```

### Verify Ollama Connection ✅

Jalankan test:

```bash
python test_ollama.py
```

Output yang sukses:
```
✓ Ollama server running at http://localhost:11434
✓ Model available: mistral
✓ Connection successful
```

### Model Recommendations 🎯

| Model | Size | Speed | Quality | Recommended |
|-------|------|-------|---------|-------------|
| Mistral | 7GB | Fast | Good | ⭐⭐⭐ Best |
| Llama 2 | 4GB | Medium | Good | ⭐⭐ Good |
| Neural Chat | 3GB | Fastest | Fair | ⭐⭐ Fast |
| Dolphin | 8GB | Medium | Excellent | ⭐⭐⭐ Smartest |

**Recommendation untuk Desktop Assistant**:
- **First time**: Download `mistral` (balanced)
- **Need speed**: Download `neural-chat` (fastest)
- **Need quality**: Download `dolphin` (smartest)

### Troubleshooting Ollama ⚠️

**Problem**: "Connection refused" 
```
Solution:
1. Pastikan Ollama running (ollama serve di terminal lain)
2. Check URL: http://localhost:11434
3. Restart Ollama
```

**Problem**: Model tidak found
```
Solution:
1. Download model terlebih dahulu: ollama pull mistral
2. Check: ollama list (lihat installed models)
3. Update config dengan model name yang benar
```

**Problem**: Respons sangat lambat
```
Solution:
1. Model sedang download/loading (tunggu)
2. Pakai model yang lebih kecil (neural-chat)
3. Increase timeout di config
```

### Using AI with Desktop Assistant 🤖

#### **Chat dengan AI**:
```
1. Press B → Buka chat panel
2. Type: "Buka VSCode"
3. AI process dengan Ollama
4. Response: "Membuka VSCode..."
5. Character execute action
```

#### **Command Examples**:
```
"Buka VSCode dan buat folder project"
"Cari di Google tentang Python"
"Buat file index.html"
"Buka Chrome dan buka Google"
```

#### **Setting Timeout** (jika AI lambat):

```python
# system/action_executor.py
# Nanti ada timeout setting
```

### Offline vs Online 🌐

| Mode | Pros | Cons |
|------|------|------|
| **Ollama (Offline)** | Private, Fast, No internet needed | Perlu setup, Smaller model |
| **OpenAI (Online)** | Smarter, Better quality | Perlu internet, Biaya, Less private |

**Recommendation**: Gunakan **Ollama** untuk:
- ✅ Privacy (data tidak dikirim ke cloud)
- ✅ Offline capability
- ✅ No API costs
- ✅ Local processing

### Advanced Ollama Configuration 🔧

Edit Ollama settings untuk optimize performance:

```bash
# Environment variables
export OLLAMA_NUM_THREAD=8        # Increase CPU threads
export OLLAMA_KEEP_ALIVE=5m       # Keep model in memory
```

---

## Summary & Checklist ✅

### Chat Design:
- ✅ 5 built-in themes
- ✅ Real-time theme switching
- ✅ Custom color support
- ✅ Modern UI design

### Gravity System:
- ✅ Physics-based falling
- ✅ Configurable ground level
- ✅ Can be disabled
- ✅ Smooth animation

### Ollama AI:
- ✅ Local AI model support
- ✅ Private & offline
- ✅ Multiple model options
- ✅ Easy configuration

---

## Next Steps 🚀

1. **Chat Design**: Change theme dari dropdown
2. **Gravity**: Drag character ke atas dan lihat jatuh
3. **Ollama**: Setup & download model, test chat
4. **Combine**: Use all together untuk amazing experience!

Enjoy! 🎉
