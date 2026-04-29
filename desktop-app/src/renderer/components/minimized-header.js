// minimized-header.js — externalized from minimized-header.html to satisfy CSP
const api = window.trapezi

/* ── Live clock */
function updateClock() {
  const now = new Date()
  const dd  = String(now.getDate()).padStart(2, '0')
  const mm  = String(now.getMonth() + 1).padStart(2, '0')
  const yy  = now.getFullYear()
  let   hh  = now.getHours()
  const min = String(now.getMinutes()).padStart(2, '0')
  const ampm = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  const hhStr = String(hh).padStart(2, '0')
  document.getElementById('datetime-display').textContent =
    `${dd}/${mm}/${yy}\u00a0\u00a0${hhStr}:${min} ${ampm}`
}

updateClock()
setInterval(updateClock, 30_000)

/* ── Load streak & task counts */
async function loadData() {
  try {
    const [tasks, settings] = await Promise.all([
      api.tasks.getAll(),
      api.settings.get(),
    ])

    const done   = tasks.filter(t => t.is_done).length
    const total  = tasks.length
    document.getElementById('task-progress').textContent = `${done}/${total}`
    document.getElementById('streak-count').textContent  = settings.streak ?? 0
  } catch (err) {
    console.error('Failed to load data:', err)
  }
}

loadData()

/* ── Button actions (restore now accepts optional page) */
document.getElementById('btn-chat')?.addEventListener('click', () => {
  api.window.restore('chat')
})

document.getElementById('btn-home')?.addEventListener('click', () => {
  api.window.restore('active')
})

document.getElementById('btn-settings')?.addEventListener('click', () => {
  api.window.restore('settings')
})

document.getElementById('btn-expand')?.addEventListener('click', () => {
  api.window.restore('active')
})

/* ── Refresh when tasks change */
api.window.onRefreshTasks?.(() => loadData())

/* Expose for debugging if needed */
window.__minimizedHeader = { loadData }
