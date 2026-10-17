// Every ipcMain handler. The renderer-facing surface is declared in preload.js.
const { app, ipcMain } = require('electron')
const { store, getCharacter, DEFAULT_CHARACTER } = require('./store')
const character = require('./character')
const windows = require('./windows')
const { createTray, rebuildMenu } = require('./tray')

const on = ipcMain.on.bind(ipcMain)
const handle = ipcMain.handle.bind(ipcMain)

function registerIpc() {
  // ── App / window lifecycle ─────────────────────────────────
  on('window:forceQuit', () => app.quit())

  on('window:startApp', (_, data) => {
    character.spawn(data?.character || getCharacter())
    windows.get('settings')?.close()
    windows.openCompanion()
    createTray()
  })

  on('window:closeSettings', () => {
    windows.get('settings')?.close()
    windows.get('appSettings')?.close()
    if (!windows.get('companion')) app.quit()
  })

  on('window:hide', () => windows.get('companion')?.hide())

  on('window:minimize', () => {
    windows.get('companion')?.hide()
    windows.openMinimized()
  })

  on('window:restore', (_, page) => {
    // The gear icon in the minimized bar opens app settings instead of the companion.
    if (page === 'settings') {
      windows.get('minimized')?.hide()
      windows.openAppSettings()
      return
    }

    // The bar's position is the source of truth for where the companion reappears.
    const minimized = windows.get('minimized')
    if (minimized) {
      store.set('windowBounds.companion', windows.companionBoundsFromMinimized(minimized.getBounds()))
      minimized.close()
    }

    if (!windows.get('companion')) windows.openCompanion()
    const companion = windows.get('companion')
    if (minimized) companion.setBounds(windows.savedBounds('companion', companion.getBounds()))
    companion.show()
    companion.focus()
    companion.webContents.send('navigate', page || 'active')
  })

  // ── Tasks ──────────────────────────────────────────────────
  const updateTask = (id, change) => {
    const tasks = store.get('tasks')
    const i = tasks.findIndex((t) => t.id === id)
    if (i === -1) return null
    tasks[i] = { ...tasks[i], ...change(tasks[i]) }
    store.set('tasks', tasks)
    return tasks[i]
  }

  handle('tasks:getAll', () => store.get('tasks'))

  handle('tasks:add', (_, task) => {
    const created = {
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
    store.set('tasks', [...store.get('tasks'), created])
    return created
  })

  handle('tasks:complete', (_, id) =>
    updateTask(id, () => ({ is_done: true, completed_at: new Date().toISOString() })))

  handle('tasks:update', (_, id, data) => updateTask(id, () => data))

  handle('tasks:delete', (_, id) => {
    store.set('tasks', store.get('tasks').filter((t) => t.id !== id))
    return true
  })

  // ── Settings ───────────────────────────────────────────────
  handle('settings:get', () => store.get('settings'))

  // Merges into the stored settings, so a window that only knows some keys can't erase the rest.
  handle('settings:set', (_, data) => {
    const prev = store.get('settings')
    const next = { ...prev, ...data }
    store.set('settings', next)

    if (next.doNotDisturb) {
      character.killAll()
    } else if (prev.doNotDisturb) {
      character.spawn(next.character || DEFAULT_CHARACTER)
    } else if (data?.character && data.character !== character.lastLaunched()) {
      character.spawn(data.character)
    }
    return true
  })

  handle('language:get', () => store.get('settings.language', 'en'))

  on('language:set', (_, lang) => {
    store.set('settings.language', lang)
    rebuildMenu()
    windows.broadcast(
      ['companion', 'minimized', 'addTask', 'appSettings', 'settings'],
      'language:changed',
      lang,
    )
  })

  on('theme:apply', (_, theme) => {
    store.set('settings.character', theme)
    if (theme !== character.lastLaunched()) character.spawn(theme)
    windows.broadcast(['companion', 'minimized', 'addTask', 'appSettings'], 'theme:apply', theme)
  })

  on('character:show', (_, key) => character.spawn(key))
  on('character:hide', () => character.killAll())

  // ── Speech bubble ──────────────────────────────────────────
  // Each message is forwarded to the bubble window on the same channel it arrived on.
  for (const channel of ['bubble:show', 'bubble:taskAdded', 'bubble:taskCompleted']) {
    on(channel, (_, payload) => {
      const bubble = windows.ensureBubble()
      windows.sendWhenLoaded('bubble', channel, payload)
      bubble.show()
    })
  }
  on('bubble:hide', () => windows.get('bubble')?.hide())

  // ── Add-task modal and its pickers ─────────────────────────
  handle('modal:openAddTask', () => windows.openAddTask())
  on('modal:closeAddTask', () => windows.get('addTask')?.close())
  on('modal:taskAdded', () => {
    windows.send('companion', 'refresh:tasks')
    windows.get('addTask')?.close()
  })

  handle('calendar:open', (_, date) => windows.openPicker('calendar', 'calendar-picker', {
    height: 480, dy: 60, query: date ? { date } : undefined,
  }))
  on('calendar:selectDate', (_, date) => {
    windows.send('addTask', 'calendar:dateSelected', date)
    windows.get('calendar')?.close()
  })
  on('calendar:close', () => windows.get('calendar')?.close())

  handle('clock:open', (_, time) => windows.openPicker('clock', 'clock-picker', {
    height: 280, dy: 80, query: time ? { time } : undefined,
  }))
  on('clock:selectTime', (_, time) => {
    windows.send('addTask', 'clock:timeSelected', time)
    windows.get('clock')?.close()
  })
  on('clock:close', () => windows.get('clock')?.close())
}

module.exports = { registerIpc }
