// --- Global State & Configuration ---
let timeOffset = 0;
let timelineData = [];
let swRunning = false, swStart = 0, swElapsed = 0, swInterval = null, swLaps = [];
let cdInterval = null, cdEndTime = 0;
let clockInterval = null; // เพิ่มตัวแปรสำหรับป้องกันนาฬิกาเดินเบิ้ล

const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

const cities = [
  { name: 'กรุงเทพฯ', nameEn: 'Bangkok', flag: '🇹🇭', tz: 'Asia/Bangkok' },
  { name: 'กัวลาลัมเปอร์', nameEn: 'Kuala Lumpur', flag: '🇲🇾', tz: 'Asia/Kuala_Lumpur' },
  { name: 'สิงคโปร์', nameEn: 'Singapore', flag: '🇸🇬', tz: 'Asia/Singapore' },
  { name: 'จาการ์ตา', nameEn: 'Jakarta', flag: '🇮🇩', tz: 'Asia/Jakarta' },
  { name: 'โตเกียว', nameEn: 'Tokyo', flag: '🇯🇵', tz: 'Asia/Tokyo' },
  { name: 'เซี่ยงไฮ้', nameEn: 'Shanghai', flag: '🇨🇳', tz: 'Asia/Shanghai' },
  { name: 'ฮ่องกง', nameEn: 'Hong Kong', flag: '🇭🇰', tz: 'Asia/Hong_Kong' },
  { name: 'นิวยอร์ก', nameEn: 'New York', flag: '🇺🇸', tz: 'America/New_York' },
  { name: 'ลอนดอน', nameEn: 'London', flag: '🇬🇧', tz: 'Europe/London' },
  { name: 'เยอรมนี', nameEn: 'Frankfurt', flag: '🇩🇪', tz: 'Europe/Berlin' },
  { name: 'UTC', nameEn: 'UTC', flag: '🌐', tz: 'UTC' }
];

const defaultConfig = {
  app_title: 'CCTV Time Calculator',
  app_subtitle: 'เครื่องมือสืบสวนและคำนวณเวลาแบบครบวงจร'
};

// --- Initialization ---
async function initApp() {
  // Load Timeline Data จาก LocalStorage
  loadTimelineData();

  // Start Clock (ลบของเก่าก่อนเริ่มใหม่ ป้องกันบัก)
  updateLiveClock();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(updateLiveClock, 1000);

  // Pre-fill Dates
  const today = new Date().toISOString().split('T')[0];
  ['cctvDate', 'realDate', 'convertDate', 'calcBaseDate', 'tl-date', 'convert-tz-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  // Bind Listeners
  setupTabNavigation();
  setupTimezoneOptions();

  const calcForm = document.getElementById('calculator-form');
  if(calcForm) {
      calcForm.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateOffset();
      });
  }

  const btnSwStart = document.getElementById('btn-sw-start');
  if(btnSwStart) btnSwStart.addEventListener('click', toggleStopwatch);
  
  const btnSwLap = document.getElementById('btn-sw-lap');
  if(btnSwLap) btnSwLap.addEventListener('click', recordLap);
  
  const btnSwReset = document.getElementById('btn-sw-reset');
  if(btnSwReset) btnSwReset.addEventListener('click', resetStopwatch);
  
  const btnCdStart = document.getElementById('btn-cd-start');
  if(btnCdStart) btnCdStart.addEventListener('click', startCountdown);
  
  const btnCdStop = document.getElementById('btn-cd-stop');
  if(btnCdStop) btnCdStop.addEventListener('click', stopCountdown);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// --- Utility Functions ---
function pad(n) { return String(n).padStart(2, '0'); }
function formatThaiDateShort(d) { return `${d.getDate()} ${thaiMonths[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`; }
function formatTime(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; }
function formatDateStandard(dateStr) {
  if (!dateStr) return '--/--/----';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function updateLiveClock() {
  const clockEl = document.getElementById('live-clock');
  const dateEl = document.getElementById('live-date');
  if(!clockEl || !dateEl) return;
  
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString('th-TH', { hour12: false });
  dateEl.textContent = now.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.className = `toast ${bgColor} px-4 py-3 rounded-xl text-white font-medium shadow-lg flex items-center gap-2`;
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setNowToInputs(dateId, timeId) {
  const now = new Date();
  const dEl = document.getElementById(dateId);
  const tEl = document.getElementById(timeId);
  if(dEl) dEl.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  if(tEl) tEl.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function goBackHome() {
  if (window.self !== window.top) {
    try {
      if (window.parent && typeof window.parent.closeModal === 'function') {
        window.parent.closeModal();
        return;
      }
      if (window.parent && typeof window.parent.showPage === 'function') {
        window.parent.showPage('report');
        return;
      }
    } catch(e) {
      console.warn('Iframe parent navigation notice:', e);
    }
  }
  if (document.referrer && document.referrer.includes('index.html')) {
    window.history.back();
  } else {
    window.location.href = 'index.html';
  }
}

// --- Tab Navigation ---
function setupTabNavigation() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.nav-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const target = document.getElementById(tab.dataset.tab);
      if(target) {
        target.style.display = 'block';
        if (tab.dataset.tab === 'tab-routemap') {
          setTimeout(() => {
            initEscapeMap();
            if (escapeMap) escapeMap.invalidateSize();
          }, 150);
        }
      }
    });
  });
}

// --- Tab 1: CCTV Calculator & Converter ---
function captureCurrentTime() {
  setNowToInputs('realDate', 'realTime');
  showToast('จับเวลาปัจจุบันแล้ว', 'info');
}

function calculateOffset() {
  const cctvDate = document.getElementById('cctvDate').value;
  const cctvTime = document.getElementById('cctvTime').value;
  const realDate = document.getElementById('realDate').value;
  const realTime = document.getElementById('realTime').value;

  if (!cctvDate || !cctvTime || !realDate || !realTime) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error'); return;
  }

  const cctvDateTime = new Date(`${cctvDate}T${cctvTime}`);
  const realDateTime = new Date(`${realDate}T${realTime}`);
  timeOffset = Math.floor((realDateTime - cctvDateTime) / 1000);

  const offsetDays = Math.floor(Math.abs(timeOffset) / 86400);
  const remainingSeconds = Math.abs(timeOffset) % 86400;
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  document.getElementById('offset-days').textContent = `${offsetDays} วัน`;
  document.getElementById('offset-time').textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const totalEl = document.getElementById('offset-total');
  totalEl.textContent = `${timeOffset >= 0 ? '+' : ''}${timeOffset.toLocaleString()} วินาที`;

  if (timeOffset > 0) {
    totalEl.className = 'mono text-lg font-semibold result-positive';
    document.getElementById('offset-description').textContent = '🔴 กล้องช้ากว่าเวลาจริง (ต้องบวก Offset)';
  } else if (timeOffset < 0) {
    totalEl.className = 'mono text-lg font-semibold result-negative';
    document.getElementById('offset-description').textContent = '🟢 กล้องเร็วกว่าเวลาจริง (ต้องลบ Offset)';
  } else {
    totalEl.className = 'mono text-lg font-semibold result-neutral';
    document.getElementById('offset-description').textContent = '🟡 กล้องตรงกับเวลาจริง';
  }

  document.getElementById('offsetResult').classList.remove('hidden');
  updateConversion(); 
  showToast('คำนวณความต่างเวลาเรียบร้อย', 'success');
}

function resetCalculator() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('cctvDate').value = today;
  document.getElementById('realDate').value = today;
  document.getElementById('cctvTime').value = '';
  document.getElementById('realTime').value = '';
  document.getElementById('offsetResult').classList.add('hidden');
  timeOffset = 0;
}

function updateConversion() {
  const convertDate = document.getElementById('convertDate').value;
  const convertTime = document.getElementById('convertTime').value;
  const convertType = document.getElementById('convertType').value;
  const resultDiv = document.getElementById('convertResult');
  const copyBtn = document.getElementById('copy-btn');

  if (!convertDate || !convertTime || !convertType) {
    resultDiv.classList.add('hidden');
    copyBtn.classList.add('hidden');
    return;
  }

  const dateTime = new Date(`${convertDate}T${convertTime}`);
  const resultDateTime = new Date(dateTime.getTime() + (convertType === 'toReal' ? timeOffset : -timeOffset) * 1000);

  document.getElementById('result-date').textContent = formatDateStandard(resultDateTime.toISOString().split('T')[0]);
  document.getElementById('result-time').textContent = resultDateTime.toTimeString().slice(0, 8);

  resultDiv.classList.remove('hidden');
  copyBtn.classList.remove('hidden');
}

function resetConverter() {
  document.getElementById('convertDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('convertTime').value = '';
  document.getElementById('convertType').value = '';
  document.getElementById('convertResult').classList.add('hidden');
  document.getElementById('copy-btn').classList.add('hidden');
}

function copyResult() {
  const text = `${document.getElementById('result-date').textContent} ${document.getElementById('result-time').textContent}`;
  navigator.clipboard.writeText(text).then(() => showToast('คัดลอกผลลัพธ์แล้ว', 'success'));
}

async function sendCctvOffsetToTimeline() {
  const cctvDate = document.getElementById('cctvDate')?.value;
  const cctvTime = document.getElementById('cctvTime')?.value;
  const realDate = document.getElementById('realDate')?.value;
  const realTime = document.getElementById('realTime')?.value;

  if (!cctvDate || !cctvTime || !realDate || !realTime) {
    showToast('กรุณากรอกและคำนวณความต่างเวลาก่อนส่งเข้า Timeline', 'error');
    return;
  }

  const offsetDescEl = document.getElementById('offset-description');
  const offsetDesc = offsetDescEl ? offsetDescEl.textContent.trim() : '';
  const sign = timeOffset >= 0 ? '+' : '';
  
  // 1. เพิ่มใน Local CCTV Timeline ของหน้านี้
  const cctvTlItem = {
    id: Date.now().toString(),
    date: realDate,
    time: realTime,
    desc: `[วิเคราะห์ CCTV] เวลาจริง ${realTime} (เวลากล้อง ${cctvTime}) Offset: ${sign}${timeOffset} วินาที | ${offsetDesc}`
  };
  timelineData.push(cctvTlItem);
  saveTimelineData();

  // 2. เพิ่มใน Investigation Timeline (localStorage key: 'inv_timeline')
  try {
    let invTimeline = [];
    const storedInv = localStorage.getItem('inv_timeline');
    if (storedInv) {
      try { invTimeline = JSON.parse(storedInv); } catch(e) { invTimeline = []; }
    }
    
    let officerName = 'เจ้าหน้าที่ตรวจกล้อง';
    try {
      const storedName = localStorage.getItem('sanbot_displayName');
      if (storedName) officerName = storedName;
    } catch(e) {}

    const invItem = {
      id: 'TL-CCTV-' + Date.now(),
      date: realDate,
      time: realTime,
      event: `[วิเคราะห์ CCTV] ตรวจสอบกล้องวงจรปิด เวลาจริง ${realTime} เทียบเวลากล้อง ${cctvTime} (${sign}${timeOffset} วินาที) ${offsetDesc}`,
      location: 'ตรวจวิเคราะห์ CCTV',
      officer: officerName,
      type: 'CCTV'
    };

    invTimeline.push(invItem);
    invTimeline.sort((a, b) => ((a.date || a.timestamp || '') + (a.time || '')).localeCompare((b.date || b.timestamp || '') + (b.time || '')));
    localStorage.setItem('inv_timeline', JSON.stringify(invTimeline));

    // ซิงค์กับ GAS ถ้ามี
    if (typeof callGasApi === 'function') {
      callGasApi('createTimeline', invItem, 'POST').catch(err => console.warn('GAS sync:', err));
    } else if (typeof getGasApiUrl === 'function') {
      const url = getGasApiUrl();
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'createTimeline', data: invItem, ...invItem })
      }).catch(err => console.warn('GAS fetch sync:', err));
    }

    showToast('บันทึกเข้า Timeline สืบสวนและ CCTV เรียบร้อยแล้ว', 'success');
  } catch(e) {
    console.error('Error saving CCTV offset to timeline:', e);
    showToast('บันทึกใน CCTV Timeline แล้ว', 'success');
  }
}

// --- Tab 2: Time Calculator ---
function calculateTime() {
  const bd = document.getElementById('calcBaseDate').value;
  const bt = document.getElementById('calcBaseTime').value;
  if (!bd || !bt) { showToast('กรุณากรอกวันที่และเวลา', 'error'); return; }

  const op = document.getElementById('calcOperation').value;
  const totalMs = (((parseInt(document.getElementById('calcDays').value) || 0) * 86400) +
    ((parseInt(document.getElementById('calcHours').value) || 0) * 3600) +
    ((parseInt(document.getElementById('calcMinutes').value) || 0) * 60) +
    (parseInt(document.getElementById('calcSeconds').value) || 0)) * 1000;

  const resultDT = op === 'add' ? new Date(new Date(`${bd}T${bt}`).getTime() + totalMs) : new Date(new Date(`${bd}T${bt}`).getTime() - totalMs);

  document.getElementById('calc-result-time').textContent = formatTime(resultDT);
  document.getElementById('calc-result-date').textContent = formatThaiDateShort(resultDT);
  document.getElementById('calcResult').classList.remove('hidden');
  showToast('คำนวณเรียบร้อย', 'success');
}

function setCalcNow() { setNowToInputs('calcBaseDate', 'calcBaseTime'); }
function resetCalcForm() {
  document.getElementById('calcBaseDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('calcBaseTime').value = '';
  ['calcDays', 'calcHours', 'calcMinutes', 'calcSeconds'].forEach(id => document.getElementById(id).value = '0');
  document.getElementById('calcResult').classList.add('hidden');
}

// --- Tab 3: Stopwatch ---
function formatSW(ms) {
  const h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1e3), ml = ms % 1e3;
  return `${pad(h)}:${pad(m)}:${pad(s)}<span class="stopwatch-ms">.${String(ml).padStart(3, '0')}</span>`;
}

function updateSW() { 
  const display = document.getElementById('stopwatch-display');
  if(display) display.innerHTML = formatSW(swElapsed + (Date.now() - swStart)); 
}

function toggleStopwatch() {
  const btn = document.getElementById('btn-sw-start');
  if (!swRunning) {
    swRunning = true; swStart = Date.now(); swInterval = setInterval(updateSW, 50);
    btn.textContent = '⏸ หยุด';
    btn.className = 'btn-secondary px-8 py-3 rounded-xl font-medium flex items-center gap-2';
    document.getElementById('btn-sw-lap').disabled = false;
  } else {
    swRunning = false; swElapsed += Date.now() - swStart; clearInterval(swInterval);
    btn.textContent = '▶ เริ่ม';
    btn.className = 'btn-primary px-8 py-3 rounded-xl font-medium flex items-center gap-2';
    document.getElementById('btn-sw-lap').disabled = true;
    updateSW();
  }
}

function recordLap() {
  if (!swRunning) return;
  const total = swElapsed + (Date.now() - swStart);
  const prevTotal = swLaps.length > 0 ? swLaps[swLaps.length - 1].total : 0;
  swLaps.push({ total, diff: total - prevTotal });
  renderLaps();
}

function resetStopwatch() {
  swRunning = false; swElapsed = 0; swLaps = []; clearInterval(swInterval);
  document.getElementById('stopwatch-display').innerHTML = formatSW(0);
  const btnStart = document.getElementById('btn-sw-start');
  btnStart.textContent = '▶ เริ่ม';
  btnStart.className = 'btn-primary px-8 py-3 rounded-xl font-medium flex items-center gap-2';
  document.getElementById('btn-sw-lap').disabled = true;
  document.getElementById('lap-list').innerHTML = '';
}

function renderLaps() {
  const list = document.getElementById('lap-list'); list.innerHTML = '';
  swLaps.slice().reverse().forEach((lap, i) => {
    const div = document.createElement('div'); div.className = 'lap-item';
    const dH = Math.floor(lap.diff / 36e5), dM = Math.floor((lap.diff % 36e5) / 6e4), dS = Math.floor((lap.diff % 6e4) / 1e3), dMs = lap.diff % 1e3;
    const tH = Math.floor(lap.total / 36e5), tM = Math.floor((lap.total % 36e5) / 6e4), tS = Math.floor((lap.total % 6e4) / 1e3), tMs = lap.total % 1e3;
    div.innerHTML = `<span class="lap-num">รอบ ${swLaps.length - i}</span><span class="lap-diff">+${pad(dH)}:${pad(dM)}:${pad(dS)}.${String(dMs).padStart(3, '0')}</span><span class="lap-time">${pad(tH)}:${pad(tM)}:${pad(tS)}.${String(tMs).padStart(3, '0')}</span>`;
    list.appendChild(div);
  });
}

// --- Tab 4: Countdown ---
function startCountdown() {
  const totalMs = (((parseInt(document.getElementById('cd-days').value) || 0) * 86400) +
    ((parseInt(document.getElementById('cd-hours').value) || 0) * 3600) +
    ((parseInt(document.getElementById('cd-minutes').value) || 0) * 60) +
    (parseInt(document.getElementById('cd-seconds').value) || 0)) * 1000;
  if (totalMs <= 0) { showToast('กรุณาระบุเวลา', 'error'); return; }

  cdEndTime = Date.now() + totalMs;
  document.getElementById('btn-cd-start').disabled = true;
  document.getElementById('btn-cd-stop').disabled = false;
  document.getElementById('countdown-display').classList.remove('expired');

  cdInterval = setInterval(() => {
    const rem = cdEndTime - Date.now();
    if (rem <= 0) {
      clearInterval(cdInterval);
      document.getElementById('countdown-display').innerHTML = '00:00:00 <br><span class="text-2xl mt-2 block text-red-500 font-prompt">หมดเวลา!</span>';
      document.getElementById('countdown-display').classList.add('expired');
      document.getElementById('btn-cd-start').disabled = false;
      document.getElementById('btn-cd-stop').disabled = true;
      showToast('นับถอยหลังจบแล้ว!', 'success');
      return;
    }
    const rd = Math.floor(rem / 864e5), rh = Math.floor(rem / 36e5), rm = Math.floor((rem % 36e5) / 6e4), rs = Math.floor((rem % 6e4) / 1e3);
    document.getElementById('countdown-display').textContent = rd > 0 ? `${rd} วัน ${pad(rh % 24)}:${pad(rm)}:${pad(rs)}` : `${pad(rh)}:${pad(rm)}:${pad(rs)}`;
  }, 200);
}

function stopCountdown() {
  clearInterval(cdInterval);
  document.getElementById('btn-cd-start').disabled = false;
  document.getElementById('btn-cd-stop').disabled = true;
  document.getElementById('countdown-display').classList.remove('expired');
}

// --- Tab 5: Timeline (LocalStorage) ---
function loadTimelineData() {
  const stored = localStorage.getItem('cctv_timeline_data');
  if (stored) {
    try { timelineData = JSON.parse(stored); } catch (e) { timelineData = []; }
  }
  renderTimeline();
}

function saveTimelineData() {
  localStorage.setItem('cctv_timeline_data', JSON.stringify(timelineData));
  renderTimeline();
}

function addTimelineItem() {
  const d = document.getElementById('tl-date').value;
  const t = document.getElementById('tl-time').value;
  const desc = document.getElementById('tl-desc').value.trim();

  if (!d || !t || !desc) {
    showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
    return;
  }

  timelineData.push({ id: Date.now().toString(), date: d, time: t, desc: desc });
  saveTimelineData();

  document.getElementById('tl-desc').value = '';
  showToast('เพิ่มเหตุการณ์เรียบร้อย', 'success');
}

function setTimelineNow() { setNowToInputs('tl-date', 'tl-time'); }

function renderTimeline() {
  const list = document.getElementById('timeline-list');
  const copyBtn = document.getElementById('btn-tl-copy');
  const clearBtn = document.getElementById('btn-tl-clear');
  list.innerHTML = '';

  if (timelineData.length === 0) {
    copyBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    return;
  }

  copyBtn.style.display = 'inline-block';
  clearBtn.style.display = 'inline-block';

  [...timelineData].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)).forEach(item => {
    const dt = new Date(`${item.date}T${item.time}`);
    const div = document.createElement('div');
    div.className = 'timeline-item';
    div.innerHTML = `
          <div>
            <div class="timeline-time">${formatTime(dt)}</div>
            <div class="timeline-date">${formatDateStandard(dt.toISOString().split('T')[0])}</div>
          </div>
          <div class="timeline-desc">${item.desc.replace(/</g, '&lt;')}</div>
          <div class="timeline-actions">
            <button type="button" title="ลบ" onclick="deleteTimelineItem('${item.id}')">🗑</button>
          </div>`;
    list.appendChild(div);
  });
}

function deleteTimelineItem(id) {
  timelineData = timelineData.filter(x => x.id !== id);
  saveTimelineData();
  showToast('ลบเหตุการณ์เรียบร้อย', 'success');
}

function clearAllTimeline() {
  if (!confirm('ต้องการล้าง Timeline ทั้งหมดหรือไม่?')) return;
  timelineData = [];
  saveTimelineData();
  showToast('ล้าง Timeline เรียบร้อย', 'success');
}

function copyTimeline() {
  const text = [...timelineData].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .map(e => `${formatTime(new Date(`${e.date}T${e.time}`))} ${formatDateStandard(e.date)} — ${e.desc}`).join('\n');
  navigator.clipboard.writeText(text).then(() => showToast('คัดลอก Timeline แล้ว', 'success'));
}

// --- Tab 6: Time Zone Converter ---
function setupTimezoneOptions() {
  const select = document.getElementById('convert-tz-from');
  if(!select) return;
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city.tz; opt.textContent = `${city.flag} ${city.name}`;
    if (city.tz === 'Asia/Bangkok') opt.selected = true;
    select.appendChild(opt);
  });
}

function convertTimezone() {
  const dv = document.getElementById('convert-tz-date').value, tv = document.getElementById('convert-tz-time').value, fromTZ = document.getElementById('convert-tz-from').value;
  if (!dv || !tv) { showToast('กรุณาระบุวันที่และเวลา', 'error'); return; }

  const dts = `${dv}T${tv}`;
  const srcUTC = new Date(new Date(dts).toLocaleString('en-US', { timeZone: 'UTC' }));
  const srcLocal = new Date(new Date(dts).toLocaleString('en-US', { timeZone: fromTZ }));
  const utcTs = new Date(dts).getTime() - (srcLocal.getTime() - srcUTC.getTime());

  const grid = document.getElementById('result-grid'); grid.innerHTML = '';
  cities.forEach(city => {
    const conv = new Date(new Date(utcTs).toLocaleString('en-US', { timeZone: city.tz }));
    const item = document.createElement('div'); item.className = 'result-item';
    item.innerHTML = `<div class="city">${city.flag} ${city.name}</div><div class="time">${formatTime(conv)}</div><div class="date">${formatDateStandard(conv.toISOString().split('T')[0])}</div>`;
    grid.appendChild(item);
  });
  document.getElementById('convert-tz-result').classList.remove('hidden');
  showToast('แปลงเวลาเรียบร้อย', 'success');
}

// ========================================================
// --- Tab 7: Escape Route Interactive Tracker Logic ---
// ========================================================
let escapeRoutePoints = [];
let escapeMap = null;
let routePolyline = null;
let routeMarkers = [];

function loadEscapeRouteData() {
  try {
    const saved = localStorage.getItem('sanbot_escape_route');
    if (saved) {
      escapeRoutePoints = JSON.parse(saved);
    }
  } catch (e) {
    escapeRoutePoints = [];
  }
}

function saveEscapeRouteData() {
  localStorage.setItem('sanbot_escape_route', JSON.stringify(escapeRoutePoints));
  renderEscapeRoute();
}

function initEscapeMap() {
  const mapContainer = document.getElementById('leaflet-escape-map');
  if (!mapContainer) return;

  if (!escapeMap && typeof L !== 'undefined') {
    // กำหนดจุดกึ่งกลางเริ่มต้น (ประเทศไทย/ระยอง หรือจุดแรกในข้อมูล)
    const initialLat = (escapeRoutePoints.length > 0) ? escapeRoutePoints[0].lat : 12.8256;
    const initialLng = (escapeRoutePoints.length > 0) ? escapeRoutePoints[0].lng : 101.1738;

    escapeMap = L.map('leaflet-escape-map', {
      scrollWheelZoom: false
    }).setView([initialLat, initialLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | San BOT'
    }).addTo(escapeMap);

    // คลิกบนแผนที่เพื่อใส่พิกัดลงในฟอร์มอัตโนมัติ
    escapeMap.on('click', function(e) {
      const latEl = document.getElementById('rm-lat');
      const lngEl = document.getElementById('rm-lng');
      if (latEl && lngEl) {
        latEl.value = e.latlng.lat.toFixed(6);
        lngEl.value = e.latlng.lng.toFixed(6);
        showToast(`เลือกพิกัด: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`, 'info');
      }
    });
  }

  loadEscapeRouteData();
  renderEscapeRoute();
}

function getCurrentGpsForRoute() {
  if (!navigator.geolocation) {
    showToast('อุปกรณ์ไม่รองรับการดึง GPS', 'error');
    return;
  }
  showToast('กำลังค้นหาพิกัด GPS ปัจจุบัน...', 'info');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('rm-lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('rm-lng').value = pos.coords.longitude.toFixed(6);
      showToast('ดึงพิกัด GPS สำเร็จ', 'success');
      if (escapeMap) {
        escapeMap.setView([pos.coords.latitude, pos.coords.longitude], 15);
      }
    },
    (err) => {
      showToast('ไม่สามารถดึง GPS ได้: ' + err.message, 'error');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function addRoutePoint() {
  const date = document.getElementById('rm-date').value;
  const time = document.getElementById('rm-time').value;
  const lat = parseFloat(document.getElementById('rm-lat').value);
  const lng = parseFloat(document.getElementById('rm-lng').value);
  const note = document.getElementById('rm-note').value.trim();

  if (!date || !time || isNaN(lat) || isNaN(lng) || !note) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  const point = {
    id: Date.now(),
    date,
    time,
    lat,
    lng,
    note
  };

  escapeRoutePoints.push(point);
  // จัดเรียงตามวันและเวลาจริง
  escapeRoutePoints.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  saveEscapeRouteData();

  // Reset note
  document.getElementById('rm-note').value = '';
  showToast('บันทึกจุดตรวจและอัปเดตเส้นทางแล้ว', 'success');
}

function deleteRoutePoint(id) {
  escapeRoutePoints = escapeRoutePoints.filter(p => p.id !== id);
  saveEscapeRouteData();
  showToast('ลบจุดตรวจเรียบร้อย', 'success');
}

function clearAllRoutePoints() {
  if (!escapeRoutePoints.length) return;
  if (!confirm('ต้องการลบจุดตรวจเส้นทางทั้งหมดหรือไม่?')) return;
  escapeRoutePoints = [];
  saveEscapeRouteData();
  showToast('ล้างเส้นทางทั้งหมดแล้ว', 'success');
}

// คำนวณระยะทางแบบ Haversine (กิโลเมตร)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // รัศมีโลกในหน่วย กม.
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function renderEscapeRoute() {
  const listContainer = document.getElementById('route-points-list');
  if (!listContainer) return;

  // เคลียร์ markers และ polyline เก่า
  if (routeMarkers && routeMarkers.length) {
    routeMarkers.forEach(m => m.remove());
    routeMarkers = [];
  }
  if (routePolyline && escapeMap) {
    routePolyline.remove();
    routePolyline = null;
  }

  // อัปเดตสถิติ
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  const latLngs = [];

  for (let i = 0; i < escapeRoutePoints.length; i++) {
    const p = escapeRoutePoints[i];
    latLngs.push([p.lat, p.lng]);

    if (i > 0) {
      const prev = escapeRoutePoints[i - 1];
      const dist = calculateHaversineDistance(prev.lat, prev.lng, p.lat, p.lng);
      totalDistanceKm += dist;

      const t1 = new Date(`${prev.date}T${prev.time}`).getTime();
      const t2 = new Date(`${p.date}T${p.time}`).getTime();
      const diffMinutes = Math.max(0, (t2 - t1) / (1000 * 60));
      totalDurationMinutes += diffMinutes;
    }
  }

  const avgSpeed = (totalDurationMinutes > 0) ? (totalDistanceKm / (totalDurationMinutes / 60)) : 0;

  // แสดงผลค่าสถิติ
  document.getElementById('rm-stat-points').textContent = `${escapeRoutePoints.length} จุด`;
  document.getElementById('rm-stat-distance').textContent = `${totalDistanceKm.toFixed(2)} กม.`;
  document.getElementById('rm-stat-duration').textContent = `${Math.round(totalDurationMinutes)} นาที`;
  document.getElementById('rm-stat-speed').textContent = `${avgSpeed.toFixed(1)} กม./ชม.`;

  // วาด Marker และ Polyline บน Leaflet
  if (escapeMap && typeof L !== 'undefined') {
    escapeRoutePoints.forEach((p, idx) => {
      // Custom Numbered Icon
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#dc2626;color:#fff;width:28px;height:28px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;box-shadow:0 3px 8px rgba(0,0,0,0.4);">${idx + 1}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(escapeMap);
      marker.bindPopup(`
        <div style="font-family:'Prompt',sans-serif;font-size:13px;line-height:1.4;">
          <b style="color:#1e3a8a;">จุดที่ ${idx + 1}: ${p.note}</b><br>
          📅 วันที่: ${formatDateStandard(p.date)}<br>
          ⏰ เวลา: ${p.time} น.<br>
          📍 พิกัด: ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}
        </div>
      `);
      routeMarkers.push(marker);
    });

    if (latLngs.length > 1) {
      routePolyline = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(escapeMap);
      escapeMap.fitBounds(routePolyline.getBounds(), { padding: [40, 40] });
    } else if (latLngs.length === 1) {
      escapeMap.setView(latLngs[0], 15);
    }
  }

  // Render Table
  if (!escapeRoutePoints.length) {
    listContainer.innerHTML = '<div class="text-center py-6 text-gray-500 text-xs">ยังไม่มีจุดตรวจเส้นทางหลบหนี กรุณาเพิ่มจุดแรกด้านบน</div>';
    return;
  }

  listContainer.innerHTML = escapeRoutePoints.map((p, idx) => {
    let legInfo = '';
    if (idx > 0) {
      const prev = escapeRoutePoints[idx - 1];
      const legDist = calculateHaversineDistance(prev.lat, prev.lng, p.lat, p.lng);
      const t1 = new Date(`${prev.date}T${prev.time}`).getTime();
      const t2 = new Date(`${p.date}T${p.time}`).getTime();
      const legMins = Math.max(0, (t2 - t1) / (1000 * 60));
      const legSpeed = legMins > 0 ? (legDist / (legMins / 60)) : 0;
      legInfo = `
        <div class="text-xs text-police-blue mt-1.5 flex flex-wrap items-center gap-3 font-medium bg-blue-50/70 px-2.5 py-1 rounded-lg border border-blue-100">
          <span>📏 ห่างจากจุดก่อนหน้า: <b>${legDist.toFixed(2)} กม.</b></span>
          <span>⏱️ ใช้เวลา: <b>${Math.round(legMins)} นาที</b></span>
          <span>⚡ ความเร็วเฉลี่ย: <b>${legSpeed.toFixed(1)} กม./ชม.</b></span>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-start justify-between gap-3 transition hover:border-blue-300">
        <div class="flex items-start gap-3">
          <span class="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">${idx + 1}</span>
          <div>
            <div class="text-slate-800 font-bold text-sm">${p.note}</div>
            <div class="text-xs text-slate-500 mt-0.5 font-medium">📅 ${formatDateStandard(p.date)} | ⏰ ${p.time} น. | 📍 ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</div>
            ${legInfo}
          </div>
        </div>
        <button onclick="deleteRoutePoint(${p.id})" class="btn-danger p-1.5 rounded-lg text-xs hover:bg-red-700 text-white transition shadow-sm" title="ลบจุดตรวจ">🗑️</button>
      </div>
    `;
  }).join('');
}

function openAllInGoogleMaps() {
  if (!escapeRoutePoints.length) {
    showToast('ยังไม่มีจุดตรวจเส้นทาง', 'error');
    return;
  }
  const origin = `${escapeRoutePoints[0].lat},${escapeRoutePoints[0].lng}`;
  const destination = `${escapeRoutePoints[escapeRoutePoints.length - 1].lat},${escapeRoutePoints[escapeRoutePoints.length - 1].lng}`;
  let waypoints = '';
  if (escapeRoutePoints.length > 2) {
    waypoints = escapeRoutePoints.slice(1, -1).map(p => `${p.lat},${p.lng}`).join('|');
  }

  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
  window.open(url, '_blank');
}

// ==================== Escape Route PDF Report ====================
function exportEscapeRoutePDF() {
  if (!escapeRoutePoints || !escapeRoutePoints.length) {
    showToast('ยังไม่มีจุดตรวจเส้นทางหลบหนี กรุณาเพิ่มจุดตรวจก่อนพิมพ์รายงาน', 'warning');
    return;
  }

  const modalId = 'escape-route-print-modal';
  let modal = document.getElementById(modalId);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
    document.body.appendChild(modal);
  }

  // คำนวณสถิติรวม
  let totalDist = 0;
  let totalMins = 0;
  const legs = [];

  for (let i = 0; i < escapeRoutePoints.length; i++) {
    const p = escapeRoutePoints[i];
    let legDist = 0;
    let legMins = 0;
    let legSpeed = 0;

    if (i > 0) {
      const prev = escapeRoutePoints[i - 1];
      legDist = calculateHaversineDistance(prev.lat, prev.lng, p.lat, p.lng);
      totalDist += legDist;

      const t1 = new Date(`${prev.date}T${prev.time}`).getTime();
      const t2 = new Date(`${p.date}T${p.time}`).getTime();
      legMins = Math.max(0, (t2 - t1) / (1000 * 60));
      totalMins += legMins;

      legSpeed = legMins > 0 ? (legDist / (legMins / 60)) : 0;
    }

    legs.push({
      point: p,
      index: i + 1,
      legDist,
      legMins,
      legSpeed
    });
  }

  const avgSpeed = totalMins > 0 ? (totalDist / (totalMins / 60)) : 0;
  const reportDateThai = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] overflow-y-auto">
      
      <!-- Action Bar (ไม่แสดงเวลาพิมพ์) -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div class="flex items-center gap-2">
          <span class="text-xl">🗺️</span>
          <span class="font-extrabold text-police-blue text-sm sm:text-base">รายงานสรุปเส้นทางหลบหนีและคำนวณความเร็ว (Escape Route Report)</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95">
            🖨️ สั่งพิมพ์ / บันทึก PDF
          </button>
          <button onclick="document.getElementById('${modalId}').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition">
            ✕
          </button>
        </div>
      </div>

      <!-- Printable Report Area -->
      <div class="printable-route-report text-slate-800 space-y-4">
        
        <!-- Header -->
        <div class="text-center pb-3 border-b-2 border-police-blue">
          <div class="inline-block px-3.5 py-1 rounded-full bg-blue-100 text-blue-900 font-extrabold text-xs tracking-wider uppercase mb-1.5 border border-blue-200">
            📊 รายงานการวิเคราะห์กล้องวงจรปิดและเส้นทางหลบหนี
          </div>
          <h2 class="text-lg sm:text-xl font-black text-police-blue">งานสืบสวน สถานีตำรวจภูธรนิคมพัฒนา ภ.จว.ระยอง</h2>
          <p class="text-xs text-slate-500 mt-0.5">ออกรายงาน ณ วันที่: ${reportDateThai} | ระบบคำนวณเวลาและแผนที่ CCTV Time Calculator</p>
        </div>

        <!-- 4 Summary KPI Cards -->
        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div class="text-slate-500 font-bold">📍 จุดตรวจที่พบ</div>
            <div class="text-lg font-black text-police-blue">${escapeRoutePoints.length} จุด</div>
          </div>
          <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <div class="text-emerald-800 font-bold">📏 ระยะทางรวม</div>
            <div class="text-lg font-black text-emerald-700">${totalDist.toFixed(2)} กม.</div>
          </div>
          <div class="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
            <div class="text-purple-800 font-bold">⏱️ เวลาเดินทางรวม</div>
            <div class="text-lg font-black text-purple-700">${Math.round(totalMins)} นาที</div>
          </div>
          <div class="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <div class="text-amber-800 font-bold">⚡ ความเร็วเฉลี่ย</div>
            <div class="text-lg font-black text-amber-700">${avgSpeed.toFixed(1)} กม./ชม.</div>
          </div>
        </div>

        <!-- Waypoints Table -->
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <th class="p-2.5 text-center w-12">จุดที่</th>
                <th class="p-2.5">วันและเวลาตรวจพบ (CCTV)</th>
                <th class="p-2.5">ชื่อจุดตรวจ / กล้องวงจรปิด / รายละเอียด</th>
                <th class="p-2.5 font-mono">พิกัด GPS</th>
                <th class="p-2.5 text-right">ระยะช่วง</th>
                <th class="p-2.5 text-right">เวลาช่วง</th>
                <th class="p-2.5 text-right">ความเร็วช่วง</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${legs.map((leg, i) => `
                <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
                  <td class="p-2.5 text-center font-bold">
                    <span class="inline-block w-5 h-5 rounded-full bg-blue-700 text-white text-[10px] leading-5 text-center font-black">${leg.index}</span>
                  </td>
                  <td class="p-2.5 font-medium">
                    📅 ${formatDateStandard(leg.point.date)}<br>
                    ⏰ <span class="font-bold text-police-blue">${leg.point.time} น.</span>
                  </td>
                  <td class="p-2.5 font-semibold text-slate-800">${leg.point.note}</td>
                  <td class="p-2.5 font-mono text-[11px] text-slate-600">${leg.point.lat.toFixed(5)}, ${leg.point.lng.toFixed(5)}</td>
                  <td class="p-2.5 text-right font-medium">${i === 0 ? '<span class="text-slate-400">จุดเริ่มต้น</span>' : `${leg.legDist.toFixed(2)} กม.`}</td>
                  <td class="p-2.5 text-right font-medium">${i === 0 ? '<span class="text-slate-400">-</span>' : `${Math.round(leg.legMins)} นาที`}</td>
                  <td class="p-2.5 text-right font-bold ${leg.legSpeed > 80 ? 'text-rose-600' : 'text-slate-700'}">${i === 0 ? '<span class="text-slate-400">-</span>' : `${leg.legSpeed.toFixed(1)} กม./ชม.`}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Tactical Conclusion Box -->
        <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <span class="font-bold text-police-blue block mb-1">💡 สรุปการวิเคราะห์เชิงยุทธวิธี:</span>
          <p class="text-slate-700 leading-relaxed">
            ผู้ต้องสงสัย/ยานพาหนะเป้าหมายเริ่มเคลื่อนที่จาก <strong>${escapeRoutePoints[0].note}</strong> เมื่อเวลา ${escapeRoutePoints[0].time} น. 
            และปรากฏตัวล่าสุดที่ <strong>${escapeRoutePoints[escapeRoutePoints.length - 1].note}</strong> เมื่อเวลา ${escapeRoutePoints[escapeRoutePoints.length - 1].time} น. 
            รวมระยะทางตรวจพบ ${totalDist.toFixed(2)} กม. ใช้เวลาเดินทางรวมประมาณ ${Math.round(totalMins)} นาที ด้วยความเร็วเฉลี่ย ${avgSpeed.toFixed(1)} กม./ชม.
          </p>
        </div>

        <!-- Signatures Section -->
        <div class="grid grid-cols-2 gap-8 pt-6 text-center text-xs text-slate-700">
          <div>
            <p>ลงชื่อ ...........................................................</p>
            <p class="mt-1 font-bold">( ........................................................... )</p>
            <p class="text-slate-500">เจ้าหน้าที่ผู้ตรวจวิเคราะห์กล้อง CCTV</p>
          </div>
          <div>
            <p>ลงชื่อ ...........................................................</p>
            <p class="mt-1 font-bold">( ........................................................... )</p>
            <p class="text-slate-500">สารวัตรสืบสวน สภ.นิคมพัฒนา</p>
          </div>
        </div>

      </div>
    </div>
  `;
}


