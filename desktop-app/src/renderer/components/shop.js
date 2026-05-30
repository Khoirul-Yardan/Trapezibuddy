// shop.js — TrapeziBuddy Shop Component
// Handles: Shop UI, purchases, currency management

// ── Shop Configuration ──────────────────────────────
const SHOP_CONFIG = {
  ITEMS: {
    'character-2': {
      name: 'Buka Goldship',
      desc: 'Dapatkan karakter petualang penuh gaya',
      icon: '🎭',
      price: 500,
      type: 'character',
      oneTime: true,
    },
    'streak-shield': {
      name: 'Streak Shield',
      desc: 'Lindungi streak jika terpaksa putus',
      icon: '🛡️',
      price: 50,
      type: 'protection',
      oneTime: false,
    },
  },
  EARNINGS: {
    TASK_COMPLETED: 550,    // Points untuk task selesai
    FOCUS_SESSION: 5,      // Points untuk focus session
  },
  STORAGE_KEY: 'trapezibuddy_shop_data',
}

// ── Shop State ──────────────────────────────────────
let shopState = {
  points: 0,
  character2Unlocked: false,
  streakShields: 0,
}

// ── Initialize Shop Data ────────────────────────────
function initShopData() {
  // AUTO RESET ON STARTUP FOR DEMO - Comment this out to enable persistence
  console.log('[Shop] Resetting all data on startup for demo')
  resetShopData()
  
  // To enable persistence, uncomment below and comment out resetShopData() above:
  // const saved = localStorage.getItem(SHOP_CONFIG.STORAGE_KEY)
  // if (saved) {
  //   try {
  //     shopState = JSON.parse(saved)
  //   } catch (e) {
  //     console.error('Error loading shop data:', e)
  //     resetShopData()
  //   }
  // } else {
  //   resetShopData()
  // }
  updateShopUI()
}

// ── Reset Shop Data to Defaults ─────────────────────
function resetShopData() {
  shopState = {
    points: 0,
    character2Unlocked: false,
    streakShields: 0,
  }
  saveShopData()
}

// ── Save Shop Data to Storage ───────────────────────
function saveShopData() {
  localStorage.setItem(SHOP_CONFIG.STORAGE_KEY, JSON.stringify(shopState))
}

// ── Add Points (Called from main app) ───────────────
function addPoints(amount, source = 'misc') {
  shopState.points += amount
  saveShopData()
  updateShopUI()
  console.log(`[Shop] Added ${amount} points from ${source}. Total: ${shopState.points}`)
}

// ── Task Completion Reward ──────────────────────────
function onTaskCompleted() {
  addPoints(SHOP_CONFIG.EARNINGS.TASK_COMPLETED, 'task_completed')
}

// ── Focus Session Reward ────────────────────────────
function onFocusSessionCompleted() {
  addPoints(SHOP_CONFIG.EARNINGS.FOCUS_SESSION, 'focus_session')
}

// ── Handle Purchase ─────────────────────────────────
function purchaseItem(itemId) {
  const item = SHOP_CONFIG.ITEMS[itemId]
  
  if (!item) {
    console.error(`[Shop] Unknown item: ${itemId}`)
    return false
  }

  // Check if already purchased (one-time items)
  if (item.oneTime) {
    if (itemId === 'character-2' && shopState.character2Unlocked) {
      showShopNotification('Sudah dibuka!', 'error')
      return false
    }
  }

  // Check points
  if (shopState.points < item.price) {
    showShopNotification(`Poin tidak cukup! Perlu ${item.price - shopState.points} lagi`, 'error')
    return false
  }

  // Apply purchase
  shopState.points -= item.price
  
  if (itemId === 'character-2') {
    shopState.character2Unlocked = true
    showShopNotification('🎭 Goldship berhasil dibuka!', 'success')
    
    // Show celebration message via bubble if API available
    setTimeout(() => {
      if (window.trapezi && window.trapezi.bubble && window.trapezi.bubble.show) {
        try {
          window.trapezi.bubble.show({
            text: 'Selamat! Karakter Goldship telah terbuka! 🎉 Silakan keluar dan masuk aplikasi lagi untuk menggunakan karakter baru.',
            emoji: '🎭'
          })
        } catch (e) {
          console.log('Bubble API not available for celebration message')
        }
      }
    }, 300)
  } else if (itemId === 'streak-shield') {
    shopState.streakShields += 1
    showShopNotification('🛡️ Streak Shield ditambah!', 'success')
  }

  saveShopData()
  updateShopUI()
  return true
}

// ── Update Shop UI ──────────────────────────────────
function updateShopUI() {
  // Update points display
  const pointsEl = document.getElementById('shop-points')
  if (pointsEl) {
    pointsEl.textContent = shopState.points
  }

  // Update character 2 item
  const char2Btn = document.querySelector('[data-item="character-2"]')
  if (char2Btn) {
    const char2Item = document.getElementById('item-character-2')
    if (shopState.character2Unlocked) {
      char2Item.classList.add('purchased')
      char2Btn.classList.add('purchased')
      char2Btn.textContent = '✓ Sudah Dibuka'
      char2Btn.disabled = true
    } else {
      char2Item.classList.remove('purchased')
      char2Btn.classList.remove('purchased')
      char2Btn.innerHTML = '<span class="shop-item-price">500 ⭐</span>'
      char2Btn.disabled = shopState.points < 500
    }
  }

  // Update streak shield
  const shieldBtn = document.querySelector('[data-item="streak-shield"]')
  const shieldCount = document.getElementById('shield-count')
  if (shieldBtn && shieldCount) {
    shieldCount.textContent = `Dimiliki: ${shopState.streakShields}`
    shieldBtn.innerHTML = '<span class="shop-item-price">50 ⭐</span>'
    shieldBtn.disabled = shopState.points < 50
  }
}

// ── Show Notification ───────────────────────────────
function showShopNotification(message, type = 'info') {
  console.log(`[Shop Notify] ${type.toUpperCase()}: ${message}`)
  
  // Create notification element
  const notif = document.createElement('div')
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
    color: white;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `
  notif.textContent = message

  // Add animation
  const style = document.createElement('style')
  if (!document.querySelector('style[data-notif-anim]')) {
    style.setAttribute('data-notif-anim', 'true')
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(notif)

  // Remove after 2.5 seconds
  setTimeout(() => {
    notif.style.animation = 'slideIn 0.3s ease reverse'
    setTimeout(() => notif.remove(), 300)
  }, 2500)
}

// ── Open/Close Shop ─────────────────────────────────
function openShop() {
  const overlay = document.getElementById('shop-overlay')
  if (overlay) {
    overlay.style.display = 'flex'
    initShopData() // Refresh data when opening
  }
}

function closeShop() {
  const overlay = document.getElementById('shop-overlay')
  if (overlay) {
    overlay.style.display = 'none'
  }
}

// ── Setup Event Listeners ───────────────────────────
function setupShopListeners() {
  // Shop button
  const shopBtn = document.getElementById('btn-shop')
  const closeShopBtn = document.getElementById('btn-close-shop')
  const overlay = document.getElementById('shop-overlay')

  if (shopBtn) {
    shopBtn.addEventListener('click', openShop)
  }

  if (closeShopBtn) {
    closeShopBtn.addEventListener('click', closeShop)
  }

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeShop()
      }
    })
  }

  // Purchase buttons
  document.querySelectorAll('.shop-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const itemId = btn.getAttribute('data-item')
      purchaseItem(itemId)
    })
  })
}

// ── Export for use in companion.js ──────────────────
// These functions will be called from companion.js
window.shopAPI = {
  init: initShopData,
  addPoints: addPoints,
  onTaskCompleted: onTaskCompleted,
  onFocusSessionCompleted: onFocusSessionCompleted,
  purchaseItem: purchaseItem,
  getState: () => shopState,
  getCharacter2Unlocked: () => shopState.character2Unlocked,
  getStreakShields: () => shopState.streakShields,
  useStreakShield: () => {
    if (shopState.streakShields > 0) {
      shopState.streakShields -= 1
      saveShopData()
      updateShopUI()
      return true
    }
    return false
  },
}

// ── Initialize on page load ────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    setupShopListeners()
    initShopData()
  }, 100)
})
