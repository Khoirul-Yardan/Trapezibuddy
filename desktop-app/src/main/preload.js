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
  // ── Character Selection ────────────────────────────
  character: {
    select: (character) => ipcRenderer.send('character:select', character),
  },

  // ── Agnes Character Control ──────────────────────────────
  agnes: {
    hideCharacter: () => ipcRenderer.send('agnes:hideCharacter'),
    showCharacter: () => ipcRenderer.send('agnes:showCharacter'),
  },

  // ── GoldShip Character Control ────────────────────────────
  goldship: {
    hideCharacter: () => ipcRenderer.send('goldship:hideCharacter'),
    showCharacter: () => ipcRenderer.send('goldship:showCharacter'),
  },

  // ── Python Character Control (DEPRECATED - use agnes/goldship) ──────────────────────────────
  python: {
    showBubble:    (text, duration) => ipcRenderer.send('bubble:taskAdded', { text, duration }),
    hideCharacter: () => ipcRenderer.send('agnes:hideCharacter'), // Try Agnes first
    showCharacter: () => ipcRenderer.send('agnes:showCharacter'),
  },

  // ── Bubble Notifications (task events) ────────────────────
  bubble: {
    show:          (text) => ipcRenderer.send('bubble:show', { text }),
    taskAdded:     (data) => ipcRenderer.send('bubble:taskAdded', data),
    taskCompleted: (data) => ipcRenderer.send('bubble:taskCompleted', data),
    hide:          ()     => ipcRenderer.send('bubble:hide'),
  },

  // ── Window ────────────────────────────────────────────────
  window: {
    // Companion
    minimize:         ()             => ipcRenderer.send('window:minimize'),
    hide:             ()             => ipcRenderer.send('window:hide'),
    restore:          (page)         => ipcRenderer.send('window:restore', page),
    getSelectedCharacter: ()         => ipcRenderer.invoke('window:getSelectedCharacter'),

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

    // Settings window
    closeSettings:    ()             => ipcRenderer.send('window:closeSettings'),
    startApp:         (data)         => ipcRenderer.send('window:startApp', data),
    exitApp:          ()             => ipcRenderer.send('window:exitApp'),
  },

})