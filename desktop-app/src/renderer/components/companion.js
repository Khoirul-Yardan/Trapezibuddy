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
  const lang = window.currentLang || 'en'
  const daysEn = ['M','T','W','T','F','S','S']
  const daysId = ['S','S','R','K','J','S','M']
  const days = lang === 'id' ? daysId : daysEn
  
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
  const streakIcon = document.querySelector('.streak-icon')

  if (active === 0 && total > 0) {
    moodLabel.textContent = t('allDone')
  } else if (active > 0) {
    moodLabel.textContent = t('almostDone')
  } else {
    moodLabel.textContent = t('noTasksYet')
  }

  moodSub.textContent   = `${done}/${total} Task`
  streakEl.textContent  = state.streak

  // Update streak icon color based on freeze status
  if (streakIcon) {
    // If frozen, use blue color, else orange
    streakIcon.style.fill = state.freezeActive ? '#4FC3F7' : '#FF7043'
  }
}

// ── Task Card ────────────────────────────────────────────────
function createTaskCard(task) {
  // Use priority for indicator bar color, but deadline for the label color
  const priorityClass = (() => {
    const p = (task.priority || 'Sedang').toLowerCase()
    if (p === 'tinggi') return 'urgent'
    if (p === 'sedang') return 'soon'
    return 'normal'
  })()

  const urgency  = calcUrgency(task.deadline_date, task.deadline_time, task.is_done)
  const dlLabel  = task.is_done
    ? getDoneSubtitle(task)
    : calcDeadlineLabel(task.deadline_date, task.deadline_time)
  const icon = task.is_done ? SVG_SPARK : SVG_CLOCK

  // Categories HTML
  const catsHtml = (task.categories || []).map(cat => `
    <span class="task-cat-tag cat-${cat.toLowerCase()}">${cat}</span>
  `).join('')

  const card = document.createElement('div')
  card.className = 'task-card'
  card.dataset.id = task.id

  card.innerHTML = `
    <div class="task-bar ${priorityClass}"></div>
    <div class="task-content">
      <button class="task-check ${task.is_done ? 'checked' : ''}"
              data-id="${task.id}">
        ${SVG_CHECK}
      </button>
      <div class="task-text">
        <span class="task-name ${task.is_done ? 'done' : ''}">${task.name}</span>
        <div class="task-meta">
          <div class="task-deadline ${urgency}">
            ${icon}
            <span>${dlLabel}</span>
          </div>
          <div class="task-cats">${catsHtml}</div>
        </div>
      </div>
    </div>
  `

  // Check button click
  card.querySelector('.task-check').addEventListener('click', () => {
    handleTaskCheck(task)
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
  try {
    const list  = document.getElementById('task-list')
    const empty = document.getElementById('task-empty')
    const title = document.getElementById('task-list-title')
    const filtersEl = document.getElementById('finished-filters')
    const deleteHistoryBtn = document.getElementById('btn-delete-history')

    if (!list || !empty || !title) {
      console.warn('[Companion] Task list elements not found in DOM');
      return;
    }

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
    if (deleteHistoryBtn) deleteHistoryBtn.style.display = state.activeTab === 'finished' ? 'flex' : 'none'

    if (filtered.length === 0) {
      empty.style.display = 'block'
    } else {
      empty.style.display = 'none'
      filtered.forEach(task => {
        try {
          list.appendChild(createTaskCard(task))
        } catch (e) {
          console.error('[Companion] Failed to create card for task:', task, e)
        }
      })
    }

    // Re-apply translations to all data-i18n elements (tabs, filters, title, empty state)
    translateDOM()
  } catch (err) {
    console.error('[Companion] Error rendering task list:', err);
  }
}

// ── Task Check — buka confirm modal ──────────────────────────
function handleTaskCheck(task) {
  openConfirmModal(task)
}

// ── Confirm Modal ────────────────────────────────────────────
// State confirm modal
let _confirmTaskId   = null
let _confirmTaskName = null
let _confirmTaskDeadlineDate = null
let _confirmTaskDeadlineTime = null

function openConfirmModal(task) {
  _confirmTaskId   = task.id
  _confirmTaskName = task.name
  _confirmTaskDeadlineDate = task.deadline_date
  _confirmTaskDeadlineTime = task.deadline_time

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
  nameEl.textContent = task.name
  hintEl.textContent = task.name
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

  if (!overlay || !closeBtn || !input || !confirmBtn || !errorEl) {
    console.error('[Confirm] Modal elements missing in DOM')
    return
  }

  // Tutup modal
  const closeConfirm = () => {
    overlay.style.display = 'none'
    _confirmTaskId   = null
    _confirmTaskName = null
    _confirmTaskDeadlineDate = null
    _confirmTaskDeadlineTime = null
  }

  closeBtn.addEventListener('click', closeConfirm)
  
  // Also support clicking a "Cancel" button if it exists in different UI versions
  const cancelBtn = document.getElementById('btn-cancel-confirm')
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeConfirm)
  }

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
      try {
        const val      = input.value.trim()
        const expected = _confirmTaskName?.trim()

        console.log(`[Confirm] Input: "${val}", Expected: "${expected}"`)

        // Validasi: harus persis sama (case-insensitive)
        if (val.toLowerCase() !== expected?.toLowerCase()) {
          input.classList.add('error')
          errorEl.style.display = 'block'
          input.focus()
          return
        }

        // Sukses — tandai selesai
        confirmBtn.disabled = true
        confirmBtn.textContent = t('saving') || 'Saving...'

        const currentApi = getApi()
        if (!currentApi) {
          throw new Error('API not available')
        }

        console.log(`[Confirm] Completing task ID: ${_confirmTaskId}`)
        const task = await currentApi.tasks.complete(_confirmTaskId)
        if (task) {
          console.log('[Confirm] Task completed successfully on backend, updating streak')
          await handleStreakOnTaskComplete(task)
        } else {
          console.warn('[Confirm] Task completion returned null task')
        }

        // Show congratulatory bubble with task name
        if (currentApi.bubble) {
          const lang = window.currentLang || 'en'
          const dateStr = _confirmTaskDeadlineDate || ''
          const timeStr = _confirmTaskDeadlineTime || ''
          const deadline = safeDate(`${dateStr}T${timeStr}`)
          const isLate = deadline && (new Date() - deadline > 0)
          
          let congratsMessage = ''
          if (isLate) {
            congratsMessage = lang === 'id'
              ? `Selamat! "${_confirmTaskName}" selesai (walaupun terlambat)! 🎉`
              : `Congrats! "${_confirmTaskName}" is done (even if late)! 🎉`
          } else {
            congratsMessage = lang === 'id'
              ? `Selamat! "${_confirmTaskName}" selesai tepat waktu! 🎉`
              : `Congrats! "${_confirmTaskName}" completed on time! 🎉`
          }
          
          console.log(`[Confirm] Showing bubble: "${congratsMessage}"`)
          currentApi.bubble.taskCompleted({ name: congratsMessage, emoji: '✅' })
        }

        closeConfirm()

        // Refresh UI
        await loadTasks()
        updateMoodCard()
        renderTaskList()
      } catch (err) {
        console.error('[Confirm] Error confirming task:', err)
        confirmBtn.disabled = false
        confirmBtn.textContent = t('confirm') || 'Confirm'
        alert('Error: ' + err.message)
      }
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
    state.longestStreak = settings.longest_streak ?? 0
    state.freezeTokens = settings.freezeTokens ?? 2
    state.freezeActive = settings.freezeActive ?? false
    state.lastTaskDate = settings.lastTaskDate ?? null
    state.lastTokenRecoveryDate = settings.lastTokenRecoveryDate ?? null
    state.focusTimer = settings.focusTimer ?? 25
    state.doNotDisturb = settings.doNotDisturb ?? false
    focusSeconds = state.focusTimer * 60
    // Set language before first render so t() returns correct translations
    if (settings.language) window.currentLang = settings.language
  }
}

// ── Tab Bar ──────────────────────────────────────────────────
function initTabBar() {
  const tabs = document.querySelectorAll('.tab-btn');
  console.log(`[Companion] Found ${tabs.length} tab buttons.`);
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('[Companion] Tab clicked:', btn.dataset.tab);
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      state.activeTab = btn.dataset.tab
      renderTaskList()
    })
  })
}

function initFinishedFilters() {
  const el = document.getElementById('finished-filters')
  if (!el) {
    console.warn('[Companion] Finished filters container not found');
    return
  }
  const chips = el.querySelectorAll('.filter-chip');
  console.log(`[Companion] Found ${chips.length} filter chips.`);
  chips.forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('[Companion] Filter clicked:', btn.dataset.filter);
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
      tag.removeEventListener('click', tag._clickRef); // Prevent duplicate listeners
      tag._clickRef = () => tag.classList.toggle('active');
      tag.addEventListener('click', tag._clickRef);
    })

    // Priority buttons
    document.querySelectorAll('.prio-btn').forEach(btn => {
      btn.removeEventListener('click', btn._clickRef);
      btn._clickRef = () => {
        document.querySelectorAll('.prio-btn').forEach(b => b.classList.remove('active'))
        btn.classList.add('active')
      };
      btn.addEventListener('click', btn._clickRef);
    })

  // Initialize custom calendar for embedded add task modal
  const taskDateInput = document.getElementById('task-date')
  if (taskDateInput && typeof CustomCalendar !== 'undefined') {
    // Only for Agnes Tachyon theme
    if (!document.body.classList.contains('theme-goldship')) {
      new CustomCalendar(taskDateInput, {
        disablePast: true,
        onChange: (date) => {
          console.log('Date selected in embedded modal:', date);
        }
      })
    }
  }

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
  document.getElementById('btn-settings')
    ?.addEventListener('click', () => api.window.restore('settings'))
  document.getElementById('btn-minimize')
    ?.addEventListener('click', () => api.window.minimize())
  document.getElementById('btn-exit')
    ?.addEventListener('click', () => api.window.close())
}

// ── Focus Timer ──────────────────────────────────────────────
let focusSeconds = 25 * 60
let focusInterval = null
let shouldStartFocusInterval = false

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
const remindedTasks = new Set()

function checkDeadlineReminders() {
  const tasks = state.tasks
  const now = new Date()
  const lang = window.currentLang || 'en'
  
  const urgentTasks = tasks.filter(t => {
    if (t.is_done) return false
    if (!t.reminder) return false
    if (remindedTasks.has(t.id)) return false // Don't spam
    
    const deadline = new Date(`${t.deadline_date}T${t.deadline_time}`)
    const diffHrs = (deadline - now) / (1000 * 60 * 60)
    // Remind if deadline is within 1 hour
    return diffHrs < 1 && diffHrs > 0
  })
  
  if (urgentTasks.length > 0) {
    const task = urgentTasks[0]
    remindedTasks.add(task.id) // Mark as reminded
    
    const msgEn = `Task "${task.name}" is almost out of time, let's speed up progress friend! ⏰`
    const msgId = `Tugas "${task.name}" hampir kehabisan waktu, ayo percepat progres kawan! ⏰`
    
    const msg = lang === 'id' ? msgId : msgEn
    
    const currentApi = getApi()
    if (currentApi && currentApi.bubble && currentApi.bubble.show) {
      currentApi.bubble.show(msg)
    }
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
  console.log('Focus: User stopped focus session')
  if (focusInterval) {
    clearInterval(focusInterval)
    focusInterval = null
  }
  shouldStartFocusInterval = false
  focusSeconds = 25 * 60

  const timerEl = document.getElementById('focus-timer')
  if (timerEl) timerEl.textContent = formatFocusTime(focusSeconds)

  const dot = document.getElementById('focus-dot')
  if (dot) dot.style.background = 'var(--c-urgent)'

  setFocusView(false)
  
  // Hide bubble to clear any lingering content
  const currentApi = getApi()
  if (currentApi && currentApi.bubble && currentApi.bubble.hide) {
    currentApi.bubble.hide()
  }
  
  // Show only the SELECTED character when focus is stopped
  if (!currentApi) return
  
  console.log('Focus: Showing only selected character after manual stop')
  
  // Get which character is selected and show ONLY that one
  if (currentApi.window && currentApi.window.getSelectedCharacter) {
    currentApi.window.getSelectedCharacter().then(character => {
      console.log(`Focus: Selected character is: ${character}`)
      if (character === 'goldship' && currentApi.goldship) {
        currentApi.goldship.showCharacter()
      } else if (character === 'agnesTachyon' && currentApi.agnes) {
        currentApi.agnes.showCharacter()
      }
    }).catch(err => {
      console.error('Error getting selected character on stop:', err)
      // Fallback: show agnes
      if (currentApi.agnes) currentApi.agnes.showCharacter()
    })
  }
}

function startFocusTimer() {
  if (focusInterval) return
  shouldStartFocusInterval = true
  setFocusView(true)
  
  // Show initial bubble message
  const currentApi = getApi()
  if (currentApi && currentApi.bubble && currentApi.bubble.show) {
    currentApi.bubble.show('oke sistem akan masuk mode focus mulai menghilangkan character')
  }
  
  // Hide BOTH characters during focus session
  if (!currentApi) return

  const hideCharacters = async () => {
    try {
      // Hide both characters with explicit hide calls
      console.log('Focus: Hiding Agnes character')
      if (currentApi.agnes) {
        currentApi.agnes.hideCharacter()
      }
      console.log('Focus: Hiding Goldship character')
      if (currentApi.goldship) {
        currentApi.goldship.hideCharacter()
      }
      
      // Wait longer to ensure both processes are fully terminated
      console.log('Focus: Waiting 2000ms for processes to terminate...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      console.log('Focus: Characters should now be hidden, starting timer')
    } catch (err) {
      console.error('Error hiding characters:', err)
    }
    
    // NOW start the focus timer after characters are hidden (only if still requested)
    if (shouldStartFocusInterval) {
      startFocusInterval()
    }
  }

  hideCharacters()
}

function startFocusInterval() {
  focusSeconds = (state.focusTimer || 25) * 60
  const timerEl = document.getElementById('focus-timer')
  if (timerEl) timerEl.textContent = formatFocusTime(focusSeconds)

  focusInterval = setInterval(() => {
    if (focusSeconds <= 0) {
      clearInterval(focusInterval)
      focusInterval = null
      document.getElementById('focus-dot').style.background = 'var(--c-done)'
      
      console.log('Focus timer complete: Showing selected character and completion message')
      
      // Reset view to show "Start Focus" button again
      setFocusView(false)
      
      // When timer ends, show only the SELECTED character
      const api2 = getApi()
      if (api2) {
        // Get which character is selected and show ONLY that one
        if (api2.window && api2.window.getSelectedCharacter) {
          api2.window.getSelectedCharacter().then(character => {
            console.log(`Focus complete: Showing character: ${character}`)
            
            // Clear any lingering bubble content before showing completion
            if (api2.bubble && api2.bubble.hide) {
              api2.bubble.hide()
            }
            
            if (character === 'goldship' && api2.goldship) {
              api2.goldship.showCharacter()
            } else if (character === 'agnesTachyon' && api2.agnes) {
              api2.agnes.showCharacter()
            }
            
            // Show completion bubble after character is visible
            setTimeout(() => {
              console.log('Focus: Showing completion message')
              if (api2.bubble && api2.bubble.taskCompleted) {
                api2.bubble.taskCompleted({ name: 'Focus Selesai! Istirahat dulu ya! 🎉', emoji: '🎉' })
              }
            }, 500)
          }).catch(err => {
            console.error('Error getting selected character:', err)
            // Fallback: show agnes
            if (api2.agnes) api2.agnes.showCharacter()
            // Clear bubble before showing completion
            if (api2.bubble && api2.bubble.hide) {
              api2.bubble.hide()
            }
            setTimeout(() => {
              if (api2.bubble && api2.bubble.taskCompleted) {
                api2.bubble.taskCompleted({ name: 'Focus Selesai! Istirahat dulu ya! 🎉', emoji: '🎉' })
              }
            }, 500)
          })
        }
      }
      return
    }
    focusSeconds--
    const t = document.getElementById('focus-timer')
    if (t) t.textContent = formatFocusTime(focusSeconds)
  }, 1000)
}

// ── Streak Logic ──────────────────────────────────────────────
async function checkStreak() {
  const now = new Date()
  const activeTasks = state.tasks.filter(t => !t.is_done)
  
  let usedTokenCount = 0
  let resetStreak = false
  let tasksToUpdate = []

  // ── Weekly Freeze Token Recovery ──────────────────────────
  const lastRecovery = state.lastTokenRecoveryDate ? new Date(state.lastTokenRecoveryDate) : null
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  
  if (!lastRecovery || (now - lastRecovery >= oneWeek)) {
    if (state.freezeTokens < 2) {
      state.freezeTokens = Math.min(state.freezeTokens + 1, 2)
      state.lastTokenRecoveryDate = now.toISOString()
      console.log(`[Streak] Weekly recovery: +1 token. Total: ${state.freezeTokens}`)
      
      const currentApi = getApi()
      if (currentApi && currentApi.bubble && currentApi.bubble.show) {
        const lang = window.currentLang || 'en'
        const msg = lang === 'id'
          ? 'Persediaan Token Beku mingguanmu sudah datang! +1 ❄️'
          : 'Your weekly Freeze Token supply has arrived! +1 ❄️'
        currentApi.bubble.show(msg)
      }
    } else {
      // If tokens are already full, just update the date so we don't spam check
      state.lastTokenRecoveryDate = now.toISOString()
    }
  }

  for (const task of activeTasks) {
    const deadline = safeDate(`${task.deadline_date}T${task.deadline_time}`)
    
    // Check if task is past deadline and hasn't been penalized yet
    if (deadline && (now - deadline > 0) && !task.streak_penalty_handled) {
      if (state.streak > 0 || state.freezeTokens > 0) {
        if (state.freezeTokens > 0) {
          state.freezeTokens--
          state.freezeActive = true // Enter Frozen state
          usedTokenCount++
          task.streak_penalty_handled = true
          tasksToUpdate.push(task)
          console.log(`[Streak] Task "${task.name}" past deadline. Used token. Tokens left: ${state.freezeTokens}`)
        } else {
          resetStreak = true
          task.streak_penalty_handled = true
          tasksToUpdate.push(task)
          console.log(`[Streak] Task "${task.name}" past deadline. No tokens left. Resetting streak.`)
        }
      } else {
        // Streak is already 0 and no tokens, just mark task as handled to avoid repeated checks
        task.streak_penalty_handled = true
        tasksToUpdate.push(task)
      }
    }
  }

  if (resetStreak) {
    state.streak = 0
    state.freezeActive = false
  }

  if (tasksToUpdate.length > 0 || resetStreak) {
    const currentApi = getApi()
    if (currentApi) {
      // Update tasks to mark penalty as handled
      for (const t of tasksToUpdate) {
        await currentApi.tasks.update(t.id, t)
      }
      
      if (usedTokenCount > 0 && currentApi.bubble && currentApi.bubble.show) {
        const lang = window.currentLang || 'en'
        const msg = lang === 'id' 
          ? `Deadline terlewati! ${usedTokenCount} Token Beku digunakan. Streak aman! ❄️` 
          : `Deadline missed! ${usedTokenCount} Freeze Token used. Streak safe! ❄️`
        currentApi.bubble.show(msg)
      } else if (resetStreak && currentApi.bubble && currentApi.bubble.show) {
        const lang = window.currentLang || 'en'
        const msg = lang === 'id'
          ? 'Yah, streak kamu reset karena ada tugas yang melewati deadline. Ayo mulai lagi! 💔'
          : 'Oh no, your streak reset because a task passed its deadline. Let\'s start over! 💔'
        currentApi.bubble.show(msg)
      }
      
      await saveStreakSettings()
      updateMoodCard()
      renderStreakProgress()
    }
  }
}

async function handleStreakOnTaskComplete(task) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  // If task was already past deadline when completed, don't increase streak
  const deadline = safeDate(`${task.deadline_date}T${task.deadline_time}`)
  const isLate = deadline && (now - deadline > 0)

  if (!isLate) {
    state.streak++
    state.lastTaskDate = todayStr
    
    // Update longest streak
    if (state.streak > state.longestStreak) {
      state.longestStreak = state.streak
    }
  }

  // Exit Frozen state on task completion (even if late)
  state.freezeActive = false

  await saveStreakSettings()
  updateMoodCard()
  renderStreakProgress()
}

async function saveStreakSettings() {
  const currentApi = getApi()
  if (currentApi) {
    const existing = await currentApi.settings.get() || {}
    await currentApi.settings.set({
      ...existing,
      streak: state.streak,
      longest_streak: state.longestStreak,
      freezeTokens: state.freezeTokens,
      freezeActive: state.freezeActive,
      lastTaskDate: state.lastTaskDate,
      lastTokenRecoveryDate: state.lastTokenRecoveryDate,
    })
  }
}

// ── Init ─────────────────────────────────────────────────────
async function init() {
  console.log('[Companion] Initializing...');
  try {
    await loadSettings()
    await loadTasks()
    await checkStreak()

    renderDayStrip()
    updateMoodCard()
    
    // Initialize tabs first to ensure menu navigation works
    initTabBar()
    initFinishedFilters()
    
    renderTaskList()
    
    initModal()
    initConfirmModal()
    initWindowControls()
    initStreakBottomSheet()
    
    // Focus timer starts only on user action
    setFocusView(false)
    
    const startBtn = document.getElementById('btn-focus-start')
    const stopBtn  = document.getElementById('btn-focus-stop')
    const deleteHistoryBtn = document.getElementById('btn-delete-history')

    startBtn?.addEventListener('click', () => startFocusTimer())
    stopBtn?.addEventListener('click', () => stopFocusTimer())
    
    deleteHistoryBtn?.addEventListener('click', async () => {
      const lang = window.currentLang || 'en'
      const confirmMsg = lang === 'id' 
        ? 'Hapus semua riwayat tugas yang sudah selesai? (Tidak mempengaruhi streak)' 
        : 'Delete all finished task history? (Does not affect streak)'
      
      if (confirm(confirmMsg)) {
        const finishedTasks = state.tasks.filter(t => t.is_done)
        const currentApi = getApi()
        if (currentApi) {
          for (const task of finishedTasks) {
            await currentApi.tasks.delete(task.id)
          }
          await loadTasks()
          renderTaskList()
          updateMoodCard()
        }
      }
    })

    // Listen untuk refresh dari modal windows
    const currentApi = getApi()
    if (currentApi && currentApi.window && currentApi.window.onRefreshTasks) {
      currentApi.window.onRefreshTasks(async () => {
        await loadTasks()
        await checkStreak()
        updateMoodCard()
        renderTaskList()
        
        // Show task acknowledgment message
        showTaskAcknowledgment()
      })
    }

    // Check streak periodically (every 1 minute)
    setInterval(() => {
      checkStreak()
    }, 60 * 1000)

    // Check deadline reminders periodically (every 1 minute)
    checkDeadlineReminders()
    setInterval(() => {
      checkDeadlineReminders()
    }, 60 * 1000)

    // Listen for language changes
    const langApi = getApi()
    if (langApi && langApi.language && langApi.language.onChange) {
      langApi.language.onChange((lang) => {
        window.currentLang = lang
        renderDayStrip()
        updateMoodCard()
        renderTaskList()
      })
    }

    // Listen to navigation requests from main (e.g. restore with target page)
    const navApi = getApi()
    if (navApi && navApi.window && navApi.window.onNavigate) {
      navApi.window.onNavigate((page) => {
        console.log('[Companion] Navigation request:', page);
        if (!page) return
        if (page === 'active' || page === 'finished') {
          state.activeTab = page
          document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.tab === page)
          })
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

    console.log('[Companion] Initialization complete.');
  } catch (err) {
    console.error('[Companion] Initialization error:', err);
  }
}

const THEME_SPRITES = {
  agnesTachyon: '../assets/styles/images/agnesTachyon/agnesTahcyon.png',
  goldship: '../assets/styles/images/goldShip/goldship.png',
}
const THEME_LOGOS = {
  agnesTachyon: '../assets/styles/images/agnesTachyon/logo.svg',
  goldship: '../assets/styles/images/goldShip/logo.svg',
}

function applyThemeAssets(theme) {
  const logo = document.querySelector('.panel-title, img[alt="TrapeziBuddy"]')
  const avatar = document.querySelector('#companion-sprite, .avatar img')
  if (logo) logo.src = THEME_LOGOS[theme] ?? THEME_LOGOS.agnesTachyon
  if (avatar) avatar.src = THEME_SPRITES[theme] ?? THEME_SPRITES.agnesTachyon
}

// Theme listener — registered at load time so broadcasts from any window are handled immediately
window.trapezi?.onThemeApply?.((theme) => {
  document.body.classList.remove('theme-agnesTachyon', 'theme-goldship')
  document.body.classList.add(`theme-${theme}`)
  applyThemeAssets(theme)
})

// ── Streak Progress Bottom Sheet Controller ──────────────────
function renderStreakProgress() {
  const overlay = document.getElementById('streak-overlay')
  const currentCard = document.getElementById('current-streak-card')
  const normalState = document.getElementById('streak-normal-state')
  const frozenState = document.getElementById('streak-frozen-state')
  
  if (!overlay || !currentCard || !normalState || !frozenState) return

  // Set current streak values
  const valNormal = document.getElementById('current-streak-val-normal')
  const valFrozen = document.getElementById('current-streak-val-frozen')
  if (valNormal) valNormal.textContent = state.streak
  if (valFrozen) valFrozen.textContent = state.streak

  // Set longest streak
  const longestValEl = document.getElementById('longest-streak-val')
  if (longestValEl) {
    longestValEl.textContent = state.longestStreak
  }

  // Calculate On-time Rate
  const finishedTasks = state.tasks.filter(t => t.is_done)
  const totalFinished = finishedTasks.length
  let onTimeCount = 0

  finishedTasks.forEach(t => {
    const doneAt = getTaskCompletedAt(t)
    const deadline = safeDate(`${t.deadline_date}T${t.deadline_time}`)
    if (!deadline || (deadline - doneAt >= 0)) {
      onTimeCount++
    }
  })

  // Missed tasks are active tasks past deadline
  let missedCount = state.tasks.filter(t => {
    if (t.is_done) return false
    const deadline = safeDate(`${t.deadline_date}T${t.deadline_time}`)
    return deadline && (deadline - new Date() < 0)
  }).length

  const totalForRatio = totalFinished + missedCount
  const onTimePercent = totalForRatio > 0 ? Math.round((onTimeCount / totalForRatio) * 100) : 0
  const missedPercent = totalForRatio > 0 ? 100 - onTimePercent : 0

  const fractionLabel = document.getElementById('on-time-fraction-label')
  const progressFill = document.getElementById('on-time-progress-fill')
  const percentLabel = document.getElementById('on-time-percent-label')
  const missedLabel = document.getElementById('on-time-missed-label')

  if (fractionLabel) {
    const taskText = t('tasks') || 'tasks'
    fractionLabel.textContent = `${onTimeCount} / ${totalForRatio} ${taskText}`
  }
  if (progressFill) {
    progressFill.style.width = `${onTimePercent}%`
  }
  if (percentLabel) {
    const onTimeText = t('onTime') || 'on time'
    percentLabel.textContent = `${onTimePercent}% ${onTimeText}`
  }
  if (missedLabel) {
    const missedText = t('missed') || 'missed'
    missedLabel.textContent = `${missedPercent}% ${missedText}`
  }

  // Render Freeze Tokens
  const tokensContainer = document.getElementById('freeze-tokens-container')
  if (tokensContainer) {
    tokensContainer.innerHTML = ''
    for (let i = 1; i <= 2; i++) {
      const btn = document.createElement('button')
      btn.className = 'freeze-token-btn'
      btn.textContent = '❄'

      // Token is "active" (available) if state.freezeTokens >= i
      let isAvailable = (state.freezeTokens >= i)

      if (isAvailable) {
        btn.classList.add('active')
      }

      // Interaction
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        if (isAvailable) {
          if (window.trapezi && window.trapezi.bubble && window.trapezi.bubble.show) {
            window.trapezi.bubble.show({
              text: 'Token beku aktif melindungi streak kamu secara otomatis jika kamu lupa! 🛡️',
              emoji: '❄️'
            })
          }
        } else {
          if (window.trapezi && window.trapezi.bubble && window.trapezi.bubble.show) {
            window.trapezi.bubble.show({
              text: 'Token beku belum tersedia. Selesaikan 5 streak untuk mendapatkan 1 token!',
              emoji: '❄️'
            })
          }
        }
      })

      tokensContainer.appendChild(btn)
    }
  }

  // Toggle card state classes
  currentCard.classList.remove('frozen')
  normalState.style.display = 'block'
  frozenState.style.display = 'none'
}

function initStreakBottomSheet() {
  const badge = document.getElementById('streak-badge')
  const overlay = document.getElementById('streak-overlay')
  const closeBtn = document.getElementById('btn-close-streak')

  if (!badge || !overlay || !closeBtn) return

  // Click to open sheet
  badge.addEventListener('click', () => {
    overlay.style.display = 'block'
    setTimeout(() => {
      overlay.classList.add('active')
      renderStreakProgress()
    }, 20)
  })

  // Click to close sheet
  const closeSheet = () => {
    overlay.classList.remove('active')
    setTimeout(() => {
      overlay.style.display = 'none'
    }, 300)
  }

  closeBtn.addEventListener('click', closeSheet)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeSheet()
    }
  })
}

// Set today's date as default on date input
document.addEventListener('DOMContentLoaded', () => {
  ;(async () => {
    try {
      const s = await window.trapezi?.settings?.get()
      applyThemeAssets(s?.character || 'agnesTachyon')
    } catch (_) { applyThemeAssets('agnesTachyon') }
  })()

  const today = new Date().toISOString().split('T')[0]
  const dateInput = document.getElementById('task-date')
  if (dateInput) dateInput.value = today

  init()
})
