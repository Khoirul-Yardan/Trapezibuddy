// bubble.js: speech bubble overlay. Main forwards messages here; each one is typed out,
// then the bubble hides itself after a reading pause.

const TYPE_SPEED_MS = 22 // per character
const READING_TIME_MS = 3500
const HIDE_ANIMATION_MS = 300 // matches the CSS transition

const card = document.getElementById('bubble-card')
const textEl = document.getElementById('bubble-text')

let typeTimer = null
let autoHideTimer = null

function showBubble(text, emoji) {
  clearTimeout(autoHideTimer)
  clearInterval(typeTimer)

  textEl.textContent = ''
  card.classList.remove('hiding')
  card.classList.add('active')

  card.querySelector('.bubble-emoji')?.remove()
  if (emoji) {
    const badge = document.createElement('span')
    badge.className = 'bubble-emoji'
    badge.textContent = emoji
    card.appendChild(badge)
  }

  let shown = 0
  typeTimer = setInterval(() => {
    textEl.textContent = text.substring(0, ++shown)
    if (shown >= text.length) clearInterval(typeTimer)
  }, TYPE_SPEED_MS)

  autoHideTimer = setTimeout(hideBubble, text.length * TYPE_SPEED_MS + READING_TIME_MS)
}

function hideBubble() {
  card.classList.add('hiding')
  setTimeout(() => card.classList.remove('active', 'hiding'), HIDE_ANIMATION_MS)
}

// Accepts a plain string or { text, emoji }.
const show = (payload) =>
  typeof payload === 'string' ? showBubble(payload) : showBubble(payload?.text || '', payload?.emoji || '')

const { bubble } = window.trapezi
bubble.onShow(show)
bubble.onTaskAdded((task) => showBubble(`Tugas baru ditambahkan: "${task.name}"`, '📝'))
bubble.onTaskCompleted((task) => showBubble(task.name || 'Tugas selesai!', task.emoji || '✅'))
