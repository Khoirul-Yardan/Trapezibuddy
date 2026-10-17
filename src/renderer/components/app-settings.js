const api = window.trapezi;

// savedState = nilai dari store (untuk revert jika user tekan ←)
// state      = nilai sementara selama session ini
const savedState = { character: 'agnesTachyon', focusTimer: 25, doNotDisturb: true, language: 'en' };
let state      = { ...savedState };

function updateStepperButtons() {
  document.getElementById('timer-minus').disabled = state.focusTimer <= 5;
  document.getElementById('timer-plus').disabled  = state.focusTimer >= 60;
}

function updateUI() {
  document.querySelectorAll('.char-card').forEach(el => {
    el.classList.toggle('active', el.dataset.char === state.character);
  });
  document.querySelectorAll('.lang-btn').forEach(el => {
    el.style.border = el.dataset.lang === state.language ? '2px solid #3B3B3A' : '1px solid #E0E0E0';
    el.style.background = el.dataset.lang === state.language && el.dataset.lang === 'id' ? '#F4A9A9' : '#FFF';
    if (el.dataset.lang === 'id') {
      el.style.borderColor = el.dataset.lang === state.language ? '#F4A9A9' : '#E0E0E0';
    }
  });
  document.getElementById('toggle-dnd').checked = state.doNotDisturb;
  document.getElementById('timer-val').textContent = state.focusTimer + ' min';
  updateStepperButtons();
}

// Terapkan CSS class lokal tanpa broadcast ke window lain
function applyThemeLocal(character) {
  applyTheme(character);
}

async function loadSettings() {
  if (api && api.settings) {
    const stored = await api.settings.get();
    if (stored) {
      if (stored.character    !== undefined) savedState.character    = stored.character;
      if (stored.focusTimer   !== undefined) savedState.focusTimer   = stored.focusTimer;
      if (stored.doNotDisturb !== undefined) savedState.doNotDisturb = stored.doNotDisturb;
      if (stored.language     !== undefined) savedState.language     = stored.language;
    }
  }
  state = { ...savedState };
  applyThemeLocal(state.character);
  updateUI();
}

async function save() {
  if (api && api.settings) {
    // Merge with existing to preserve fields not managed here (character_size, etc.)
    const existing = await api.settings.get() || {}
    await api.settings.set({
      ...existing,
      character:    state.character,
      focusTimer:   state.focusTimer,
      doNotDisturb: state.doNotDisturb,
      language:     state.language,
    });
  }
  // 1. Broadcast theme first so companion updates immediately
  console.log('Applying theme:', state.character);
  window.trapezi?.theme?.apply(state.character);
  // 2. Broadcast language
  if (api && api.language) {
    api.language.set(state.language);
  }
  // 3. Close window last
  if (api && api.window) api.window.closeSettings();
}

// Character cards — preview lokal + langsung broadcast ke companion
document.querySelectorAll('.char-card').forEach(card => {
  card.addEventListener('click', () => {
    state.character = card.dataset.char;
    applyThemeLocal(state.character);
    updateUI();
    window.trapezi?.theme?.apply(state.character);
  });
});

// Language buttons
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.language = btn.dataset.lang;
    updateUI();
  });
});

// Toggle DND
document.getElementById('toggle-dnd').addEventListener('change', e => {
  state.doNotDisturb = e.target.checked;
});

// Timer stepper
document.getElementById('timer-minus').addEventListener('click', () => {
  if (state.focusTimer > 5) {
    state.focusTimer -= 5;
    document.getElementById('timer-val').textContent = state.focusTimer + ' min';
    updateStepperButtons();
  }
});
document.getElementById('timer-plus').addEventListener('click', () => {
  if (state.focusTimer < 60) {
    state.focusTimer += 5;
    document.getElementById('timer-val').textContent = state.focusTimer + ' min';
    updateStepperButtons();
  }
});

// ← tutup tanpa simpan, revert theme preview ke nilai tersimpan + broadcast revert
document.getElementById('btn-back').addEventListener('click', () => {
  applyThemeLocal(savedState.character);
  window.trapezi?.theme?.apply(savedState.character);
  if (api && api.window) api.window.closeSettings();
});

// ✓ simpan ke store, broadcast theme, tutup
document.getElementById('btn-save').addEventListener('click', save);

loadSettings();
