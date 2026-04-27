// src/main/main.js
// TrapeziBuddy — Electron Main Process

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron')
const path  = require('path')
const Store = require('electron-store')
const { spawn } = require('child_process')
const fs = require('fs')

// ── Python companion process ──────────────────────────────────
let pythonProcess = null

function getProjectRoot() {
  return path.join(__dirname, '..', '..', '..')
}

function getPythonExecutable() {
  const projectRoot = getProjectRoot()
  const venvPython = process.platform === 'win32'
    ? path.join(projectRoot, 'venv', 'Scripts', 'python.exe')
    : path.join(projectRoot, 'venv', 'bin', 'python')

  if (fs.existsSync(venvPython)) return venvPython
  return process.platform === 'win32' ? 'python' : 'python3'
}

function startPythonCompanion(characterSize = 60) {
  if (pythonProcess) return

  const pythonScript = path.join(getProjectRoot(), 'main.py')
  const pythonExec = getPythonExecutable()
  const safeSize = Number.isFinite(characterSize) ? characterSize : 60

  pythonProcess = spawn(pythonExec, [pythonScript, '--skip-settings', '--character-size', String(safeSize)], {
    detached: false,
    stdio:    'ignore',
  })

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python companion:', err)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python companion exited with code ${code}`)
    pythonProcess = null
  })
}

function stopPythonCompanion() {
  if (pythonProcess) {
    pythonProcess.kill()
    pythonProcess = null
  }
}

const store = new Store({
  defaults: {
    tasks: [],
    settings: {
      character_size: 60,
      reminder_enabled: true,
      focus_duration: 25,
      streak: 0,
      last_active: null,
    },
    windowPosition: { x: null, y: null },
  }
})

let settingsWindow    = null
let companionWindow   = null
let addTaskWindow     = null
let confirmTaskWindow = null
let chatWindow        = null
let tray              = null
const isDev           = process.argv.includes('--dev')

function getDevPage() {
  const pageArg = process.argv.find(arg => arg.startsWith('--page='))
  return pageArg ? pageArg.split('=')[1] : null
}

function createStandalonePageWindow(pageName) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const pageMap = {
    chat: {
      file: '../renderer/pages/chat.html',
      width: 300,
      height: 680,
      x: Math.floor(width / 2 - 150),
      y: Math.floor(height / 2 - 340),
    },
    companion: {
      file: '../renderer/pages/companion.html',
      width: 300,
      height: 700,
      x: Math.floor(width / 2 - 150),
      y: Math.floor(height / 2 - 350),
    },
    'add-task': {
      file: '../renderer/pages/add-task.html',
      width: 300,
      height: 580,
      x: Math.floor(width / 2 - 150),
      y: Math.floor(height / 2 - 290),
    },
    'confirm-task': {
      file: '../renderer/pages/confirm-task.html',
      width: 280,
      height: 380,
      x: Math.floor(width / 2 - 140),
      y: Math.floor(height / 2 - 190),
    },
  }

  const target = pageMap[pageName]
  if (!target) return false

  const win = new BrowserWindow({
    width: target.width,
    height: target.height,
    x: target.x,
    y: target.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  win.loadFile(path.join(__dirname, target.file))
  if (isDev) win.webContents.openDevTools({ mode: 'detach' })
  return true
}

// ── Settings Window ──────────────────────────────────────────
function createSettingsWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  settingsWindow = new BrowserWindow({
    width:       520,
    height:      440,
    x:           Math.floor(width  / 2 - 260),
    y:           Math.floor(height / 2 - 230),
    frame:       false,
    resizable:   false,
    hasShadow:   true,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  settingsWindow.loadFile(
    path.join(__dirname, '../renderer/pages/settings.html')
  )

  if (isDev) settingsWindow.webContents.openDevTools({ mode: 'detach' })
  settingsWindow.on('closed', () => { settingsWindow = null })
}

// ── Companion Window ─────────────────────────────────────────
function createCompanionWindow(characterSize = 60) {
  const { width } = screen.getPrimaryDisplay().workAreaSize
  const savedPos  = store.get('windowPosition')
  const x = savedPos.x ?? width - 320
  const y = savedPos.y ?? 40

  const settings = store.get('settings')
  settings.character_size = characterSize
  store.set('settings', settings)

  companionWindow = new BrowserWindow({
    width: 300, height: 700, x, y,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: false, resizable: false, hasShadow: true,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  companionWindow.loadFile(path.join(__dirname, '../renderer/pages/companion.html'))
  companionWindow.on('moved', () => {
    const [x, y] = companionWindow.getPosition()
    store.set('windowPosition', { x, y })
  })
  if (isDev) companionWindow.webContents.openDevTools({ mode: 'detach' })
  companionWindow.on('closed', () => { companionWindow = null })
}

// ── Tray ─────────────────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Buka',   click: () => companionWindow?.show() },
    { type: 'separator' },
    { label: 'Keluar', click: () => app.quit() }
  ]))
  tray.setToolTip('TrapeziBuddy')
  tray.on('click', () =>
    companionWindow?.isVisible() ? companionWindow.hide() : companionWindow?.show()
  )
}

// ── IPC: Settings ────────────────────────────────────────────
ipcMain.on('window:closeSettings', () => {
  settingsWindow?.close()
  if (!companionWindow) app.quit()
})

ipcMain.on('window:startApp', (_, data) => {
  const size = data?.characterSize ?? 60
  settingsWindow?.close()
  createCompanionWindow(size)
  createTray()
  startPythonCompanion(size)
})

// ── IPC: Tasks ───────────────────────────────────────────────
ipcMain.handle('tasks:getAll', () => store.get('tasks'))

ipcMain.handle('tasks:add', (_, task) => {
  const tasks = store.get('tasks')
  const newTask = {
    id: Date.now().toString(),
    name: task.name,
    deadline_date: task.deadline_date,
    deadline_time: task.deadline_time,
    categories: task.categories ?? [],
    priority: task.priority ?? 'Sedang',
    reminder: task.reminder ?? true,
    is_done: false,
    created_at: new Date().toISOString(),
  }
  tasks.push(newTask)
  store.set('tasks', tasks)
  return newTask
})

ipcMain.handle('tasks:complete', (_, taskId) => {
  const tasks = store.get('tasks')
  const idx = tasks.findIndex(t => t.id === taskId)
  if (idx !== -1) {
    tasks[idx].is_done = true
    tasks[idx].completed_at = new Date().toISOString()
    store.set('tasks', tasks)
  }
  return tasks[idx] ?? null
})

ipcMain.handle('tasks:delete', (_, taskId) => {
  store.set('tasks', store.get('tasks').filter(t => t.id !== taskId))
  return true
})

ipcMain.handle('settings:get', () => store.get('settings'))
ipcMain.handle('settings:set', (_, data) => { store.set('settings', data); return true })

// ── IPC: Window ──────────────────────────────────────────────
ipcMain.on('window:minimize', () => companionWindow?.minimize())
ipcMain.on('window:hide',     () => companionWindow?.hide())

// ── IPC: Add Task ────────────────────────────────────────────
ipcMain.handle('modal:openAddTask', () => {
  if (addTaskWindow) { addTaskWindow.focus(); return }
  const [px, py] = companionWindow.getPosition()
  addTaskWindow = new BrowserWindow({
    width: 300, height: 580, x: px - 10, y: py + 60,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: true,
    parent: companionWindow,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  })
  addTaskWindow.loadFile(path.join(__dirname, '../renderer/pages/add-task.html'))
  addTaskWindow.on('closed', () => { addTaskWindow = null })
})
ipcMain.on('modal:closeAddTask', () => addTaskWindow?.close())
ipcMain.on('modal:taskAdded', () => {
  companionWindow?.webContents.send('refresh:tasks')
  addTaskWindow?.close()
})

// ── IPC: Confirm Task ────────────────────────────────────────
ipcMain.handle('modal:openConfirmTask', (_, { taskId, taskName }) => {
  if (confirmTaskWindow) { confirmTaskWindow.focus(); return }
  const [px, py] = companionWindow.getPosition()
  confirmTaskWindow = new BrowserWindow({
    width: 280, height: 380, x: px + 10, y: py + 200,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: true,
    parent: companionWindow,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  })
  confirmTaskWindow.loadFile(
    path.join(__dirname, '../renderer/pages/confirm-task.html'),
    { query: { taskId, taskName } }
  )
  confirmTaskWindow.on('closed', () => { confirmTaskWindow = null })
})
ipcMain.on('modal:closeConfirmTask', () => confirmTaskWindow?.close())
ipcMain.on('modal:taskCompleted', () => {
  companionWindow?.webContents.send('refresh:tasks')
  confirmTaskWindow?.close()
})

// ── IPC: Chat ────────────────────────────────────────────────
ipcMain.handle('window:openChat', () => {
  if (chatWindow) { chatWindow.focus(); return }
  const [px, py] = companionWindow.getPosition()
  chatWindow = new BrowserWindow({
    width: 300, height: 680, x: px - 315, y: py,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: false, resizable: false, hasShadow: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  })
  chatWindow.loadFile(path.join(__dirname, '../renderer/pages/chat.html'))
  if (isDev) chatWindow.webContents.openDevTools({ mode: 'detach' })
  chatWindow.on('closed', () => { chatWindow = null })
})
ipcMain.on('window:closeChat', () => chatWindow?.close())

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  const page = getDevPage()
  if (page && createStandalonePageWindow(page)) {
    return
  }
  createSettingsWindow()
})

app.on('window-all-closed', () => {
  if (!companionWindow && process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  stopPythonCompanion()
})

app.on('activate', () => {
  if (!companionWindow && !settingsWindow) createSettingsWindow()
})