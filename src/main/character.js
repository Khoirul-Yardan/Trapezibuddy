// Lifecycle of the external desktop-pet executables (assets/<character>/*.exe).
const { spawn, execFileSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const { store } = require('./store')
const { projectRoot } = require('./paths')

const EXES = {
  agnesTachyon: path.join('assets', 'agnesTachyon', 'agnesTachyon.exe'),
  goldship: path.join('assets', 'GoldShip', 'goldship.exe'),
}

let child = null
let lastLaunched = null

function killAll() {
  if (child) {
    try { child.kill() } catch (_) { /* already gone */ }
    child = null
  }
  // The pet may have been started by an earlier session, so kill by image name too.
  if (process.platform !== 'win32') return
  for (const rel of Object.values(EXES)) {
    try {
      execFileSync('taskkill', ['/IM', path.basename(rel), '/F'], { stdio: 'pipe', timeout: 3000 })
    } catch (_) { /* not running */ }
  }
}

function spawnCharacter(key) {
  killAll()
  if (store.get('settings.doNotDisturb', false)) return
  const rel = EXES[key]
  if (!rel) return
  const exe = path.join(projectRoot(), rel)
  if (!fs.existsSync(exe)) {
    console.warn('Character exe not found:', exe)
    return
  }
  try {
    child = spawn(exe, [], { detached: true, stdio: 'ignore' })
    lastLaunched = key
  } catch (err) {
    console.error('Failed to launch character exe:', err)
  }
}

module.exports = {
  killAll,
  spawn: spawnCharacter,
  // Deliberately not cleared by killAll: settings:set uses it to avoid respawning a
  // character that was only hidden (focus mode), not switched.
  lastLaunched: () => lastLaunched,
}
