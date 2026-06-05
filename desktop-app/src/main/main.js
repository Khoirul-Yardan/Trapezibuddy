
// src/main/main.js
// TrapeziBuddy — Electron Main Process

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron')
const path  = require('path')
const Store = require('electron-store')
const { spawn, exec, execSync } = require('child_process')
const fs = require('fs')

// ── Simple Logger ──────────────────────────────────────────────
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
}


function getProjectRoot() {
  if (app.isPackaged) {
    // In production, the backend folder is copied to resources/backend
    return process.resourcesPath
  }
  return path.join(__dirname, '..', '..', '..')
}

function getAppIcon() {
  const devIcon = path.join(getProjectRoot(), 'desktop-app', 'build', 'icons', 'gugugaga.ico')
  const pkgIcon = path.join(process.resourcesPath || '', 'build', 'icons', 'gugugaga.ico')
  const iconPath = fs.existsSync(pkgIcon) ? pkgIcon : devIcon
  return nativeImage.createFromPath(iconPath)
}

// Set AppUserModelID for Windows so tray/icon behaves correctly
try {
  if (process.platform === 'win32' && app && app.setAppUserModelId) {
    app.setAppUserModelId('com.trapezibuddy.app')
  }
} catch (err) {
  logger.warn('Failed to set AppUserModelId: ' + err)
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

let characterProcess   = null
let currentRunningChar = null
let settingsWindow     = null
let appSettingsWindow = null
let companionWindow   = null
let minimizedWindow   = null
let addTaskWindow     = null
let confirmTaskWindow = null
let chatWindow        = null
let bubbleWindow      = null
let tray              = null
const isDev           = process.argv.includes('--dev')

// ═══════════════════════════════════════════════════════════════
// WINDOW SIZE CONFIGURATION
// ═══════════════════════════════════════════════════════════════
// Customize window sizes here. All dimensions in pixels (px)
// Companion: character display window
// Chat: chat interface window
// Bubble: speech bubble above character
// Minimized: collapsed header bar
// AddTask: task creation modal
// ConfirmTask: task completion modal
// ═══════════════════════════════════════════════════════════════
const COMPANION_SIZE = { width: 300, height: 700 }    // Character window
const CHAT_SIZE = { width: 300, height: 680 }         // Chat panel
const MINIMIZED_SIZE = { width: 382, height: 44 }     // Minimized bar
const WINDOW_GAP = 15                                  // Space between windows

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
      width: CHAT_SIZE.width,
      height: CHAT_SIZE.height,
      x: Math.floor(width / 2 - CHAT_SIZE.width / 2),
      y: Math.floor(height / 2 - CHAT_SIZE.height / 2),
    },
    companion: {
      file: '../renderer/pages/companion.html',
      width: COMPANION_SIZE.width,
      height: COMPANION_SIZE.height,
      x: Math.floor(width / 2 - COMPANION_SIZE.width / 2),
      y: Math.floor(height / 2 - COMPANION_SIZE.height / 2),
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
    hasShadow: false,
    icon: getAppIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  win.loadFile(path.join(__dirname, target.file))
  // DevTools removed for cleaner experience
  return true
}


// ── Settings Window ──────────────────────────────────────────
function createSettingsWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  const fallback = {
    width: 420,
    height: 510,
    x: Math.floor(width / 2 - 210),
    y: Math.floor(height / 2 - 255),
  }
  const b = getSavedBounds('settings', fallback)

  settingsWindow = new BrowserWindow({
    width:       420,
    height:      600,
    x:           b.x,
    y:           b.y,
    frame:       false,
    resizable:   false,
    hasShadow:   true,
    icon:        getAppIcon(),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  settingsWindow.loadFile(
    path.join(__dirname, '../renderer/pages/settings.html')
  )

  wireBoundsPersistence(settingsWindow, 'settings')
  settingsWindow.on('closed', () => { settingsWindow = null })
}

// ── App Settings Window ──────────────────────────────────────
function createAppSettingsWindow() {
  if (appSettingsWindow) { appSettingsWindow.focus(); return }
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  appSettingsWindow = new BrowserWindow({
    width:       420,
    height:      680,
    x:           Math.floor(width  / 2 - 210),
    y:           Math.floor(height / 2 - 340),
    frame:       false,
    transparent: false,
    alwaysOnTop: true,
    resizable:   false,
    hasShadow:   true,
    icon:        getAppIcon(),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
  appSettingsWindow.loadFile(
    path.join(__dirname, '../renderer/pages/app-settings.html')
  )
  appSettingsWindow.on('closed', () => {
    appSettingsWindow = null
    minimizedWindow?.show()
  })
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
    skipTaskbar: false, resizable: false, hasShadow: false,
    icon: getAppIcon(),
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  const storedCharacter = (store.get('settings') || {}).character || 'agnesTachyon'
  companionWindow.loadFile(
    path.join(__dirname, '../renderer/pages/companion.html'),
    { query: { character: storedCharacter } }
  )
  wireBoundsPersistence(companionWindow, 'companion')
  // keep legacy key updated for older code paths/tools
  companionWindow.on('move', () => {
    const [x, y] = companionWindow.getPosition()
    store.set('windowPosition', { x, y })
  })
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
    icon:        getAppIcon(),
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
function buildTrayMenu() {
  if (!tray) return
  const lang = store.get('settings.language', 'en')
  const openLabel = lang === 'id' ? 'Buka' : 'Open'
  const exitLabel = lang === 'id' ? 'Keluar' : 'Exit'
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: openLabel, click: () => companionWindow?.show() },
    { type: 'separator' },
    { label: exitLabel, click: () => app.quit() }
  ]))
}

function createTray() {
  tray = new Tray(getAppIcon())
  buildTrayMenu()
  tray.setToolTip('TrapeziBuddy')
  tray.on('click', () =>
    companionWindow?.isVisible() ? companionWindow.hide() : companionWindow?.show()
  )
}

// ── IPC: Settings ────────────────────────────────────────────
ipcMain.on('window:closeSettings', () => {
  settingsWindow?.close()
  appSettingsWindow?.close()
  if (!companionWindow) app.quit()
})

// IPC: Benar-benar keluar aplikasi dari renderer
ipcMain.on('window:forceQuit', () => {
  app.quit();
});

const CHARACTER_EXE_MAP = {
  agnesTachyon: path.join('assets', 'agnesTachyon', 'agnesTachyon.exe'),
  goldship:     path.join('assets', 'goldShip',     'goldShip.exe'),
}

function killAllCharacterExes() {
  if (characterProcess) {
    try { characterProcess.kill() } catch (_) {}
    characterProcess = null
  }
  if (process.platform === 'win32') {
    Object.values(CHARACTER_EXE_MAP).forEach(relPath => {
      const exeName = path.basename(relPath)
      try { execSync(`taskkill /IM "${exeName}" /F`, { stdio: 'pipe' }) } catch (_) {}
    })
  }
}

function spawnCharacterExe(charKey) {
  killAllCharacterExes()
  const relExe = CHARACTER_EXE_MAP[charKey]
  if (!relExe) return
  const exePath = path.join(getProjectRoot(), relExe)
  if (!fs.existsSync(exePath)) {
    logger.warn('Character exe not found: ' + exePath)
    return
  }
  try {
    characterProcess   = spawn(exePath, [], { detached: true, stdio: 'ignore' })
    currentRunningChar = charKey
    logger.info('Launched character exe: ' + exePath)
  } catch (err) {
    logger.error('Failed to launch character exe: ' + err)
  }
}

ipcMain.on('window:startApp', (_, data) => {
  const charKey = data?.character || store.get('settings.character') || 'agnesTachyon'
  spawnCharacterExe(charKey)
  settingsWindow?.close()
  createCompanionWindow()
  createTray()
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
ipcMain.handle('settings:set', (_, data) => {
  store.set('settings', data)
  if (data && data.character) store.set('settings.theme', data.character)
  // Compare against the exe actually running, not the store
  // (store is already updated by theme:apply before save() fires)
  if (data?.character && data.character !== currentRunningChar) {
    spawnCharacterExe(data.character)
  }
  return true
})

// ── IPC: Language ────────────────────────────────────────────
ipcMain.handle('language:get', () => store.get('settings.language', 'en'))
ipcMain.on('language:set', (_, lang) => {
  store.set('settings.language', lang)
  buildTrayMenu()
  const targets = [companionWindow, chatWindow, minimizedWindow, addTaskWindow, confirmTaskWindow, appSettingsWindow, settingsWindow]
  targets.forEach(win => {
    try {
      if (win && !win.isDestroyed()) win.webContents.send('language:changed', lang)
    } catch (_err) { /* window may be closing */ }
  })
})

// Broadcast language when a new window finishes loading
app.on('web-contents-created', (event, contents) => {
  contents.on('did-finish-load', () => {
    const lang = store.get('settings.language', 'en');
    contents.send('language:changed', lang);
  });
})

// ── IPC: Theme ───────────────────────────────────────────────
ipcMain.on('theme:apply', (_, theme) => {
  store.set('settings.character', theme)
  const windows = [
    companionWindow,
    minimizedWindow,
    chatWindow,
    addTaskWindow,
    confirmTaskWindow,
    appSettingsWindow
  ]
  windows.forEach(win => {
    try {
      if (win && !win.isDestroyed() && win.webContents) {
        win.webContents.send('theme:apply', theme)
      }
    } catch (e) {
      console.error('Failed to send theme to window:', e)
    }
  })
})

// ── IPC: Chat (Local Dialog) ──────────────────────────────────
// Local dialog responses - no Python backend needed for now
const localDialogResponses = {
  'halo': 'Hai! Ada yang bisa aku bantu? 😊',
  'halo aku': 'Selamat datang! Mau ngobrol atau butuh bantuan?',
  'buka chrome': 'Baik, aku buka Chrome untuk kamu! 🌐',
  'buka aplikasi': 'Aplikasi mana yang mau dibuka?',
  'buat resume': 'Siap! Aku bantu kamu bikin resume di Word.',
  'task': 'Ayo tambah task baru! Apa yang mau dikerjain?',
  'fokus': 'Wah, mau fokus? Aku hilang dulu ya. Good luck! 💪',
  'bantuan': 'Aku bisa membantu buka aplikasi, chat, atau manage tasks!',
  'default': 'Hmm, aku bingung. Bisa dijelasin lagi? 🤔',
}

// ── Call Backend ──────────────────────────────────────────────
async function callPythonBackend(userMessage) {
  try {
    return new Promise((resolve, reject) => {
      const projectRoot = getProjectRoot()
      let backend;
      
      const backendExe = path.join(projectRoot, 'backend', 'main.exe')
      logger.info(`Spawning backend exe: ${backendExe}`)
      
      if (!fs.existsSync(backendExe)) {
        logger.error(`Backend exe not found: ${backendExe}`)
        reject(new Error(`Backend executable not found at ${backendExe}`))
        return
      }
      
      backend = spawn(backendExe, [
        '--chat-bridge',
        '--message', userMessage,
        '--execute-actions'
      ], {
        cwd: path.dirname(backendExe),
        stdio: ['pipe', 'pipe', 'pipe'],
      })

      let output = ''
      let error = ''

      backend.stdout.on('data', (data) => {
        output += data.toString()
      })

      backend.stderr.on('data', (data) => {
        error += data.toString()
      })

      backend.on('close', (code) => {
        try {
          if (code !== 0) {
            logger.warn(`Backend exited with code ${code}: ${error}`)
          }
          
          // Parse JSON response
          let jsonStr = output.trim();
          const startIdx = jsonStr.indexOf('{');
          const endIdx = jsonStr.lastIndexOf('}');
          if (startIdx !== -1 && endIdx !== -1) {
            jsonStr = jsonStr.substring(startIdx, endIdx + 1);
          }
          const response = JSON.parse(jsonStr)
          logger.info(`[AI] Response: ${response.response}`)
          resolve(response)
        } catch (parseErr) {
          logger.error(`Failed to parse Backend response: ${parseErr}`)
          logger.error(`Output was: ${output}`)
          logger.error(`Error was: ${error}`)
          reject(parseErr)
        }
      })

      backend.on('error', (err) => {
        logger.error(`Failed to spawn Backend process: ${err.message}`)
        reject(err)
      })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        backend.kill()
        reject(new Error('Backend timeout'))
      }, 30000)
    })
  } catch (err) {
    logger.error(`Backend error: ${err.message}`)
    throw err
  }
}

// ── Chat Handler: Send Message to Python Backend ────────────
ipcMain.handle('chat:sendMessage', async (_, userMessage) => {
  try {
    logger.info(`[Chat] User: ${userMessage}`)
    
    // Call Python backend via chat_bridge
    const result = await callPythonBackend(userMessage)
    const response = result.response || 'Hmm, aku belum paham. Coba ulangi ya.'
    
    // Log chat history
    const chatHistory = store.get('chatHistory') || []
    chatHistory.push({
      timestamp: new Date().toISOString(),
      user: userMessage,
      assistant: response,
      intent: result.intent,
      actions: result.actions_executed,
    })
    store.set('chatHistory', chatHistory)
    
    return {
      ok: true,
      response: response,
      intent: result.intent,
      actions: result.actions_executed,
    }
  } catch (err) {
    console.error('Chat error:', err)
    logger.error(`[Chat] Error: ${err.message}`)
    
    return {
      ok: false,
      response: 'Maaf, ada error. Coba lagi ya! \uD83D\uDD04',
      intent: 'error',
      actions: 0,
    }
  }
})

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

  // Gear icon in minimized header → open app-settings window
  if (target === 'settings') {
    minimizedWindow?.hide()
    createAppSettingsWindow()
    return
  }

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
        skipTaskbar: false, resizable: false, hasShadow: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
      })
      chatWindow.loadFile(path.join(__dirname, '../renderer/pages/chat.html'))
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
    skipTaskbar: true, resizable: false, hasShadow: false,
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
  const confirmTheme = store.get('settings.theme') || store.get('settings.character') || 'agnesTachyon'
  confirmTaskWindow = new BrowserWindow({
    width: 280, height: 380, x: px + 10, y: py + 200,
    frame: false, transparent: false, alwaysOnTop: true,
    skipTaskbar: true, resizable: false, hasShadow: true,
    backgroundColor: confirmTheme === 'goldship' ? '#E8E2D8' : '#FBF9F8',
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
    skipTaskbar: false, resizable: false, hasShadow: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') }
  })
  chatWindow.loadFile(path.join(__dirname, '../renderer/pages/chat.html'))
  wireBoundsPersistence(chatWindow, 'chat')
  chatWindow.on('closed', () => { chatWindow = null })
})
ipcMain.on('window:closeChat', () => chatWindow?.close())

// ── IPC: Calendar Picker ─────────────────────────────────────
let calendarWindow = null
ipcMain.handle('calendar:open', (_, currentDate) => {
  if (calendarWindow) { 
    calendarWindow.focus()
    return 
  }
  
  // Get add-task window position to position calendar picker above it
  let calendarX, calendarY
  if (addTaskWindow && !addTaskWindow.isDestroyed()) {
    const [addTaskX, addTaskY] = addTaskWindow.getPosition()
    const addTaskBounds = addTaskWindow.getBounds()
    // Center calendar picker horizontally above add-task window
    calendarX = addTaskX + Math.floor((addTaskBounds.width - 360) / 2)
    calendarY = addTaskY + 60 // Position slightly below the top
  } else {
    // Fallback to center of screen
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    calendarX = Math.floor(width / 2 - 180)
    calendarY = Math.floor(height / 2 - 240)
  }
  
  calendarWindow = new BrowserWindow({
    width: 360,
    height: 480,
    x: calendarX,
    y: calendarY,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    backgroundColor: '#FFFFFF',
    parent: addTaskWindow || companionWindow,
    modal: false, // Changed to false so it can be dragged
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
  
  calendarWindow.loadFile(path.join(__dirname, '../renderer/pages/calendar-picker.html'), {
    query: currentDate ? { date: currentDate } : {}
  })
  
  calendarWindow.on('closed', () => { calendarWindow = null })
})

ipcMain.on('calendar:selectDate', (_, date) => {
  // Send selected date back to the parent window (add-task)
  if (addTaskWindow && !addTaskWindow.isDestroyed()) {
    addTaskWindow.webContents.send('calendar:dateSelected', date)
  }
  calendarWindow?.close()
})

ipcMain.on('calendar:close', () => {
  calendarWindow?.close()
})

// ── IPC: Clock Picker ────────────────────────────────────────
let clockWindow = null
ipcMain.handle('clock:open', (_, currentTime) => {
  if (clockWindow) { 
    clockWindow.focus()
    return 
  }
  
  // Get add-task window position to position clock picker above it
  let clockX, clockY
  if (addTaskWindow && !addTaskWindow.isDestroyed()) {
    const [addTaskX, addTaskY] = addTaskWindow.getPosition()
    const addTaskBounds = addTaskWindow.getBounds()
    // Center clock picker horizontally above add-task window
    clockX = addTaskX + Math.floor((addTaskBounds.width - 360) / 2)
    clockY = addTaskY + 80 // Position slightly below the top
  } else {
    // Fallback to center of screen
    const { width, height } = screen.getPrimaryDisplay().workAreaSize
    clockX = Math.floor(width / 2 - 180)
    clockY = Math.floor(height / 2 - 140)
  }
  
  clockWindow = new BrowserWindow({
    width: 360,
    height: 280,
    x: clockX,
    y: clockY,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: true,
    backgroundColor: '#FFFFFF',
    parent: addTaskWindow || companionWindow,
    modal: false, // Changed to false so it can be dragged
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
  
  clockWindow.loadFile(path.join(__dirname, '../renderer/pages/clock-picker.html'), {
    query: currentTime ? { time: currentTime } : {}
  })
  
  clockWindow.on('closed', () => { clockWindow = null })
})

ipcMain.on('clock:selectTime', (_, time) => {
  // Send selected time back to the parent window (add-task)
  if (addTaskWindow && !addTaskWindow.isDestroyed()) {
    addTaskWindow.webContents.send('clock:timeSelected', time)
  }
  clockWindow?.close()
})

ipcMain.on('clock:close', () => {
  clockWindow?.close()
})



// ── App lifecycle ────────────────────────────────────────────

// Send stored theme to every window once it finishes loading.
// Read settings.character as the authoritative source; fall back to settings.theme.
app.on('browser-window-created', (_, win) => {
  win.webContents.on('did-finish-load', () => {
    try {
      const settings = store.get('settings') || {}
      const theme = settings.character || settings.theme || 'agnesTachyon'
      win.webContents.send('theme:apply', theme)
    } catch (_err) { /* window may be closing */ }
  })
})

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
  if (characterProcess) {
    try { characterProcess.kill() } catch (_) {}
    characterProcess = null
  }
  if (process.platform === 'win32') {
    Object.values(CHARACTER_EXE_MAP).forEach(relPath => {
      const exeName = path.basename(relPath)
      try { execSync(`taskkill /IM "${exeName}" /F`, { timeout: 3000 }) } catch (_) {}
    })
  }
})



app.on('activate', () => {
  if (!companionWindow && !settingsWindow) createSettingsWindow()
})