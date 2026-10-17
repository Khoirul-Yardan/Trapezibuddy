// Secure bridge: the only way renderer pages reach the main process (window.trapezi).
const { contextBridge, ipcRenderer } = require('electron')

const send = (channel) => (...args) => ipcRenderer.send(channel, ...args)
const invoke = (channel) => (...args) => ipcRenderer.invoke(channel, ...args)
// Subscribe to a main-process event; the callback receives only the payload.
const listen = (channel) => (cb) => ipcRenderer.on(channel, (_, payload) => cb(payload))

contextBridge.exposeInMainWorld('trapezi', {
  tasks: {
    getAll: invoke('tasks:getAll'),
    add: invoke('tasks:add'),
    update: invoke('tasks:update'),
    complete: invoke('tasks:complete'),
    delete: invoke('tasks:delete'),
  },

  settings: {
    get: invoke('settings:get'),
    set: invoke('settings:set'),
  },

  window: {
    minimize: send('window:minimize'),
    hide: send('window:hide'),
    restore: send('window:restore'),
    close: send('window:forceQuit'), // quits the whole app
    closeSettings: send('window:closeSettings'),
    startApp: send('window:startApp'),

    openAddTask: invoke('modal:openAddTask'),
    closeAddTask: send('modal:closeAddTask'),
    taskAdded: send('modal:taskAdded'),

    onRefreshTasks: listen('refresh:tasks'),
    onNavigate: listen('navigate'),
  },

  character: {
    show: send('character:show'), // (characterKey)
    hide: send('character:hide'),
  },

  bubble: {
    show: send('bubble:show'), // (text) or ({ text, emoji })
    hide: send('bubble:hide'),
    taskAdded: send('bubble:taskAdded'),
    taskCompleted: send('bubble:taskCompleted'),

    // Listeners used by the bubble window itself.
    onShow: listen('bubble:show'),
    onTaskAdded: listen('bubble:taskAdded'),
    onTaskCompleted: listen('bubble:taskCompleted'),
  },

  theme: { apply: send('theme:apply') },
  onThemeApply: listen('theme:apply'),

  language: {
    get: invoke('language:get'),
    set: send('language:set'),
    onChange: listen('language:changed'),
  },

  calendar: {
    open: invoke('calendar:open'),
    selectDate: send('calendar:selectDate'),
    close: send('calendar:close'),
    onDateSelected: listen('calendar:dateSelected'),
  },

  clock: {
    open: invoke('clock:open'),
    selectTime: send('clock:selectTime'),
    close: send('clock:close'),
    onTimeSelected: listen('clock:timeSelected'),
  },
})
