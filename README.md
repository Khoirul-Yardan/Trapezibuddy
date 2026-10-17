<div align="center">

<img width="256" alt="Image" src="https://github.com/user-attachments/assets/8522a8a9-042f-4ebf-a4a7-7a15616edef1" />

**A 2D desktop companion that keeps university students on track.**

[![CI](https://github.com/Khoirul-Yardan/Trapezibuddy/actions/workflows/ci.yml/badge.svg)](https://github.com/Khoirul-Yardan/Trapezibuddy/actions/workflows/ci.yml) ![Version](https://img.shields.io/badge/version-1.0.0-blueviolet) ![Platform](https://img.shields.io/badge/platform-Windows-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Electron](https://img.shields.io/badge/electron-41-47848F)

</div>


## ✨ What is TrapeziBuddy?

TrapeziBuddy is a desktop productivity companion app built for university students, powered by Electron.js. It lives on your screen as a friendly 2D animated character, helping you manage tasks with deadlines, run focus sessions, and build a daily productivity streak — all without ever needing an account.


## 📸 Screenshots

<div align="center">

<img width="632" alt="Image" src="https://github.com/user-attachments/assets/4b92e02c-c924-472b-9c51-e978c2bbe927" />

<img width="566" alt="Image" src="https://github.com/user-attachments/assets/8e7621c0-fb2c-4363-830b-7dcc178f6c68" />

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

<div align="center">

[![My Skills](https://skillicons.dev/icons?i=electron,css,html,js)](https://skillicons.dev)

</div>

| Layer | Technology |
|-------|-----------|
| Runtime | [Electron.js](https://www.electronjs.org/) |
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Packaging | [electron-builder](https://www.electron.build/) |


## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20.19+ (24 recommended) and npm
- Windows 10 / 11 (64-bit)

### Install

```bash
git clone https://github.com/Khoirul-Yardan/Trapezibuddy.git
cd Trapezibuddy
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
```

### Build the installer

```bash
npm run build
# Output: dist/TrapeziBuddy Setup 1.0.0.exe
```

> Prefer not to build from source? Download the ready-made `TrapeziBuddy Setup <version>.exe` from [Releases](../../releases) and run the installer instead.
>
> The installer is **not code-signed yet**, so Windows SmartScreen may show "Windows protected your PC". Choose **More info**, then **Run anyway**. Each release lists a SHA-256 checksum (`SHA256SUMS.txt`) you can compare with `Get-FileHash`.

### Checks

```bash
npm run lint    # ESLint
npm test        # main-process handlers and renderer wiring, Node's built-in runner, no Electron needed
```

The same checks run in GitHub Actions on every pull request and on `main`, followed by a dry-run packaging of the app.

> npm 12 blocks dependency install scripts unless they are approved. `package.json` approves `electron` (which downloads its binary), so a plain `npm install` or `npm ci` is enough.

### Releasing

```bash
npm version patch          # or minor / major: bumps package.json and creates the tag vX.Y.Z
git push --follow-tags
```

Pushing the tag starts the **Release** workflow. It repeats the checks, builds the installer, and publishes it to [Releases](../../releases) with checksums and generated notes. A tag with a suffix such as `v1.2.0-rc.1` is published as a pre-release. The tag must equal `v` plus the version in `package.json`, otherwise nothing is built.


<details>
<summary>📁 Project Structure</summary>

```
Trapezibuddy/
├── package.json
├── eslint.config.js                  ← Lint rules for main, renderer and tests
├── .github/
│   ├── workflows/ci.yml              ← Lint, test and packaging dry run on PRs and main
│   ├── workflows/release.yml         ← Builds and publishes the installer on version tags
│   └── dependabot.yml                ← Weekly npm and Actions updates
├── test/                             ← node:test suites (main process, renderer wiring)
├── assets/                           ← Character pet executables, sprites, sounds (spawned by the app)
├── build/
│   └── icons/                        ← App icon (.ico)
└── src/
    ├── main/                         ← Electron main process (Node)
    │   ├── main.js                   ← Entry point: app lifecycle only
    │   ├── ipc.js                    ← Every ipcMain handler (tasks, settings, windows, bubble, pickers)
    │   ├── windows.js                ← Window factory, sizes, placement, bounds persistence
    │   ├── character.js              ← Starts/stops the character .exe
    │   ├── tray.js                   ← System tray icon and menu
    │   ├── store.js                  ← electron-store instance and defaults
    │   ├── paths.js                  ← Packaged vs. dev paths, app icon
    │   └── preload.js                ← Secure bridge exposing window.trapezi to pages
    └── renderer/                     ← Pages (Chromium, no Node access)
        ├── pages/                    ← Markup only, one HTML file per window
        │   ├── companion.html        ← Main companion panel
        │   ├── add-task.html         ← Task creation form
        │   ├── settings.html         ← First-run character & language picker
        │   ├── app-settings.html     ← Character, focus timer, do-not-disturb
        │   ├── minimized-header.html ← Compact always-on-top bar
        │   ├── calendar-picker.html  ← Date picker
        │   ├── clock-picker.html     ← Time picker
        │   └── bubble.html           ← Speech bubble overlay
        ├── components/               ← Logic of each page, same name as the page (+ confirm-modal.js)
        ├── theme.js                  ← Shared: applies the character theme to a page
        ├── i18n.js                   ← Shared: EN/ID dictionary and translateDOM()
        └── assets/styles/
            ├── global.css            ← CSS variables + theme classes
            ├── <page>.css            ← Styles of each page, same name as the page
            └── images/               ← Character sprites, logos, SVG icons
```

Conventions for a page: `pages/x.html` links `assets/styles/x.css` and loads
`i18n.js`, `theme.js`, then `components/x.js`. Pages have no inline scripts or handlers,
which lets the Content-Security-Policy be `script-src 'self'`.

</details>

<details>
<summary>🧭 Architecture</summary>

Renderer pages never touch the disk or the OS. They call `window.trapezi.*` (defined in
`src/main/preload.js`), which forwards to handlers in `src/main/ipc.js`. Those read and write
the `electron-store` file and open or message windows through `src/main/windows.js`.

```
page (renderer) ──window.trapezi──▶ preload.js ──IPC──▶ ipc.js ──▶ store.js / windows.js / character.js
                                                                     │
page (renderer) ◀──────────── theme:apply · language:changed · refresh:tasks ───┘
```

- **Windows**: each window is a separate page. Main keeps one reference per name and removes it when the window closes.
- **Theme and language** are pushed by main to every window right after it loads, and again whenever they change. `theme.js` and `i18n.js` handle that for all pages; a page with dynamic text listens for the `trapezi:language` event to re-render.
- **Character**: the animated pet is a separate `.exe` under `assets/`. `character.js` starts and stops it. Do-not-disturb and focus mode keep it hidden.
- **Settings** are merged on save (`settings:set`), so a window that knows only some keys cannot erase the others.

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
  completed_at?: string,   // ISO, set on completion
  streak_penalty_handled?: boolean  // set once a missed deadline has cost a token or the streak
}
```

**Settings**
```js
{
  character: string,       // "agnesTachyon" | "goldship"
  language: string,        // "en" | "id"
  focusTimer: number,      // minutes (default: 25)
  streak: number,
  longest_streak: number,
  freezeTokens: number,    // 0-2, default 2; one is earned back each week
  freezeActive: boolean,   // a token was just spent to protect the streak
  lastTaskDate: string | null,
  lastTokenRecoveryDate: string | null,  // ISO, last weekly token refill
  doNotDisturb: boolean
}
```

</details>


## 💝 Credits & Attribution

TrapeziBuddy wouldn't exist without these people and works.

**Character Assets**

> [!NOTE]
> Uma Musume character assets (**Agnes Tachyon** & **GoldShip**) are used courtesy of [**DesktopGremlin**](https://github.com/Kritzkingvoid/Desktop_Gremlin). These assets are fan-made and used strictly for non-commercial purposes. All rights to the original characters belong to **Cygames / Uma Musume Pretty Derby**.

## 📄 License

MIT — free to use and modify.


<div align="center">

**TrapeziBuddy v1.0.0**

</div>
