# TrapeziBuddy — Electron Boilerplate

Desktop companion interaktif untuk produktivitas.
Tech stack: Electron + HTML/CSS/JS (vanilla)

---

## Struktur Folder

```
trapezibuddy-electron/
├── package.json
├── src/
│   ├── main/
│   │   ├── main.js        ← Electron main process (window, tray, IPC)
│   │   └── preload.js     ← Secure bridge main ↔ renderer
│   └── renderer/
│       ├── pages/
│       │   └── companion.html    ← UI utama companion panel
│       ├── components/
│       │   └── companion.js      ← Logic renderer (tasks, modal, timer)
│       └── assets/
│           ├── styles/
│           │   ├── global.css    ← Reset + CSS variables
│           │   └── companion.css ← Component styles
│           └── icons/            ← Taruh sprite karakter di sini
└── assets/
    └── icon.ico                  ← App icon (untuk build)
```

---

## Setup (wajib semua anggota tim)

### 1. Install Node.js
Download LTS dari https://nodejs.org — next-next-finish.

Verifikasi:
```bash
node --version   # harus v18+
npm --version
```

### 2. Clone repo dan install dependencies
```bash
git clone <repo-url>
cd trapezibuddy-electron
npm install
```

### 3. Jalankan
```bash
npm start
```

Untuk mode development (dengan DevTools):
```bash
npm run dev
```

---

## Cara kerja arsitektur

```
┌─────────────────────────────────────────┐
│  Main Process (main.js)                 │
│  - Buat window                          │
│  - Kelola data JSON (electron-store)    │
│  - Handle IPC dari renderer             │
│  - System tray                          │
└────────────────┬────────────────────────┘
                 │ IPC (preload.js bridge)
┌────────────────▼────────────────────────┐
│  Renderer Process (companion.html/js)   │
│  - Tampilkan UI                         │
│  - Panggil window.trapezi.tasks.xxx()   │
│  - Render task list, modal, timer       │
└─────────────────────────────────────────┘
```

---

## API yang tersedia di renderer (window.trapezi)

```javascript
// Tasks
await window.trapezi.tasks.getAll()           // ambil semua tugas
await window.trapezi.tasks.add(taskData)      // tambah tugas baru
await window.trapezi.tasks.complete(taskId)   // tandai selesai
await window.trapezi.tasks.delete(taskId)     // hapus tugas

// Settings
await window.trapezi.settings.get()           // ambil settings
await window.trapezi.settings.set(data)       // simpan settings

// Window
window.trapezi.window.minimize()              // minimize window
window.trapezi.window.hide()                  // sembunyikan ke tray
```

---

## Pembagian tugas tim

| Role    | File yang dikerjakan |
|---------|---------------------|
| FE 1    | companion.html + companion.css (panel utama) |
| FE 2    | companion.js (logic, task rendering, modal) |
| BE      | main.js (IPC handlers, data storage, state engine) |
| UI/UX   | companion.css (styling, tweak visual) |
| PO      | Review semua, integration testing |

---

## Menambahkan sprite karakter

1. Taruh file sprite PNG/SVG ke `src/renderer/assets/icons/`
2. Di `companion.html`, ganti `src` pada tag `<img>` di `.avatar`:
```html
<img src="../assets/icons/penguin-happy.png" id="companion-sprite" />
```
3. Di `companion.js`, update sprite berdasarkan state:
```javascript
function updateSprite(state) {
  const sprite = document.getElementById('companion-sprite')
  const sprites = {
    happy:     '../assets/icons/penguin-happy.png',
    neutral:   '../assets/icons/penguin-neutral.png',
    worried:   '../assets/icons/penguin-worried.png',
    sad:       '../assets/icons/penguin-sad.png',
    neglected: '../assets/icons/penguin-neglected.png',
  }
  sprite.src = sprites[state] ?? sprites.neutral
}
```

---

## Build ke .exe

```bash
npm run build
```

Output ada di folder `dist/`.
