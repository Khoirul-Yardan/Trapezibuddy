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

  // ── Python Character Control ──────────────────────────────
  python: {
    showBubble:    (text, duration) => ipcRenderer.send('python:showBubble', { text, duration }),
    hideCharacter: ()               => ipcRenderer.send('python:hideCharacter'),
    showCharacter: ()               => ipcRenderer.send('python:showCharacter'),
  },

  // ── Bubble Notifications (task events) ────────────────────
  bubble: {
    taskAdded:     (data) => ipcRenderer.send('bubble:taskAdded', data),
    taskCompleted: (data) => ipcRenderer.send('bubble:taskCompleted', data),
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
  },

  // ── Theme ─────────────────────────────────────────────────
  theme: {
    apply: (theme) => ipcRenderer.send('theme:apply', theme),
  },

  onThemeApply: (cb) => ipcRenderer.on('theme:apply', (_, theme) => cb(theme)),

})