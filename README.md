<div align="center">

<img width="124" alt="Image" src="https://github.com/user-attachments/assets/8522a8a9-042f-4ebf-a4a7-7a15616edef1" />

**A 2D desktop companion that keeps university students on track.**

![Version](https://img.shields.io/badge/version-1.0.0-blueviolet) ![Platform](https://img.shields.io/badge/platform-Windows-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Electron](https://img.shields.io/badge/electron-41-47848F)

</div>


## ✨ What is TrapeziBuddy?

TrapeziBuddy is a desktop productivity companion app built for university students, powered by Electron.js. It lives on your screen as a friendly 2D animated character, helping you manage tasks with deadlines, run focus sessions, and build a daily productivity streak — all without ever needing an account.


## 📸 Screenshots

<div align="center">

<img width="566" alt="Image" src="https://github.com/user-attachments/assets/8e7621c0-fb2c-4363-830b-7dcc178f6c68" />

<img width="632" alt="Image" src="https://github.com/user-attachments/assets/4b92e02c-c924-472b-9c51-e978c2bbe927" />

</div>


## 🚀 Features

- **Task Management** — create tasks with deadlines, automatically classified as Overdue / Urgent / Soon / Normal
- **Focus Session Timer** — built-in 25-minute focus timer to help you lock in
- **Daily Streak System** — build a streak by completing tasks on time, with Freeze Tokens to protect it from a missed deadline
- **Two Selectable Characters** — Agnes Tachyon & GoldShip, each with full dynamic theming across the entire app
- **Bilingual UI** — full English and Indonesian support, switchable anytime from Settings
- **Minimized Header Mode** — a compact always-on-top bar for when you just need the essentials
- **Local-First Data Storage** — everything is saved on your device, no account or sign-up required


## 🎭 Characters

| Character | Theme | Accent Color |
|-----------|-------|---------------|
| **Agnes Tachyon** | Warm, earthy sage tones | `#A2B29F` |
| **GoldShip** | Lavender luxury purple | `#9E8EC6` |

Pick your companion from Settings — the entire UI adapts to match their theme.

<details>
<summary>🐎 Agnes Tachyon — Color Palette</summary>
<br>
<img width="720" alt="Agnes Tachyon Color Palette & Typography" src="https://github.com/user-attachments/assets/2178632b-627f-4667-affe-aa913214430c" />
</details>

<details>
<summary>🐎 GoldShip — Color Palette</summary>
<br>
<img width="720" alt="Image" src="https://github.com/user-attachments/assets/f0501729-9dc1-4179-a1a7-7be211627a06" />
</details>


## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Electron.js](https://www.electronjs.org/) |
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Packaging | [electron-builder](https://www.electron.build/) |


## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- Windows 10 / 11 (64-bit)

### Install

```bash
git clone <repo-url>
cd trapezibuddy/desktop-app
npm install
```

### Run in development

```bash
npm run dev
```

Target a specific page during development:

```bash
npm run dev:companion
npm run dev:add-task
npm run dev:confirm-task
```

### Build the installer

```bash
npm run build
# Output: desktop-app/dist/TrapeziBuddy Setup 1.0.0.exe
```

> Prefer not to build from source? Download the ready-made `TrapeziBuddy Setup 1.0.0.exe` from [Releases](../../releases) and run the installer instead.


<details>
<summary>📁 Project Structure</summary>

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

</details>

<details>
<summary>🗃️ Data Model</summary>

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

</details>


## 💝 Credits & Attribution

TrapeziBuddy wouldn't exist without these people and works.

**Character Assets**

> Uma Musume character assets (**Agnes Tachyon** & **GoldShip**) are used courtesy of **DesktopGremlin**. These assets are fan-made and used strictly for non-commercial purposes. All rights to the original characters belong to **Cygames / Uma Musume Pretty Derby**.

**The Team**

| Role | Contributor(s) |
|------|-----------------|
| UI/UX Design | Hawwin, Pius |
| Character & Animation | Fito |
| Backend | Yardan |
| UI Development | Bagus, Aldino |
| Testing | Husain |


## 📄 License

MIT — free to use and modify.


<div align="center">

**TrapeziBuddy v1.0.0**

</div>
