// bubble.js — Speech bubble overlay logic
// Receives text via IPC from main process, shows with typewriter animation

const { ipcRenderer } = require('electron')

let typeTimer = null

// ── Show bubble text with typewriter effect ──────────────────
function showBubble(text, emoji) {
  const textEl = document.getElementById('bubble-text')
  const card = document.getElementById('bubble-card')
  if (!textEl || !card) return

  // Clear previous
  if (typeTimer) clearInterval(typeTimer)
  textEl.innerHTML = ''
  card.classList.remove('hiding')

  // Add emoji badge if provided
  const existingEmoji = card.querySelector('.bubble-emoji')
  if (existingEmoji) existingEmoji.remove()
  if (emoji) {
    const emojiEl = document.createElement('span')
    emojiEl.className = 'bubble-emoji'
    emojiEl.textContent = emoji
    card.appendChild(emojiEl)
  }

  // Typewriter effect
  let i = 0
  const speed = 22 // ms per character

  function typeChar() {
    if (i < text.length) {
      textEl.textContent = text.substring(0, i + 1)
      i++
    } else {
      clearInterval(typeTimer)
      typeTimer = null
    }
  }

  typeTimer = setInterval(typeChar, speed)
}

// ── Hide bubble with animation ───────────────────────────────
function hideBubble() {
  const card = document.getElementById('bubble-card')
  if (card) {
    card.classList.add('hiding')
  }
}

// ── Listen for messages from main process ────────────────────
// Note: contextIsolation is OFF for this window since it needs direct ipcRenderer
try {
  // Try preload API first
  if (window.trapezi && window.trapezi.bubble) {
    window.trapezi.bubble.onShow((data) => {
      showBubble(data.text || '', data.emoji || '')
    })
    window.trapezi.bubble.onHide(() => {
      hideBubble()
    })
  }
} catch (e) {
  console.log('Bubble: waiting for IPC via webContents.send')
}

// Fallback: listen via ipcRenderer directly (if nodeIntegration enabled)
try {
  if (typeof require !== 'undefined') {
    const { ipcRenderer: ipc } = require('electron')
    ipc.on('bubble:show', (_, data) => {
      showBubble(data.text || '', data.emoji || '')
    })
    ipc.on('bubble:hide', () => {
      hideBubble()
    })
  }
} catch (e) {
  // nodeIntegration not available, use preload
}
