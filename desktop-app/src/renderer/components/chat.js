// chat.js — TrapeziBuddy Chat Logic
// Migrasi dari Python chat_panel.py ke Electron
// AI backend: Ollama lokal (http://localhost:11434)

const api = window.trapezi

// ── Config ───────────────────────────────────────────────────
const OLLAMA_URL   = 'http://localhost:11434/api/generate'
const OLLAMA_MODEL = 'llama2'  // ganti sesuai model yang diinstall

// System prompt untuk karakter TrapeziBuddy
const SYSTEM_PROMPT = `Kamu adalah TrapeziBuddy, asisten desktop companion yang friendly dan helpful.
Kamu membantu pengguna mengelola tugas, memberikan semangat, dan menjadi teman ngobrol.
Gunakan bahasa yang casual dan hangat, seperti teman dekat. 
Jawaban singkat dan padat, maksimal 2-3 kalimat.
Sesekali gunakan emoji yang relevan.`

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

// ── Call Ollama ──────────────────────────────────────────────
async function callOllama(userMessage) {
  // Build prompt dengan history sederhana
  const recentHistory = messageHistory.slice(-6)  // 3 pasang pesan terakhir
  let historyText = ''
  recentHistory.forEach(msg => {
    const prefix = msg.role === 'user' ? 'User' : 'Assistant'
    historyText += `${prefix}: ${msg.text}\n`
  })

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${historyText}User: ${userMessage}\nAssistant:`

  try {
    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:  OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return data.response?.trim() ?? 'Hmm, aku lagi bingung. Coba tanya lagi ya!'

  } catch (err) {
    console.error('Ollama error:', err)

    // Fallback responses kalau Ollama tidak tersedia
    const fallbacks = [
      'Wah, kayaknya koneksi AI-ku lagi putus. Coba cek Ollama dulu ya!',
      'Hmm, aku lagi susah mikir sekarang. Pastikan Ollama sudah jalan ya 😅',
      'Sepertinya ada masalah teknis. Jalankan "ollama serve" dulu ya!',
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
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
  const response = await callOllama(text)

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