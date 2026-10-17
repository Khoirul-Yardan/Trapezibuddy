// Loads the main-process modules against fakes, so they can be tested without an Electron binary.
//
// electron         -> in-memory windows, ipcMain, screen, tray
// electron-store   -> plain object store
// child_process    -> records spawn/taskkill calls; never starts a real process
const Module = require('module')
const path = require('path')

const MAIN = path.join(__dirname, '..', '..', 'src', 'main')
const WORK_AREA = { x: 0, y: 0, width: 1920, height: 1080 }

function createEnvironment() {
  const env = {
    handlers: {}, // ipc channel -> handler
    windows: [], // every BrowserWindow created, in order
    sent: [], // [channel, payload] pairs sent to any window
    spawned: [], // executables passed to spawn()
    killed: [], // image names passed to taskkill
    data: {}, // electron-store contents
    quits: 0,
  }

  class FakeWindow {
    constructor(options) {
      this.options = options
      this.listeners = {}
      this.visible = false
      env.windows.push(this)
      this.webContents = {
        isLoading: () => false,
        once() {},
        send: (channel, payload) => env.sent.push([channel, payload]),
      }
    }
    loadFile(file, options) { this.file = path.basename(file); this.query = options?.query }
    on(event, cb) { (this.listeners[event] ||= []).push(cb) }
    getBounds() { return { x: 100, y: 100, width: this.options.width, height: this.options.height } }
    getPosition() { return [100, 100] }
    setBounds() {}
    show() { this.visible = true }
    hide() { this.visible = false }
    focus() {}
    isVisible() { return this.visible }
    isDestroyed() { return false }
    close() { (this.listeners.closed || []).forEach((cb) => cb()) }
  }

  class FakeStore {
    constructor({ defaults }) { env.data = JSON.parse(JSON.stringify(defaults)) }
    get(key, fallback) {
      const value = key.split('.').reduce((obj, part) => obj?.[part], env.data)
      return value === undefined ? fallback : value
    }
    set(key, value) {
      const parts = key.split('.')
      const last = parts.pop()
      parts.reduce((obj, part) => obj[part], env.data)[last] = value
    }
  }

  const electron = {
    app: { isPackaged: false, quit: () => { env.quits++ }, on() {}, whenReady: () => ({ then() {} }), setAppUserModelId() {} },
    BrowserWindow: FakeWindow,
    Tray: class { setToolTip() {} on() {} setContextMenu() {} },
    Menu: { buildFromTemplate: (template) => template },
    nativeImage: { createFromPath: () => ({}) },
    screen: {
      getPrimaryDisplay: () => ({ workAreaSize: { width: WORK_AREA.width, height: WORK_AREA.height }, workArea: WORK_AREA }),
      getDisplayMatching: () => ({ workArea: WORK_AREA }),
    },
    ipcMain: {
      on: (channel, handler) => { env.handlers[channel] = handler },
      handle: (channel, handler) => { env.handlers[channel] = handler },
    },
  }

  const childProcess = {
    spawn: (exe) => { env.spawned.push(path.basename(exe)); return { kill() {} } },
    execFileSync: (_cmd, args) => { env.killed.push(args[1]) },
  }

  // Character executables count as present, whatever is in assets/.
  const fs = { ...require('fs'), existsSync: (p) => String(p).endsWith('.exe') || require('fs').existsSync(p) }

  const realLoad = Module._load
  Module._load = (request, ...rest) => {
    if (request === 'electron') return electron
    if (request === 'electron-store') return FakeStore
    if (request === 'child_process') return childProcess
    if (request === 'fs' && rest[0]?.filename?.startsWith(MAIN)) return fs
    return realLoad(request, ...rest)
  }

  // Fresh module instances, so state never leaks between tests.
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(MAIN)) delete require.cache[key]
  }

  env.invoke = (channel, ...args) => env.handlers[channel]({}, ...args)
  env.windowByFile = (file) => env.windows.find((w) => w.file === file)
  env.sentOn = (channel) => env.sent.filter(([c]) => c === channel).map(([, payload]) => payload)
  env.restore = () => { Module._load = realLoad }

  require(path.join(MAIN, 'ipc.js')).registerIpc()
  return env
}

module.exports = { createEnvironment }
