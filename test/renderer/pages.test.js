// Static checks of the renderer: every page is wired correctly and follows the page conventions.
const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

const RENDERER = path.join(__dirname, '..', '..', 'src', 'renderer')
const PAGES_DIR = path.join(RENDERER, 'pages')
const read = (file) => fs.readFileSync(file, 'utf8')
const pages = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith('.html')).map((f) => ({
  name: f.replace('.html', ''),
  file: path.join(PAGES_DIR, f),
  html: read(path.join(PAGES_DIR, f)),
}))

const scriptsOf = (html) => [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => ({
  src: /src="([^"]+)"/.exec(m[1])?.[1],
  module: /type="module"/.test(m[1]),
}))

describe('page files', () => {
  it('finds the pages', () => assert.ok(pages.length >= 8))

  for (const page of pages) {
    describe(page.name, () => {
      it('references only files that exist', () => {
        for (const [, ref] of page.html.matchAll(/(?:src|href)="(\.\.\/[^"]+)"/g)) {
          assert.ok(fs.existsSync(path.join(PAGES_DIR, ref)), `${page.name}.html references missing ${ref}`)
        }
      })

      it('has no inline scripts and no inline event attributes', () => {
        assert.ok(scriptsOf(page.html).every((s) => s.src), 'inline <script> found')
        assert.doesNotMatch(page.html, /\son[a-z]+=["']/i, 'inline event handler found')
      })

      it('declares the shared Content-Security-Policy', () => {
        assert.match(
          page.html,
          /Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'"/,
        )
      })

      it('uses no external or data: resources', () => {
        const external = page.html.replace(/xmlns="[^"]*"/g, '').match(/(?:src|href)="(?:https?:|data:)[^"]*"/g)
        assert.equal(external, null)
      })
    })
  }
})

describe('page scripts', () => {
  it('never redeclare a global that another script on the same page declares', () => {
    for (const page of pages) {
      const seen = new Map()
      for (const { src, module } of scriptsOf(page.html)) {
        if (!src || module) continue // modules have their own scope
        const code = read(path.join(PAGES_DIR, src))
        for (const [match, name] of code.matchAll(/^(?:async\s+)?(?:const|let|var|function|class)\s+([\w$]+)/gm)) {
          const isFunction = /^(?:async\s+)?function/.test(match)
          const previous = seen.get(name)
          const clash = previous && !(isFunction && previous.isFunction)
          assert.ok(!clash, `${page.name}: '${name}' declared in ${src} and ${previous?.src}`)
          seen.set(name, { src, isFunction })
        }
      }
    }
  })

  it('only look up element ids that exist in their page', () => {
    for (const page of pages) {
      const own = scriptsOf(page.html).map((s) => s.src).filter((s) => s?.startsWith('../components/'))
      const ids = new Set([...page.html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))
      for (const src of own) {
        const code = read(path.join(PAGES_DIR, src))
        for (const [, id] of code.matchAll(/(?:getElementById|\$)\(\s*'([\w-]+)'\s*\)/g)) {
          // ids created at runtime are listed by their literal in the script itself
          const createdAtRuntime = new RegExp(`\\.id\\s*=\\s*['"]${id}['"]|id="${id}"`).test(code)
          assert.ok(ids.has(id) || createdAtRuntime, `${page.name}: ${src} looks up #${id}, which the page does not define`)
        }
      }
    }
  })
})

describe('preload bridge', () => {
  // Load the real preload against a fake contextBridge to get the exposed API surface.
  function exposedApi() {
    let api
    const fake = {
      contextBridge: { exposeInMainWorld: (_name, value) => { api = value } },
      ipcRenderer: { send() {}, invoke() {}, on() {} },
    }
    const realLoad = Module._load
    Module._load = (request, ...rest) => (request === 'electron' ? fake : realLoad(request, ...rest))
    try {
      const file = path.join(__dirname, '..', '..', 'src', 'main', 'preload.js')
      delete require.cache[file]
      require(file)
    } finally {
      Module._load = realLoad
    }
    return api
  }

  it('provides every window.trapezi call the renderer makes', () => {
    const api = exposedApi()
    const files = [
      ...fs.readdirSync(path.join(RENDERER, 'components')).map((f) => path.join(RENDERER, 'components', f)),
      ...fs.readdirSync(RENDERER).filter((f) => f.endsWith('.js')).map((f) => path.join(RENDERER, f)),
    ]
    const namespaces = 'tasks|settings|window|character|bubble|theme|language|calendar|clock'
    const call = new RegExp(`(?:api|trapezi)\\??\\.(${namespaces})\\??\\.(\\w+)`, 'g')
    const missing = new Set()
    for (const file of files) {
      for (const [, ns, fn] of read(file).replace(/\?/g, '').matchAll(call)) {
        if (typeof api[ns]?.[fn] !== 'function') missing.add(`${ns}.${fn} (${path.basename(file)})`)
      }
    }
    assert.deepEqual([...missing], [])
  })
})
