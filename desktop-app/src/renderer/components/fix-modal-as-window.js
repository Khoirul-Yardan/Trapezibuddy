// ─────────────────────────────────────────────────────────────
// FIX PROPER: Modal sebagai window terpisah di Electron
//
// TAMBAHKAN di main.js — di bagian IPC Handlers
// ─────────────────────────────────────────────────────────────

// ── Modal Windows ─────────────────────────────────────────────
let addTaskWindow    = null
let confirmTaskWindow = null

// Buka Add Task Modal
ipcMain.handle('modal:openAddTask', () => {
  if (addTaskWindow) {
    addTaskWindow.focus()
    return
  }

  const parent = companionWindow
  const [px, py] = parent.getPosition()
  const [pw]     = parent.getSize()

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

  // Pass task data via URL params
  const params = new URLSearchParams({ taskId, taskName })
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


// ─────────────────────────────────────────────────────────────
// TAMBAHKAN di preload.js — di bagian window:
// ─────────────────────────────────────────────────────────────

/*
  window: {
    minimize:          () => ipcRenderer.send('window:minimize'),
    hide:              () => ipcRenderer.send('window:hide'),

    // ← TAMBAHKAN ini:
    openAddTask:       ()             => ipcRenderer.invoke('modal:openAddTask'),
    closeAddTask:      ()             => ipcRenderer.send('modal:closeAddTask'),
    openConfirmTask:   (taskId, name) => ipcRenderer.invoke('modal:openConfirmTask', { taskId, taskName: name }),
    closeConfirmTask:  ()             => ipcRenderer.send('modal:closeConfirmTask'),
    taskCompleted:     ()             => ipcRenderer.send('modal:taskCompleted'),
    taskAdded:         ()             => ipcRenderer.send('modal:taskAdded'),

    onRefreshTasks: (cb) => ipcRenderer.on('refresh:tasks', cb),
  },
*/


// ─────────────────────────────────────────────────────────────
// UBAH di companion.js:
// ─────────────────────────────────────────────────────────────

/*
  // Ganti tombol add task:
  openBtn.addEventListener('click', () => {
    api.window.openAddTask()   // ← buka sebagai window baru
  })

  // Ganti handleTaskCheck:
  function handleTaskCheck(taskId, taskName) {
    api.window.openConfirmTask(taskId, taskName)  // ← window baru
  }

  // Listen refresh dari main:
  api.window.onRefreshTasks(async () => {
    await loadTasks()
    updateMoodCard()
    renderTaskList()
  })
*/
