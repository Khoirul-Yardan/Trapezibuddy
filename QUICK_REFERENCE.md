# Quick Reference - Desktop Assistant 🚀

## ⌨️ Hotkeys Cheat Sheet

```
SIZE CONTROL:
  A  = Perkecil character
  D  = Perbesar character

MOVEMENT:
  W  = Gerakkan atas
  S  = Gerakkan bawah
  Q  = Gerakkan kiri
  E  = Gerakkan kanan

UI CONTROL:
  B  = Toggle chat panel
  F1 = Buka settings dialog
  ESC = Exit aplikasi

MOUSE:
  SCROLL UP   = Perbesar character
  SCROLL DOWN = Perkecil character
  DRAG LEFT CLICK = Move window
```

## 🎯 AI Commands (Chat dengan Assistant)

### Aplikasi
```
"Buka VSCode"
"Buka Chrome"
"Buka Notepad"
"Buka Kalkulator"
"Cari di Google"
```

### File Operations
```
"Buat folder project"
"Buat file index.html"
"Buka folder"
```

### Kombinasi
```
"Buka VSCode dan buat folder website"
"Buka Chrome dan cari di Google"
```

## ⚙️ Configuration (`config/config.py`)

### Drag Mode
```python
DRAG_BOUNDARY_ENABLED = False  # True untuk batasan layar
```

### Hotkeys
```python
HOTKEY_SIZE_INCREASE = 'D'
HOTKEY_SIZE_DECREASE = 'A'
HOTKEY_MOVE_UP = 'W'
HOTKEY_MOVE_DOWN = 'S'
HOTKEY_MOVE_LEFT = 'Q'
HOTKEY_MOVE_RIGHT = 'E'
HOTKEY_TOGGLE_CHAT = 'B'
HOTKEY_SHOW_SETTINGS = 'F1'
```

## 🔧 Fitur Baru

| Fitur | Status | Deskripsi |
|-------|--------|-----------|
| Free Drag Mode | ✅ | Character bisa bergerak ke seluruh desktop |
| Hotkey Controls | ✅ | A/D/W/S/Q/E untuk kontrol character |
| Settings Dialog | ✅ | F1 untuk adjust size dan lihat hotkeys |
| VSCode Integration | ✅ | Buka VSCode dari chat |
| File Operations | ✅ | Buat folder, file, dll dari chat |
| AI Movement | ✅ | Character bergerak otomatis saat AI command |

## 📝 Troubleshooting

| Masalah | Solusi |
|--------|--------|
| Hotkeys tidak berfungsi | Pastikan window focused, check `HOTKEYS_ENABLED = True` |
| Drag terbatas | Set `DRAG_BOUNDARY_ENABLED = False` di config |
| AI commands error | Ollama tidak running? Akan fallback ke local parsing |
| Character tidak bergerak | Restart app, check logs |

## 🚀 Mulai Menggunakan

1. **Jalankan aplikasi**: `python main.py`
2. **Set preferences** di settings panel awal
3. **Tekan hotkeys** untuk kontrol character
4. **Tekan B** untuk buka chat panel
5. **Ketik perintah** untuk AI assistant

## 📚 Full Documentation

Lihat `NEW_FEATURES.md` untuk dokumentasi lengkap!
