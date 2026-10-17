// Character theming for pages that show the companion sprite and logo.
const THEME_ASSETS = {
  agnesTachyon: {
    sprite: '../assets/styles/images/agnesTachyon/agnesTahcyon.png',
    logo: '../assets/styles/images/agnesTachyon/logo.svg',
  },
  goldship: {
    sprite: '../assets/styles/images/goldShip/goldship.png',
    logo: '../assets/styles/images/goldShip/logo.svg',
  },
}

function applyTheme(theme) {
  const key = THEME_ASSETS[theme] ? theme : 'agnesTachyon'
  document.body.classList.remove(...Object.keys(THEME_ASSETS).map((k) => `theme-${k}`))
  document.body.classList.add(`theme-${key}`)
  const sprite = document.getElementById('companion-sprite')
  const logo = document.querySelector('.panel-title')
  if (sprite) sprite.src = THEME_ASSETS[key].sprite
  if (logo) logo.src = THEME_ASSETS[key].logo
}

// main passes the saved character in the URL so the first paint is already themed.
const initialTheme = new URLSearchParams(location.search).get('character')
if (initialTheme) {
  applyTheme(initialTheme)
  document.addEventListener('DOMContentLoaded', () => applyTheme(initialTheme), { once: true })
}

window.trapezi?.onThemeApply(applyTheme)
