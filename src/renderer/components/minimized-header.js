import { showConfirmModal } from "./confirm-modal.js";
// Exit button with confirm dialog
document.getElementById('btn-exit')?.addEventListener('click', () => {
  showConfirmModal("Apakah anda yakin untuk keluar dari TrapeziBuddy?", () => {
    api.window.close();
  });
});
// minimized-header.js — externalized from minimized-header.html to satisfy CSP
const api = window.trapezi
const params = new URLSearchParams(window.location.search)
let activePage = params.get('activePage') || 'active'


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

/* ── Theme */
function applyTheme(theme) {
  document.body.classList.remove('theme-agnesTachyon', 'theme-goldship')
  document.body.classList.add('theme-' + theme)
}

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
    applyTheme(settings?.character || 'agnesTachyon')
  } catch (err) {
    console.error('Failed to load data:', err)
  }
}

loadData()

api?.onThemeApply?.((theme) => applyTheme(theme))

/* ── Button actions */
document.getElementById('btn-settings')?.addEventListener('click', () => {
  api.window.restore('settings')
})

document.getElementById('btn-expand')?.addEventListener('click', () => {
  api.window.restore(activePage)
})

/* ── Refresh when tasks change */
api.window.onRefreshTasks?.(() => loadData())

/* Expose for debugging if needed */
window.__minimizedHeader = { loadData }
