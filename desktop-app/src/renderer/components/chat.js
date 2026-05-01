// chat.js — TrapeziBuddy Chat Logic
// Electron UI + Python Backend AI

// Get API safely
let api = null
function getApi() {
  if (!api) api = window.trapezi
  return api
}

// ── State ────────────────────────────────────────────────────
let isThinking = false
let typingEl   = null
let messageHistory = []

// ── Helpers ─────────────────────────────────────────────────
function formatTime(date = new Date()) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  const container = document.getElementById('chat-messages')
  if (container) container.scrollTop = container.scrollHeight
}

// ── Render chat bubble ───────────────────────────────────────
function appendMessage(text, role = 'companion') {
  const container = document.getElementById('chat-messages')
  if (!container) return null

  const group = document.createElement('div')
  group.className = `msg-group ${role}`

  if (role === 'companion') {
    const avatarRow = document.createElement('div')
    avatarRow.style.cssText = 'display:flex; align-items:flex-end; gap:6px;'

    const avatar = document.createElement('div')
    avatar.className = 'msg-avatar'
    avatar.innerHTML = `<svg viewBox="0 0 22 16" fill="none" width="14" height="10">
      <path d="M4 14L0 2H22L18 14H4Z" fill="rgba(255,255,255,0.9)"/>
    </svg>`

    const bubble = document.createElement('div')
    bubble.className = 'bubble'
    bubble.textContent = text

    avatarRow.appendChild(avatar)
    avatarRow.appendChild(bubble)
    group.appendChild(avatarRow)
  } else {
    const bubble = document.createElement('div')
    bubble.className = 'bubble'
    bubble.textContent = text
    group.appendChild(bubble)
  }

  const time = document.createElement('div')
  time.className = 'msg-time'
  time.textContent = formatTime()

  if (role === 'companion') time.style.paddingLeft = '32px'
  group.appendChild(time)

  container.appendChild(group)
  scrollToBottom()
  return group
}

// ── Typing indicator ─────────────────────────────────────────
function showTyping() {
  const container = document.getElementById('chat-messages')
  if (!container) return

  const group = document.createElement('div')
  group.className = 'msg-group companion'
  group.id = 'typing-indicator'

  const avatarRow = document.createElement('div')
  avatarRow.style.cssText = 'display:flex; align-items:flex-end; gap:6px;'

  const avatar = document.createElement('div')
  avatar.className = 'msg-avatar'
  avatar.innerHTML = `<svg viewBox="0 0 22 16" fill="none" width="14" height="10">
    <path d="M4 14L0 2H22L18 14H4Z" fill="rgba(255,255,255,0.9)"/>
  </svg>`

  const typingBubble = document.createElement('div')
  typingBubble.className = 'typing-bubble'
  typingBubble.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `

  avatarRow.appendChild(avatar)
  avatarRow.appendChild(typingBubble)
  group.appendChild(avatarRow)
  container.appendChild(group)
  scrollToBottom()
  typingEl = group
}

function hideTyping() {
  if (typingEl) { typingEl.remove(); typingEl = null }
}

// ── Call Python AI Backend ────────────────────────────────────
async function callLocalDialog(userMessage) {
  try {
    const currentApi = getApi()
    if (!currentApi || !currentApi.chat || !currentApi.chat.sendMessage) {
      throw new Error('API tidak terhubung')
    }
    const result = await currentApi.chat.sendMessage(userMessage)
    if (!result?.ok) throw new Error(result?.response || 'Dialog error')
    return result.response?.trim() || 'Hmm, aku bingung. Coba tanya lagi ya! 🤔'
  } catch (err) {
    console.error('Dialog error:', err)
    return 'Ada error di chat. Coba lagi ya! 🔄'
  }
}

// ── Send message ─────────────────────────────────────────────
async function sendMessage() {
  if (isThinking) return
  const input   = document.getElementById('chat-input')
  const sendBtn = document.getElementById('btn-send')
  if (!input) return
  const text = input.value.trim()
  if (!text) return

  input.value = ''
  input.focus()

  appendMessage(text, 'user')
  messageHistory.push({ role: 'user', text })

  isThinking = true
  if (sendBtn) sendBtn.disabled = true
  showTyping()

  const response = await callLocalDialog(text)

  hideTyping()
  appendMessage(response, 'companion')
  messageHistory.push({ role: 'companion', text: response })

  // AI response bubble is shown on Python character via main.js chat:sendMessage handler
  // No need to call python.showBubble here — main.js already does it

  handleChatCommands(text.toLowerCase())

  isThinking = false
  if (sendBtn) sendBtn.disabled = false
  if (input) input.focus()
}

// ── Handle Chat Commands ──────────────────────────────────────
async function handleChatCommands(text) {
  const currentApi = getApi()
  if (!currentApi) return
  if (text.includes('tambah task') || text.includes('buat task')) {
    setTimeout(() => currentApi.window?.openAddTask?.(), 500)
  }
  if (text.includes('fokus') || text.includes('pomodoro')) {
    if (currentApi.python) currentApi.python.hideCharacter()
  }
}

// ── Window controls ──────────────────────────────────────────
function initWindowControls() {
  const btn = document.getElementById('btn-minimize')
  if (btn) {
    btn.addEventListener('click', () => {
      const currentApi = getApi()
      if (currentApi?.window?.minimize) currentApi.window.minimize()
    })
  }
}

// ── Event listeners ──────────────────────────────────────────
function initEvents() {
  const sendBtn = document.getElementById('btn-send')
  const input   = document.getElementById('chat-input')
  if (sendBtn) sendBtn.addEventListener('click', sendMessage)
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
    })
  }
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