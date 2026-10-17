// Persistent app data (tasks, settings, window bounds) backed by electron-store.
const Store = require('electron-store')

const DEFAULT_CHARACTER = 'agnesTachyon'

const store = new Store({
  defaults: {
    tasks: [],
    settings: {
      character: DEFAULT_CHARACTER,
      language: 'en',
      focusTimer: 25, // minutes
      streak: 0,
      longest_streak: 0,
      freezeTokens: 2,
      lastTaskDate: null,
      doNotDisturb: false,
    },
    windowBounds: { companion: null, minimized: null, settings: null },
  },
})

module.exports = {
  store,
  DEFAULT_CHARACTER,
  getCharacter: () => store.get('settings.character') || DEFAULT_CHARACTER,
}
