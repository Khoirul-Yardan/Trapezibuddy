// Window factory plus the size, placement and bounds-persistence rules of every window.
const { BrowserWindow, screen } = require('electron')
const path = require('path')
const { store, getCharacter } = require('./store')
const { appIcon, PRELOAD, PAGES } = require('./paths')

const COMPANION_SIZE = { width: 300, height: 700 }
const MINIMIZED_SIZE = { width: 382, height: 44 }

const windows = {} // name -> BrowserWindow; an entry is removed when its window closes

const get = (name) => windows[name]

function create(name, page, options, query) {
  const win = new BrowserWindow({
    icon: appIcon(),
    frame: false,
    resizable: false,
    ...options,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: PRELOAD },
  })
  win.loadFile(path.join(PAGES, `${page}.html`), query ? { query } : undefined)
  windows[name] = win
  win.on('closed', () => { delete windows[name] })
  return win
}

function send(name, channel, payload) {
  const win = windows[name]
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
}

function broadcast(names, channel, payload) {
  names.forEach((name) => send(name, channel, payload))
}

// Bubble/picker windows may still be loading when the first message arrives.
function sendWhenLoaded(name, channel, payload) {
  const win = windows[name]
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', () => send(name, channel, payload))
  else send(name, channel, payload)
}

// ── Bounds ───────────────────────────────────────────────────

function clampToWorkArea(bounds) {
  if (!bounds) return null
  const { x, y, width, height } = bounds
  if (![x, y, width, height].every(Number.isFinite)) return null

  const wa = (screen.getDisplayMatching({ x, y, width, height }) ?? screen.getPrimaryDisplay()).workArea
  const w = Math.min(Math.max(Math.floor(width), 180), wa.width)
  const h = Math.min(Math.max(Math.floor(height), 120), wa.height)
  return {
    x: Math.min(Math.max(Math.floor(x), wa.x), wa.x + wa.width - w),
    y: Math.min(Math.max(Math.floor(y), wa.y), wa.y + wa.height - h),
    width: w,
    height: h,
  }
}

const savedBounds = (key, fallback) =>
  clampToWorkArea(store.get(`windowBounds.${key}`)) ?? clampToWorkArea(fallback) ?? fallback

function persistBounds(win, key) {
  const save = () => store.set(`windowBounds.${key}`, win.getBounds())
  win.on('move', save)
  win.on('resize', save)
}

// The minimized bar is centred on the companion, so one position derives the other.
const companionBoundsFromMinimized = (mb) => ({
  x: mb.x - Math.floor((COMPANION_SIZE.width - mb.width) / 2),
  y: mb.y,
  ...COMPANION_SIZE,
})

const workArea = () => screen.getPrimaryDisplay().workAreaSize
const centred = (w, h) => ({
  x: Math.floor(workArea().width / 2 - w / 2),
  y: Math.floor(workArea().height / 2 - h / 2),
})

// ── Windows ──────────────────────────────────────────────────

function openSettings() {
  const fallback = { width: 420, height: 510, ...centred(420, 510) }
  const b = savedBounds('settings', fallback)
  const win = create('settings', 'settings', {
    width: 420, height: 600, x: b.x, y: b.y, hasShadow: true,
  })
  persistBounds(win, 'settings')
}

function openAppSettings() {
  if (windows.appSettings) return windows.appSettings.focus()
  const win = create('appSettings', 'app-settings', {
    width: 420, height: 680, ...centred(420, 680), alwaysOnTop: true, hasShadow: true,
  })
  win.on('closed', () => windows.minimized?.show())
}

function openCompanion() {
  const fallback = { ...COMPANION_SIZE, x: workArea().width - 320, y: 40 }
  const b = savedBounds('companion', fallback)
  const win = create('companion', 'companion', {
    ...b, transparent: true, alwaysOnTop: true, hasShadow: false,
  }, { character: getCharacter() })
  persistBounds(win, 'companion')
}

function openMinimized() {
  if (windows.minimized) return windows.minimized.focus()

  const wa = screen.getPrimaryDisplay().workArea
  const fallback = { ...MINIMIZED_SIZE, x: wa.x + wa.width - 480, y: wa.y + 40 }
  let b
  if (windows.companion) {
    const cb = windows.companion.getBounds()
    const anchored = { ...fallback, x: cb.x + Math.floor((cb.width - fallback.width) / 2), y: cb.y }
    b = clampToWorkArea(anchored) ?? anchored
  } else {
    b = savedBounds('minimized', fallback)
  }

  const win = create('minimized', 'minimized-header', {
    ...b, transparent: true, alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
  })
  persistBounds(win, 'minimized')
  // Dragging the bar moves where the companion will reappear.
  win.on('move', () => store.set('windowBounds.companion', companionBoundsFromMinimized(win.getBounds())))
}

function openAddTask() {
  if (windows.addTask) return windows.addTask.focus()
  const [px, py] = windows.companion.getPosition()
  create('addTask', 'add-task', {
    width: 300, height: 580, x: px - 10, y: py + 60,
    transparent: true, alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
    parent: windows.companion,
  })
}

function ensureBubble() {
  return windows.bubble ?? create('bubble', 'bubble', {
    width: 300, height: 150, x: Math.floor(workArea().width / 2 - 150), y: 30,
    transparent: true, alwaysOnTop: true, skipTaskbar: true, hasShadow: false,
  })
}

// Date/time pickers hang just below the top of the add-task window they belong to.
function openPicker(name, page, { height, dy, query }) {
  if (windows[name]) return windows[name].focus()
  const WIDTH = 360
  const anchor = windows.addTask
  let x, y
  if (anchor) {
    const b = anchor.getBounds()
    x = b.x + Math.floor((b.width - WIDTH) / 2)
    y = b.y + dy
  } else {
    ;({ x, y } = centred(WIDTH, height))
  }
  create(name, page, {
    width: WIDTH, height, x, y,
    alwaysOnTop: true, skipTaskbar: true, hasShadow: true, backgroundColor: '#FFFFFF',
    parent: anchor || windows.companion,
  }, query)
}

// `npm run dev:<page>`: show a single page without going through the settings window.
const STANDALONE = { companion: COMPANION_SIZE, 'add-task': { width: 300, height: 580 } }

function openStandalone(page) {
  const size = STANDALONE[page]
  if (!size) return false
  create('standalone', page, {
    ...size, ...centred(size.width, size.height),
    transparent: true, alwaysOnTop: true, hasShadow: false,
  })
  return true
}

module.exports = {
  COMPANION_SIZE,
  get,
  send,
  broadcast,
  sendWhenLoaded,
  savedBounds,
  companionBoundsFromMinimized,
  openSettings,
  openAppSettings,
  openCompanion,
  openMinimized,
  openAddTask,
  ensureBubble,
  openPicker,
  openStandalone,
}
