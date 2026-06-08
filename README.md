# TrapeziBuddy

Desktop productivity companion with a 2D character, task management, streak system, and focus timer — built with Electron.

![Version](https://img.shields.io/badge/version-1.0.0-blueviolet) ![Platform](https://img.shields.io/badge/platform-Windows-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Electron](https://img.shields.io/badge/electron-41-47848F)

---

## Overview

TrapeziBuddy is a Windows desktop overlay app that lives on top of your screen as an interactive 2D character companion. It helps you track tasks with deadlines, maintain a daily task-completion streak, and run focus sessions — all without leaving your workflow.

Two characters are available, each with their own visual theme:

| Character | Theme | Accent Color |
|-----------|-------|--------------|
| **Agnes Tachyon** | Warm earth tones | `#A2B29F` — coconut green |
| **GoldShip** | Lavender luxury | `#9E8EC6` — soft purple |

---

## Features

**Task Management**
- Add tasks with name, deadline date & time, category tags, and priority level
- Urgency indicators: Overdue / Urgent (< 24h) / Soon (< 72h) / Normal
- Complete tasks with a confirmation flow (type the task name to confirm)
- Active and Finished tabs; finished tasks filterable by Today / Last 3 days / This week / All

**Streak System**
- Daily streak tracked each time tasks are completed on time
- Freeze Tokens — spend a token to protect your streak from a missed deadline
- Streak Progress bottom sheet: current streak, longest streak, on-time rate, freeze token management

**Focus Session**
- Built-in 25-minute focus timer on the companion panel
- Start / stop with a single click

**Minimized Header Mode**
- Compact always-on-top bar showing streak count, task progress (X/Y), and date/time
- Quick access to Settings and Exit from the header

**Bilingual UI**
- Full English and Indonesian translation
- Switch language from Settings; all windows update instantly without reload

**System Integration**
- System tray icon with Open / Exit menu
- Always-on-top transparent frameless windows
- Desktop and Start Menu shortcuts created on install

---

## Screenshots

<img width="720" alt="Color Palette & Typography" src="https://github.com/user-attachments/assets/2178632b-627f-4667-affe-aa913214430c" />

---

## Installation

### Option A — Installer (recommended)

1. Download `TrapeziBuddy Setup 1.0.0.exe` from [Releases](../../releases)
2. Run the installer — choose install directory, then Finish
3. Launch **TrapeziBuddy** from the desktop or Start Menu

**Requirements:** Windows 10 / 11 (64-bit)

### Option B — Run from Source

**Prerequisites:** Node.js 18+ and npm

```bash
git clone <repo-url>
cd trapezibuddy/desktop-app
npm install
npm start
```

For development mode (DevTools enabled):
```bash
npm run dev
```

Target a specific page during development:
```bash
npm run dev:companion
npm run dev:add-task
npm run dev:confirm-task
```

Build the Windows installer:
```bash
npm run build
# Output: desktop-app/dist/TrapeziBuddy Setup 1.0.0.exe
```

---

## Project Structure

```
trapezibuddy/
└── desktop-app/
    ├── package.json
    ├── build/
    │   └── icons/                    ← App icon (.ico)
    └── src/
        ├── main/
        │   ├── main.js               ← Electron main process: windows, tray, IPC, data
        │   └── preload.js            ← Secure bridge exposing window.trapezi API
        └── renderer/
            ├── pages/
            │   ├── companion.html    ← Main companion panel
            │   ├── add-task.html     ← Task creation form
            │   ├── confirm-task.html ← Task completion confirmation
            │   ├── settings.html     ← Character & language settings
            │   ├── app-settings.html ← Keybind / character control settings
            │   ├── minimized-header.html ← Compact always-on-top bar
            │   ├── calendar-picker.html  ← Custom date picker
            │   ├── clock-picker.html     ← Custom time picker
            │   ├── chat.html         ← Chat interface
            │   └── bubble.html       ← Speech bubble overlay
            ├── components/
            │   ├── companion.js      ← Companion panel logic
            │   ├── minimized-header.js
            │   └── confirm-modal.js
            ├── i18n.js               ← EN/ID translations
            └── assets/
                └── styles/
                    ├── global.css    ← CSS variables + theme classes
                    ├── companion.css ← Component styles
                    └── images/
                        ├── agnesTachyon/   ← Character sprite + logo
                        ├── goldShip/       ← Character sprite + logo
                        └── icons/          ← SVG icons (streak, freeze, trophy, …)
```

---

## Data Model

**Task**
```js
{
  id: string,              // timestamp-based
  name: string,
  deadline_date: string,   // "YYYY-MM-DD"
  deadline_time: string,   // "HH:MM"
  categories: string[],
  priority: string,        // "Tinggi" | "Sedang" | "Rendah"
  reminder: boolean,
  is_done: boolean,
  created_at: string,      // ISO
  completed_at?: string    // ISO, set on completion
}
```

**Settings**
```js
{
  character: string,       // "agnesTachyon" | "goldship"
  language: string,        // "en" | "id"
  focus_duration: number,  // minutes (default: 25)
  streak: number,
  longest_streak: number,
  freezeTokens: number,    // default: 2
  lastTaskDate: string | null,
  doNotDisturb: boolean
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Electron](https://www.electronjs.org/) 41 |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Persistence | [electron-store](https://github.com/sindresorhus/electron-store) 8 |
| Installer | electron-builder — Windows NSIS |
| i18n | Custom `window.i18n` object + `[data-i18n]` DOM attributes |

---

## License

MIT — free to use and modify.

---

**TrapeziBuddy v1.0.0**
