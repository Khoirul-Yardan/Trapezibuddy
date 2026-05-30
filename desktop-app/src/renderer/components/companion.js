// companion.js — TrapeziBuddy Renderer Logic
// Handles: UI rendering, task management, IPC calls

// Get API safely - may not be available immediately on page load
let api = null
function getApi() {
  if (!api) {
    api = window.trapezi
  }
  return api
}

// i18n helper — reads current language set by the HTML page
function t(key) {
  const lang = window.currentLang || 'en'
  return window.i18n?.[lang]?.[key] ?? window.i18n?.en?.[key] ?? key
}

// ── State ────────────────────────────────────────────────────
let state = {
  tasks:       [],
  activeTab:   'active',
  finishedFilter: 'today', // today | last3 | week | all
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
  const lang     = window.currentLang || 'en'

  if (diffMs < 0)   return t('overdue')
  if (diffHrs < 1)  return lang === 'id'
    ? `${Math.floor(diffMs / 60000)} menit lagi`
    : `${Math.floor(diffMs / 60000)} minutes left`
  if (diffHrs < 24) return lang === 'id'
    ? `${Math.floor(diffHrs)} jam lagi`
    : `${Math.floor(diffHrs)} hours left`
  if (diffHrs < 48) return t('tomorrow')
  return lang === 'id'
    ? `${Math.floor(diffHrs / 24)} hari lagi`
    : `${Math.floor(diffHrs / 24)} days left`
}

function safeDate(value) {
  const d = value ? new Date(value) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

function getTaskCreatedAt(task) {
  return safeDate(task.created_at) ?? new Date()
}

function getTaskCompletedAt(task) {
  // completed_at added when completing; fallback for older tasks
  return safeDate(task.completed_at) ?? safeDate(task.updated_at) ?? getTaskCreatedAt(task)
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date) {
  // Monday as week start
  const d = startOfDay(date)
  const day = (d.getDay() + 6) % 7 // 0=Mon
  d.setDate(d.getDate() - day)
  return d
}

function hashString(str) {
  // stable hash for deterministic message pick
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick(list, seedStr) {
  const h = hashString(seedStr)
  return list[h % list.length]
}

function getDoneSubtitle(task) {
  const createdAt = getTaskCreatedAt(task)
  const doneAt = getTaskCompletedAt(task)
  const deadline = safeDate(`${task.deadline_date}T${task.deadline_time}`) ?? null

  const speedMs = doneAt - createdAt
  const mins = speedMs / 60000

  const quick = [
    'Wow that was quick.',
    'Speedrun completed.',
    'Fast hands, nice.',
    "You’re on fire.",
  ]

  const onTime = [
    'You are super.',
    'Nice work, keep it up.',
    'Clean finish. Respect.',
    'Solid discipline.',
  ]

  const late = [
    'You disappoint me.',
    'Late… but done.',
    'Better late than never.',
    'Try harder next time.',
  ]

  // If no valid deadline, base on completion speed only
  if (!deadline) {
    if (mins <= 30) return pick(quick, task.id + ':quick')
    return pick(onTime, task.id + ':ontime')
  }

  const diffMs = deadline - doneAt // positive = early/on-time
  if (diffMs < 0) return pick(late, task.id + ':late')
  if (mins <= 30) return pick(quick, task.id + ':quick')
  return pick(onTime, task.id + ':ontime')
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

const SVG_SPARK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2l1.2 4.2L17 8l-3.8 1.8L12 14l-1.2-4.2L7 8l3.8-1.8L12 2z"/>
  <path d="M19 13l.7 2.4L22 16l-2.3.6L19 19l-.7-2.4L16 16l2.3-.6L19 13z"/>
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
    moodLabel.textContent = t('allDone')
  } else if (active > 0) {
    moodLabel.textContent = t('almostDone')
  } else {
    moodLabel.textContent = t('noTasksYet')
  }

  moodSub.textContent   = `${done}/${total} Task`
  streakEl.textContent  = state.streak
}

// ── Task Card ────────────────────────────────────────────────
function createTaskCard(task) {
  const urgency  = calcUrgency(task.deadline_date, task.deadline_time, task.is_done)
  const dlLabel  = task.is_done
    ? getDoneSubtitle(task)
    : calcDeadlineLabel(task.deadline_date, task.deadline_time)
  const icon = task.is_done ? SVG_SPARK : SVG_CLOCK

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
          ${icon}
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

// ── Translate DOM ─────────────────────────────────────────────
// Re-applies data-i18n translations after dynamic renders (no re-render loop).
function translateDOM() {
  const lang = window.currentLang || 'en'
  const dict = window.i18n?.[lang] || window.i18n?.en
  if (!dict) return
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    if (dict[key] !== undefined) el.textContent = dict[key]
  })
}

// ── Task List ────────────────────────────────────────────────
function renderTaskList() {
  const list  = document.getElementById('task-list')
  const empty = document.getElementById('task-empty')
  const title = document.getElementById('task-list-title')
  const filtersEl = document.getElementById('finished-filters')

  // Clear existing cards (preserve empty placeholder)
  list.querySelectorAll('.task-card').forEach(c => c.remove())

  const now = new Date()
  const rangeStart = (() => {
    if (state.finishedFilter === 'all') return null
    if (state.finishedFilter === 'today') return startOfDay(now)
    if (state.finishedFilter === 'last3') return new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    if (state.finishedFilter === 'week') return startOfWeek(now)
    return startOfDay(now)
  })()

  const filtered = state.activeTab === 'active'
    ? state.tasks.filter(t => !t.is_done)
    : state.tasks
        .filter(t => t.is_done)
        .filter(t => {
          if (!rangeStart) return true
          const doneAt = getTaskCompletedAt(t)
          return doneAt >= rangeStart
        })

  title.textContent = state.activeTab === 'active' ? t('activeTasks') : t('finished')
  if (filtersEl) filtersEl.style.display = state.activeTab === 'finished' ? 'flex' : 'none'

  if (filtered.length === 0) {
    empty.style.display = 'block'
  } else {
    empty.style.display = 'none'
    filtered.forEach(task => {
      list.appendChild(createTaskCard(task))
    })
  }

  // Re-apply translations to all data-i18n elements (tabs, filters, title, empty state)
  translateDOM()
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

  const nameEl = document.getElementById('confirm-task-name')
  const hintEl = document.getElementById('confirm-task-hint')
  const instrEl = document.getElementById('confirm-instruction')
  const input = document.getElementById('confirm-input')
  const errorEl = document.getElementById('confirm-error')
  const confirmBtn = document.getElementById('btn-confirm-task')
  const overlay = document.getElementById('confirm-overlay')

  // If the confirm modal isn't present in DOM for some reason, don't crash.
  // (This can happen if the HTML changes or the modal was removed.)
  if (!nameEl || !hintEl || !instrEl || !input || !errorEl || !confirmBtn || !overlay) {
    console.error('Confirm modal elements missing; cannot open confirm modal.')
    return
  }

  // Set teks
  nameEl.textContent = taskName
  hintEl.textContent = taskName
  hintEl.style.fontWeight = 'bold' // ensure it's bold as originally intended by the innerHTML overwrite

  // Reset state
  input.value = ''
  input.classList.remove('error')
  errorEl.style.display = 'none'
  confirmBtn.disabled = true

  // Tampilkan modal
  overlay.style.display = 'flex'

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
    confirmBtn.textContent = t('saving')

    const currentApi = getApi()
    if (currentApi) {
      await currentApi.tasks.complete(_confirmTaskId)
    }


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
  const currentApi = getApi()
  if (currentApi) {
    state.tasks = await currentApi.tasks.getAll()
  }
}

// ── Load Settings ────────────────────────────────────────────
async function loadSettings() {
  const currentApi = getApi()
  if (currentApi) {
    const settings = await currentApi.settings.get()
    state.streak = settings.streak ?? 0
    // Set language before first render so t() returns correct translations
    if (settings.language) window.currentLang = settings.language
  }
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

function initFinishedFilters() {
  const el = document.getElementById('finished-filters')
  if (!el) return
  el.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.finishedFilter = btn.dataset.filter || 'today'
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

// ── Task Acknowledgment Messages ─────────────────────────────
function showTaskAcknowledgment() {
  const tasks = state.tasks
  const activeTasks = tasks.filter(t => !t.is_done)
  
  if (activeTasks.length === 0) return
  
  const taskAckMessages = [
    'Wah, banyak task nih! Kuat gak kamu? 💪',
    'Task bertambah, semangat harus tetap! 🚀',
    'Jangan malas yah, task menunggu! 😄',
    'Mantap! Satu task lagi, ayo! 🎯',
    'Sibuk-sibuk tapi kaya nih! ✨',
  ]
  
  const msg = taskAckMessages[Math.floor(Math.random() * taskAckMessages.length)]
  console.log('[Character Ack]:', msg)
}

// ── Deadline Reminders ───────────────────────────────────────
function checkDeadlineReminders() {
  const tasks = state.tasks
  const now = new Date()
  
  const urgentTasks = tasks.filter(t => {
    if (t.is_done) return false
    const deadline = new Date(`${t.deadline_date}T${t.deadline_time}`)
    const diffHrs = (deadline - now) / (1000 * 60 * 60)
    return diffHrs < 1 && diffHrs > -1
  })
  
  if (urgentTasks.length > 0) {
    const reminderMessages = [
      'Hei! Deadline task mu tinggal 1 jam! ⏰',
      'Jangan lupa, task mu mau deadline! ⚠️',
      'Cepat selesaiin, deadline mepet! 🔥',
      'Setengah jam lagi deadline! 😅',
    ]
    
    const msg = reminderMessages[Math.floor(Math.random() * reminderMessages.length)]
    console.log('[Deadline Reminder]:', msg)
  }
}

function formatFocusTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function setFocusView(isRunning) {
  const idle = document.getElementById('focus-idle')
  const running = document.getElementById('focus-running')
  if (idle) idle.style.display = isRunning ? 'none' : 'flex'
  if (running) running.style.display = isRunning ? 'flex' : 'none'
}

function stopFocusTimer() {
  if (focusInterval) {
    clearInterval(focusInterval)
    focusInterval = null
  }
  focusSeconds = 25 * 60

  const timerEl = document.getElementById('focus-timer')
  if (timerEl) timerEl.textContent = formatFocusTime(focusSeconds)

  const dot = document.getElementById('focus-dot')
  if (dot) dot.style.background = 'var(--c-urgent)'

  setFocusView(false)
  

}

function startFocusTimer() {
  if (focusInterval) return
  setFocusView(true)
  


  const timerEl = document.getElementById('focus-timer')
  if (timerEl) timerEl.textContent = formatFocusTime(focusSeconds)

  focusInterval = setInterval(() => {
    if (focusSeconds <= 0) {
      clearInterval(focusInterval)
      focusInterval = null
      document.getElementById('focus-dot').style.background = 'var(--c-done)'
      

      return
    }
    focusSeconds--
    const t = document.getElementById('focus-timer')
    if (t) t.textContent = formatFocusTime(focusSeconds)
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
  initFinishedFilters()
  initModal()
  initConfirmModal()
  initWindowControls()
  // Focus timer starts only on user action
  setFocusView(false)
  const startBtn = document.getElementById('btn-focus-start')
  const stopBtn  = document.getElementById('btn-focus-stop')
  startBtn?.addEventListener('click', () => startFocusTimer())
  stopBtn?.addEventListener('click', () => stopFocusTimer())

  // Listen untuk refresh dari modal windows
  const currentApi = getApi()
  if (currentApi && currentApi.window && currentApi.window.onRefreshTasks) {
    currentApi.window.onRefreshTasks(async () => {
      await loadTasks()
      updateMoodCard()
      renderTaskList()
      
      // Show task acknowledgment message
      showTaskAcknowledgment()
    })
  }

  // Check deadline reminders every 5 minutes
  checkDeadlineReminders()
  setInterval(() => {
    checkDeadlineReminders()
  }, 5 * 60 * 1000)

  // Listen to navigation requests from main (e.g. restore with target page)
  const navApi = getApi()
  if (navApi && navApi.window && navApi.window.onNavigate) {
    navApi.window.onNavigate((page) => {
      if (!page) return
      if (page === 'active' || page === 'finished') {
        state.activeTab = page
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === page))
        renderTaskList()
      } else if (page === 'add-task') {
        const addApi = getApi()
        if (addApi) addApi.window.openAddTask()
      } else if (page === 'chat') {
        const chatApi = getApi()
        if (chatApi) chatApi.window.openChat()
      }
    })
  }
}

// Set today's date as default on date input
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0]
  const dateInput = document.getElementById('task-date')
  if (dateInput) dateInput.value = today

  init()
})
