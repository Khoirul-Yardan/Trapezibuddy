// companion.js: logic of the main companion panel (tasks, streak, focus timer).
// Theme switching lives in ../theme.js; the data layer is the main process (window.trapezi).

const api = window.trapezi
const $ = (id) => document.getElementById(id)

const HOUR = 60 * 60 * 1000
const MINUTE = 60 * 1000
const FREEZE_TOKEN_MAX = 2

const lang = () => window.currentLang || 'en'
const isId = () => lang() === 'id'

function t(key) {
  return window.i18n?.[lang()]?.[key] ?? window.i18n?.en?.[key] ?? key
}

const state = {
  tasks: [],
  activeTab: 'active',
  finishedFilter: 'today', // today | last3 | week | all
  streak: 0,
  longestStreak: 0,
  freezeTokens: FREEZE_TOKEN_MAX,
  freezeActive: false,
  lastTaskDate: null,
  lastTokenRecoveryDate: null,
  focusTimer: 25, // minutes
}

// ── Helpers ──────────────────────────────────────────────────

function escapeHtml(value) {
  const el = document.createElement('div')
  el.textContent = value
  return el.innerHTML.replace(/"/g, '&quot;')
}

function safeDate(value) {
  const d = value ? new Date(value) : null
  return d && !Number.isNaN(d.getTime()) ? d : null
}

const deadlineOf = (task) => safeDate(`${task.deadline_date}T${task.deadline_time}`)

// completed_at is set on completion; older tasks fall back to updated_at / created_at.
function completedAt(task) {
  return safeDate(task.completed_at) ?? safeDate(task.updated_at) ?? safeDate(task.created_at) ?? new Date()
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfWeek(date) {
  const d = startOfDay(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // weeks start on Monday
  return d
}

function calcUrgency(task) {
  if (task.is_done) return 'done'
  const hours = (deadlineOf(task) - new Date()) / HOUR
  if (hours < 24) return 'urgent' // includes overdue
  if (hours < 72) return 'soon'
  return 'normal'
}

function calcDeadlineLabel(task) {
  const ms = deadlineOf(task) - new Date()
  const hours = ms / HOUR
  if (ms < 0) return t('overdue')
  if (hours < 1) return isId() ? `${Math.floor(ms / MINUTE)} menit lagi` : `${Math.floor(ms / MINUTE)} minutes left`
  if (hours < 24) return isId() ? `${Math.floor(hours)} jam lagi` : `${Math.floor(hours)} hours left`
  if (hours < 48) return t('tomorrow')
  return isId() ? `${Math.floor(hours / 24)} hari lagi` : `${Math.floor(hours / 24)} days left`
}

// Stable string hash so a finished task always shows the same message.
function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const pickStable = (list, seed) => list[hashString(seed) % list.length]
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)]

const DONE_MESSAGES = {
  quick: ['Wow that was quick.', 'Speedrun completed.', 'Fast hands, nice.', 'You’re on fire.'],
  onTime: ['You are super.', 'Nice work, keep it up.', 'Clean finish. Respect.', 'Solid discipline.'],
  late: ['You disappoint me.', 'Late… but done.', 'Better late than never.', 'Try harder next time.'],
}

function getDoneSubtitle(task) {
  const done = completedAt(task)
  const deadline = deadlineOf(task)
  const minutesTaken = (done - (safeDate(task.created_at) ?? new Date())) / MINUTE

  if (deadline && deadline - done < 0) return pickStable(DONE_MESSAGES.late, `${task.id}:late`)
  if (minutesTaken <= 30) return pickStable(DONE_MESSAGES.quick, `${task.id}:quick`)
  return pickStable(DONE_MESSAGES.onTime, `${task.id}:ontime`)
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

// ── i18n ─────────────────────────────────────────────────────
// i18n.js translates the static markup; here we re-render the dynamic parts.
// Registered at load, not in init(): main sends the saved language as soon as the page loads.
document.addEventListener('trapezi:language', () => {
  renderDayStrip()
  updateMoodCard()
  renderTaskList()
})

// ── Day strip and mood card ──────────────────────────────────

function renderDayStrip() {
  const days = isId() ? ['S', 'S', 'R', 'K', 'J', 'S', 'M'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const today = (new Date().getDay() + 6) % 7 // 0 = Monday
  $('day-strip').innerHTML = days
    .map((d, i) => `<div class="day-cell ${i === today ? 'today' : ''}">${d}</div>`)
    .join('')
}

function hasOverdue() {
  const now = new Date()
  return state.tasks.some((task) => {
    if (task.is_done || !task.deadline_date) return false
    return new Date(`${task.deadline_date}T${task.deadline_time || '23:59:59'}`) < now
  })
}

function updateMoodCard() {
  const total = state.tasks.length
  const done = state.tasks.filter((task) => task.is_done).length
  const active = total - done

  let label
  if (total === 0) label = pickRandom(['No tasks yet', 'Add something to do!'])
  else if (hasOverdue()) label = pickRandom(["I'm disappointed...", "You're late!", 'Fix it NOW 😤'])
  else if (active === 0) label = pickRandom(['Well Done!', 'You crushed it!', 'All clear! 🎉'])
  else if (done === 0) label = pickRandom(["Let's get started!", 'Time to grind!', 'You got this!'])
  else if (done >= Math.ceil(total / 2)) label = pickRandom(["C'mon, a lil bit more!", 'Almost there!', 'I believe in you!'])
  else label = pickRandom(["You're Almost Done", 'Keep going!', 'One step at a time'])

  $('mood-label').textContent = label
  $('mood-sub').textContent = `${done}/${total} Task`
  $('streak-count').textContent = state.streak

  const icon = document.querySelector('.streak-icon')
  if (icon) icon.style.fill = state.freezeActive ? '#4FC3F7' : '#FF7043'
}

// ── Task list ────────────────────────────────────────────────

const PRIORITY_BAR = { tinggi: 'urgent', sedang: 'soon' }

function createTaskCard(task) {
  const bar = PRIORITY_BAR[(task.priority || 'Sedang').toLowerCase()] ?? 'normal'
  const label = task.is_done ? getDoneSubtitle(task) : calcDeadlineLabel(task)
  const cats = (task.categories || []).map((cat) => `
    <span class="task-cat-tag cat-${escapeHtml(cat.toLowerCase())}" title="${escapeHtml(cat)}">${escapeHtml(cat.charAt(0).toUpperCase())}</span>
  `).join('')

  const card = document.createElement('div')
  card.className = 'task-card'
  card.dataset.id = task.id
  card.innerHTML = `
    <div class="task-bar ${bar}"></div>
    <div class="task-content">
      <button class="task-check ${task.is_done ? 'checked' : ''}" data-id="${escapeHtml(task.id)}">${SVG_CHECK}</button>
      <div class="task-text">
        <span class="task-name ${task.is_done ? 'done' : ''}">${escapeHtml(task.name)}</span>
        <div class="task-meta">
          <div class="task-deadline ${calcUrgency(task)}">
            ${task.is_done ? SVG_SPARK : SVG_CLOCK}
            <span>${escapeHtml(label)}</span>
          </div>
          <div class="task-cats">${cats}</div>
        </div>
      </div>
    </div>
  `
  card.querySelector('.task-check').addEventListener('click', () => openConfirmModal(task))
  return card
}

function finishedRangeStart() {
  const now = new Date()
  switch (state.finishedFilter) {
    case 'all': return null
    case 'last3': return new Date(now.getTime() - 3 * 24 * HOUR)
    case 'week': return startOfWeek(now)
    default: return startOfDay(now)
  }
}

function renderTaskList() {
  const list = $('task-list')
  const empty = $('task-empty')
  const finished = state.activeTab === 'finished'

  list.querySelectorAll('.task-card').forEach((card) => card.remove())

  const rangeStart = finishedRangeStart()
  const visible = finished
    ? state.tasks.filter((task) => task.is_done && (!rangeStart || completedAt(task) >= rangeStart))
    : state.tasks.filter((task) => !task.is_done)

  $('task-list-title').textContent = finished ? t('finished') : t('activeTasks')
  $('finished-filters').style.display = finished ? 'flex' : 'none'
  $('btn-delete-history').style.display = finished ? 'flex' : 'none'

  empty.style.display = visible.length === 0 ? 'block' : 'none'
  visible.forEach((task) => list.appendChild(createTaskCard(task)))
  translateDOM()
}

// ── Complete-task confirmation (type the task name to confirm) ─

let confirmTask = null

function openConfirmModal(task) {
  confirmTask = task
  $('confirm-task-name').textContent = task.name
  const hint = $('confirm-task-hint')
  hint.textContent = task.name
  hint.style.fontWeight = 'bold'

  const input = $('confirm-input')
  input.value = ''
  input.classList.remove('error')
  $('confirm-error').style.display = 'none'
  $('btn-confirm-task').disabled = true
  $('confirm-overlay').style.display = 'flex'
  setTimeout(() => input.focus(), 50)
}

function congratsMessage(task) {
  const deadline = deadlineOf(task)
  const late = deadline && new Date() > deadline
  if (isId()) {
    return late
      ? `Selamat! "${task.name}" selesai (walaupun terlambat)! 🎉`
      : `Selamat! "${task.name}" selesai tepat waktu! 🎉`
  }
  return late
    ? `Congrats! "${task.name}" is done (even if late)! 🎉`
    : `Congrats! "${task.name}" completed on time! 🎉`
}

function initConfirmModal() {
  const overlay = $('confirm-overlay')
  const input = $('confirm-input')
  const confirmBtn = $('btn-confirm-task')
  const errorEl = $('confirm-error')

  const close = () => {
    overlay.style.display = 'none'
    confirmTask = null
  }

  $('btn-close-confirm').addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })

  input.addEventListener('input', () => {
    input.classList.remove('error')
    errorEl.style.display = 'none'
    confirmBtn.disabled = input.value.trim().length === 0
  })
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !confirmBtn.disabled) confirmBtn.click()
  })

  confirmBtn.addEventListener('click', async () => {
    const task = confirmTask
    if (input.value.trim().toLowerCase() !== task.name.trim().toLowerCase()) {
      input.classList.add('error')
      errorEl.style.display = 'block'
      input.focus()
      return
    }

    confirmBtn.disabled = true
    confirmBtn.textContent = t('saving')
    try {
      const completed = await api.tasks.complete(task.id)
      if (completed) await handleStreakOnTaskComplete(completed)
      api.bubble.taskCompleted({ name: congratsMessage(task), emoji: '✅' })
      close()
      await refresh()
    } catch (err) {
      console.error('[Confirm] Failed to complete task:', err)
      confirmBtn.disabled = false
      alert('Error: ' + err.message)
    } finally {
      confirmBtn.textContent = t('confirmThisTask')
    }
  })
}

// ── Data ─────────────────────────────────────────────────────

async function loadTasks() {
  state.tasks = await api.tasks.getAll()
}

async function loadSettings() {
  const s = await api.settings.get()
  state.streak = s.streak ?? 0
  state.longestStreak = s.longest_streak ?? 0
  state.freezeTokens = s.freezeTokens ?? FREEZE_TOKEN_MAX
  state.freezeActive = s.freezeActive ?? false
  state.lastTaskDate = s.lastTaskDate ?? null
  state.lastTokenRecoveryDate = s.lastTokenRecoveryDate ?? null
  state.focusTimer = s.focusTimer ?? 25
  // Set before the first render so t() already uses the right language.
  if (s.language) window.currentLang = s.language
}

async function refresh() {
  await loadTasks()
  updateMoodCard()
  renderTaskList()
}

// ── Tabs and filters ─────────────────────────────────────────

function initTabBar() {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab))
  })
}

function selectTab(tab) {
  state.activeTab = tab
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab))
  renderTaskList()
}

function initFinishedFilters() {
  const chips = document.querySelectorAll('#finished-filters .filter-chip')
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.toggle('active', c === chip))
      state.finishedFilter = chip.dataset.filter || 'today'
      renderTaskList()
    })
  })
}

function initWindowControls() {
  $('btn-add-task').addEventListener('click', () => api.window.openAddTask())
  $('btn-settings')?.addEventListener('click', () => api.window.restore('settings'))
  $('btn-minimize')?.addEventListener('click', () => api.window.minimize())
  $('btn-exit')?.addEventListener('click', () => api.window.close())

  $('btn-delete-history').addEventListener('click', async () => {
    const message = isId()
      ? 'Hapus semua riwayat tugas yang sudah selesai? (Tidak mempengaruhi streak)'
      : 'Delete all finished task history? (Does not affect streak)'
    if (!confirm(message)) return
    for (const task of state.tasks.filter((x) => x.is_done)) await api.tasks.delete(task.id)
    await refresh()
  })
}

// ── Deadline reminders ───────────────────────────────────────

const remindedTasks = new Set()

function checkDeadlineReminders() {
  const now = new Date()
  const task = state.tasks.find((x) => {
    if (x.is_done || !x.reminder || remindedTasks.has(x.id)) return false
    const hours = (deadlineOf(x) - now) / HOUR
    return hours > 0 && hours < 1
  })
  if (!task) return

  remindedTasks.add(task.id) // one reminder per task
  api.bubble.show(isId()
    ? `Tugas "${task.name}" hampir kehabisan waktu, ayo percepat progres kawan! ⏰`
    : `Task "${task.name}" is almost out of time, let's speed up progress friend! ⏰`)
}

// ── Focus timer ──────────────────────────────────────────────

let focusSeconds = 25 * 60
let focusInterval = null
let focusRequested = false // false once the user stops before the 2s hide delay has elapsed

const focusDuration = () => (state.focusTimer || 25) * 60

function formatFocusTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

function setFocusView(running) {
  $('focus-idle').style.display = running ? 'none' : 'flex'
  $('focus-running').style.display = running ? 'flex' : 'none'
}

async function showSelectedCharacter() {
  try {
    api.character.show((await api.settings.get()).character || 'agnesTachyon')
  } catch (err) {
    console.error('[Focus] Could not read selected character:', err)
    api.character.show('agnesTachyon')
  }
}

function startFocusTimer() {
  if (focusInterval || focusRequested) return
  focusRequested = true
  setFocusView(true)
  api.bubble.show('oke sistem akan masuk mode focus mulai menghilangkan character')
  api.character.hide()
  // Give the character processes time to exit before the countdown starts.
  setTimeout(() => { if (focusRequested) startFocusInterval() }, 2000)
}

function startFocusInterval() {
  focusSeconds = focusDuration()
  $('focus-timer').textContent = formatFocusTime(focusSeconds)

  focusInterval = setInterval(async () => {
    if (focusSeconds > 0) {
      focusSeconds--
      $('focus-timer').textContent = formatFocusTime(focusSeconds)
      return
    }

    clearInterval(focusInterval)
    focusInterval = null
    focusRequested = false
    $('focus-dot').style.background = 'var(--c-done)'
    setFocusView(false)

    api.bubble.hide()
    await showSelectedCharacter()
    setTimeout(() => api.bubble.taskCompleted({ name: 'Focus Selesai! Istirahat dulu ya! 🎉', emoji: '🎉' }), 500)
  }, 1000)
}

function stopFocusTimer() {
  clearInterval(focusInterval)
  focusInterval = null
  focusRequested = false
  focusSeconds = focusDuration()

  $('focus-timer').textContent = formatFocusTime(focusSeconds)
  $('focus-dot').style.background = 'var(--c-urgent)'
  setFocusView(false)
  api.bubble.hide()
  showSelectedCharacter()
}

// ── Streak ───────────────────────────────────────────────────

async function saveStreakSettings() {
  // Main merges this into the stored settings.
  await api.settings.set({
    streak: state.streak,
    longest_streak: state.longestStreak,
    freezeTokens: state.freezeTokens,
    freezeActive: state.freezeActive,
    lastTaskDate: state.lastTaskDate,
    lastTokenRecoveryDate: state.lastTokenRecoveryDate,
  })
}

// Weekly: earn one Freeze Token back (up to the max).
function recoverFreezeToken(now) {
  const last = safeDate(state.lastTokenRecoveryDate)
  if (last && now - last < 7 * 24 * HOUR) return false

  state.lastTokenRecoveryDate = now.toISOString()
  if (state.freezeTokens < FREEZE_TOKEN_MAX) {
    state.freezeTokens++
    api.bubble.show(isId()
      ? 'Persediaan Token Beku mingguanmu sudah datang! +1 ❄️'
      : 'Your weekly Freeze Token supply has arrived! +1 ❄️')
  }
  return true
}

// Each task that passes its deadline costs a Freeze Token, or resets the streak when none are left.
async function checkStreak() {
  const now = new Date()
  let changed = recoverFreezeToken(now)
  let tokensUsed = 0
  let reset = false
  const penalised = []

  for (const task of state.tasks) {
    const deadline = deadlineOf(task)
    if (task.is_done || task.streak_penalty_handled || !deadline || deadline > now) continue

    task.streak_penalty_handled = true
    penalised.push(task)
    if (state.streak > 0 || state.freezeTokens > 0) {
      if (state.freezeTokens > 0) {
        state.freezeTokens--
        state.freezeActive = true
        tokensUsed++
      } else {
        reset = true
      }
    }
  }

  if (reset) {
    state.streak = 0
    state.freezeActive = false
  }
  if (!changed && penalised.length === 0) return

  for (const task of penalised) await api.tasks.update(task.id, task)

  if (tokensUsed > 0) {
    api.bubble.show(isId()
      ? `Deadline terlewati! ${tokensUsed} Token Beku digunakan. Streak aman! ❄️`
      : `Deadline missed! ${tokensUsed} Freeze Token used. Streak safe! ❄️`)
  } else if (reset) {
    api.bubble.show(isId()
      ? 'Yah, streak kamu reset karena ada tugas yang melewati deadline. Ayo mulai lagi! 💔'
      : "Oh no, your streak reset because a task passed its deadline. Let's start over! 💔")
  }

  await saveStreakSettings()
  updateMoodCard()
  renderStreakProgress()
}

async function handleStreakOnTaskComplete(task) {
  const now = new Date()
  const deadline = deadlineOf(task)

  // Completing late doesn't extend the streak.
  if (!(deadline && now > deadline)) {
    state.streak++
    state.lastTaskDate = now.toISOString().split('T')[0]
    state.longestStreak = Math.max(state.longestStreak, state.streak)
  }
  state.freezeActive = false // any completion ends the frozen state

  await saveStreakSettings()
  updateMoodCard()
  renderStreakProgress()
}

// ── Streak bottom sheet ──────────────────────────────────────

function renderStreakProgress() {
  const set = (id, text) => { const el = $(id); if (el) el.textContent = text }

  set('current-streak-val-normal', state.streak)
  set('current-streak-val-frozen', state.streak)
  set('longest-streak-val', state.longestStreak)

  const now = new Date()
  const finished = state.tasks.filter((task) => task.is_done)
  const onTime = finished.filter((task) => {
    const deadline = deadlineOf(task)
    return !deadline || deadline - completedAt(task) >= 0
  }).length
  const missed = state.tasks.filter((task) => !task.is_done && deadlineOf(task) && deadlineOf(task) < now).length

  const total = finished.length + missed
  const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0
  const missedPercent = total > 0 ? 100 - onTimePercent : 0

  set('on-time-fraction-label', `${onTime} / ${total} ${t('tasks')}`)
  set('on-time-percent-label', `${onTimePercent}% ${t('onTime')}`)
  set('on-time-missed-label', `${missedPercent}% ${t('missed')}`)
  const fill = $('on-time-progress-fill')
  if (fill) fill.style.width = `${onTimePercent}%`

  const tokens = $('freeze-tokens-container')
  if (tokens) {
    tokens.innerHTML = ''
    for (let i = 1; i <= FREEZE_TOKEN_MAX; i++) {
      const available = state.freezeTokens >= i
      const btn = document.createElement('button')
      btn.className = `freeze-token-btn${available ? ' active' : ''}`
      btn.innerHTML = '<img src="../assets/styles/images/icons/freeze.svg" width="14" height="14" style="pointer-events:none">'
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        api.bubble.show({
          text: available
            ? 'Token beku aktif melindungi streak kamu secara otomatis jika kamu lupa! 🛡️'
            : 'Token beku belum tersedia. Token pulih 1 setiap minggu!',
          emoji: '❄️',
        })
      })
      tokens.appendChild(btn)
    }
  }

  $('current-streak-card')?.classList.remove('frozen')
  $('streak-normal-state').style.display = 'block'
  $('streak-frozen-state').style.display = 'none'
}

function initStreakBottomSheet() {
  const overlay = $('streak-overlay')

  $('streak-badge').addEventListener('click', () => {
    overlay.style.display = 'block'
    setTimeout(() => {
      overlay.classList.add('active')
      renderStreakProgress()
    }, 20)
  })

  const close = () => {
    overlay.classList.remove('active')
    setTimeout(() => { overlay.style.display = 'none' }, 300) // matches the CSS transition
  }
  $('btn-close-streak').addEventListener('click', close)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close() })
}

// ── Init ─────────────────────────────────────────────────────

async function init() {
  await loadSettings()
  await loadTasks()
  await checkStreak()

  translateDOM()
  renderDayStrip()
  updateMoodCard()
  renderTaskList()

  initTabBar()
  initFinishedFilters()
  initConfirmModal()
  initWindowControls()
  initStreakBottomSheet()

  setFocusView(false)
  $('btn-focus-start')?.addEventListener('click', startFocusTimer)
  $('btn-focus-stop')?.addEventListener('click', stopFocusTimer)

  // A task was added or completed in another window.
  api.window.onRefreshTasks(async () => {
    await loadTasks()
    await checkStreak()
    updateMoodCard()
    renderTaskList()
  })

  api.window.onNavigate((page) => {
    if (page === 'active' || page === 'finished') selectTab(page)
    else if (page === 'add-task') api.window.openAddTask()
  })

  checkDeadlineReminders()
  setInterval(() => { checkStreak(); checkDeadlineReminders() }, MINUTE)
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => console.error('[Companion] Initialization error:', err))
})
