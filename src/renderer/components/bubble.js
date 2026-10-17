// bubble.js — Speech bubble overlay logic
// Receives text via IPC from main process, shows with typewriter animation

let typeTimer = null
let autoHideTimer = null

// ── Show bubble text with typewriter effect ──────────────────
function showBubble(text, emoji) {
  console.log('[Bubble] showBubble called with:', text, emoji);
  const textEl = document.getElementById('bubble-text')
  const card = document.getElementById('bubble-card')
  if (!textEl || !card) {
    console.error('[Bubble] textEl or card missing');
    return
  }

  // Clear previous timers
  if (typeTimer) clearInterval(typeTimer)
  if (autoHideTimer) clearTimeout(autoHideTimer)
  
  textEl.innerHTML = ''
  card.classList.remove('hiding')
  card.classList.add('active')

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
  
  // Auto-hide the bubble after typing finishes + reading time
  const typingDuration = text.length * speed
  const readingTimeMs = 3500 // Extra 3.5 seconds to read
  
  autoHideTimer = setTimeout(() => {
    hideBubble()
    autoHideTimer = null
  }, typingDuration + readingTimeMs)
}

// ── Hide bubble with animation ───────────────────────────────
function hideBubble() {
  const card = document.getElementById('bubble-card')
  if (card) {
    card.classList.add('hiding')
    setTimeout(() => {
      card.classList.remove('active')
      card.classList.remove('hiding')
    }, 300) // match CSS transition duration
  }
}

// ── Clear bubble content completely ──────────────────────────
function clearBubble() {
  const textEl = document.getElementById('bubble-text')
  if (textEl) {
    textEl.innerHTML = ''
    textEl.textContent = ''
  }
  
  // Remove any emoji badges
  const card = document.getElementById('bubble-card')
  if (card) {
    const existingEmoji = card.querySelector('.bubble-emoji')
    if (existingEmoji) existingEmoji.remove()
    
    // Ensure card is hidden
    card.classList.remove('active', 'hiding')
  }
  
  // Clear all timers
  if (typeTimer) {
    clearInterval(typeTimer)
    typeTimer = null
  }
  if (autoHideTimer) {
    clearTimeout(autoHideTimer)
    autoHideTimer = null
  }
  
  console.log('Bubble cleared completely')
}

// ── Listen for messages from main process ────────────────────
// Note: contextIsolation is ON, using preload API
console.log('[Bubble] Initializing listeners...');
if (window.trapezi && window.trapezi.bubble) {
  const b = window.trapezi.bubble
  console.log('[Bubble] trapezi.bubble API found');
  
  b.onSetText((text) => {
    console.log('[Bubble] onSetText received:', text);
    showBubble(text)
  })
  
  b.onShow((data) => {
    console.log('[Bubble] onShow received:', data);
    if (typeof data === 'string') showBubble(data)
    else showBubble(data.text || '', data.emoji || '')
  })
  
  b.onHide(() => {
    console.log('[Bubble] onHide received');
    hideBubble()
  })
  b.onClear(() => {
    console.log('[Bubble] onClear received');
    clearBubble()
  })
  
  b.onTaskAdded((task) => {
    console.log('[Bubble] onTaskAdded received:', task);
    const msg = `Tugas baru ditambahkan: "${task.name}"`
    showBubble(msg, '📝')
  })
  
  b.onTaskCompleted((task) => {
    console.log('[Bubble] onTaskCompleted received:', task);
    const msg = task.name || 'Tugas selesai!'
    showBubble(msg, task.emoji || '✅')
  })
} else {
  console.error('[Bubble] trapezi.bubble API NOT found!');
}

// Ensure bubble starts completely empty
clearBubble()
