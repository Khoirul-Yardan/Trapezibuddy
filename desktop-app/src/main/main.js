// src/main/main.js
// TrapeziBuddy — Electron Main Process
// Handles: window creation, system tray, IPC, data storage

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
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
let companionWindow  = null
let addTaskWindow    = null
let confirmTaskWindow = null
let chatWindow       = null
let tray            = null
const isDev         = process.argv.includes('--dev')

const projectRoot = path.resolve(__dirname, '../../..')

// ── Helper: Get page parameter untuk dev mode ────────────────
function getDevPage() {
  const pageArg = process.argv.find(arg => arg.startsWith('--page='))
  return pageArg ? pageArg.split('=')[1] : null
}

function getPythonExecutable() {
  const venvPython = process.platform === 'win32'
    ? path.join(projectRoot, 'venv', 'Scripts', 'python.exe')
    : path.join(projectRoot, 'venv', 'bin', 'python')

  if (fs.existsSync(venvPython)) return venvPython
  return process.platform === 'win32' ? 'python' : 'python3'
}

function callPythonChat(message) {
  return new Promise((resolve, reject) => {
    const python = getPythonExecutable()
    const bridgeScript = path.join(projectRoot, 'chat_bridge.py')

    if (!fs.existsSync(bridgeScript)) {
      reject(new Error('chat_bridge.py tidak ditemukan'))
      return
    }

    const child = spawn(
      python,
      [bridgeScript, '--message', message, '--execute-actions'],
      { cwd: projectRoot }
    )

    let stdout = ''
    let stderr = ''

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('Python chat timeout (>35s)'))
    }, 35000)

    child.stdout.on('data', chunk => { stdout += chunk.toString() })
    child.stderr.on('data', chunk => { stderr += chunk.toString() })

    child.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })

    child.on('close', code => {
      clearTimeout(timer)
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Python exited with code ${code}`))
        return
      }

      try {
        const payload = JSON.parse(stdout.trim())
        resolve(payload)
      } catch (err) {
        reject(new Error(`Invalid bridge response: ${stdout.trim() || '(empty)'}`))
      }
    })
  })
}

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
    frame:           false,
    transparent:     true,
    alwaysOnTop:     true,
    skipTaskbar:     false,
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
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const menu = Menu.buildFromTemplate([
    {
      label: 'Buka',
      click: () => companionWindow?.show()
    },
    {
      type: 'separator'
    },
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

ipcMain.handle('window:openChat', () => {
  if (chatWindow) {
    chatWindow.focus()
    return
  }
 
  const { width } = screen.getPrimaryDisplay().workAreaSize
  const [px, py]  = companionWindow.getPosition()
 
  chatWindow = new BrowserWindow({
    width:       300,
    height:      680,
    x:           px - 320,   // muncul di sebelah kiri companion panel
    y:           py,
    frame:       false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable:   false,
    hasShadow:   true,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })
 
  chatWindow.loadFile(
    path.join(__dirname, '../renderer/pages/chat.html')
  )
 
  if (isDev) {
    chatWindow.webContents.openDevTools({ mode: 'detach' })
  }
 
  chatWindow.on('closed', () => { chatWindow = null })
})
 
ipcMain.on('window:closeChat', () => {
  chatWindow?.close()
})

ipcMain.handle('chat:sendMessage', async (_, message) => {
  if (!message || typeof message !== 'string') {
    return { ok: false, response: 'Pesan tidak valid.' }
  }

  try {
    const result = await callPythonChat(message)
    return {
      ok: true,
      response: result.response || 'Aku sedang mikir... coba ulangi ya.',
      intent: result.intent || 'unknown',
      actionsExecuted: result.actions_executed || 0,
    }
  } catch (err) {
    return {
      ok: false,
      response: `Backend Python error: ${err.message}`,
      intent: 'error',
      actionsExecuted: 0,
    }
  }
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

// ── Modal Windows ─────────────────────────────────────────────
// Buka Add Task Modal
ipcMain.handle('modal:openAddTask', () => {
  if (addTaskWindow) {
    addTaskWindow.focus()
    return
  }

  const [px, py] = companionWindow.getPosition()
  const [pw]     = companionWindow.getSize()

  addTaskWindow = new BrowserWindow({
    width:  300,
    height: 540,
    x:      px - 10,
    y:      py + 80,
    frame:         false,
    transparent:   true,
    alwaysOnTop:   true,
    skipTaskbar:   true,
    resizable:     false,
    hasShadow:     true,
    parent:        companionWindow,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  addTaskWindow.loadFile(
    path.join(__dirname, '../renderer/pages/add-task.html')
  )

  addTaskWindow.on('closed', () => { addTaskWindow = null })
})

ipcMain.on('modal:closeAddTask', () => {
  addTaskWindow?.close()
})

// Buka Confirm Task Modal
ipcMain.handle('modal:openConfirmTask', (_, { taskId, taskName }) => {
  if (confirmTaskWindow) {
    confirmTaskWindow.focus()
    return
  }

  const [px, py] = companionWindow.getPosition()

  confirmTaskWindow = new BrowserWindow({
    width:  280,
    height: 380,
    x:      px + 10,
    y:      py + 200,
    frame:         false,
    transparent:   true,
    alwaysOnTop:   true,
    skipTaskbar:   true,
    resizable:     false,
    hasShadow:     true,
    parent:        companionWindow,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  confirmTaskWindow.loadFile(
    path.join(__dirname, '../renderer/pages/confirm-task.html'),
    { query: { taskId, taskName } }
  )

  confirmTaskWindow.on('closed', () => { confirmTaskWindow = null })
})

ipcMain.on('modal:closeConfirmTask', () => {
  confirmTaskWindow?.close()
})

// Notify companion window untuk refresh setelah task selesai
ipcMain.on('modal:taskCompleted', () => {
  companionWindow?.webContents.send('refresh:tasks')
  confirmTaskWindow?.close()
})

ipcMain.on('modal:taskAdded', () => {
  companionWindow?.webContents.send('refresh:tasks')
  addTaskWindow?.close()
})

// ── App lifecycle ────────────────────────────────────────────
app.whenReady().then(() => {
  // Dev mode: jika ada --page parameter, buka page spesifik
  const devPage = isDev ? getDevPage() : null
  
  if (devPage) {
    // Create window untuk page spesifik
    const pageConfig = {
      'chat': { file: 'chat.html', width: 300, height: 680 },
      'add-task': { file: 'add-task.html', width: 300, height: 540 },
      'confirm-task': { file: 'confirm-task.html', width: 280, height: 380 },
    }
    
    const config = pageConfig[devPage] || pageConfig['chat']
    const devWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      hasShadow: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      }
    })
    
    devWindow.loadFile(
      path.join(__dirname, `../renderer/pages/${config.file}`)
    )
    
    // Open dev tools otomatis
    devWindow.webContents.openDevTools({ mode: 'detach' })
    
    devWindow.on('closed', () => { app.quit() })
  } else {
    // Normal mode: create companion window + tray
    createCompanionWindow()
    createTray()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Jangan quit — biarkan tray tetap aktif
  }
})

app.on('activate', () => {
  if (!companionWindow) createCompanionWindow()
})
