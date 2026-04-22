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
    minimize: () => ipcRenderer.send('window:minimize'),
    hide:     () => ipcRenderer.send('window:hide'),
  },

})
