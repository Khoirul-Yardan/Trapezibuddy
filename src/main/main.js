// TrapeziBuddy, Electron main process entry: app lifecycle only.
// Windows: windows.js · IPC: ipc.js · Pet executables: character.js · Data: store.js
const { app } = require('electron')
const { store, getCharacter } = require('./store')
const character = require('./character')
const windows = require('./windows')
const { registerIpc } = require('./ipc')

app.setAppUserModelId('com.trapezibuddy.app') // lets Windows group the tray icon and taskbar entry

registerIpc()

// Every window gets the saved theme and language as soon as its page has loaded.
app.on('browser-window-created', (_, win) => {
  win.webContents.on('did-finish-load', () => {
    if (win.isDestroyed()) return
    win.webContents.send('theme:apply', getCharacter())
    win.webContents.send('language:changed', store.get('settings.language', 'en'))
  })
})

app.whenReady().then(() => {
  const arg = process.argv.find((a) => a.startsWith('--page='))
  if (arg && windows.openStandalone(arg.slice('--page='.length))) return
  windows.openSettings()
})

app.on('window-all-closed', () => {
  if (!windows.get('companion')) app.quit()
})

app.on('before-quit', character.killAll)
