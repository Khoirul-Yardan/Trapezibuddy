// ─────────────────────────────────────────────────────────────
// PERUBAHAN di companion.js:
//
// 1. GANTI fungsi handleTaskCheck() yang lama dengan yang baru di bawah
// 2. TAMBAHKAN fungsi initConfirmModal() di bawahnya
// 3. TAMBAHKAN initConfirmModal() di dalam fungsi init()
// ─────────────────────────────────────────────────────────────


// ── Task Check — buka confirm modal (GANTI yang lama) ────────
function handleTaskCheck(taskId, taskName) {
  openConfirmModal(taskId, taskName)
}


// ── Confirm Modal ────────────────────────────────────────────
// State confirm modal
let _confirmTaskId   = null
let _confirmTaskName = null

function openConfirmModal(taskId, taskName) {
  _confirmTaskId   = taskId
  _confirmTaskName = taskName

  // Set teks
  document.getElementById('confirm-task-name').textContent = taskName
  document.getElementById('confirm-task-hint').textContent = taskName
  document.getElementById('confirm-instruction').innerHTML =
    `To confirm, type "<strong>${taskName}</strong>" below`

  // Reset state
  const input = document.getElementById('confirm-input')
  input.value = ''
  input.classList.remove('error')
  document.getElementById('confirm-error').style.display = 'none'
  document.getElementById('btn-confirm-task').disabled = true

  // Tampilkan modal
  document.getElementById('confirm-overlay').style.display = 'flex'

  // Focus input setelah animasi
  setTimeout(() => input.focus(), 50)
}

function initConfirmModal() {
  const overlay    = document.getElementById('confirm-overlay')
  const closeBtn   = document.getElementById('btn-close-confirm')
  const input      = document.getElementById('confirm-input')
  const confirmBtn = document.getElementById('btn-confirm-task')
  const errorEl    = document.getElementById('confirm-error')

  // Tutup modal
  const closeConfirm = () => {
    overlay.style.display = 'none'
    _confirmTaskId   = null
    _confirmTaskName = null
  }

  closeBtn.addEventListener('click', closeConfirm)
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
    const val      = input.value.trim()
    const expected = _confirmTaskName?.trim()

    // Validasi: harus persis sama (case-insensitive)
    if (val.toLowerCase() !== expected?.toLowerCase()) {
      input.classList.add('error')
      errorEl.style.display = 'block'
      input.focus()
      return
    }

    // Sukses — tandai selesai
    confirmBtn.disabled = true
    confirmBtn.textContent = 'Menyimpan...'

    await api.tasks.complete(_confirmTaskId)

    closeConfirm()

    // Refresh UI
    await loadTasks()
    updateMoodCard()
    renderTaskList()
  })

  // Enter key shortcut
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !confirmBtn.disabled) {
      confirmBtn.click()
    }
  })
}


// ── TAMBAHKAN initConfirmModal() di dalam fungsi init() ──────
//
// async function init() {
//   await loadSettings()
//   await loadTasks()
//
//   renderDayStrip()
//   updateMoodCard()
//   renderTaskList()
//   initTabBar()
//   initModal()
//   initWindowControls()
//   initConfirmModal()   ← TAMBAHKAN BARIS INI
//   startFocusTimer()
// }
