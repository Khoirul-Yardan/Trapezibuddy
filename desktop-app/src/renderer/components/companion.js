// companion.js — TrapeziBuddy Renderer Logic
// Handles: UI rendering, task management, IPC calls

const api = window.trapezi

// ── State ────────────────────────────────────────────────────
let state = {
  tasks:       [],
  activeTab:   'active',
  streak:      0,
  focusActive: true,
}

// ── Helpers ──────────────────────────────────────────────────
function calcUrgency(deadline_date, deadline_time, is_done) {
  if (is_done) return 'done'
  const deadline = new Date(`${deadline_date}T${deadline_time}`)
  const now      = new Date()
  const diffMs   = deadline - now
  const diffHrs  = diffMs / (1000 * 60 * 60)
  if (diffMs < 0)    return 'urgent'
  if (diffHrs < 24)  return 'urgent'
  if (diffHrs < 72)  return 'soon'
  return 'normal'
}

function calcDeadlineLabel(deadline_date, deadline_time) {
  const deadline = new Date(`${deadline_date}T${deadline_time}`)
  const now      = new Date()
  const diffMs   = deadline - now
  const diffHrs  = diffMs / (1000 * 60 * 60)

  if (diffMs < 0)        return 'Overdue!'
  if (diffHrs < 1)       return `${Math.floor(diffMs / 60000)} minutes left`
  if (diffHrs < 24)      return `${Math.floor(diffHrs)} hours left`
  if (diffHrs < 48)      return 'Tomorrow'
  return `${Math.floor(diffHrs / 24)} days left`
}

const SVG_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"/>
</svg>`

const SVG_CLOCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>`

// ── Day Strip ────────────────────────────────────────────────
function renderDayStrip() {
  const days      = ['M','T','W','T','F','S','S']
  const todayIdx  = (new Date().getDay() + 6) % 7  // 0=Mon
  const container = document.getElementById('day-strip')
  container.innerHTML = days.map((d, i) => `
    <div class="day-cell ${i === todayIdx ? 'today' : ''}">${d}</div>
  `).join('')
}

// ── Mood Card ────────────────────────────────────────────────
function updateMoodCard() {
  const total    = state.tasks.length
  const done     = state.tasks.filter(t => t.is_done).length
  const active   = total - done

  const moodLabel = document.getElementById('mood-label')
  const moodSub   = document.getElementById('mood-sub')
  const streakEl  = document.getElementById('streak-count')

  if (active === 0 && total > 0) {
    moodLabel.textContent = 'All Done! 🎉'
  } else if (active > 0) {
    moodLabel.textContent = "You're Almost Done"
  } else {
    moodLabel.textContent = 'No tasks yet'
  }

  moodSub.textContent   = `${done}/${total} Task`
  streakEl.textContent  = state.streak
}

// ── Task Card ────────────────────────────────────────────────
function createTaskCard(task) {
  const urgency  = calcUrgency(task.deadline_date, task.deadline_time, task.is_done)
  const dlLabel  = calcDeadlineLabel(task.deadline_date, task.deadline_time)

  const card = document.createElement('div')
  card.className = 'task-card'
  card.dataset.id = task.id

  card.innerHTML = `
    <div class="task-bar ${urgency}"></div>
    <div class="task-content">
      <button class="task-check ${task.is_done ? 'checked' : ''}"
              data-id="${task.id}">
        ${SVG_CHECK}
      </button>
      <div class="task-text">
        <span class="task-name ${task.is_done ? 'done' : ''}">${task.name}</span>
        <div class="task-deadline ${urgency}">
          ${SVG_CLOCK}
          <span>${dlLabel}</span>
        </div>
      </div>
    </div>
  `

  // Check button click
  card.querySelector('.task-check').addEventListener('click', () => {
    handleTaskCheck(task.id, task.name)
  })

  return card
}

// ── Task List ────────────────────────────────────────────────
function renderTaskList() {
  const list  = document.getElementById('task-list')
  const empty = document.getElementById('task-empty')
  const title = document.getElementById('task-list-title')

  // Clear existing cards (preserve empty placeholder)
  list.querySelectorAll('.task-card').forEach(c => c.remove())

  const filtered = state.activeTab === 'active'
    ? state.tasks.filter(t => !t.is_done)
    : state.tasks.filter(t =>  t.is_done)

  title.textContent = state.activeTab === 'active' ? 'Tugas Aktif' : 'Selesai'

  if (filtered.length === 0) {
    empty.style.display = 'block'
  } else {
    empty.style.display = 'none'
    filtered.forEach(task => {
      list.appendChild(createTaskCard(task))
    })
  }
}

// ── Task Check — buka confirm modal ──────────────────────────
function handleTaskCheck(taskId, taskName) {
  openConfirmModal(taskId, taskName)
}

// ── Confirm Modal ────────────────────────────────────────────
// State confirm modal
let _confirmTaskId   = null
let _confirmTaskName = null

function openConfirmModal(taskId, taskName) {
  _confirmTaskId   = taskId
  _confirmTaskName = taskName

  // Set teks
  document.getElementById('confirm-task-name').textContent = taskName
  document.getElementById('confirm-task-hint').textContent = taskName
  document.getElementById('confirm-instruction').innerHTML =
    `To confirm, type "<strong>${taskName}</strong>" below`

  // Reset state
  const input = document.getElementById('confirm-input')
  input.value = ''
  input.classList.remove('error')
  document.getElementById('confirm-error').style.display = 'none'
  document.getElementById('btn-confirm-task').disabled = true

  // Tampilkan modal
  document.getElementById('confirm-overlay').style.display = 'flex'

  // Focus input setelah animasi
  setTimeout(() => input.focus(), 50)
}

function initConfirmModal() {
  const overlay    = document.getElementById('confirm-overlay')
  const closeBtn   = document.getElementById('btn-close-confirm')
  const input      = document.getElementById('confirm-input')
  const confirmBtn = document.getElementById('btn-confirm-task')
  const errorEl    = document.getElementById('confirm-error')

  // Tutup modal
  const closeConfirm = () => {
    overlay.style.display = 'none'
    _confirmTaskId   = null
    _confirmTaskName = null
  }

  closeBtn.addEventListener('click', closeConfirm)
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeConfirm()
  })

  // Enable/disable tombol confirm berdasarkan input
  input.addEventListener('input', () => {
    const val = input.value.trim()

    // Reset error saat user mulai ketik ulang
    input.classList.remove('error')
    errorEl.style.display = 'none'

    // Enable tombol hanya jika sudah ada isian
    confirmBtn.disabled = val.length === 0
  })

  // Handle confirm
  confirmBtn.addEventListener('click', async () => {
    const val      = input.value.trim()
    const expected = _confirmTaskName?.trim()

    // Validasi: harus persis sama (case-insensitive)
    if (val.toLowerCase() !== expected?.toLowerCase()) {
      input.classList.add('error')
      errorEl.style.display = 'block'
      input.focus()
      return
    }

    // Sukses — tandai selesai
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Menyimpan...'

    await api.tasks.complete(_confirmTaskId)

    closeConfirm()

    // Refresh UI
    await loadTasks()
    updateMoodCard()
    renderTaskList()
  })

  // Enter key shortcut
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !confirmBtn.disabled) {
      confirmBtn.click()
    }
  })
}





// ── Load Tasks ───────────────────────────────────────────────
async function loadTasks() {
  state.tasks = await api.tasks.getAll()
}

// ── Load Settings ────────────────────────────────────────────
async function loadSettings() {
  const settings = await api.settings.get()
  state.streak   = settings.streak ?? 0
}

// ── Tab Bar ──────────────────────────────────────────────────
function initTabBar() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.activeTab = btn.dataset.tab
      renderTaskList()
    })
  })
}

// ── Add Task Modal ───────────────────────────────────────────
function initModal() {
  const overlay   = document.getElementById('modal-overlay')
  const openBtn   = document.getElementById('btn-add-task')
  const closeBtn  = document.getElementById('btn-close-modal')
  const cancelBtn = document.getElementById('btn-cancel-modal')
  const saveBtn   = document.getElementById('btn-save-task')

  // Open
  openBtn.addEventListener('click', () => {
    api.window.openAddTask()
  })

  // Close
  const closeModal = () => { overlay.style.display = 'none' }
  closeBtn.addEventListener('click',  closeModal)
  cancelBtn.addEventListener('click', closeModal)
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal()
  })

  // Category tags
  document.querySelectorAll('.cat-tag:not(.add-cat)').forEach(tag => {
    tag.addEventListener('click', () => tag.classList.toggle('active'))
  })

  // Priority buttons
  document.querySelectorAll('.prio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  // Save task
  saveBtn.addEventListener('click', async () => {
    const name = document.getElementById('task-name').value.trim()
    if (!name) {
      document.getElementById('task-name').style.borderColor = 'var(--c-urgent)'
      return
    }

    const cats = [...document.querySelectorAll('.cat-tag.active:not(.add-cat)')]
      .map(b => b.dataset.cat)

    const prio = document.querySelector('.prio-btn.active')?.dataset.prio ?? 'Sedang'
    const date = document.getElementById('task-date').value
    const time = document.getElementById('task-time').value
    const reminder = document.getElementById('reminder-toggle').checked

    await api.tasks.add({
      name,
      deadline_date: date || new Date().toISOString().split('T')[0],
      deadline_time: time || '23:59',
      categories:    cats,
      priority:      prio,
      reminder,
    })

    closeModal()
    await loadTasks()
    updateMoodCard()
    renderTaskList()

    // Reset form
    document.getElementById('task-name').value = ''
    document.getElementById('task-name').style.borderColor = ''
  })
}

// ── Window controls ──────────────────────────────────────────
function initWindowControls() {
  document.getElementById('btn-minimize')
    ?.addEventListener('click', () => api.window.minimize())
}

// ── Focus Timer ──────────────────────────────────────────────
let focusSeconds = 25 * 60
let focusInterval = null

function startFocusTimer() {
  focusInterval = setInterval(() => {
    if (focusSeconds <= 0) {
      clearInterval(focusInterval)
      document.getElementById('focus-dot').style.background = 'var(--c-done)'
      return
    }
    focusSeconds--
    const m = String(Math.floor(focusSeconds / 60)).padStart(2, '0')
    const s = String(focusSeconds % 60).padStart(2, '0')
    document.getElementById('focus-timer').textContent = `${m}:${s}`
  }, 1000)
}

// ── Init ─────────────────────────────────────────────────────
async function init() {
  await loadSettings()
  await loadTasks()

  renderDayStrip()
  updateMoodCard()
  renderTaskList()
  initTabBar()
  initModal()
  initConfirmModal()
  initWindowControls()
  startFocusTimer()

  // Listen untuk refresh dari modal windows
  api.window.onRefreshTasks(async () => {
    await loadTasks()
    updateMoodCard()
    renderTaskList()
  })
}

// Set today's date as default on date input
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0]
  const dateInput = document.getElementById('task-date')
  if (dateInput) dateInput.value = today

  init()
})
