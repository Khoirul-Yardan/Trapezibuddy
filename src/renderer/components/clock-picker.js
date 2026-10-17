const api = window.trapezi;

const hourInput  = document.getElementById('clock-hour');
const minuteInput = document.getElementById('clock-minute');
const hourBox    = document.getElementById('hour-box');
const minuteBox  = document.getElementById('minute-box');

// ── Parse URL param ──────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const initialTime = params.get('time');
if (initialTime) {
  const [h, m] = initialTime.split(':').map(s => parseInt(s) || 0);
  hourInput.value   = String(Math.min(23, Math.max(0, h))).padStart(2, '0');
  minuteInput.value = String(Math.min(59, Math.max(0, m))).padStart(2, '0');
} else {
  // Default to current time
  const now = new Date();
  hourInput.value   = String(now.getHours()).padStart(2, '0');
  minuteInput.value = String(now.getMinutes()).padStart(2, '0');
}

// ── Focus / blur ─────────────────────────────────────────
hourBox.addEventListener('click', () => { hourInput.focus(); hourInput.select(); });
minuteBox.addEventListener('click', () => { minuteInput.focus(); minuteInput.select(); });

hourInput.addEventListener('focus', () => { hourBox.classList.add('focused'); hourInput.select(); });
hourInput.addEventListener('blur',  () => {
  hourBox.classList.remove('focused');
  let v = parseInt(hourInput.value);
  if (isNaN(v) || v < 0) v = 0;
  if (v > 23) v = 23;
  hourInput.value = String(v).padStart(2, '0');
});

minuteInput.addEventListener('focus', () => { minuteBox.classList.add('focused'); minuteInput.select(); });
minuteInput.addEventListener('blur',  () => {
  minuteBox.classList.remove('focused');
  let v = parseInt(minuteInput.value);
  if (isNaN(v) || v < 0) v = 0;
  if (v > 59) v = 59;
  minuteInput.value = String(v).padStart(2, '0');
});

// ── Hour validation & auto-advance ───────────────────────
let hourBuffer = '';

hourInput.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    hourBuffer += e.key;

    const num = parseInt(hourBuffer);

    // If first digit > 2, it can't be a valid 2-digit hour start — clamp immediately
    if (hourBuffer.length === 1 && num > 2) {
      hourInput.value = String(num).padStart(2, '0');
      hourBuffer = '';
      minuteInput.focus();
      minuteInput.select();
      return;
    }

    hourInput.value = hourBuffer.padStart(2, '0');

    if (hourBuffer.length >= 2) {
      const clamped = Math.min(23, Math.max(0, num));
      hourInput.value = String(clamped).padStart(2, '0');
      hourBuffer = '';
      minuteInput.focus();
      minuteInput.select();
    }
  } else if (e.key === 'Backspace') {
    hourBuffer = hourBuffer.slice(0, -1);
  } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
    hourBuffer = '';
  } else if (e.key === 'Enter') {
    minuteInput.focus();
    minuteInput.select();
  }
});

hourInput.addEventListener('focus', () => { hourBuffer = ''; });

// ── Minute validation ────────────────────────────────────
let minuteBuffer = '';

minuteInput.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    minuteBuffer += e.key;

    const num = parseInt(minuteBuffer);

    // First digit > 5 → single-digit minute
    if (minuteBuffer.length === 1 && num > 5) {
      minuteInput.value = String(num).padStart(2, '0');
      minuteBuffer = '';
      return;
    }

    minuteInput.value = minuteBuffer.padStart(2, '0');

    if (minuteBuffer.length >= 2) {
      const clamped = Math.min(59, Math.max(0, num));
      minuteInput.value = String(clamped).padStart(2, '0');
      minuteBuffer = '';
      minuteInput.blur();
    }
  } else if (e.key === 'Backspace') {
    minuteBuffer = minuteBuffer.slice(0, -1);
  } else if (e.key === 'Enter') {
    confirmTime();
  }
});

minuteInput.addEventListener('focus', () => { minuteBuffer = ''; });

// ── OK / Cancel ──────────────────────────────────────────
function confirmTime() {
  let h = parseInt(hourInput.value);
  let m = parseInt(minuteInput.value);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  h = Math.min(23, Math.max(0, h));
  m = Math.min(59, Math.max(0, m));
  const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  if (api && api.clock) api.clock.selectTime(timeString);
}

document.getElementById('btn-ok').addEventListener('click', confirmTime);

document.getElementById('btn-cancel').addEventListener('click', () => {
  if (api && api.clock) api.clock.close();
});

// ── Keyboard shortcuts ───────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && api && api.clock) api.clock.close();
});

// ── Auto-focus hour on load ──────────────────────────────
setTimeout(() => { hourInput.focus(); hourInput.select(); }, 100);
