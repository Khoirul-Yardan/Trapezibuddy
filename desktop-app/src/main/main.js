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

// ── Character processes ───────────────────────────────────────
let agnesProcess = null
let goldshipProcess = null

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

function startPythonCompanion(characterSize = 60) {
  // Stub - no longer used, only external .exe files (Agnes, Goldship)
  logger.info('Python companion deprecated - using external executables only')
}

function stopPythonCompanion() {
  // Stub - no longer used
}

// ── IPC Bridge (deprecated) ──────────────────────────────────
function sendCommandToPython(command, params = {}) {
  // Stub - no longer used
}

function readPythonState() {
  // Stub - no longer used
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
    windowBounds: {
      companion: null,
      minimized: null,
    },
  }
})

let characterSelectionWindow = null
let settingsWindow    = null
let companionWindow   = null
let minimizedWindow   = null
let addTaskWindow     = null
let confirmTaskWindow = null
let bubbleWindow      = null
let tray              = null
let selectedCharacter = 'agnes' // Default to 'agnes' character
const isDev           = process.argv.includes('--dev')

// ═══════════════════════════════════════════════════════════════
// WINDOW SIZE CONFIGURATION
// ═══════════════════════════════════════════════════════════════
// Customize window sizes here. All dimensions in pixels (px)
// Companion: character display window
// Bubble: speech bubble at top-center
// Minimized: collapsed header bar
// AddTask: task creation modal
// ConfirmTask: task completion modal
// ═══════════════════════════════════════════════════════════════
const COMPANION_SIZE = { width: 300, height: 700 }    // Character window
const BUBBLE_SIZE = { width: 320, height: 140 }       // Notification bubble
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
  
  // Position bubble at screen center top as notification (not above character)
  // Optimized: reduced frequency from 30ms to 100ms for lower RAM usage
  setInterval(() => {
    if (!bubbleWindow) return
    
    const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize
    
    // Fixed position: center-top of screen
    const x = Math.floor(screenWidth / 2 - BUBBLE_SIZE.width / 2)
    const y = 30  // 30px from top
    
    bubbleWindow.setBounds({ x, y, width: BUBBLE_SIZE.width, height: BUBBLE_SIZE.height })
    if (!bubbleWindow.isVisible()) bubbleWindow.showInactive()
  }, 100)  // Optimized: reduced frequency for lower RAM usage
  
  bubbleWindow.webContents.on('did-finish-load', () => {
    logger.info('Bubble window loaded - ensuring it starts empty')
    // Ensure bubble is completely empty on startup
    bubbleWindow.webContents.send('bubble:clear')
  })
  
  bubbleWindow.on('closed', () => { bubbleWindow = null })
}

// ── Character Selection Window ───────────────────────────────
function createCharacterSelectionWindow() {
  if (characterSelectionWindow) return

  try {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    characterSelectionWindow = new BrowserWindow({
      width: 540,
      height: 440,
      x: Math.floor(width / 2 - 270),
      y: Math.floor(height / 2 - 220),
      frame: false,
      resizable: false,
      hasShadow: true,
      icon: getAppIcon(),
      webPreferences: {
        nodeIntegration:  false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      }
    })

    const charSelectPath = path.join(__dirname, '../renderer/pages/character-selection.html')
    logger.info(`Loading character selection from: ${charSelectPath}`)
    
    characterSelectionWindow.loadFile(charSelectPath)
      .catch(err => {
        logger.error(`Error loading character-selection.html: ${err.message}`)
      })

    characterSelectionWindow.webContents.on('did-finish-load', () => {
      logger.info(`Character selection window loaded successfully`)
      if (isDev) {
        characterSelectionWindow.webContents.openDevTools()
      }
    })

    characterSelectionWindow.on('closed', () => { 
      logger.info(`Character selection window closed`)
      characterSelectionWindow = null 
    })
  } catch (err) {
    logger.error(`Error creating character selection window: ${err.message}`)
    logger.error(err.stack)
  }
}

// ── Settings Window ──────────────────────────────────────────
function createSettingsWindow() {
  try {
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

    const settingsPath = path.join(__dirname, '../renderer/pages/settings.html')
    logger.info(`Loading settings window from: ${settingsPath}`)
    
    settingsWindow.loadFile(settingsPath)
      .catch(err => {
        logger.error(`Error loading settings.html: ${err.message}`)
      })

    settingsWindow.webContents.on('did-finish-load', () => {
      logger.info(`Settings window loaded successfully`)
    })

    settingsWindow.webContents.on('crashed', () => {
      logger.error(`Settings window crashed`)
    })

    wireBoundsPersistence(settingsWindow, 'settings')
    settingsWindow.on('closed', () => { 
      logger.info(`Settings window closed`)
      settingsWindow = null 
    })
  } catch (err) {
    logger.error(`Error creating settings window: ${err.message}`)
    logger.error(err.stack)
  }
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

  // Anchor minimized bar to companion window
  const anchor = companionWindow
    ? { key: 'companion', size: COMPANION_SIZE, bounds: companionWindow.getBounds() }
    : null

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
      const cx = mb.x - Math.floor((COMPANION_SIZE.width - mb.width) / 2)
      const cy = mb.y
      store.set('windowBounds.companion', { x: cx, y: cy, width: COMPANION_SIZE.width, height: COMPANION_SIZE.height })
      store.set('windowPosition', { x: cx, y: cy }) // legacy
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
  characterSelectionWindow?.close()
  if (!companionWindow) app.quit()
})


ipcMain.on('window:startApp', (_, data) => {
  const size = data?.characterSize ?? 60
  settingsWindow?.close()
  characterSelectionWindow?.close()
  createCompanionWindow(size)
  createTray()
})

// ── IPC: Character Selection ──────────────────────────────────
ipcMain.on('character:select', (_, character) => {
  try {
    selectedCharacter = character
    logger.info(`Character selected: ${character}`)
    
    if (characterSelectionWindow) {
      characterSelectionWindow.close()
      logger.info(`Character selection window closed`)
    }
    
    // Launch character executable (Agnes or Goldship)
    let exePath = ''
    let exeName = ''
    
    if (character === 'agnes') {
      exePath = path.join(getProjectRoot(), 'assets', 'Agnes', 'Agnes.exe')
      exeName = 'Agnes'
    } else if (character === 'goldship') {
      exePath = path.join(getProjectRoot(), 'assets', 'GoldShip', 'goldship.exe')
      exeName = 'Goldship'
    }
    
    if (exePath && fs.existsSync(exePath)) {
      logger.info(`Launching ${exeName}.exe`)
      try {
        // Spawn WITHOUT detached so we can control the process
        const proc = spawn(exePath, [])
        
        // Track the process so we can kill it later
        if (character === 'agnes') {
          agnesProcess = proc
          agnesProcess.on('close', () => {
            agnesProcess = null
            logger.info('Agnes process ended')
          })
        } else if (character === 'goldship') {
          goldshipProcess = proc
          goldshipProcess.on('close', () => {
            goldshipProcess = null
            logger.info('Goldship process ended')
          })
        }
        
        logger.info(`${exeName} launched successfully (PID: ${proc.pid})`)
      } catch (err) {
        logger.error(`Failed to launch ${exeName}: ${err.message}`)
      }
    } else {
      logger.error(`${exeName}.exe not found at ${exePath}`)
    }
    
    // Go directly to companion window
    setTimeout(() => {
      createCompanionWindow(60)
      createTray()
    }, 500)
  } catch (err) {
    logger.error(`Error in character:select handler: ${err.message}`)
    logger.error(err.stack)
  }
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
  if (companionWindow && companionWindow.isVisible && companionWindow.isVisible()) {
    companionWindow.hide()
  }

  createMinimizedWindow(lastActivePage)
})

ipcMain.on('window:restore', (_, page) => {
  const target = page || lastActivePage || 'active'

  // If minimized header exists, use its current bounds
  const minimizedBounds = (() => {
    try {
      return minimizedWindow?.getBounds?.() ?? null
    } catch {
      return null
    }
  })()

  // Close header
  minimizedWindow?.close()

  // Restore companion window
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

  // reset lastActivePage
  lastActivePage = 'active'
})

ipcMain.on('window:hide',     () => companionWindow?.hide())

ipcMain.handle('window:getSelectedCharacter', () => selectedCharacter || 'agnes')

ipcMain.on('window:exitApp', () => {
  logger.info('Exiting app: terminating all character processes...')
  // Kill all character processes with SIGKILL to ensure termination
  if (agnesProcess) {
    try {
      logger.info(`Force-killing Agnes (PID: ${agnesProcess.pid})...`)
      agnesProcess.kill('SIGKILL')
      agnesProcess = null
    } catch (err) {
      logger.error(`Failed to kill Agnes on exit: ${err.message}`)
    }
  }
  if (goldshipProcess) {
    try {
      logger.info(`Force-killing GoldShip (PID: ${goldshipProcess.pid})...`)
      goldshipProcess.kill('SIGKILL')
      goldshipProcess = null
    } catch (err) {
      logger.error(`Failed to kill GoldShip on exit: ${err.message}`)
    }
  }
  // Close all windows and quit
  companionWindow?.close()
  minimizedWindow?.close()
  addTaskWindow?.close()
  confirmTaskWindow?.close()
  settingsWindow?.close()
  characterSelectionWindow?.close()
  logger.info('All processes terminated, quitting app')
  app.quit()
})

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

// ── IPC: Focus session → hide/show Agnes character ──────────
ipcMain.on('agnes:hideCharacter', () => {
  // Kill agnes.exe if running (forcefully)
  if (agnesProcess) {
    try {
      logger.info(`Terminating Agnes (PID: ${agnesProcess.pid})...`)
      agnesProcess.kill('SIGKILL') // Use SIGKILL for forceful termination
      logger.info('Agnes process force-killed')
      agnesProcess = null
    } catch (err) {
      logger.error(`Failed to kill Agnes: ${err.message}`)
      agnesProcess = null
    }
  }
})

ipcMain.on('agnes:showCharacter', () => {
  // Relaunch agnes.exe if not running
  if (!agnesProcess) {
    try {
      const agnesPath = path.join(getProjectRoot(), 'assets', 'Agnes', 'Agnes.exe')
      if (fs.existsSync(agnesPath)) {
        agnesProcess = spawn(agnesPath, [])
        agnesProcess.on('close', () => {
          agnesProcess = null
          logger.info('Agnes process ended')
        })
        // Ensure bubble window exists when Agnes is shown
        createBubbleWindow()
        logger.info(`Agnes process relaunched (PID: ${agnesProcess.pid})`)
      } else {
        logger.error(`Agnes.exe not found at ${agnesPath}`)
      }
    } catch (err) {
      logger.error(`Failed to relaunch Agnes: ${err.message}`)
    }
  }
})

// ── IPC: Focus session → hide/show GoldShip character ───────
ipcMain.on('goldship:hideCharacter', () => {
  // Kill goldship.exe if running (forcefully)
  if (goldshipProcess) {
    try {
      logger.info(`Terminating GoldShip (PID: ${goldshipProcess.pid})...`)
      goldshipProcess.kill('SIGKILL') // Use SIGKILL for forceful termination
      logger.info('GoldShip process force-killed')
      goldshipProcess = null
    } catch (err) {
      logger.error(`Failed to kill GoldShip: ${err.message}`)
      goldshipProcess = null
    }
  }
})

ipcMain.on('goldship:showCharacter', () => {
  // Relaunch goldship.exe if not running
  if (!goldshipProcess) {
    try {
      const goldshipPath = path.join(getProjectRoot(), 'assets', 'GoldShip', 'goldship.exe')
      if (fs.existsSync(goldshipPath)) {
        goldshipProcess = spawn(goldshipPath, [])
        goldshipProcess.on('close', () => {
          goldshipProcess = null
          logger.info('GoldShip process ended')
        })
        // Ensure bubble window exists when GoldShip is shown
        createBubbleWindow()
        logger.info(`GoldShip process relaunched (PID: ${goldshipProcess.pid})`)
      } else {
        logger.error(`goldship.exe not found at ${goldshipPath}`)
      }
    } catch (err) {
      logger.error(`Failed to relaunch GoldShip: ${err.message}`)
    }
  }
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

ipcMain.on('bubble:hide', () => {
  if (bubbleWindow) {
    bubbleWindow.webContents.send('bubble:hide')
  }
})

// ── IPC: Generic bubble show (for focus, etc) ─────────────────
ipcMain.on('bubble:show', (_, data) => {
  if (bubbleWindow) {
    bubbleWindow.webContents.send('bubble:show', { text: data?.text || '' })
  }
})

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  const page = getDevPage()
  if (page && createStandalonePageWindow(page)) {
    return
  }
  createCharacterSelectionWindow()
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

// (no demo IPC; demo button selects Goldship card in renderer)