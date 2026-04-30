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
    windowBounds: {
      companion: null,
      minimized: null,
      chat: null,
      settings: null,
    },
  }
})

let settingsWindow    = null
let companionWindow   = null
let minimizedWindow   = null
let addTaskWindow     = null
let confirmTaskWindow = null
let chatWindow        = null
let tray              = null
const isDev           = process.argv.includes('--dev')

const COMPANION_SIZE = { width: 300, height: 700 }
const CHAT_SIZE = { width: 300, height: 680 }
const MINIMIZED_SIZE = { width: 382, height: 44 }
const WINDOW_GAP = 15

function clampBoundsToWorkArea(bounds) {
  if (!bounds) return null
  const { x, y, width, height } = bounds
  if (![x, y, width, height].every(Number.isFinite)) return null

  // Find best matching display for the given bounds
  const display = screen.getDisplayMatching({ x, y, width, height })
  const wa = display?.workArea ?? screen.getPrimaryDisplay().workArea

  const w = Math.min(Math.max(Math.floor(width), 180), wa.width)
  const h = Math.min(Math.max(Math.floor(height), 120), wa.height)

  const minX = wa.x
  const minY = wa.y
  const maxX = wa.x + wa.width - w
  const maxY = wa.y + wa.height - h

  return {
    x: Math.min(Math.max(Math.floor(x), minX), maxX),
    y: Math.min(Math.max(Math.floor(y), minY), maxY),
    width: w,
    height: h,
  }
}

function getSavedBounds(key, fallback) {
  const saved = clampBoundsToWorkArea(store.get(`windowBounds.${key}`))
  if (saved) return saved

  // Backward compat: older builds stored only x/y for companion
  if (key === 'companion') {
    const pos = store.get('windowPosition')
    if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y) && fallback) {
      const migrated = clampBoundsToWorkArea({ ...fallback, x: pos.x, y: pos.y })
      if (migrated) return migrated
    }
  }

  return clampBoundsToWorkArea(fallback) ?? fallback
}

function wireBoundsPersistence(win, key) {
  if (!win) return
  const save = () => {
    try {
      store.set(`windowBounds.${key}`, win.getBounds())
    } catch (err) {
      console.error(`Failed to persist bounds for ${key}:`, err)
    }
  }

  // 'move' fires while dragging; 'moved' is not always consistent across platforms
  win.on('move', save)
  win.on('moved', save)
  win.on('resize', save)
  win.on('closed', () => {
    // keep last known bounds even after close; no-op
  })
}

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

  const fallback = {
    width: 520,
    height: 440,
    x: Math.floor(width / 2 - 260),
    y: Math.floor(height / 2 - 230),
  }
  const b = getSavedBounds('settings', fallback)

  settingsWindow = new BrowserWindow({
    width:       b.width,
    height:      b.height,
    x:           b.x,
    y:           b.y,
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
  wireBoundsPersistence(settingsWindow, 'settings')
  settingsWindow.on('closed', () => { settingsWindow = null })
}

// ── Companion Window ─────────────────────────────────────────
function createCompanionWindow(characterSize = 60) {
  const { width } = screen.getPrimaryDisplay().workAreaSize
  const fallback = { width: COMPANION_SIZE.width, height: COMPANION_SIZE.height, x: width - 320, y: 40 }
  const b = getSavedBounds('companion', fallback)

  const settings = store.get('settings')
  settings.character_size = characterSize
  store.set('settings', settings)

  companionWindow = new BrowserWindow({
    width: b.width, height: b.height, x: b.x, y: b.y,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: false, resizable: false, hasShadow: true,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  companionWindow.loadFile(path.join(__dirname, '../renderer/pages/companion.html'))
  wireBoundsPersistence(companionWindow, 'companion')
  // keep legacy key updated for older code paths/tools
  companionWindow.on('move', () => {
    const [x, y] = companionWindow.getPosition()
    store.set('windowPosition', { x, y })
  })
  if (isDev) companionWindow.webContents.openDevTools({ mode: 'detach' })
  companionWindow.on('closed', () => { companionWindow = null })
}


// ── Minimized header window ───────────────────────────────────────
function createMinimizedWindow(activePage = 'active') {
  if (minimizedWindow) {
    try {
      minimizedWindow.webContents.send('minimized:activePage', activePage)
    } catch (err) {
      console.error('Failed to update minimized active page:', err)
    }
    minimizedWindow.focus()
    return
  }

  const primaryWA = screen.getPrimaryDisplay().workArea
  const fallback = {
    width: MINIMIZED_SIZE.width,
    height: MINIMIZED_SIZE.height,
    x: primaryWA.x + primaryWA.width - 480,
    y: primaryWA.y + 40,
  }

  // Anchor minimized bar to the currently active window:
  // - when minimizing Chat, align to Chat window
  // - otherwise align to Companion window
  const anchor =
    (activePage === 'chat' && chatWindow)
      ? { key: 'chat', size: CHAT_SIZE, bounds: chatWindow.getBounds() }
      : (companionWindow
          ? { key: 'companion', size: COMPANION_SIZE, bounds: companionWindow.getBounds() }
          : null)

  const fromAnchor = anchor
    ? (() => {
        const x = anchor.bounds.x + Math.floor((anchor.bounds.width - fallback.width) / 2)
        const y = anchor.bounds.y
        return { ...fallback, x, y }
      })()
    : null

  // If we have an anchor window, prefer alignment; otherwise use last saved minimized bounds.
  const b = fromAnchor
    ? (clampBoundsToWorkArea(fromAnchor) ?? fromAnchor)
    : getSavedBounds('minimized', fallback)

  minimizedWindow = new BrowserWindow({
    width:       b.width,
    height:      b.height,
    x:           b.x,
    y:           b.y,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable:   false,
    hasShadow:   false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  minimizedWindow.loadFile(
    path.join(__dirname, '../renderer/pages/minimized-header.html'),
    { query: { activePage } }
  )

  if (isDev) minimizedWindow.webContents.openDevTools({ mode: 'detach' })
  wireBoundsPersistence(minimizedWindow, 'minimized')

  // When user drags minimized bar, we want restore to open companion at matching place.
  // So we persist the active (anchor) window x/y as the "inverse" of our centering alignment,
  // and keep the other window aligned with a fixed gap.
  minimizedWindow.on('move', () => {
    try {
      const mb = minimizedWindow.getBounds()
      const anchorKey =
        (activePage === 'chat' && chatWindow) ? 'chat' : 'companion'

      const anchorSize = anchorKey === 'chat' ? CHAT_SIZE : COMPANION_SIZE
      const anchorX = mb.x - Math.floor((anchorSize.width - mb.width) / 2)
      const anchorY = mb.y

      if (anchorKey === 'companion') {
        const cx = anchorX
        const cy = anchorY
        store.set('windowBounds.companion', { x: cx, y: cy, width: COMPANION_SIZE.width, height: COMPANION_SIZE.height })
        store.set('windowPosition', { x: cx, y: cy }) // legacy
        store.set('windowBounds.chat', {
          x: cx - (CHAT_SIZE.width + WINDOW_GAP),
          y: cy,
          width: CHAT_SIZE.width,
          height: CHAT_SIZE.height,
        })
      } else {
        const chx = anchorX
        const chy = anchorY
        store.set('windowBounds.chat', { x: chx, y: chy, width: CHAT_SIZE.width, height: CHAT_SIZE.height })
        const cx = chx + CHAT_SIZE.width + WINDOW_GAP
        const cy = chy
        store.set('windowBounds.companion', { x: cx, y: cy, width: COMPANION_SIZE.width, height: COMPANION_SIZE.height })
        store.set('windowPosition', { x: cx, y: cy }) // legacy
      }
    } catch (err) {
      console.error('Failed to sync minimized->companion position:', err)
    }
  })

  minimizedWindow.on('closed', () => { minimizedWindow = null })
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
// Track which page was active before minimize so restore() can re-open it
let lastActivePage = 'active'

ipcMain.on('window:minimize', () => {
  // Determine which window is currently visible and hide it
  if (chatWindow && chatWindow.isVisible && chatWindow.isVisible()) {
    lastActivePage = 'chat'
    chatWindow.hide()
  } else if (companionWindow && companionWindow.isVisible && companionWindow.isVisible()) {
    lastActivePage = 'active'
    companionWindow.hide()
  } else {
    lastActivePage = 'active'
  }

  createMinimizedWindow(lastActivePage)
})

ipcMain.on('window:restore', (_, page) => {
  const target = page || lastActivePage || 'active'

  // If minimized header exists, use its current bounds as the single source of truth
  // for where restored windows should appear (so switching Chat/Home from the minimized
  // header keeps the same on-screen location).
  const minimizedBounds = (() => {
    try {
      return minimizedWindow?.getBounds?.() ?? null
    } catch {
      return null
    }
  })()

  const applyAnchorFromMinimized = (anchorKey) => {
    if (!minimizedBounds) return
    const anchorSize = anchorKey === 'chat' ? CHAT_SIZE : COMPANION_SIZE
    const anchorX = minimizedBounds.x - Math.floor((anchorSize.width - minimizedBounds.width) / 2)
    const anchorY = minimizedBounds.y

    if (anchorKey === 'chat') {
      store.set('windowBounds.chat', { x: anchorX, y: anchorY, width: CHAT_SIZE.width, height: CHAT_SIZE.height })
      const cx = anchorX + CHAT_SIZE.width + WINDOW_GAP
      store.set('windowBounds.companion', { x: cx, y: anchorY, width: COMPANION_SIZE.width, height: COMPANION_SIZE.height })
      store.set('windowPosition', { x: cx, y: anchorY }) // legacy
    } else {
      store.set('windowBounds.companion', { x: anchorX, y: anchorY, width: COMPANION_SIZE.width, height: COMPANION_SIZE.height })
      store.set('windowPosition', { x: anchorX, y: anchorY }) // legacy
      store.set('windowBounds.chat', {
        x: anchorX - (CHAT_SIZE.width + WINDOW_GAP),
        y: anchorY,
        width: CHAT_SIZE.width,
        height: CHAT_SIZE.height,
      })
    }
  }

  // If user restores from minimized header, pre-seed the bounds based on the button they clicked.
  // This makes "Chat -> minimized -> click Home" open companion at the same minimized location.
  if (minimizedBounds) {
    applyAnchorFromMinimized(target === 'chat' ? 'chat' : 'companion')
  }

  // Close header
  minimizedWindow?.close()

  if (target === 'chat') {
    // Ensure chat window exists and show it. Hide companion to avoid duplicate UI.
    companionWindow?.hide()
    if (chatWindow) {
      if (minimizedBounds) {
        const b = getSavedBounds('chat', chatWindow.getBounds())
        chatWindow.setBounds(b)
      }
      chatWindow.show()
      chatWindow.focus()
    } else {
      // Create chat window (prefer saved bounds; otherwise derive from companion)
      const primaryWA = screen.getPrimaryDisplay().workArea
      const fallback = {
        width: CHAT_SIZE.width,
        height: CHAT_SIZE.height,
        x: primaryWA.x + primaryWA.width - (CHAT_SIZE.width + COMPANION_SIZE.width + WINDOW_GAP + 20),
        y: primaryWA.y + 40,
      }

      const derived = companionWindow?.getBounds
        ? (() => {
            const cb = companionWindow.getBounds()
            return { ...fallback, x: cb.x - (CHAT_SIZE.width + WINDOW_GAP), y: cb.y }
          })()
        : null

      const b = getSavedBounds('chat', derived ?? fallback)
      chatWindow = new BrowserWindow({
        width: b.width, height: b.height, x: b.x, y: b.y,
        frame: false, transparent: true, alwaysOnTop: true,
        skipTaskbar: false, resizable: false, hasShadow: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
      })
      chatWindow.loadFile(path.join(__dirname, '../renderer/pages/chat.html'))
      if (isDev) chatWindow.webContents.openDevTools({ mode: 'detach' })
      wireBoundsPersistence(chatWindow, 'chat')
      chatWindow.on('closed', () => { chatWindow = null })
    }
  } else {
    // Restore companion window and navigate if requested
    if (!companionWindow) createCompanionWindow()
    if (companionWindow && minimizedBounds) {
      const b = getSavedBounds('companion', companionWindow.getBounds())
      companionWindow.setBounds(b)
    }
    companionWindow?.show()
    companionWindow?.focus()

    try {
      companionWindow?.webContents.send('navigate', target)
    } catch (err) {
      console.error('Failed to send navigate message:', err)
    }
  }

  // reset lastActivePage
  lastActivePage = 'active'
})

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

  const primaryWA = screen.getPrimaryDisplay().workArea
  const fallback = {
    width: CHAT_SIZE.width,
    height: CHAT_SIZE.height,
    x: primaryWA.x + primaryWA.width - (CHAT_SIZE.width + COMPANION_SIZE.width + WINDOW_GAP + 20),
    y: primaryWA.y + 40,
  }

  const derived = companionWindow?.getBounds
    ? (() => {
        const cb = companionWindow.getBounds()
        return { ...fallback, x: cb.x - (CHAT_SIZE.width + WINDOW_GAP), y: cb.y }
      })()
    : null

  const b = getSavedBounds('chat', derived ?? fallback)
  chatWindow = new BrowserWindow({
    width: b.width, height: b.height, x: b.x, y: b.y,
    frame: false, transparent: true, alwaysOnTop: true,
    skipTaskbar: false, resizable: false, hasShadow: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  })
  chatWindow.loadFile(path.join(__dirname, '../renderer/pages/chat.html'))
  if (isDev) chatWindow.webContents.openDevTools({ mode: 'detach' })
  wireBoundsPersistence(chatWindow, 'chat')
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