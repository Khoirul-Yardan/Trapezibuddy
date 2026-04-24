// src/main/preload.js
// Secure bridge — expose hanya API yang dibutuhkan renderer
// Main process ↔ Renderer process

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('trapezi', {

  // ── Tasks ─────────────────────────────────────────────────
  tasks: {
    getAll:   ()       => ipcRenderer.invoke('tasks:getAll'),
    add:      (task)   => ipcRenderer.invoke('tasks:add', task),
    complete: (id)     => ipcRenderer.invoke('tasks:complete', id),
    delete:   (id)     => ipcRenderer.invoke('tasks:delete', id),
  },

  // ── Settings ──────────────────────────────────────────────
  settings: {
    get: ()         => ipcRenderer.invoke('settings:get'),
    set: (settings) => ipcRenderer.invoke('settings:set', settings),
  },

  // ── Window ────────────────────────────────────────────────
  window: {
    minimize:        () => ipcRenderer.send('window:minimize'),
    hide:            () => ipcRenderer.send('window:hide'),
    openAddTask:     ()             => ipcRenderer.invoke('modal:openAddTask'),
    closeAddTask:    ()             => ipcRenderer.send('modal:closeAddTask'),
    openConfirmTask: (taskId, name) => ipcRenderer.invoke('modal:openConfirmTask', { taskId, taskName: name }),
    closeConfirmTask: ()            => ipcRenderer.send('modal:closeConfirmTask'),
    taskCompleted:   ()             => ipcRenderer.send('modal:taskCompleted'),
    taskAdded:       ()             => ipcRenderer.send('modal:taskAdded'),
    onRefreshTasks:  (cb)           => ipcRenderer.on('refresh:tasks', cb),
    openChat: () => ipcRenderer.invoke('window:openChat'),
    closeChat: () => ipcRenderer.send('window:closeChat'),
  },

  // ── Chat (Python backend bridge) ─────────────────────────
  chat: {
    sendMessage: (message) => ipcRenderer.invoke('chat:sendMessage', message),
  },
})
