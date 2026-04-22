// src/main/main.js
// TrapeziBuddy — Electron Main Process
// Handles: window creation, system tray, IPC, data storage

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron')
const path = require('path')
const Store = require('electron-store')

// ── Data store (JSON lokal, otomatis di AppData) ─────────────
const store = new Store({
  defaults: {
    tasks: [],
    settings: {
      character_size: 100,
      reminder_enabled: true,
      focus_duration: 25,
      streak: 0,
      last_active: null,
    },
    windowPosition: { x: null, y: null },
  }
})

// ── State ────────────────────────────────────────────────────
let companionWindow = null
let tray            = null
const isDev         = process.argv.includes('--dev')

// ── Create companion window ──────────────────────────────────
function createCompanionWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // Restore last position atau default ke pojok kanan atas
  const savedPos = store.get('windowPosition')
  const x = savedPos.x ?? width  - 320
  const y = savedPos.y ?? 40

  companionWindow = new BrowserWindow({
    width:           300,
    height:          700,
    x,
    y,
    frame:           false,       // frameless — kita bikin header sendiri
    transparent:     true,        // background transparan
    alwaysOnTop:     true,        // selalu di atas app lain
    skipTaskbar:     false,       // muncul di taskbar
    resizable:       false,
    hasShadow:       true,
    webPreferences: {
      nodeIntegration:     false,
      contextIsolation:    true,
      preload:             path.join(__dirname, 'preload.js'),
    }
  })

  companionWindow.loadFile(path.join(__dirname, '../renderer/pages/companion.html'))

  // Save posisi saat window dipindah
  companionWindow.on('moved', () => {
    const [x, y] = companionWindow.getPosition()
    store.set('windowPosition', { x, y })
  })

  // Dev tools
  if (isDev) {
    companionWindow.webContents.openDevTools({ mode: 'detach' })
  }

  companionWindow.on('closed', () => {
    companionWindow = null
  })
}

// ── System Tray ──────────────────────────────────────────────
function createTray() {
  // Pakai default icon dulu — nanti ganti dengan icon penguin
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const menu = Menu.buildFromTemplate([
    {
      label: 'Tampilkan TrapeziBuddy',
      click: () => {
        if (companionWindow) {
          companionWindow.show()
          companionWindow.focus()
        } else {
          createCompanionWindow()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sembunyikan',
      click: () => companionWindow?.hide()
    },
    { type: 'separator' },
    {
      label: 'Keluar',
      click: () => app.quit()
    }
  ])

  tray.setContextMenu(menu)
  tray.setToolTip('TrapeziBuddy')

  tray.on('click', () => {
    if (companionWindow?.isVisible()) {
      companionWindow.hide()
    } else {
      companionWindow?.show()
    }
  })
}

// ── IPC Handlers — komunikasi renderer ↔ main ───────────────

// Tasks
ipcMain.handle('tasks:getAll', () => store.get('tasks'))

ipcMain.handle('tasks:add', (_, task) => {
  const tasks = store.get('tasks')
  const newTask = {
    id:            Date.now().toString(),
    name:          task.name,
    deadline_date: task.deadline_date,
    deadline_time: task.deadline_time,
    categories:    task.categories ?? [],
    priority:      task.priority ?? 'Sedang',
    reminder:      task.reminder ?? true,
    is_done:       false,
    created_at:    new Date().toISOString(),
  }
  tasks.push(newTask)
  store.set('tasks', tasks)
  return newTask
})

ipcMain.handle('tasks:complete', (_, taskId) => {
  const tasks = store.get('tasks')
  const idx   = tasks.findIndex(t => t.id === taskId)
  if (idx !== -1) {
    tasks[idx].is_done      = true
    tasks[idx].completed_at = new Date().toISOString()
    store.set('tasks', tasks)
  }
  return tasks[idx] ?? null
})

ipcMain.handle('tasks:delete', (_, taskId) => {
  const tasks = store.get('tasks').filter(t => t.id !== taskId)
  store.set('tasks', tasks)
  return true
})

// Settings
ipcMain.handle('settings:get', () => store.get('settings'))
ipcMain.handle('settings:set', (_, settings) => {
  store.set('settings', settings)
  return true
})

// Window control
ipcMain.on('window:minimize', () => companionWindow?.minimize())
ipcMain.on('window:hide',     () => companionWindow?.hide())
ipcMain.on('window:drag',     (_, { deltaX, deltaY }) => {
  if (!companionWindow) return
  const [x, y] = companionWindow.getPosition()
  companionWindow.setPosition(x + deltaX, y + deltaY)
})

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  createCompanionWindow()
  createTray()
})

app.on('window-all-closed', () => {
  // Di Windows, app tetap jalan di tray walaupun window ditutup
  if (process.platform !== 'darwin') {
    // Jangan quit — biarkan tray tetap aktif
  }
})

app.on('activate', () => {
  if (!companionWindow) createCompanionWindow()
})
