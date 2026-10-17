const api = window.trapezi;

let viewDate = new Date();
let selectedDate = null;
const disablePast = true;
let currentLang = 'en';

const monthNames = {
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
  id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
};

const weekdayNames = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  id: ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb']
};

// Parse URL params to get initial date
const params = new URLSearchParams(window.location.search);
const initialDate = params.get('date');
if (initialDate) {
  selectedDate = new Date(initialDate + 'T00:00:00');
  viewDate = new Date(selectedDate);
}

// i18n support
function applyLanguage(lang) {
  currentLang = lang;
  const t = window.i18n[lang] || window.i18n['en'];
  
  // Update button text
  document.getElementById('btn-clear').textContent = t.cancel || 'Clear';
  document.getElementById('btn-select').textContent = t.saveTask || 'Select Date';
  
  // Update weekday headers
  const weekdayElements = document.querySelectorAll('.calendar-weekday');
  weekdayNames[lang].forEach((day, i) => {
    if (weekdayElements[i]) weekdayElements[i].textContent = day;
  });
  
  // Re-render calendar with new month names
  renderCalendar();
}

document.addEventListener('trapezi:language', () => applyLanguage(window.currentLang));

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  // Update header with localized month name
  const monthName = monthNames[currentLang] || monthNames['en'];
  document.getElementById('month-year').textContent = `${monthName[month]} ${year}`;
  
  // Clear days
  const daysGrid = document.getElementById('calendar-days');
  daysGrid.innerHTML = '';
  
  // Get first day of month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    const dayBtn = createDayButton(day, date, true);
    daysGrid.appendChild(dayBtn);
  }
  
  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayBtn = createDayButton(day, date, false);
    daysGrid.appendChild(dayBtn);
  }
  
  // Next month days to fill grid
  const totalCells = daysGrid.children.length;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    const dayBtn = createDayButton(day, date, true);
    daysGrid.appendChild(dayBtn);
  }
}

function createDayButton(day, date, isOtherMonth) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'calendar-day';
  btn.textContent = day;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  
  if (isOtherMonth) {
    btn.classList.add('other-month');
  }
  
  // Check if today
  if (compareDate.getTime() === today.getTime()) {
    btn.classList.add('today');
  }
  
  // Check if selected
  if (selectedDate) {
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    if (compareDate.getTime() === selected.getTime()) {
      btn.classList.add('selected');
    }
  }
  
  // Check if past
  if (disablePast && compareDate < today) {
    btn.classList.add('past', 'disabled');
    btn.disabled = true;
  }
  
  // Add click handler
  if (!btn.disabled) {
    btn.addEventListener('click', () => {
      selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      renderCalendar();
      document.getElementById('btn-select').disabled = false;
    });
  }
  
  return btn;
}

// Navigation
document.getElementById('btn-prev-month').addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('btn-next-month').addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
});

// Clear button
document.getElementById('btn-clear').addEventListener('click', () => {
  if (api && api.calendar) {
    api.calendar.selectDate(null);
  }
});

// Select button
document.getElementById('btn-select').addEventListener('click', () => {
  if (selectedDate && api && api.calendar) {
    const formatted = formatDate(selectedDate);
    api.calendar.selectDate(formatted);
  }
});

// Close on escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (api && api.calendar) {
      api.calendar.close();
    }
  }
});

// Initial render
renderCalendar();

// Enable select button if date already selected
if (selectedDate) {
  document.getElementById('btn-select').disabled = false;
}
