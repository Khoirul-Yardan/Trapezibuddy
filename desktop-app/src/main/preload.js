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

  // ── Window ────────────────────────────────────────────────
  window: {
    // Companion
    minimize:         ()             => ipcRenderer.send('window:minimize'),
    hide:             ()             => ipcRenderer.send('window:hide'),

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

    // Chat window
    openChat:         ()             => ipcRenderer.invoke('window:openChat'),
    closeChat:        ()             => ipcRenderer.send('window:closeChat'),

    // Settings window
    closeSettings:    ()             => ipcRenderer.send('window:closeSettings'),
    startApp:         (data)         => ipcRenderer.send('window:startApp', data),
  },

})