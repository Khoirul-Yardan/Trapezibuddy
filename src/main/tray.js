// System tray icon and its (localised) menu.
const { app, Menu, Tray } = require('electron')
const { store } = require('./store')
const { appIcon } = require('./paths')
const windows = require('./windows')

let tray = null

function rebuildMenu() {
  if (!tray) return
  const id = store.get('settings.language', 'en') === 'id'
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: id ? 'Buka' : 'Open', click: () => windows.get('companion')?.show() },
    { type: 'separator' },
    { label: id ? 'Keluar' : 'Exit', click: () => app.quit() },
  ]))
}

function createTray() {
  if (tray) return
  tray = new Tray(appIcon())
  tray.setToolTip('TrapeziBuddy')
  tray.on('click', () => {
    const companion = windows.get('companion')
    companion?.isVisible() ? companion.hide() : companion?.show()
  })
  rebuildMenu()
}

module.exports = { createTray, rebuildMenu }
