// chat.js — TrapeziBuddy Chat Logic
// Electron UI + Local Dialog (no backend needed)

// Get API safely - may not be available immediately on page load
let api = null
function getApi() {
  if (!api) {
    api = window.trapezi
  }
  return api
}

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
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

// ── Render bubble ────────────────────────────────────────────
function appendMessage(text, role = 'companion') {
  const container = document.getElementById('chat-messages')
  if (!container) return null

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
  if (!container) return

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

// ── Call Local Dialog (no Python backend) ────────────────────
async function callLocalDialog(userMessage) {
  try {
    const currentApi = getApi()
    if (!currentApi || !currentApi.chat || !currentApi.chat.sendMessage) {
      console.error('API tidak tersedia:', { api: currentApi, available: !!window.trapezi })
      throw new Error('API tidak terhubung')
    }
    
    const result = await currentApi.chat.sendMessage(userMessage)
    
    if (!result?.ok) {
      throw new Error(result?.response || 'Dialog error')
    }
    
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

  // Clear input
  input.value = ''
  input.focus()

  // Append user bubble
  appendMessage(text, 'user')
  messageHistory.push({ role: 'user', text })

  // Show thinking
  isThinking = true
  if (sendBtn) sendBtn.disabled = true
  showTyping()

  // Get dialog response
  const response = await callLocalDialog(text)

  // Hide thinking, show response
  hideTyping()
  appendMessage(response, 'companion')
  messageHistory.push({ role: 'companion', text: response })

  // Handle specific commands
  handleChatCommands(text.toLowerCase())

  isThinking   = false
  if (sendBtn) sendBtn.disabled = false
  if (input) input.focus()
}

// ── Handle Chat Commands ──────────────────────────────────────
async function handleChatCommands(text) {
  const currentApi = getApi()
  if (!currentApi) return

  // Task-related commands
  if (text.includes('tambah task') || text.includes('buat task')) {
    setTimeout(() => {
      currentApi.window?.openAddTask?.()
    }, 500)
  }

  // Focus session commands
  if (text.includes('fokus') || text.includes('pomodoro')) {
    console.log('Focus session started')
    // Character akan tersembunyi saat fokus (handled by companion.html)
    currentApi.window?.hide?.()
  }

  // App opening commands
  if (text.includes('buka chrome') || text.includes('buka youtube')) {
    console.log('Opening app:', text)
    // Akan di-execute oleh Python backend nanti
  }
}

// ── Window controls ──────────────────────────────────────────
function initWindowControls() {
  const btn = document.getElementById('btn-minimize')
  if (btn) {
    btn.addEventListener('click', () => {
      const currentApi = getApi()
      if (currentApi && currentApi.window && currentApi.window.minimize) {
        currentApi.window.minimize()
      }
    })
  }
}

// ── Event listeners ──────────────────────────────────────────
function initEvents() {
  const sendBtn = document.getElementById('btn-send')
  const input   = document.getElementById('chat-input')

  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage)
  }

  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
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