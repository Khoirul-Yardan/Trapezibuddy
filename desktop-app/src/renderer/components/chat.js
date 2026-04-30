// chat.js — TrapeziBuddy Chat Logic
// Electron UI + Python backend bridge (AIController + ActionExecutor)

const api = window.trapezi

// ── State ────────────────────────────────────────────────────
let isThinking = false
let typingEl   = null
let messageHistory = []  // Untuk context window

// ── Helpers ─────────────────────────────────────────────────
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages')
  container.scrollTop = container.scrollHeight
}

// ── Render bubble ────────────────────────────────────────────
function appendMessage(text, role = 'companion') {
  const container = document.getElementById('chat-messages')

  const group = document.createElement('div')
  group.className = `msg-group ${role}`

  const bubble = document.createElement('div')
  bubble.className = 'bubble'
  bubble.textContent = text

  const time = document.createElement('div')
  time.className = 'msg-time'
  time.textContent = formatTime()

  group.appendChild(bubble)
  group.appendChild(time)
  container.appendChild(group)

  scrollToBottom()
  return group
}

// ── Typing indicator ─────────────────────────────────────────
function showTyping() {
  const container = document.getElementById('chat-messages')

  const group = document.createElement('div')
  group.className = 'msg-group companion'
  group.id = 'typing-indicator'

  group.innerHTML = `
    <div class="typing-bubble">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `

  container.appendChild(group)
  scrollToBottom()
  typingEl = group
}

function hideTyping() {
  if (typingEl) {
    typingEl.remove()
    typingEl = null
  }
}

// ── Call Python backend via Electron IPC ────────────────────
async function callPythonBackend(userMessage) {
  try {
    const result = await api.chat.sendMessage(userMessage)
    if (!result?.ok) {
      throw new Error(result?.response || 'Python backend tidak merespons.')
    }
    return result.response?.trim() || 'Hmm, aku lagi bingung. Coba tanya lagi ya!'
  } catch (err) {
    console.error('Python backend error:', err)
    return 'Backend Python sedang bermasalah. Cek terminal untuk detail error ya.'
  }
}

// ── Send message ─────────────────────────────────────────────
async function sendMessage() {
  if (isThinking) return

  const input   = document.getElementById('chat-input')
  const sendBtn = document.getElementById('btn-send')
  const text    = input.value.trim()
  if (!text) return

  // Clear input
  input.value = ''
  input.focus()

  // Append user bubble
  appendMessage(text, 'user')
  messageHistory.push({ role: 'user', text })

  // Show thinking
  isThinking = true
  sendBtn.disabled = true
  showTyping()

  // Get AI response
  const response = await callPythonBackend(text)

  // Hide thinking, show response
  hideTyping()
  appendMessage(response, 'companion')
  messageHistory.push({ role: 'companion', text: response })

  isThinking   = false
  sendBtn.disabled = false
  input.focus()
}

// ── Window controls ──────────────────────────────────────────
function initWindowControls() {
  document.getElementById('btn-minimize')
    ?.addEventListener('click', () => api.window.minimize())
}

// ── Event listeners ──────────────────────────────────────────
function initEvents() {
  const sendBtn = document.getElementById('btn-send')
  const input   = document.getElementById('chat-input')

  sendBtn.addEventListener('click', sendMessage)

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })
}

// ── Greeting on load ────────────────────────────────────────
function showGreeting() {
  const greetings = [
    'Halo! Ada yang bisa aku bantu? 😊',
    'Hai! Aku TrapeziBuddy. Mau ngobrol atau butuh bantuan? 👋',
    'Selamat datang! Ada yang mau ditanyain? 🌿',
  ]
  const msg = greetings[Math.floor(Math.random() * greetings.length)]
  setTimeout(() => appendMessage(msg, 'companion'), 300)
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initEvents()
  initWindowControls()
  showGreeting()
})