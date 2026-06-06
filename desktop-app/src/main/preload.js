// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('trapezi', {

  // ── Tasks ─────────────────────────────────────────────────
  tasks: {
    getAll:   ()     => ipcRenderer.invoke('tasks:getAll'),
    add:      (task) => ipcRenderer.invoke('tasks:add', task),
    complete: (id)   => ipcRenderer.invoke('tasks:complete', id),
    delete:   (id)   => ipcRenderer.invoke('tasks:delete', id),
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    get: ()       => ipcRenderer.invoke('settings:get'),
    set: (data)   => ipcRenderer.invoke('settings:set', data),
  },

  // ── Chat ─────────────────────────────────────────────────
  chat: {
    sendMessage: (message) => ipcRenderer.invoke('chat:sendMessage', message),
  },

  // ── Window ────────────────────────────────────────────────
  window: {
    // Companion
    minimize:         ()             => ipcRenderer.send('window:minimize'),
    hide:             ()             => ipcRenderer.send('window:hide'),
    restore:          (page)         => ipcRenderer.send('window:restore', page),

    // Add Task modal
    openAddTask:      ()             => ipcRenderer.invoke('modal:openAddTask'),
    closeAddTask:     ()             => ipcRenderer.send('modal:closeAddTask'),
    taskAdded:        ()             => ipcRenderer.send('modal:taskAdded'),

    // Confirm Task modal
    openConfirmTask:  (id, name)     => ipcRenderer.invoke('modal:openConfirmTask', { taskId: id, taskName: name }),
    closeConfirmTask: ()             => ipcRenderer.send('modal:closeConfirmTask'),
    taskCompleted:    ()             => ipcRenderer.send('modal:taskCompleted'),

    // Refresh listener
    onRefreshTasks:   (cb)           => ipcRenderer.on('refresh:tasks', cb),
    // Navigation listener from main
    onNavigate:       (cb)           => ipcRenderer.on('navigate', (_, page) => cb(page)),

    // Chat window
    openChat:         ()             => ipcRenderer.invoke('window:openChat'),
    closeChat:        ()             => ipcRenderer.send('window:closeChat'),

    // Settings window
    closeSettings:    ()             => ipcRenderer.send('window:closeSettings'),
    startApp:         (data)         => ipcRenderer.send('window:startApp', data),

    // Benar-benar keluar aplikasi
    close:            ()             => ipcRenderer.send('window:forceQuit'),
    exitApp:          ()             => ipcRenderer.send('window:forceQuit'),

    // Get current character
    getSelectedCharacter: () => ipcRenderer.invoke('settings:get').then(s => s.character || 'agnesTachyon'),
  },

  // ── Character Control ──────────────────────────────────────
  agnes: {
    showCharacter: () => ipcRenderer.send('character:show', 'agnesTachyon'),
    hideCharacter: () => ipcRenderer.send('character:hide', 'agnesTachyon'),
  },
  goldship: {
    showCharacter: () => ipcRenderer.send('character:show', 'goldship'),
    hideCharacter: () => ipcRenderer.send('character:hide', 'goldship'),
  },

  // ── Bubble ────────────────────────────────────────────────
  bubble: {
    show: (text) => ipcRenderer.send('bubble:show', text),
    hide: () => ipcRenderer.send('bubble:hide'),
    taskAdded: (data) => ipcRenderer.send('bubble:taskAdded', data),
    taskCompleted: (data) => ipcRenderer.send('bubble:taskCompleted', data),
  },

  // ── Theme ─────────────────────────────────────────────────
  theme: {
    apply: (theme) => ipcRenderer.send('theme:apply', theme),
  },

  onThemeApply: (cb) => ipcRenderer.on('theme:apply', (_, theme) => cb(theme)),

  // ── Language ──────────────────────────────────────────────
  language: {
    get: () => ipcRenderer.invoke('language:get'),
    set: (lang) => ipcRenderer.send('language:set', lang),
    onChange: (cb) => ipcRenderer.on('language:changed', (_, lang) => cb(lang))
  },

  // ── Calendar ──────────────────────────────────────────────
  calendar: {
    open: (currentDate) => ipcRenderer.invoke('calendar:open', currentDate),
    selectDate: (date) => ipcRenderer.send('calendar:selectDate', date),
    close: () => ipcRenderer.send('calendar:close'),
    onDateSelected: (cb) => ipcRenderer.on('calendar:dateSelected', (_, date) => cb(date))
  },

  // ── Clock ─────────────────────────────────────────────────
  clock: {
    open: (currentTime) => ipcRenderer.invoke('clock:open', currentTime),
    selectTime: (time) => ipcRenderer.send('clock:selectTime', time),
    close: () => ipcRenderer.send('clock:close'),
    onTimeSelected: (cb) => ipcRenderer.on('clock:timeSelected', (_, time) => cb(time))
  },

})