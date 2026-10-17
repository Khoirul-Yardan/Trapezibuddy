// Custom Calendar Component for Agnes Tachyon Theme
// This replaces the native date picker with a custom styled calendar

class CustomCalendar {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      minDate: options.minDate || null,
      maxDate: options.maxDate || null,
      disablePast: options.disablePast || false,
      onChange: options.onChange || null,
      ...options
    };
    
    this.currentDate = new Date();
    this.selectedDate = null;
    this.viewDate = new Date(); // Date being viewed in calendar
    
    this.init();
  }
  
  init() {
    // Check if theme is GoldShip - if so, skip custom calendar
    if (document.body.classList.contains('theme-goldship')) {
      return;
    }
    
    // Parse existing value if any
    if (this.input.value) {
      this.selectedDate = new Date(this.input.value + 'T00:00:00');
      this.viewDate = new Date(this.selectedDate);
    }
    
    // Create calendar elements
    this.createCalendar();
    
    // Bind events
    this.bindEvents();
  }
  
  createCalendar() {
    // Hide original input
    this.input.style.display = 'none';
    
    // Create custom display input
    this.displayInput = document.createElement('div');
    this.displayInput.className = 'field-input custom-date-display';
    this.displayInput.style.cursor = 'pointer';
    this.displayInput.textContent = this.input.value || this.formatDate(new Date());
    this.input.parentNode.insertBefore(this.displayInput, this.input);
    
    // Create calendar container and append to body
    this.calendar = document.createElement('div');
    this.calendar.className = 'custom-calendar';
    document.body.appendChild(this.calendar);
    
    this.renderCalendar();
  }
  
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  renderCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    // Month names
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Clear calendar
    this.calendar.innerHTML = '';
    
    // Header
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
      <button type="button" class="calendar-nav-btn" data-action="prev-month">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <div class="calendar-month-year">${monthNames[month]} ${year}</div>
      <button type="button" class="calendar-nav-btn" data-action="next-month">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    `;
    this.calendar.appendChild(header);
    
    // Weekdays
    const weekdays = document.createElement('div');
    weekdays.className = 'calendar-weekdays';
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
      const weekday = document.createElement('div');
      weekday.className = 'calendar-weekday';
      weekday.textContent = day;
      weekdays.appendChild(weekday);
    });
    this.calendar.appendChild(weekdays);
    
    // Days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'calendar-days';
    
    // Get first day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(year, month - 1, day);
      const dayBtn = this.createDayButton(day, date, true);
      daysGrid.appendChild(dayBtn);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayBtn = this.createDayButton(day, date, false);
      daysGrid.appendChild(dayBtn);
    }
    
    // Next month days to fill grid
    const totalCells = daysGrid.children.length;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const dayBtn = this.createDayButton(day, date, true);
      daysGrid.appendChild(dayBtn);
    }
    
    this.calendar.appendChild(daysGrid);
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'calendar-footer';
    footer.innerHTML = `
      <button type="button" class="calendar-btn calendar-btn-clear" data-action="clear">Clear</button>
      <button type="button" class="calendar-btn calendar-btn-today" data-action="today">Today</button>
    `;
    this.calendar.appendChild(footer);
    
    // Bind navigation events
    this.calendar.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleAction(e);
      });
    });
  }
  
  createDayButton(day, date, isOtherMonth) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'calendar-day';
    btn.textContent = day;
    btn.dataset.date = date.toISOString().split('T')[0];
    
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
    if (this.selectedDate) {
      const selected = new Date(this.selectedDate);
      selected.setHours(0, 0, 0, 0);
      if (compareDate.getTime() === selected.getTime()) {
        btn.classList.add('selected');
      }
    }
    
    // Check if past (and should be disabled)
    if (this.options.disablePast && compareDate < today) {
      btn.classList.add('past', 'disabled');
      btn.disabled = true;
    }
    
    // Check min/max dates
    if (this.options.minDate && compareDate < this.options.minDate) {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    if (this.options.maxDate && compareDate > this.options.maxDate) {
      btn.classList.add('disabled');
      btn.disabled = true;
    }
    
    // Add click handler
    if (!btn.disabled) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectDate(date);
      });
    }
    
    return btn;
  }
  
  handleAction(e) {
    const action = e.target.closest('[data-action]')?.dataset.action;
    
    switch (action) {
      case 'prev-month':
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.renderCalendar();
        break;
        
      case 'next-month':
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.renderCalendar();
        break;
        
      case 'clear':
        this.selectedDate = null;
        this.input.value = '';
        this.displayInput.textContent = '';
        this.close();
        if (this.options.onChange) {
          this.options.onChange(null);
        }
        break;
        
      case 'today':
        this.selectDate(new Date());
        break;
    }
  }
  
  selectDate(date) {
    this.selectedDate = new Date(date);
    this.selectedDate.setHours(0, 0, 0, 0);
    
    const formatted = this.formatDate(this.selectedDate);
    
    this.input.value = formatted;
    this.displayInput.textContent = formatted;
    this.close();
    
    if (this.options.onChange) {
      this.options.onChange(this.selectedDate);
    }
    
    // Trigger change event
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  bindEvents() {
    // Open calendar on display input click
    this.displayInput.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggle();
    });
    
    // Close on clicking outside
    document.addEventListener('click', (e) => {
      if (this.isOpen() && !this.calendar.contains(e.target) && e.target !== this.displayInput) {
        this.close();
      }
    });
    
    // Close on escape
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
    
    // Reposition on scroll
    this.scrollHandler = () => {
      if (this.isOpen()) {
        this.updatePosition();
      }
    };
    window.addEventListener('scroll', this.scrollHandler, true);
    
    // Reposition on resize
    this.resizeHandler = () => {
      if (this.isOpen()) {
        this.updatePosition();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }
  
  updatePosition() {
    if (!this.displayInput) return;
    
    const inputRect = this.displayInput.getBoundingClientRect();
    const calendarWidth = 320;
    
    // Calculate left position
    let left = inputRect.left + (inputRect.width / 2) - (calendarWidth / 2);
    const maxLeft = window.innerWidth - calendarWidth - 10;
    left = Math.max(10, Math.min(left, maxLeft));
    
    // Calculate top position
    let top = inputRect.bottom + 8;
    const calendarHeight = 420;
    if (top + calendarHeight > window.innerHeight) {
      top = inputRect.top - calendarHeight - 8;
    }
    
    this.calendar.style.left = left + 'px';
    this.calendar.style.top = top + 'px';
  }
  
  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    // Don't open for GoldShip theme
    if (document.body.classList.contains('theme-goldship')) {
      return;
    }
    
    // Set view to selected date or today
    if (this.selectedDate) {
      this.viewDate = new Date(this.selectedDate);
    } else {
      this.viewDate = new Date();
    }
    
    this.renderCalendar();
    this.updatePosition();
    this.calendar.classList.add('active');
  }
  
  close() {
    this.calendar.classList.remove('active');
  }
  
  isOpen() {
    return this.calendar.classList.contains('active');
  }
  
  destroy() {
    // Remove event listeners
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    // Remove DOM elements
    if (this.calendar) this.calendar.remove();
    if (this.displayInput) this.displayInput.remove();
    this.input.style.display = '';
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomCalendar;
}
