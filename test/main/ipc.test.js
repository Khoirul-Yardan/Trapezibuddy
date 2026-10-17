const { describe, it, beforeEach, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const { createEnvironment } = require('../helpers/electron-mock')

let env
beforeEach(() => { env = createEnvironment() })
afterEach(() => env.restore())

const sampleTask = { name: 'Write report', deadline_date: '2030-01-01', deadline_time: '10:00' }

describe('tasks', () => {
  it('adds a task with defaults and lists it', () => {
    const task = env.invoke('tasks:add', sampleTask)
    assert.equal(task.is_done, false)
    assert.equal(task.priority, 'Sedang')
    assert.equal(task.reminder, true)
    assert.deepEqual(task.categories, [])
    assert.deepEqual(env.invoke('tasks:getAll'), [task])
  })

  it('completes a task and stamps completed_at', () => {
    const { id } = env.invoke('tasks:add', sampleTask)
    const done = env.invoke('tasks:complete', id)
    assert.equal(done.is_done, true)
    assert.ok(Date.parse(done.completed_at))
  })

  it('returns null when completing or updating an unknown id', () => {
    assert.equal(env.invoke('tasks:complete', 'nope'), null)
    assert.equal(env.invoke('tasks:update', 'nope', { name: 'x' }), null)
  })

  it('merges updates into the task', () => {
    const { id } = env.invoke('tasks:add', sampleTask)
    const updated = env.invoke('tasks:update', id, { streak_penalty_handled: true })
    assert.equal(updated.streak_penalty_handled, true)
    assert.equal(updated.name, sampleTask.name)
  })

  it('deletes a task', () => {
    const { id } = env.invoke('tasks:add', sampleTask)
    env.invoke('tasks:delete', id)
    assert.deepEqual(env.invoke('tasks:getAll'), [])
  })
})

describe('settings', () => {
  it('merges a partial save instead of replacing the settings', () => {
    env.invoke('settings:set', { streak: 5 })
    const settings = env.invoke('settings:get')
    assert.equal(settings.streak, 5)
    assert.equal(settings.language, 'en')
    assert.equal(settings.freezeTokens, 2)
  })

  it('keeps doNotDisturb when a later save does not mention it', () => {
    env.invoke('settings:set', { doNotDisturb: true })
    env.invoke('settings:set', { streak: 1 })
    assert.equal(env.invoke('settings:get').doNotDisturb, true)
  })

  it('does not respawn a character that is only hidden', () => {
    env.invoke('window:startApp', { character: 'agnesTachyon' })
    env.invoke('character:hide')
    env.spawned.length = 0
    env.invoke('settings:set', { streak: 1, character: 'agnesTachyon' })
    assert.deepEqual(env.spawned, [])
  })

  it('spawns the new character when it changes', () => {
    env.invoke('window:startApp', { character: 'agnesTachyon' })
    env.spawned.length = 0
    env.invoke('settings:set', { character: 'goldship' })
    assert.deepEqual(env.spawned, ['goldship.exe'])
  })
})

// taskkill is only used on Windows, which is also the only platform the app ships for.
const windowsOnly = { skip: process.platform !== 'win32' && 'taskkill is Windows-only' }

describe('character process', () => {
  it('launches the selected character and closes the settings window', () => {
    env.invoke('window:startApp', { character: 'goldship' })
    assert.deepEqual(env.spawned, ['goldship.exe'])
  })

  it('kills every character image before spawning, and again on hide', windowsOnly, () => {
    env.invoke('window:startApp', { character: 'agnesTachyon' })
    assert.deepEqual(env.killed.slice(0, 2).sort(), ['agnesTachyon.exe', 'goldship.exe'])
    env.killed.length = 0
    env.invoke('character:hide')
    assert.equal(env.killed.length, 2)
  })

  it('does not spawn while do-not-disturb is on, and kills any running character', windowsOnly, () => {
    env.invoke('settings:set', { doNotDisturb: true })
    assert.equal(env.killed.length, 2)
    env.invoke('window:startApp', { character: 'agnesTachyon' })
    assert.deepEqual(env.spawned, [])
  })

  it('ignores unknown character keys', () => {
    env.invoke('character:show', 'nobody')
    assert.deepEqual(env.spawned, [])
  })
})

describe('windows', () => {
  it('opens the companion themed with the chosen character', () => {
    // The settings page applies the theme before pressing start, which stores the choice.
    env.invoke('theme:apply', 'goldship')
    env.invoke('window:startApp', { character: 'goldship' })
    const companion = env.windowByFile('companion.html')
    assert.ok(companion)
    assert.deepEqual(companion.query, { character: 'goldship' })
  })

  it('minimizes to the bar and restores to the requested tab', () => {
    env.invoke('window:startApp', {})
    env.invoke('window:minimize')
    assert.ok(env.windowByFile('minimized-header.html'))
    env.invoke('window:restore', 'finished')
    assert.deepEqual(env.sentOn('navigate'), ['finished'])
  })

  it('opens app settings, not the companion, for the gear icon', () => {
    env.invoke('window:startApp', {})
    env.invoke('window:minimize')
    env.invoke('window:restore', 'settings')
    assert.ok(env.windowByFile('app-settings.html'))
  })

  it('opens each picker once with its own size', () => {
    env.invoke('window:startApp', {})
    env.invoke('modal:openAddTask')
    env.invoke('calendar:open', '2030-01-01')
    env.invoke('calendar:open', '2030-01-01')
    env.invoke('clock:open', '10:00')
    assert.equal(env.windows.filter((w) => w.file === 'calendar-picker.html').length, 1)
    assert.equal(env.windowByFile('calendar-picker.html').options.height, 480)
    assert.equal(env.windowByFile('clock-picker.html').options.height, 280)
    assert.deepEqual(env.windowByFile('calendar-picker.html').query, { date: '2030-01-01' })
  })

  it('sends a picked date back to the add-task window and closes the picker', () => {
    env.invoke('window:startApp', {})
    env.invoke('modal:openAddTask')
    env.invoke('calendar:open')
    env.invoke('calendar:selectDate', '2030-02-02')
    assert.deepEqual(env.sentOn('calendar:dateSelected'), ['2030-02-02'])
    env.invoke('calendar:open') // closed, so a new one can open
    assert.equal(env.windows.filter((w) => w.file === 'calendar-picker.html').length, 2)
  })

  it('refreshes the companion when a task is added', () => {
    env.invoke('window:startApp', {})
    env.invoke('modal:openAddTask')
    env.invoke('modal:taskAdded')
    assert.equal(env.sentOn('refresh:tasks').length, 1)
  })
})

describe('bubble', () => {
  it('forwards string and object payloads unchanged on the same channel', () => {
    env.invoke('bubble:show', 'hello')
    env.invoke('bubble:show', { text: 'hi', emoji: 'x' })
    env.invoke('bubble:taskCompleted', { name: 'done' })
    assert.deepEqual(env.sentOn('bubble:show'), ['hello', { text: 'hi', emoji: 'x' }])
    assert.deepEqual(env.sentOn('bubble:taskCompleted'), [{ name: 'done' }])
    assert.equal(env.windows.filter((w) => w.file === 'bubble.html').length, 1)
  })
})

describe('language and theme', () => {
  it('stores the language and broadcasts it to open windows', () => {
    env.invoke('window:startApp', {})
    env.invoke('language:set', 'id')
    assert.equal(env.invoke('language:get'), 'id')
    assert.ok(env.sentOn('language:changed').includes('id'))
  })

  it('stores the theme as the selected character and broadcasts it', () => {
    env.invoke('window:startApp', {})
    env.invoke('theme:apply', 'goldship')
    assert.equal(env.invoke('settings:get').character, 'goldship')
    assert.ok(env.sentOn('theme:apply').includes('goldship'))
  })
})
