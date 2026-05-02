// src/main/main.js
// TrapeziBuddy — Electron Main Process

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron')
const path  = require('path')
const Store = require('electron-store')
const { spawn } = require('child_process')
const fs = require('fs')

// ── Simple Logger ──────────────────────────────────────────────
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
}

// ── Python companion process ──────────────────────────────────
let pythonProcess = null

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

  const safeSize = Number.isFinite(characterSize) ? characterSize : 60
  const projectRoot = getProjectRoot()
  
  if (app.isPackaged) {
    // In production, backend exe is in app.asar.unpacked/backend/
    const backendExe = path.join(projectRoot, 'backend', 'main.exe')
    logger.info(`Starting production python backend at: ${backendExe}`)
    
    if (!fs.existsSync(backendExe)) {
      logger.error(`ERROR: Backend executable not found at ${backendExe}`)
      logger.error(`Please ensure main.exe was built and included in the installer.`)
      return
    }
    
    pythonProcess = spawn(backendExe, ['--skip-settings', '--character-size', String(safeSize)], {
      cwd: path.dirname(backendExe),
      detached: false,
      stdio: 'ignore',
    })
  } else {
    const pythonScript = path.join(projectRoot, 'main.py')
    const pythonExec = getPythonExecutable()
    logger.info(`Starting dev python backend: ${pythonExec} ${pythonScript}`)
    pythonProcess = spawn(pythonExec, [pythonScript, '--skip-settings', '--character-size', String(safeSize)], {
      detached: false,
      stdio: 'ignore',
    })
  }

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python companion:', err)
    logger.error(`Python companion spawn error: ${err.message}`)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python companion exited with code ${code}`)
    logger.info(`Python companion exited with code ${code}`)
    pythonProcess = null
  })
}

function stopPythonCompanion() {
  if (pythonProcess) {
    pythonProcess.kill()
    pythonProcess = null
  }
}

// ── IPC Bridge to Python (file-based) ─────────────────────────
const IPC_DIR = app.isPackaged 
  ? path.join(getProjectRoot(), 'backend', '.ipc')
  : path.join(getProjectRoot(), '.ipc')
const IPC_COMMANDS_FILE = path.join(IPC_DIR, 'electron_commands.json')
const IPC_STATE_FILE = path.join(IPC_DIR, 'python_state.json')

function sendCommandToPython(command, params = {}) {
  try {
    fs.mkdirSync(IPC_DIR, { recursive: true })
    const data = { command, id: Date.now(), ...params }
    fs.writeFileSync(IPC_COMMANDS_FILE, JSON.stringify(data))
    logger.info(`[IPC] Sent: ${command}`)
  } catch (err) {
    logger.error(`[IPC] Send error: ${err.message}`)
  }
}

function readPythonState() {
  try {
    if (fs.existsSync(IPC_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(IPC_STATE_FILE, 'utf-8'))
    }
  } catch (e) { /* ignore */ }
  return null
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
const BUBBLE_SIZE = { width: 320, height: 140 }       // Speech bubble
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
    hasShadow: true,
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

// ── Bubble Window (Above Python Character) ───────────────────
function createBubbleWindow() {
  if (bubbleWindow) return

  bubbleWindow = new BrowserWindow({
    width: BUBBLE_SIZE.width,
    height: BUBBLE_SIZE.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    icon: getAppIcon(),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  bubbleWindow.setPosition(-2000, -2000)
  bubbleWindow.loadFile(path.join(__dirname, '../renderer/pages/bubble.html'))
  
  let lastBubbleText = ''
  
  // Keep bubble above Python character
  setInterval(() => {
    if (!bubbleWindow) return
    const state = readPythonState()
    
    if (state && state.visible) {
      const charWidth = state.width || 512
      const charHeight = state.height || 512
      
      const x = Math.floor(state.x + (charWidth / 2) - (BUBBLE_SIZE.width / 2))
      // Adjust y offset by +130px to account for the transparent space inside the 512x512 window
      // Character is 60% of 512px (bottom aligned), so its head starts around +200px
      const y = Math.floor(state.y - BUBBLE_SIZE.height + 130)
      
      bubbleWindow.setBounds({ x, y, width: BUBBLE_SIZE.width, height: BUBBLE_SIZE.height })
      if (!bubbleWindow.isVisible()) bubbleWindow.showInactive()
      
      // Trigger spontaneous bubble if Python passed it
      if (state.bubble_text && state.bubble_text !== lastBubbleText) {
        lastBubbleText = state.bubble_text
        bubbleWindow.webContents.send('bubble:show', { text: state.bubble_text })
        
        // Reset lastBubbleText after duration so same message can be shown again later
        setTimeout(() => {
          if (lastBubbleText === state.bubble_text) lastBubbleText = ''
        }, state.bubble_duration || 5000)
      }
    } else {
      if (bubbleWindow.isVisible()) bubbleWindow.hide()
    }
  }, 30)
  
  bubbleWindow.on('closed', () => { bubbleWindow = null })
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
    icon: getAppIcon(),
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
function createTray() {
  tray = new Tray(getAppIcon())
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

// ── Call Python Backend ──────────────────────────────────────
async function callPythonBackend(userMessage) {
  try {
    return new Promise((resolve, reject) => {
      const projectRoot = getProjectRoot()
      let python;
      
      if (app.isPackaged) {
        const backendExe = path.join(projectRoot, 'backend', 'main.exe')
        logger.info(`Spawning backend exe: ${backendExe}`)
        
        if (!fs.existsSync(backendExe)) {
          logger.error(`Backend exe not found: ${backendExe}`)
          reject(new Error(`Backend executable not found at ${backendExe}`))
          return
        }
        
        python = spawn(backendExe, [
          '--chat-bridge',
          '--message', userMessage,
          '--execute-actions'
        ], {
          cwd: path.dirname(backendExe),
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      } else {
        const pythonScript = path.join(projectRoot, 'main.py')
        const pythonExe = getPythonExecutable()
        logger.info(`Spawning python script: ${pythonScript}`)
        
        python = spawn(pythonExe, [
          pythonScript,
          '--chat-bridge',
          '--message', userMessage,
          '--execute-actions'
        ], {
          cwd: projectRoot,
          stdio: ['pipe', 'pipe', 'pipe'],
        })
      }

      let output = ''
      let error = ''

      python.stdout.on('data', (data) => {
        output += data.toString()
      })

      python.stderr.on('data', (data) => {
        error += data.toString()
      })

      python.on('close', (code) => {
        try {
          if (code !== 0) {
            logger.warn(`Python script exited with code ${code}: ${error}`)
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
          logger.error(`Failed to parse Python response: ${parseErr}`)
          logger.error(`Output was: ${output}`)
          logger.error(`Error was: ${error}`)
          reject(parseErr)
        }
      })

      python.on('error', (err) => {
        logger.error(`Failed to spawn Python process: ${err.message}`)
        reject(err)
      })
      
      // Timeout after 30 seconds
      setTimeout(() => {
        python.kill()
        reject(new Error('Python backend timeout'))
      }, 30000)
    })
  } catch (err) {
    logger.error(`Python backend error: ${err.message}`)
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
    // Also show AI response in Electron bubble
    if (bubbleWindow) {
      bubbleWindow.webContents.send('bubble:show', { text: response })
    }
    
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
  wireBoundsPersistence(chatWindow, 'chat')
  chatWindow.on('closed', () => { chatWindow = null })
})
ipcMain.on('window:closeChat', () => chatWindow?.close())

// ── IPC: Bubble above Python character ───────────────────────
ipcMain.on('python:showBubble', (_, data) => {
  const text = data?.text || ''
  if (text && bubbleWindow) {
    bubbleWindow.webContents.send('bubble:show', { text })
  }
})

// ── IPC: Focus session → hide/show Python character ──────────
ipcMain.on('python:hideCharacter', () => {
  sendCommandToPython('hide_character')
})

ipcMain.on('python:showCharacter', () => {
  sendCommandToPython('show_character')
})

// ── IPC: Task notifications → Bubble above character ─────────
ipcMain.on('bubble:taskAdded', (_, data) => {
  const name = data?.name || 'Task baru'
  const deadline = data?.deadline_date || ''
  const time = data?.deadline_time || ''
  const priority = data?.priority || 'Sedang'
  const cats = (data?.categories || []).join(', ') || '-'
  
  let bubbleText = `\uD83D\uDCCB Task baru: "${name}"\n`
  if (deadline) bubbleText += `\u23F0 Deadline: ${deadline} ${time}\n`
  bubbleText += `\u26A1 Prioritas: ${priority}`
  if (cats !== '-') bubbleText += ` | \uD83C\uDFF7 ${cats}`
  bubbleText += `\n\uD83D\uDCAA Semangat kerjakan ya!`
  
  if (bubbleWindow) {
    bubbleWindow.webContents.send('bubble:show', { text: bubbleText })
  }
})

ipcMain.on('bubble:taskCompleted', (_, data) => {
  const name = data?.name || 'Task'
  const msgs = [
    `\uD83C\uDF89 Yeey! "${name}" sudah selesai! Keren banget!`,
    `\u2728 Mantap! "${name}" done! Kamu hebat!`,
    `\uD83C\uDF1F Selamat! "${name}" completed! Lanjutkan!`,
    `\uD83D\uDCAA "${name}" beres! Satu lagi selesai!`,
  ]
  const bubbleText = msgs[Math.floor(Math.random() * msgs.length)]
  if (bubbleWindow) {
    bubbleWindow.webContents.send('bubble:show', { text: bubbleText })
  }
})

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  const page = getDevPage()
  if (page && createStandalonePageWindow(page)) {
    return
  }
  createSettingsWindow()
  createBubbleWindow()
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