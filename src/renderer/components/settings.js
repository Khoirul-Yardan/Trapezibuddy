const api = window.trapezi;

const state = {
  character: 'agnesTachyon',
  language: 'en'
};

const BRANDING_IMGS = {
  agnesTachyon: '../assets/styles/images/agnesTachyon/agnesTahcyon.png',
  goldship:  '../assets/styles/images/goldShip/goldship.png',
};

const BRANDING_LOGOS = {
  agnesTachyon: '../assets/styles/images/agnesTachyon/logo.svg',
  goldship:  '../assets/styles/images/goldShip/logo.svg',
};

function applyThemePreview(character) {
  applyTheme(character);
  const avatar = document.querySelector('.branding-avatar img');
  if (avatar) avatar.src = BRANDING_IMGS[character] ?? BRANDING_IMGS.agnesTachyon;
  const logo = document.getElementById('header-logo');
  if (logo) logo.src = BRANDING_LOGOS[character] ?? BRANDING_LOGOS.agnesTachyon;
}

// Removed local updateLanguageText() as it's handled by the global i18n script

function updateUI() {
  document.querySelectorAll('.char-card').forEach(el => {
    el.classList.toggle('active', el.dataset.char === state.character);
  });
  document.querySelectorAll('.lang-btn').forEach(el => {
    el.classList.toggle('active', el.dataset.lang === state.language);
  });
  // Note: text translation is now handled reactively by the global i18n script.
}

async function loadSettings() {
  if (api && api.settings) {
    const stored = await api.settings.get();
    if (stored) {
      if (stored.character) state.character = stored.character;
      if (stored.language)  state.language  = stored.language;
    }
  }
  applyThemePreview(state.character);
  updateUI();
}

// Character selection
document.querySelectorAll('.char-card').forEach(card => {
  card.addEventListener('click', () => {
    state.character = card.dataset.char;
    applyThemePreview(state.character);
    updateUI();
    window.trapezi?.theme?.apply(state.character);
  });
});

// Language selection
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.language = btn.dataset.lang;
    updateUI();
    if (api && api.language) {
      api.language.set(state.language);
    }
  });
});

// Close
document.getElementById('btn-close').addEventListener('click', () => {
  if (api && api.window) api.window.closeSettings();
});

// Start
document.getElementById('btn-start').addEventListener('click', async () => {
  if (api && api.settings && api.window) {
    const existing = await api.settings.get() || {};
    await api.settings.set({ ...existing, ...state });
    window.trapezi?.theme?.apply(state.character);
    api.window.startApp(state);
  }
});

loadSettings();
