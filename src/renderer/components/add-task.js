const api = window.trapezi

// Set today as default date
const taskDateInput = document.getElementById('task-date');
taskDateInput.value = new Date().toISOString().split('T')[0];

// Theme detection
let currentTheme = 'agnesTachyon';

// Time picker button handler - opens popup window
const timeDisplay = document.getElementById('task-time-display');
const btnTimePicker = document.getElementById('btn-time-picker');
const btnCalendarPicker = document.getElementById('btn-calendar-picker');

if (btnTimePicker && timeDisplay && api && api.clock) {
  btnTimePicker.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentTime = timeDisplay.textContent;
    api.clock.open(currentTime);
  });
  
  // Listen for time selection from clock picker window
  api.clock.onTimeSelected((time) => {
    if (time) {
      timeDisplay.textContent = time;
      console.log('Time selected from clock picker:', time);
    }
  });
}

if (btnCalendarPicker) {
  btnCalendarPicker.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (api && api.calendar) {
      const currentDate = taskDateInput.value;
      api.calendar.open(currentDate || null);
      return;
    }

    if (taskDateInput.showPicker) {
      taskDateInput.showPicker();
    } else {
      taskDateInput.focus();
      taskDateInput.click();
    }
  });
}

// Open custom calendar modal for all themes
function setupCalendarHandler() {
  taskDateInput.addEventListener('click', (e) => {
    e.preventDefault();
    const currentDate = taskDateInput.value;
    api.calendar.open(currentDate || null);
  });

  taskDateInput.addEventListener('mousedown', (e) => {
    e.preventDefault();
  });

  taskDateInput.addEventListener('focus', (e) => {
    e.target.blur();
  });
}

// Listen for date selection from calendar modal
if (api && api.calendar) {
  api.calendar.onDateSelected((date) => {
    if (date) {
      taskDateInput.value = date;
      console.log('Date selected from calendar:', date);
    } else {
      // Clear was clicked
      taskDateInput.value = '';
    }
  });
}

// Initialize calendar handler on load
setupCalendarHandler();

// Re-setup when theme changes
window.trapezi?.onThemeApply?.((theme) => {
  currentTheme = theme;
  setupCalendarHandler();
});

// Category toggle
document.querySelectorAll('.cat-tag').forEach(tag => {
  tag.addEventListener('click', () => tag.classList.toggle('active'))
})

// Add custom category
document.getElementById('btn-add-cat').addEventListener('click', () => {
  const name = prompt('Nama kategori baru:')
  if (!name?.trim()) return
  const tag = document.createElement('button')
  tag.className = 'cat-tag active cat-custom'
  tag.dataset.cat = name.trim()
  tag.innerHTML = `
    <span class="shadow"></span>
    <span class="edge" style="background: linear-gradient(to left, #757676 0%, #969696 8%, #969696 92%, #757676 100%);"></span>
    <span class="front" style="background: #BDBDBD; color: white;">${name.trim()}</span>
  `
  tag.addEventListener('click', () => tag.classList.toggle('active'))
  document.getElementById('cat-row').insertBefore(
    tag,
    document.getElementById('btn-add-cat')
  )
})

// Priority toggle
document.querySelectorAll('.pushable').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pushable').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
  })
})

// Cancel / close
const closeModal = () => api.window.closeAddTask()
document.getElementById('btn-close').addEventListener('click', closeModal)
document.getElementById('btn-cancel').addEventListener('click', closeModal)

// Save
document.getElementById('btn-save').addEventListener('click', async () => {
  const name = document.getElementById('task-name').value.trim()
  const errorEl = document.getElementById('error-name')
  const errorDateEl = document.getElementById('error-date')
  const errorCatsEl = document.getElementById('error-cats')

  if (!name) {
    document.getElementById('task-name').classList.add('error')
    errorEl.style.display = 'block'
    document.getElementById('task-name').focus()
    return
  }

  document.getElementById('task-name').classList.remove('error')
  errorEl.style.display = 'none'

  const selectedDate = document.getElementById('task-date').value
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const chosen = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null
  const dateInvalid = !chosen || Number.isNaN(chosen.getTime()) || chosen < today

  if (dateInvalid) {
    document.getElementById('task-date').classList.add('error')
    errorDateEl.style.display = 'block'
    document.getElementById('task-date').focus()
    return
  }
  document.getElementById('task-date').classList.remove('error')
  errorDateEl.style.display = 'none'

  const saveBtn = document.getElementById('btn-save')
  const _ti = () => window.i18n?.[window.currentLang || 'en'] || window.i18n?.en
  saveBtn.disabled = true
  saveBtn.textContent = _ti()?.saving || 'Saving...'

  const cats = [...document.querySelectorAll('.cat-tag.active')]
    .map(b => b.dataset.cat)
  const prio = document.querySelector('.pushable.active')?.dataset.prio ?? 'Sedang'

  if (!cats.length) {
    saveBtn.disabled = false
    saveBtn.textContent = _ti()?.saveTask || 'Save Task'
    errorCatsEl.style.display = 'block'
    return
  }
  errorCatsEl.style.display = 'none'

  try {
    await api.tasks.add({
      name,
      deadline_date: document.getElementById('task-date').value,
      deadline_time: document.getElementById('task-time-display').textContent || '23:59',
      categories:    cats,
      priority:      prio,
      reminder:      document.getElementById('reminder-toggle').checked,
    })
    api.window.taskAdded()
  } catch (err) {
    console.error('Error adding task:', err)
    saveBtn.disabled = false
    saveBtn.textContent = _ti()?.saveTask || 'Save Task'
  }
})

// Focus task name on load
document.getElementById('task-name').focus()
