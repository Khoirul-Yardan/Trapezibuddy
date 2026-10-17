// ESLint flat config. Three environments live in this repo and each gets its own globals:
//   src/main      Node (CommonJS), including preload.js
//   src/renderer  browser, classic <script> files that share globals through the page
//   test          Node (CommonJS)
const js = require('@eslint/js')
const globals = require('globals')

// Defined by one renderer script and used by others loaded on the same page.
const sharedRendererGlobals = {
  i18n: 'readonly', // i18n.js
  translateDOM: 'readonly', // i18n.js
  applyTheme: 'readonly', // theme.js
  trapezi: 'readonly', // exposed by preload.js
}

module.exports = [
  { ignores: ['node_modules/', 'dist/', 'assets/'] },
  js.configs.recommended,
  {
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      // Empty catch blocks are fine when they carry a comment saying why.
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/main/**/*.js', 'test/**/*.js', 'eslint.config.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['src/renderer/**/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: { ...globals.browser, ...sharedRendererGlobals },
    },
    rules: {
      // Top-level functions in a classic script are page globals used by other scripts.
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/renderer/components/minimized-header.js', 'src/renderer/components/confirm-modal.js'],
    languageOptions: { sourceType: 'module' },
  },
  // The files that define a shared global must not also declare it as an external one.
  { files: ['src/renderer/i18n.js'], languageOptions: { globals: { i18n: 'off', translateDOM: 'off' } } },
  { files: ['src/renderer/theme.js'], languageOptions: { globals: { applyTheme: 'off' } } },
]
