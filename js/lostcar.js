// ==================== Configuration ====================
const defaultConfig = {
  background_color: '#F9FAFB',
  surface_color: '#FFFFFF',
  text_color: '#1F2937',
  primary_color: '#1e3a8a',
  card_color: '#FFFFFF',
  font_family: 'Prompt',
  font_size: 14,
  app_title: 'ระบบรายงานรถหาย',
  station_name: 'งานสืบสวน สถานีตำรวจภูธรนิคมพัฒนา',
  apps_script_url: (typeof CONFIG !== 'undefined' && CONFIG.GAS_URL_LOSTCAR) ? CONFIG.GAS_URL_LOSTCAR : ((typeof CONFIG !== 'undefined' && CONFIG.GAS_URL) ? CONFIG.GAS_URL : 'https://script.google.com/macros/s/AKfycbxs3oWfi4tNCbO4nZ5q0aVIg5sTrdbWVcxkVGpWTuBYR87GcqBkm0BoUrnui0Ybsz1v/exec'),
  liff_id: (typeof CONFIG !== 'undefined' && CONFIG.LIFF_ID) ? CONFIG.LIFF_ID : '2004593216-XbA9wj26'
};

let config = { ...defaultConfig };
let reports = [];
let filteredReports = [];
let settings = { shifts: [], brands: {}, colors: [], areas: [] };
let deleteTargetId = null;
let liffProfile = null;
let charts = {};

// ==================== Element SDK Integration ====================
async function initElementSdk() {
  if (window.elementSdk) {
    await window.elementSdk.init({
      defaultConfig,
      onConfigChange: async (newConfig) => {
        config = { ...defaultConfig, ...newConfig };
        applyConfig();
      },
      mapToCapabilities: (cfg) => ({
        recolorables: [
          { get: () => cfg.background_color || defaultConfig.background_color, set: (v) => { cfg.background_color = v; window.elementSdk.setConfig({ background_color: v }); } },
          { get: () => cfg.surface_color || defaultConfig.surface_color, set: (v) => { cfg.surface_color = v; window.elementSdk.setConfig({ surface_color: v }); } },
          { get: () => cfg.text_color || defaultConfig.text_color, set: (v) => { cfg.text_color = v; window.elementSdk.setConfig({ text_color: v }); } },
          { get: () => cfg.primary_color || defaultConfig.primary_color, set: (v) => { cfg.primary_color = v; window.elementSdk.setConfig({ primary_color: v }); } },
          { get: () => cfg.card_color || defaultConfig.card_color, set: (v) => { cfg.card_color = v; window.elementSdk.setConfig({ card_color: v }); } }
        ],
        borderables: [],
        fontEditable: { get: () => cfg.font_family || defaultConfig.font_family, set: (v) => { cfg.font_family = v; window.elementSdk.setConfig({ font_family: v }); } },
        fontSizeable: { get: () => cfg.font_size || defaultConfig.font_size, set: (v) => { cfg.font_size = v; window.elementSdk.setConfig({ font_size: v }); } }
      }),
      mapToEditPanelValues: (cfg) => new Map([
        ['app_title', cfg.app_title || defaultConfig.app_title],
        ['station_name', cfg.station_name || defaultConfig.station_name],
        ['apps_script_url', cfg.apps_script_url || defaultConfig.apps_script_url],
        ['liff_id', cfg.liff_id || defaultConfig.liff_id]
      ])
    });
    config = { ...defaultConfig, ...window.elementSdk.config };
  }
  applyConfig();
}

function applyConfig() {
  document.getElementById('header-title').textContent = config.app_title || defaultConfig.app_title;
  document.getElementById('header-station').textContent = config.station_name || defaultConfig.station_name;
}

function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ==================== LINE LIFF Integration ====================
async function initLiff() {
  const liffId = config.liff_id || defaultConfig.liff_id;
  if (!liffId) {
    console.log('LIFF ID not configured');
    return;
  }

  const isInIframe = window.self !== window.top;
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';

  // Read cached profile from localStorage or parent window
  let cachedName = localStorage.getItem("sanbot_displayName");
  let cachedPic = localStorage.getItem("sanbot_pictureUrl");
  if (!cachedName && isInIframe) {
    try {
      cachedName = window.parent.localStorage.getItem("sanbot_displayName");
      cachedPic = window.parent.localStorage.getItem("sanbot_pictureUrl");
    } catch (e) { }
  }
  if (cachedName) {
    liffProfile = { displayName: cachedName, pictureUrl: cachedPic };
    updateUserProfile(liffProfile);
  }

  try {
    await liff.init({ liffId });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      liffProfile = profile;
      updateUserProfile(profile);
    } else {
      // ⚠️ LINE denies X-Frame-Options: NEVER call liff.login() inside an iframe!
      if (isInIframe || isLocalHost) {
        console.warn('Running inside an iframe or local development - skipping liff.login() to avoid X-Frame-Options deny');
      } else {
        liff.login();
      }
    }
  } catch (error) {
    console.warn('LIFF init warning:', error);
  }
}

function updateUserProfile(profile) {
  if (!profile) return;
  const avatar = document.getElementById('user-avatar');
  const placeholder = document.getElementById('user-avatar-placeholder');
  const name = document.getElementById('user-name');

  if (avatar && profile.pictureUrl) {
    avatar.src = profile.pictureUrl;
    avatar.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
  }
  if (name && profile.displayName) {
    name.textContent = profile.displayName;
    name.classList.remove('hidden');
  }
}

async function shareToLine(report) {
  if (!liff.isApiAvailable('shareTargetPicker')) {
    showToast('ไม่สามารถแชร์ได้ในโหมดนี้', 'error');
    return;
  }

  const message = {
    type: 'text',
    text: `🚨 รายงานรถหาย\n\n` +
      `🚗 ${report.vehicleType} ${report.brand} ${report.model || ''}\n` +
      `🎨 สี: ${report.color}\n` +
      `📋 ทะเบียน: ${report.licensePlate}\n` +
      `📍 สถานที่: ${report.location}, ${report.area}\n` +
      `📅 วันที่: ${formatThaiDate(report.incidentDate)}\n` +
      `⏰ เวลา: ${formatTime(report.incidentTime)}\n` +
      (report.latitude ? `🗺️ พิกัด: https://maps.google.com/?q=${report.latitude},${report.longitude}\n` : '') +
      `\n📞 แจ้งเบาะแสได้ที่สถานีตำรวจภูธรนิคมพัฒนา`
  };

  try {
    await liff.shareTargetPicker([message]);
    showToast('แชร์สำเร็จ', 'success');
  } catch (error) {
    console.error('Share error:', error);
    showToast('เกิดข้อผิดพลาดในการแชร์', 'error');
  }
}

// ==================== Google Apps Script API ====================
async function callApi(action, data = {}) {
  const url = (typeof CONFIG !== 'undefined' && CONFIG.GAS_URL_LOSTCAR)
    ? CONFIG.GAS_URL_LOSTCAR
    : ((typeof CONFIG !== 'undefined' && CONFIG.GAS_URL) ? CONFIG.GAS_URL : config.apps_script_url);

  if (!url || url.includes('YOUR_GAS_URL')) {
    console.warn('Apps Script URL not set, running in local preview mode');
    return null;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...data })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('POST API failed, attempting GET request fallback:', error);
    // GET fallback สำหรับ Google Apps Script
    try {
      const params = new URLSearchParams({ action });
      if (data.id) params.append('id', data.id);
      if (data.caseId) params.append('caseId', data.caseId);
      if (data.status) params.append('status', data.status);
      const getRes = await fetch(`${url}?${params.toString()}`);
      if (getRes.ok) {
        return await getRes.json();
      }
    } catch (getErr) {
      console.error('API GET fallback also failed:', getErr);
    }
    return null;
  }
}

async function loadSettings() {
  const result = await callApi('getSettings');
  if (result && result.success) {
    settings = result.data;
    populateDropdowns();
  } else {
    // Use default settings if API fails
    settings = {
      shifts: ['เวร 1', 'เวร 2', 'เวร 3'],
      brands: {
        'จักรยานยนต์': ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'GPX', 'Vespa', 'อื่นๆ'],
        'รถยนต์': ['Toyota', 'Honda', 'Nissan', 'Mazda', 'Mitsubishi', 'Isuzu', 'Ford', 'BMW', 'Benz', 'อื่นๆ'],
        'รถกระบะ': ['Toyota', 'Isuzu', 'Ford', 'Mitsubishi', 'Nissan', 'Mazda', 'อื่นๆ']
      },
      colors: ['ดำ', 'ขาว', 'แดง', 'น้ำเงิน', 'เทา', 'เงิน', 'เขียว', 'ส้ม', 'เหลือง', 'ชมพู', 'อื่นๆ'],
      areas: ['เขตเมือง', 'ตลาดกลาง', 'หมู่บ้านจัดสรร A', 'หมู่บ้านจัดสรร B', 'โรงงานอุตสาหกรรม', 'ชุมชนริมคลอง', 'ถนนสายหลัก', 'ถนนสายรอง']
    };
    populateDropdowns();
  }
}

function populateDropdowns() {
  // Shifts
  const shiftSelect = document.getElementById('shift');
  const filterShift = document.getElementById('filter-shift');
  shiftSelect.innerHTML = '<option value="">เลือกเวร</option>';
  filterShift.innerHTML = '<option value="">ทุกเวร</option>';
  settings.shifts.forEach(shift => {
    shiftSelect.innerHTML += `<option value="${shift}">${shift}</option>`;
    filterShift.innerHTML += `<option value="${shift}">${shift}</option>`;
  });

  // Colors
  const colorSelect = document.getElementById('color');
  colorSelect.innerHTML = '<option value="">เลือกสี</option>';
  settings.colors.forEach(color => {
    colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
  });

  // Areas
  const areaSelect = document.getElementById('area');
  const filterArea = document.getElementById('filter-area');
  areaSelect.innerHTML = '<option value="">เลือกพื้นที่</option>';
  filterArea.innerHTML = '<option value="">ทุกพื้นที่</option>';
  settings.areas.forEach(area => {
    areaSelect.innerHTML += `<option value="${area}">${area}</option>`;
    filterArea.innerHTML += `<option value="${area}">${area}</option>`;
  });
}

function updateBrands() {
  const vehicleType = document.getElementById('vehicle-type').value;
  const brandSelect = document.getElementById('brand');
  brandSelect.innerHTML = '<option value="">เลือกยี่ห้อ</option>';

  if (vehicleType && settings.brands[vehicleType]) {
    settings.brands[vehicleType].forEach(brand => {
      brandSelect.innerHTML += `<option value="${brand}">${brand}</option>`;
    });
  }

  document.getElementById('brand-other-container').classList.add('hidden');
}

function checkOtherBrand() {
  const brand = document.getElementById('brand').value;
  const container = document.getElementById('brand-other-container');
  if (brand === 'อื่นๆ') {
    container.classList.remove('hidden');
    document.getElementById('brand-other').required = true;
  } else {
    container.classList.add('hidden');
    document.getElementById('brand-other').required = false;
  }
}

function checkOtherColor() {
  const color = document.getElementById('color').value;
  const container = document.getElementById('color-other-container');
  if (color === 'อื่นๆ') {
    container.classList.remove('hidden');
    document.getElementById('color-other').required = true;
  } else {
    container.classList.add('hidden');
    document.getElementById('color-other').required = false;
  }
}

async function loadReports() {
  const result = await callApi('getReports');
  if (result && result.success) {
    reports = result.data || [];
    filteredReports = [...reports];
    renderReports();
    updateStats();
  } else {
    // Demo data if API fails
    reports = generateDemoData();
    filteredReports = [...reports];
    renderReports();
    updateStats();
  }
}

function generateDemoData() {
  const demoReports = [];
  const statuses = ['pending', 'investigating', 'arrested', 'closed'];
  const vehicleTypes = ['จักรยานยนต์', 'รถยนต์', 'รถกระบะ'];
  const brands = ['Honda', 'Toyota', 'Yamaha', 'Isuzu', 'Nissan'];
  const colors = ['ดำ', 'ขาว', 'แดง', 'น้ำเงิน', 'เทา'];
  const areas = settings.areas.length > 0 ? settings.areas : ['เขตเมือง', 'ตลาดกลาง', 'หมู่บ้านจัดสรร A'];

  for (let i = 0; i < 25; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 60));
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);

    demoReports.push({
      id: `DEMO-${String(i + 1).padStart(4, '0')}`,
      shift: settings.shifts[Math.floor(Math.random() * settings.shifts.length)] || 'เวร 1',
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
      brand: brands[Math.floor(Math.random() * brands.length)],
      model: ['PCX', 'Click', 'Vios', 'City', 'D-Max', 'Ranger'][Math.floor(Math.random() * 6)],
      color: colors[Math.floor(Math.random() * colors.length)],
      licensePlate: `${['กข', 'กค', 'กง', 'กจ'][Math.floor(Math.random() * 4)]} ${Math.floor(1000 + Math.random() * 9000)} กรุงเทพมหานคร`,
      area: areas[Math.floor(Math.random() * areas.length)],
      location: ['หน้าตลาด', 'ลานจอดรถห้าง', 'ซอยบ้านจัดสรร', 'หน้าร้านสะดวกซื้อ', 'ริมถนนใหญ่'][Math.floor(Math.random() * 5)],
      incidentDate: date.toISOString().split('T')[0],
      incidentTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      timePeriod: getTimePeriod(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`),
      latitude: 13.7 + Math.random() * 0.2,
      longitude: 100.4 + Math.random() * 0.2,
      details: 'รายละเอียดตัวอย่าง',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      reporter: 'ผู้ใช้ทดสอบ',
      createdAt: date.toISOString()
    });
  }

  return demoReports;
}

async function createReport(data) {
  const result = await callApi('createReport', { report: data });
  if (result && result.success) {
    showToast('บันทึกรายงานสำเร็จ', 'success');
    await loadReports();
    return true;
  }
  return false;
}

async function updateReport(id, data) {
  const result = await callApi('updateReport', { id, report: data });
  if (result && result.success) {
    showToast('อัพเดตรายงานสำเร็จ', 'success');
    await loadReports();
    return true;
  }
  return false;
}

async function deleteReport(id) {
  const result = await callApi('deleteReport', { id });
  if (result && result.success) {
    showToast('ลบรายงานสำเร็จ', 'success');
    await loadReports();
    return true;
  }
  return false;
}

async function updateStatus(id, status) {
  const result = await callApi('updateStatus', { id, status });
  if (result && result.success) {
    showToast('เปลี่ยนสถานะสำเร็จ', 'success');
    await loadReports();
    return true;
  }
  // Update locally if API fails
  const report = reports.find(r => r.id === id);
  if (report) {
    report.status = status;
    renderReports();
    updateStats();
    showToast('เปลี่ยนสถานะสำเร็จ', 'success');
  }
  return false;
}

// ==================== Page Navigation ====================
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.nav-item, .nav-tab-pill').forEach(n => {
    n.classList.remove('active');
    n.style.color = '';
    n.style.background = '';
    n.style.boxShadow = '';
    n.style.borderBottomColor = '';
  });

  const pageEl = document.getElementById(`page-${page}`);
  const navEl = document.querySelector(`[data-page="${page}"]`);

  if (pageEl) {
    pageEl.classList.remove('hidden');
    pageEl.classList.add('fade-in');
  }

  if (navEl) {
    navEl.classList.add('active');
  }

  if (page === 'list') loadReports();
  if (page === 'stats') updateStats();
  if (page === 'analysis') initAnalysis();
}

// ==================== Form Handling ====================
document.getElementById('report-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const licensePlate = document.getElementById('license-plate').value.trim();
  if (licensePlate.length < 4) {
    document.getElementById('license-error').classList.remove('hidden');
    return;
  }
  document.getElementById('license-error').classList.add('hidden');

  const editId = document.getElementById('edit-id').value;
  const brand = document.getElementById('brand').value === 'อื่นๆ'
    ? document.getElementById('brand-other').value
    : document.getElementById('brand').value;
  const color = document.getElementById('color').value === 'อื่นๆ'
    ? document.getElementById('color-other').value
    : document.getElementById('color').value;

  const data = {
    shift: document.getElementById('shift').value,
    vehicleType: document.getElementById('vehicle-type').value,
    brand,
    model: document.getElementById('model').value,
    color,
    licensePlate: licensePlate.toUpperCase(),
    area: document.getElementById('area').value,
    location: document.getElementById('location').value,
    incidentDate: document.getElementById('incident-date').value,
    incidentTime: document.getElementById('incident-time').value,
    timePeriod: document.getElementById('time-period').value,
    latitude: document.getElementById('latitude').value,
    longitude: document.getElementById('longitude').value,
    details: document.getElementById('details').value,
    reporter: liffProfile?.displayName || 'ผู้ใช้งาน',
    reporterPicture: liffProfile?.pictureUrl || ''
  };

  // Validate duplicate license plate
  const existingReport = reports.find(r =>
    r.licensePlate.replace(/\s/g, '').toUpperCase() === licensePlate.replace(/\s/g, '').toUpperCase() &&
    r.id !== editId
  );

  if (existingReport) {
    showToast('ทะเบียนนี้มีในระบบแล้ว', 'error');
    return;
  }

  const submitBtn = document.getElementById('submit-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="animate-pulse">กำลังบันทึก...</span>';

  let success;
  if (editId) {
    success = await updateReport(editId, data);
  } else {
    success = await createReport(data);
  }

  if (success || !config.apps_script_url) {
    // Local save if API not configured
    if (!config.apps_script_url) {
      if (editId) {
        const idx = reports.findIndex(r => r.id === editId);
        if (idx !== -1) {
          reports[idx] = { ...reports[idx], ...data };
        }
      } else {
        const newReport = {
          id: `RPT-${Date.now()}`,
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        reports.unshift(newReport);
      }
      showToast(editId ? 'อัพเดตรายงานสำเร็จ' : 'บันทึกรายงานสำเร็จ', 'success');
    }

    document.getElementById('report-form').reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('submit-btn').innerHTML = '📤 ส่งรายงาน';
    document.getElementById('time-period').value = '';
    document.getElementById('map-link').classList.add('hidden');
    document.getElementById('brand-other-container').classList.add('hidden');
    document.getElementById('color-other-container').classList.add('hidden');
  }

  submitBtn.disabled = false;
  submitBtn.innerHTML = editId ? '📤 ส่งรายงาน' : '📤 ส่งรายงาน';
});

// Time calculation
document.getElementById('incident-time').addEventListener('change', (e) => {
  const timePeriod = getTimePeriod(e.target.value);
  document.getElementById('time-period').value = timePeriod;
});

function getTimePeriod(time) {
  if (!time) return '';
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 6 && hour < 12) return 'เช้า (06:00-12:00)';
  if (hour >= 12 && hour < 18) return 'บ่าย (12:00-18:00)';
  if (hour >= 18 && hour < 22) return 'เย็น (18:00-22:00)';
  return 'ดึก (22:00-06:00)';
}

// Date validation
document.getElementById('incident-date').addEventListener('change', (e) => {
  const selectedDate = new Date(e.target.value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (selectedDate > today) {
    showToast('ไม่สามารถเลือกวันที่ในอนาคตได้', 'error');
    e.target.value = today.toISOString().split('T')[0];
  }
});

// Set max date
document.getElementById('incident-date').max = new Date().toISOString().split('T')[0];

// ==================== GPS Functions ====================
function getCurrentLocation() {
  const loadingEl = document.getElementById('gps-loading');
  const iconEl = document.getElementById('gps-icon');

  loadingEl.classList.remove('hidden');
  iconEl.classList.add('hidden');

  if (!navigator.geolocation) {
    showToast('เบราว์เซอร์ไม่รองรับ GPS', 'error');
    loadingEl.classList.add('hidden');
    iconEl.classList.remove('hidden');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude.toFixed(6);
      const lng = position.coords.longitude.toFixed(6);

      document.getElementById('latitude').value = lat;
      document.getElementById('longitude').value = lng;

      validateGPS();
      showToast('ดึงตำแหน่งสำเร็จ', 'success');

      loadingEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
    },
    (error) => {
      console.error('GPS Error:', error);
      showToast('ไม่สามารถดึงตำแหน่งได้', 'error');
      loadingEl.classList.add('hidden');
      iconEl.classList.remove('hidden');
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function validateGPS() {
  const lat = parseFloat(document.getElementById('latitude').value);
  const lng = parseFloat(document.getElementById('longitude').value);
  const errorEl = document.getElementById('gps-error');
  const mapLinkEl = document.getElementById('map-link');
  const mapLink = document.getElementById('google-maps-link');

  if (isNaN(lat) || isNaN(lng)) {
    errorEl.classList.add('hidden');
    mapLinkEl.classList.add('hidden');
    return;
  }

  // Thailand bounds: Lat 5.6-20.5, Lon 97.3-105.6
  if (lat < 5.6 || lat > 20.5 || lng < 97.3 || lng > 105.6) {
    errorEl.classList.remove('hidden');
    mapLinkEl.classList.add('hidden');
  } else {
    errorEl.classList.add('hidden');
    mapLinkEl.classList.remove('hidden');
    mapLink.href = `https://maps.google.com/?q=${lat},${lng}`;
  }
}

// ==================== Reports List ====================
function renderReports() {
  const container = document.getElementById('reports-list');
  const countEl = document.getElementById('results-count');

  container.innerHTML = '';
  countEl.textContent = `พบ ${filteredReports.length} รายการ`;

  if (filteredReports.length === 0) {
    container.innerHTML = `
          <div class="text-center py-12">
            <div class="text-6xl mb-4">📭</div>
            <p class="text-gray-500">ไม่พบรายการ</p>
          </div>
        `;
    return;
  }

  filteredReports.forEach((report, idx) => {
    const card = document.createElement('div');
    card.className = 'glass-card p-4 sm:p-5 card-hover slide-up border border-white/70 shadow-lg';
    card.style.animationDelay = `${idx * 40}ms`;

    card.innerHTML = `
          <div class="flex items-start justify-between mb-2.5 pb-2 border-b border-slate-100">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="text-xl">${getVehicleIcon(report.vehicleType)}</span>
                <span class="font-extrabold text-police-blue text-base">${report.brand} ${report.model || ''}</span>
                <span class="status-badge status-${report.status}">${getStatusText(report.status)}</span>
              </div>
              <div class="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span class="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200">🎨 สี: ${report.color}</span>
                <span class="px-2 py-0.5 bg-blue-50 text-police-blue rounded-md border border-blue-200 font-mono">📋 ทะเบียน: ${report.licensePlate}</span>
              </div>
            </div>
            <span class="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">#${report.id}</span>
          </div>
          
          <div class="text-xs text-slate-600 mb-3.5 space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
            <p class="flex items-center gap-1.5">📍 <span class="font-bold text-slate-800">${report.location || '-'}</span> <span class="text-slate-500">(${report.area || '-'})</span></p>
            <p class="flex items-center gap-1.5">📅 <span>${formatThaiDate(report.incidentDate)}</span> ⏰ <span>${formatTime(report.incidentTime)}</span> <span class="text-amber-700 font-semibold">(${report.timePeriod || '-'})</span></p>
            <p class="flex items-center gap-1.5">👮 ผู้บันทึก: <span class="font-semibold text-slate-700">${report.reporter || '-'}</span> | 🏢 เวร: <span class="font-semibold text-slate-700">${report.shift || '-'}</span></p>
            ${report.details ? `<p class="mt-1 pt-1 border-t border-slate-200 text-slate-700 italic">📝 "${report.details}"</p>` : ''}
          </div>
          
          <div class="flex items-center gap-1.5 flex-wrap">
            ${report.latitude ? `
              <a href="https://maps.google.com/?q=${report.latitude},${report.longitude}" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-all flex items-center gap-1">
                🗺️ แผนที่
              </a>
            ` : ''}
            <button onclick="shareReport('${report.id}')" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1">
              📤 แชร์
            </button>
            <button onclick="printLostCarReport('${report.id}')" class="px-3 py-1.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1">
              📄 พิมพ์ประกาศ
            </button>
            <button onclick="editReport('${report.id}')" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 transition-all flex items-center gap-1">
              ✏️ แก้ไข
            </button>
            <select onchange="handleStatusChange('${report.id}', this.value)" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 cursor-pointer">
              <option value="" disabled selected>📊 ปรับสถานะ</option>
              <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>รอดำเนินการ</option>
              <option value="investigating" ${report.status === 'investigating' ? 'selected' : ''}>กำลังสืบสวน</option>
              <option value="arrested" ${report.status === 'arrested' ? 'selected' : ''}>จับกุมได้</option>
              <option value="closed" ${report.status === 'closed' ? 'selected' : ''}>ปิดคดี</option>
            </select>
            <button onclick="openDeleteModal('${report.id}')" class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold border border-red-200 transition-all flex items-center gap-1">
              🗑️ ลบ
            </button>
          </div>
        `;

    container.appendChild(card);
  });
}

function getVehicleIcon(type) {
  switch (type) {
    case 'จักรยานยนต์': return '🏍️';
    case 'รถยนต์': return '🚗';
    case 'รถกระบะ': return '🛻';
    default: return '🚙';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'pending': return 'รอดำเนินการ';
    case 'investigating': return 'กำลังสืบสวน';
    case 'arrested': return 'จับกุมได้';
    case 'closed': return 'ปิดคดี';
    default: return status;
  }
}

function formatThaiDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('th-TH', options);
}

function formatTime(time) {
  const d = new Date(time);
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}


// ==================== Filter Functions ====================
function filterReports() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  const shiftFilter = document.getElementById('filter-shift').value;
  const areaFilter = document.getElementById('filter-area').value;
  const dateFilter = document.getElementById('filter-date').value;

  filteredReports = reports.filter(report => {
    // Search
    const matchSearch = !search ||
      report.licensePlate?.toLowerCase().includes(search) ||
      report.brand?.toLowerCase().includes(search) ||
      report.model?.toLowerCase().includes(search) ||
      report.location?.toLowerCase().includes(search) ||
      report.reporter?.toLowerCase().includes(search) ||
      report.area?.toLowerCase().includes(search);

    // Status
    const matchStatus = !statusFilter || report.status === statusFilter;

    // Shift
    const matchShift = !shiftFilter || report.shift === shiftFilter;

    // Area
    const matchArea = !areaFilter || report.area === areaFilter;

    // Date
    let matchDate = true;
    if (dateFilter && dateFilter !== 'custom') {
      const reportDate = new Date(report.incidentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (dateFilter) {
        case 'today':
          matchDate = reportDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchDate = reportDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchDate = reportDate >= monthAgo;
          break;
      }
    } else if (dateFilter === 'custom') {
      const dateFrom = document.getElementById('date-from').value;
      const dateTo = document.getElementById('date-to').value;
      if (dateFrom && dateTo) {
        const reportDate = new Date(report.incidentDate);
        matchDate = reportDate >= new Date(dateFrom) && reportDate <= new Date(dateTo);
      }
    }

    return matchSearch && matchStatus && matchShift && matchArea && matchDate;
  });

  renderReports();
}

function handleDateFilter() {
  const dateFilter = document.getElementById('filter-date').value;
  const customRange = document.getElementById('custom-date-range');

  if (dateFilter === 'custom') {
    customRange.classList.remove('hidden');
  } else {
    customRange.classList.add('hidden');
    filterReports();
  }
}

function resetFilters() {
  document.getElementById('search-input').value = '';
  document.getElementById('filter-status').value = '';
  document.getElementById('filter-shift').value = '';
  document.getElementById('filter-area').value = '';
  document.getElementById('filter-date').value = '';
  document.getElementById('custom-date-range').classList.add('hidden');
  filteredReports = [...reports];
  renderReports();
}

// ==================== Report Actions ====================
function shareReport(id) {
  const report = reports.find(r => r.id === id);
  if (report) {
    if (typeof liff !== 'undefined' && liff.isInClient()) {
      shareToLine(report);
    } else {
      // Fallback: Copy to clipboard

      //const text = `🚨 รายงานรถหาย\n${report.vehicleType} ${report.brand} ${report.model || ''}\nทะเบียน: ${report.licensePlate}\nสถานที่: ${report.location}, ${report.area}`;

      const text = `🚨 รายงานรถหาย\n\n` +
        `🚗 ${report.vehicleType} ${report.brand} ${report.model || ''}\n` +
        `🎨 สี: ${report.color}\n` +
        `📋 ทะเบียน: ${report.licensePlate}\n` +
        `📍 สถานที่: ${report.location}, ${report.area}\n` +
        `📅 วันที่: ${formatThaiDate(report.incidentDate)}\n` +
        `⏰ เวลา: ${formatTime(report.incidentTime)}\n` +
        (report.latitude ? `🗺️ พิกัด: https://maps.google.com/?q=${report.latitude},${report.longitude}\n` : '') +
        `\n📞 แจ้งเบาะแสได้ที่ งานสืบสวน สถานีตำรวจภูธรนิคมพัฒนา`;


      navigator.clipboard.writeText(text).then(() => {
        showToast('คัดลอกข้อความแล้ว', 'success');
      });
    }
  }
}

function printLostCarReport(id) {
  const report = reports.find(r => String(r.id) === String(id));
  if (!report) {
    showToast('ไม่พบข้อมูลรถหาย', 'error');
    return;
  }

  const mapLink = (report.latitude && report.longitude) ? `https://maps.google.com/?q=${report.latitude},${report.longitude}` : '';
  const qrUrl = mapLink ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(mapLink)}` : '';

  const printHtml = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>ประกาศสืบหารถหาย - ${report.licensePlate}</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;600;700;800&family=Sarabun:wght@400;600;700&display=swap');
              body { font-family: 'Prompt', sans-serif; margin: 0; padding: 2cm 1.5cm; color: #1e293b; background: #fff; line-height: 1.5; }
              .badge-urgent { background: #dc2626; color: #fff; padding: 6px 16px; border-radius: 999px; font-weight: 800; font-size: 14pt; display: inline-block; }
              .header { text-align: center; border-bottom: 3px double #94a3b8; padding-bottom: 15px; margin-bottom: 20px; }
              .title { font-size: 24pt; font-weight: 800; color: #1e3a8a; margin: 8px 0; }
              .plate-box { background: #fef08a; border: 3px solid #000; border-radius: 12px; font-size: 26pt; font-weight: 900; text-align: center; padding: 12px; margin: 15px auto; width: 80%; color: #000; letter-spacing: 2px; }
              .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; font-size: 13pt; }
              .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; }
              .info-card b { color: #1e3a8a; }
              .qr-section { text-align: center; margin-top: 25px; border-top: 2px dashed #cbd5e1; padding-top: 20px; }
              .footer-contact { background: #1e3a8a; color: #fff; padding: 15px; border-radius: 12px; text-align: center; margin-top: 20px; font-size: 13pt; font-weight: 600; }
              @media print {
                  body { padding: 1cm; }
                  .no-print { display: none !important; }
              }
          </style>
      </head>
      <body>
          <div class="no-print" style="position:fixed;top:15px;right:15px;background:#1e3a8a;color:#fff;padding:10px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.3);cursor:pointer;font-weight:bold;z-index:9999;" onclick="window.print()">
              🖨️ พิมพ์ประกาศ / บันทึก PDF
          </div>

          <div class="header">
              <span class="badge-urgent">🚨 ประกาศสืบหารถหาย / ติดตามเร่งด่วน</span>
              <div class="title">สถานีตำรวจภูธรนิคมพัฒนา</div>
              <div style="font-size:12pt;color:#64748b;">ระบบสนับสนุนงานสืบสวนและป้องกันปราบปราม (San BOT)</div>
          </div>

          <div class="plate-box">
              ทะเบียน: ${report.licensePlate || 'ไม่ระบุ'}
          </div>

          <div class="grid-info">
              <div class="info-card">
                  <div><b>🚗 ประเภทรถ:</b> ${report.vehicleType || '-'}</div>
                  <div><b>🏷️ ยี่ห้อ/รุ่น:</b> ${report.brand || '-'} ${report.model || ''}</div>
                  <div><b>🎨 สีตัวรถ:</b> ${report.color || '-'}</div>
              </div>
              <div class="info-card">
                  <div><b>📅 วันที่เกิดเหตุ:</b> ${formatThaiDate(report.incidentDate)}</div>
                  <div><b>⏰ เวลาประมาณ:</b> ${formatTime(report.incidentTime)} น.</div>
                  <div><b>📍 สถานที่/เขต:</b> ${report.location || '-'}, ${report.area || '-'}</div>
              </div>
          </div>

          ${report.additionalDetails ? `
          <div class="info-card" style="margin-bottom:15px;">
              <b>📝 จุดสังเกตและรายละเอียดเพิ่มเติม:</b><br>
              ${report.additionalDetails}
          </div>
          ` : ''}

          ${qrUrl ? `
          <div class="qr-section">
              <div style="font-weight:bold;font-size:12pt;margin-bottom:8px;">📱 สแกน QR Code เพื่อเปิดพิกัดจุดเกิดเหตุบน Google Maps</div>
              <img src="${qrUrl}" alt="Maps QR" style="width:140px;height:140px;border:2px solid #3b82f6;border-radius:8px;" />
              <div style="font-size:10pt;color:#64748b;margin-top:4px;">พิกัด: ${report.latitude}, ${report.longitude}</div>
          </div>
          ` : ''}

          <div class="footer-contact">
              📞 หากพบเห็นหรือมีเบาะแส กรุณาแจ้ง <b>งานสืบสวน สภ.นิคมพัฒนา</b> โทร. 191 หรือติดต่อเจ้าหน้าที่เวรปฏิบัติการทันที
          </div>
      </body>
      </html>
      `;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.open();
    printWin.document.write(printHtml);
    printWin.document.close();
  } else {
    showToast('กรุณาอนุญาต Pop-up เพื่อเปิดหน้าพิมพ์', 'error');
  }
}








function editReport(id) {
  const report = reports.find(r => r.id === id);
  if (!report) return;

  // Switch to report page
  showPage('report');

  // Fill form
  document.getElementById('edit-id').value = report.id;
  document.getElementById('shift').value = report.shift;
  document.getElementById('vehicle-type').value = report.vehicleType;

  // Update brands dropdown
  updateBrands();

  setTimeout(() => {
    // Check if brand is in the list
    const brandSelect = document.getElementById('brand');
    const brandOptions = Array.from(brandSelect.options).map(o => o.value);

    if (brandOptions.includes(report.brand)) {
      brandSelect.value = report.brand;
    } else {
      brandSelect.value = 'อื่นๆ';
      document.getElementById('brand-other-container').classList.remove('hidden');
      document.getElementById('brand-other').value = report.brand;
    }

    document.getElementById('model').value = report.model || '';

    // Check if color is in the list
    const colorSelect = document.getElementById('color');
    const colorOptions = Array.from(colorSelect.options).map(o => o.value);

    if (colorOptions.includes(report.color)) {
      colorSelect.value = report.color;
    } else {
      colorSelect.value = 'อื่นๆ';
      document.getElementById('color-other-container').classList.remove('hidden');
      document.getElementById('color-other').value = report.color;
    }

    document.getElementById('license-plate').value = report.licensePlate;
    document.getElementById('area').value = report.area;
    document.getElementById('location').value = report.location;
    document.getElementById('incident-date').value = report.incidentDate;
    document.getElementById('incident-time').value = report.incidentTime;
    document.getElementById('time-period').value = report.timePeriod || '';
    document.getElementById('latitude').value = report.latitude || '';
    document.getElementById('longitude').value = report.longitude || '';
    document.getElementById('details').value = report.details || '';

    if (report.latitude && report.longitude) {
      validateGPS();
    }

    document.getElementById('submit-btn').innerHTML = '📤 อัพเดตรายงาน';
  }, 100);

  showToast('โหลดข้อมูลสำหรับแก้ไข', 'info');
}

function handleStatusChange(id, status) {
  if (status) {
    updateStatus(id, status);
  }
}

function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

async function confirmDelete() {
  if (deleteTargetId) {
    const success = await deleteReport(deleteTargetId);
    if (!success && !config.apps_script_url) {
      reports = reports.filter(r => r.id !== deleteTargetId);
      filteredReports = filteredReports.filter(r => r.id !== deleteTargetId);
      renderReports();
      updateStats();
      showToast('ลบรายงานสำเร็จ', 'success');
    }
    closeDeleteModal();
  }
}

// ==================== Export Functions ====================
function exportExcel() {
  if (filteredReports.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับ Export', 'error');
    return;
  }

  const data = filteredReports.map(r => ({
    'รหัส': r.id,
    'เวร': r.shift,
    'ประเภท': r.vehicleType,
    'ยี่ห้อ': r.brand,
    'รุ่น': r.model || '-',
    'สี': r.color,
    'ทะเบียน': r.licensePlate,
    'พื้นที่': r.area,
    'สถานที่': r.location,
    'วันที่': formatThaiDate(r.incidentDate),
    'เวลา': formatTime(r.incidentTime),
    'ช่วงเวลา': r.timePeriod || '-',
    'Latitude': r.latitude || '-',
    'Longitude': r.longitude || '-',
    'สถานะ': getStatusText(r.status),
    'ผู้รายงาน': r.reporter || '-',
    'รายละเอียด': r.details || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'รายงานรถหาย');
  XLSX.writeFile(wb, `รายงานรถหาย_${new Date().toISOString().split('T')[0]}.xlsx`);

  showToast('Export Excel สำเร็จ', 'success');
}

function exportPDF() {
  if (filteredReports.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับ Export', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('l', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Vehicle Theft Report', 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('th-TH')}`, 14, 22);

  const tableData = filteredReports.map(r => [
    r.id,
    r.vehicleType,
    r.brand,
    r.licensePlate,
    r.area,
    formatThaiDate(r.incidentDate),
    getStatusText(r.status)
  ]);

  doc.autoTable({
    head: [['ID', 'Type', 'Brand', 'License', 'Area', 'Date', 'Status']],
    body: tableData,
    startY: 28,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [6, 199, 85] }
  });

  doc.save(`รายงานรถหาย_${new Date().toISOString().split('T')[0]}.pdf`);
  showToast('Export PDF สำเร็จ', 'success');
}

// ==================== Statistics & KPIs ====================
function updateStats() {
  const total = reports.length;
  const pending = reports.filter(r => r.status === 'pending').length;
  const investigating = reports.filter(r => r.status === 'investigating').length;
  const arrested = reports.filter(r => r.status === 'arrested' || r.status === 'found').length;
  const clearanceRate = total > 0 ? ((arrested / total) * 100).toFixed(1) : '0.0';

  const statTotal = document.getElementById('stats-total');
  const statPending = document.getElementById('stats-pending');
  const statInvestigating = document.getElementById('stats-investigating');
  const statArrested = document.getElementById('stats-arrested');
  const statClearance = document.getElementById('stats-clearance-rate');

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statInvestigating) statInvestigating.textContent = investigating;
  if (statArrested) statArrested.textContent = arrested;
  if (statClearance) statClearance.textContent = `ความสำเร็จ: ${clearanceRate}% (${arrested}/${total} คัน)`;

  // Generate Strategic Insight Summary Text
  updateStrategicInsightText();

  renderStatusChart();
  renderTimeChart();
  renderAreaChart();
  renderBrandChart();
}

function updateStrategicInsightText() {
  const insightEl = document.getElementById('stats-insight-text');
  if (!insightEl) return;

  if (!reports.length) {
    insightEl.textContent = 'ยังไม่มีข้อมูลสถิติคดีรถหายในระบบ';
    return;
  }

  // Find top area
  const areaCounts = {};
  const brandCounts = {};
  const timeCounts = {};

  reports.forEach(r => {
    if (r.area) areaCounts[r.area] = (areaCounts[r.area] || 0) + 1;
    if (r.brand) brandCounts[r.brand] = (brandCounts[r.brand] || 0) + 1;
    if (r.timePeriod) timeCounts[r.timePeriod] = (timeCounts[r.timePeriod] || 0) + 1;
  });

  const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const topBrand = Object.entries(brandCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
  const topTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0] || ['-', 0];

  insightEl.innerHTML = `
    พบการโจรกรรมหนาแน่นสูงสุดในเขต <b>${topArea[0]}</b> (${topArea[1]} คดี) 
    โดยยานพาหนะเป้าหมายหลักคือยี่ห้อ <b>${topBrand[0]}</b> (${topBrand[1]} คัน) 
    และช่วงเวลาเสี่ยงลงมือมากที่สุดคือ <b>${topTime[0]}</b> 
    แนะนำให้เพิ่มความถี่ชุดสายตรวจจักรยานยนต์และตั้งจุดสกัดบริเวณเส้นทางเชื่อมต่อ
  `;
}

function parseDateSafe(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  const str = String(dateVal).trim();
  if (!str || str.startsWith('RPT-') || str.startsWith('CASE-')) return null;
  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  const dmParts = str.split(/[/ -]/);
  if (dmParts.length >= 3) {
    let day = parseInt(dmParts[0], 10);
    let month = parseInt(dmParts[1], 10) - 1;
    let year = parseInt(dmParts[2], 10);
    if (year > 2400) year -= 543;
    if (day > 1000) {
      const tempY = day;
      day = year;
      year = tempY > 2400 ? tempY - 543 : tempY;
    }
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatThaiDate(dateVal) {
  const d = parseDateSafe(dateVal);
  if (!d) return String(dateVal || 'ไม่ระบุวันที่');
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const thaiYear = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543;
  return `${day} ${month} ${thaiYear}`;
}

function formatTime(timeVal) {
  if (!timeVal) return '-';
  if (timeVal instanceof Date) {
    return `${String(timeVal.getHours()).padStart(2, '0')}:${String(timeVal.getMinutes()).padStart(2, '0')} น.`;
  }
  const str = String(timeVal).trim();
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} น.`;
    }
  }
  return str.endsWith('น.') ? str : `${str} น.`;
}

function getThaiMonth(m) {
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  return months[m - 1] || `เดือน ${m}`;
}

function renderStatusChart() {
  const statusCounts = {
    'รอดำเนินการ': reports.filter(r => r.status === 'pending').length,
    'กำลังสืบสวน': reports.filter(r => r.status === 'investigating').length,
    'จับกุมได้/พบรถ': reports.filter(r => r.status === 'arrested' || r.status === 'found').length,
    'ปิดคดี': reports.filter(r => r.status === 'closed').length
  };
  const chartEl = document.getElementById('chart-status');
  if (!chartEl) return;
  const options = {
    series: Object.values(statusCounts),
    chart: { type: 'donut', height: 260, fontFamily: 'Prompt, sans-serif' },
    labels: Object.keys(statusCounts),
    colors: ['#F59E0B', '#3B82F6', '#10B981', '#6B7280'],
    legend: { position: 'bottom', fontSize: '13px', fontWeight: 600 },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'คดีทั้งหมด',
              fontSize: '14px',
              fontWeight: 800,
              color: '#1e3a8a',
              formatter: () => reports.length + ' คดี'
            }
          }
        }
      }
    }
  };
  if (charts.status) charts.status.destroy();
  charts.status = new ApexCharts(chartEl, options);
  charts.status.render();
}

function renderTimeChart() {
  const timeCounts = {
    'เช้า (06-12 น.)': 0,
    'บ่าย (12-18 น.)': 0,
    'ค่ำ (18-24 น.)': 0,
    'ดึก (00-06 น.)': 0
  };
  reports.forEach(r => {
    const tp = (r.timePeriod || '').toLowerCase();
    const t = (r.incidentTime || '');
    if (tp.includes('เช้า') || (t >= '06:00' && t < '12:00')) timeCounts['เช้า (06-12 น.)']++;
    else if (tp.includes('บ่าย') || (t >= '12:00' && t < '18:00')) timeCounts['บ่าย (12-18 น.)']++;
    else if (tp.includes('ค่ำ') || tp.includes('เย็น') || (t >= '18:00' && t <= '23:59')) timeCounts['ค่ำ (18-24 น.)']++;
    else if (tp.includes('ดึก') || (t >= '00:00' && t < '06:00')) timeCounts['ดึก (00-06 น.)']++;
    else timeCounts['เช้า (06-12 น.)']++;
  });
  const chartEl = document.getElementById('chart-time');
  if (!chartEl) return;
  const options = {
    series: [{ name: 'จำนวนคดี', data: Object.values(timeCounts) }],
    chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Prompt, sans-serif' },
    plotOptions: {
      bar: { borderRadius: 8, horizontal: false, columnWidth: '45%', distributed: true }
    },
    colors: ['#06b6d4', '#3b82f6', '#f59e0b', '#ef4444'],
    xaxis: { categories: Object.keys(timeCounts), labels: { style: { fontSize: '11px', fontWeight: 700 } } },
    legend: { show: false },
    dataLabels: { enabled: true, style: { fontWeight: 800 } }
  };
  if (charts.time) charts.time.destroy();
  charts.time = new ApexCharts(chartEl, options);
  charts.time.render();
}

function renderAreaChart() {
  const areaCounts = {};
  reports.forEach(r => {
    const a = r.area || 'ไม่ระบุพื้นที่';
    areaCounts[a] = (areaCounts[a] || 0) + 1;
  });
  const sorted = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const chartEl = document.getElementById('chart-area');
  if (!chartEl) return;
  const options = {
    series: [{ name: 'จำนวนคดี', data: sorted.map(s => s[1]) }],
    chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Prompt, sans-serif' },
    plotOptions: {
      bar: { borderRadius: 6, horizontal: true, barHeight: '55%' }
    },
    colors: ['#1e3a8a'],
    xaxis: { categories: sorted.map(s => s[0]), labels: { style: { fontSize: '11px', fontWeight: 600 } } },
    dataLabels: { enabled: true, style: { fontWeight: 800 } }
  };
  if (charts.area) charts.area.destroy();
  charts.area = new ApexCharts(chartEl, options);
  charts.area.render();
}

function renderBrandChart() {
  const brandCounts = {};
  reports.forEach(r => {
    const key = `${r.brand || 'อื่นๆ'} ${r.model || ''}`.trim();
    brandCounts[key] = (brandCounts[key] || 0) + 1;
  });
  const sorted = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const chartEl = document.getElementById('chart-brand');
  if (!chartEl) return;
  const options = {
    series: [{ name: 'จำนวนคดี', data: sorted.map(s => s[1]) }],
    chart: { type: 'bar', height: 280, toolbar: { show: false }, fontFamily: 'Prompt, sans-serif' },
    plotOptions: {
      bar: { borderRadius: 6, horizontal: true, barHeight: '55%' }
    },
    colors: ['#d97706'],
    xaxis: { categories: sorted.map(s => s[0]), labels: { style: { fontSize: '11px', fontWeight: 600 } } },
    dataLabels: { enabled: true, style: { fontWeight: 800 } }
  };
  if (charts.brand) charts.brand.destroy();
  charts.brand = new ApexCharts(chartEl, options);
  charts.brand.render();
}

// ==================== Analysis Subtabs ====================
function showAnalysisTab(tab) {
  document.querySelectorAll('.analysis-content').forEach(c => c.classList.add('hidden'));
  document.querySelectorAll('.subtab-pill').forEach(t => t.classList.remove('active'));

  const tabEl = document.getElementById(`tab-${tab}`);
  const btnEl = document.querySelector(`[data-tab="${tab}"]`);
  if (tabEl) {
    tabEl.classList.remove('hidden');
    tabEl.classList.add('fade-in');
  }
  if (btnEl) {
    btnEl.classList.add('active');
  }

  if (tab === 'heatmap') initHeatmap();
  if (tab === 'timeline') { initTimeline(); renderDayOfWeekChart(); }
  if (tab === 'compare') initComparison();
  if (tab === 'mo') initMoAnalysis();
  if (tab === 'report') generateMonthlyReport();
}

function initAnalysis() {
  showAnalysisTab('heatmap');
}

function initHeatmap() {
  const areaCounts = {};
  reports.forEach(r => {
    const a = r.area || 'ไม่ระบุพื้นที่';
    areaCounts[a] = (areaCounts[a] || 0) + 1;
  });
  const sorted = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);
  const total = reports.length || 1;
  const riskContainer = document.getElementById('risk-areas');
  if (!riskContainer) return;
  riskContainer.innerHTML = '';
  sorted.slice(0, 6).forEach(([area, count], idx) => {
    const percent = ((count / total) * 100).toFixed(1);
    const riskLevel = idx === 0 ? 'ความเสี่ยงวิกฤต (เน้นสายตรวจ 24 ชม.)' : idx === 1 ? 'ความเสี่ยงสูง (ตั้งจุดสกัดหัวค่ำ)' : idx === 2 ? 'ความเสี่ยงปานกลาง' : 'เฝ้าระวังปกติ';
    const riskColor = idx === 0 ? 'bg-red-50 text-red-700 border-red-200' : idx === 1 ? 'bg-orange-50 text-orange-700 border-orange-200' : idx === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200';
    riskContainer.innerHTML += `
      <div class="flex items-center justify-between p-3.5 rounded-xl border ${riskColor} shadow-sm transition-all hover:scale-[1.01]">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${idx === 0 ? '🚨' : idx === 1 ? '⚠️' : idx === 2 ? '📍' : '🛡️'}</span>
          <div>
            <span class="font-bold text-sm block text-slate-800">${area}</span>
            <span class="text-[11px] font-semibold opacity-90">${riskLevel}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="font-black text-lg text-slate-900">${count}</span> <span class="text-xs font-bold text-slate-600">คดี</span>
          <span class="text-[11px] block font-bold text-slate-500">(${percent}%)</span>
        </div>
      </div>
    `;
  });

  const mapIframe = document.getElementById('heatmap-iframe');
  if (mapIframe) {
    const validPoints = reports.filter(r => r.latitude && r.longitude && !isNaN(parseFloat(r.latitude)));
    if (validPoints.length > 0) {
      const centerLat = validPoints.reduce((sum, r) => sum + parseFloat(r.latitude), 0) / validPoints.length;
      const centerLng = validPoints.reduce((sum, r) => sum + parseFloat(r.longitude), 0) / validPoints.length;
      mapIframe.src = `https://maps.google.com/maps?q=${centerLat},${centerLng}&z=13&output=embed`;
    } else {
      mapIframe.src = 'https://maps.google.com/maps?q=12.8371,101.1992&z=12&output=embed';
    }
  }
}

function renderDayOfWeekChart() {
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  reports.forEach(r => {
    const d = parseDateSafe(r.incidentDate);
    if (d) {
      dayCounts[d.getDay()]++;
    }
  });

  const chartEl = document.getElementById('chart-day-of-week');
  if (!chartEl) return;

  const options = {
    series: [{ name: 'จำนวนคดี', data: dayCounts }],
    chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Prompt, sans-serif' },
    plotOptions: {
      bar: { borderRadius: 8, horizontal: false, columnWidth: '45%', distributed: true }
    },
    colors: ['#ef4444', '#f59e0b', '#ec4899', '#10b981', '#f97316', '#3b82f6', '#8b5cf6'],
    xaxis: { categories: days, labels: { style: { fontSize: '11px', fontWeight: 700 } } },
    legend: { show: false },
    dataLabels: { enabled: true, style: { fontWeight: 800 } }
  };

  if (charts.dayOfWeek) charts.dayOfWeek.destroy();
  charts.dayOfWeek = new ApexCharts(chartEl, options);
  charts.dayOfWeek.render();
}

function initTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;
  container.innerHTML = '';
  if (!reports || reports.length === 0) {
    container.innerHTML = '<div class="text-center text-slate-400 py-10 font-medium">ยังไม่มีข้อมูลรายงานคดีในระบบ</div>';
    return;
  }
  const sortedReports = [...reports].sort((a, b) => {
    const da = parseDateSafe(a.incidentDate) || new Date(0);
    const db = parseDateSafe(b.incidentDate) || new Date(0);
    return db.getTime() - da.getTime();
  });
  const grouped = {};
  sortedReports.forEach(r => {
    const d = parseDateSafe(r.incidentDate);
    const dateKey = d ? d.toISOString().split('T')[0] : (r.incidentDate || 'ไม่ระบุวันที่');
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(r);
  });

  Object.entries(grouped).forEach(([dateKey, items]) => {
    const formattedHeaderDate = formatThaiDate(dateKey);
    let itemsHtml = items.map(r => `
      <div class="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-lg">${getVehicleIcon(r.vehicleType)}</span>
            <span class="font-bold text-police-blue text-sm">${r.brand || '-'} ${r.model || ''}</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">${r.licensePlate || 'ไม่ระบุทะเบียน'}</span>
          </div>
          <span class="status-badge status-${r.status || 'pending'} text-xs font-bold px-2.5 py-0.5 rounded-full">${getStatusText(r.status)}</span>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
          <span>📍 <strong>พื้นที่:</strong> ${r.area || r.location || '-'}</span>
          <span>⏰ <strong>เวลา:</strong> ${formatTime(r.incidentTime)} (${r.timePeriod || 'ไม่ระบุ'})</span>
          <span>👮 <strong>ผู้รายงาน:</strong> ${r.reporter || 'เจ้าหน้าที่'}</span>
        </div>
        ${r.details ? `<p class="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200 italic">💬 ${r.details}</p>` : ''}
      </div>
    `).join('');

    container.innerHTML += `
      <div class="relative pl-6 pb-6 border-l-2 border-blue-400 last:border-0 last:pb-0">
        <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
        <div class="font-black text-police-blue text-sm mb-2.5 flex items-center gap-2">
          <span>📅 ${formattedHeaderDate}</span>
          <span class="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">${items.length} คดี</span>
        </div>
        <div class="space-y-2.5">
          ${itemsHtml}
        </div>
      </div>
    `;
  });
}

function initComparison() {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const m1 = document.getElementById('compare-month1');
  const m2 = document.getElementById('compare-month2');

  if (m1 && !m1.value) m1.value = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  if (m2 && !m2.value) m2.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  updateComparison();
}

function updateComparison() {
  const m1Input = document.getElementById('compare-month1');
  const m2Input = document.getElementById('compare-month2');
  if (!m1Input || !m2Input) return;

  const month1 = m1Input.value;
  const month2 = m2Input.value;
  if (!month1 || !month2) return;

  const [year1, m1] = month1.split('-').map(Number);
  const [year2, m2] = month2.split('-').map(Number);

  const reports1 = reports.filter(r => {
    const d = parseDateSafe(r.incidentDate);
    return d && d.getFullYear() === year1 && d.getMonth() + 1 === m1;
  });

  const reports2 = reports.filter(r => {
    const d = parseDateSafe(r.incidentDate);
    return d && d.getFullYear() === year2 && d.getMonth() + 1 === m2;
  });

  const chartCompareEl = document.getElementById('chart-compare');
  if (chartCompareEl) {
    const options = {
      series: [{
        name: getThaiMonth(m1) + ' ' + (year1 > 2400 ? year1 : year1 + 543),
        data: [
          reports1.filter(r => r.status === 'pending').length,
          reports1.filter(r => r.status === 'investigating').length,
          reports1.filter(r => r.status === 'arrested' || r.status === 'found').length,
          reports1.filter(r => r.status === 'closed').length
        ]
      }, {
        name: getThaiMonth(m2) + ' ' + (year2 > 2400 ? year2 : year2 + 543),
        data: [
          reports2.filter(r => r.status === 'pending').length,
          reports2.filter(r => r.status === 'investigating').length,
          reports2.filter(r => r.status === 'arrested' || r.status === 'found').length,
          reports2.filter(r => r.status === 'closed').length
        ]
      }],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, fontFamily: 'Prompt, sans-serif' },
      plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 6 } },
      colors: ['#3B82F6', '#10B981'],
      xaxis: { categories: ['รอดำเนินการ', 'กำลังสืบสวน', 'จับกุมได้/พบรถ', 'ปิดคดี'], labels: { style: { fontWeight: 700 } } },
      dataLabels: { enabled: true, style: { fontWeight: 800 } }
    };

    if (charts.compare) charts.compare.destroy();
    charts.compare = new ApexCharts(chartCompareEl, options);
    charts.compare.render();
  }

  const summaryEl = document.getElementById('compare-summary');
  if (summaryEl) {
    const change = reports2.length - reports1.length;
    const changePercent = reports1.length > 0 ? ((change / reports1.length) * 100).toFixed(1) : 0;

    summaryEl.innerHTML = `
      <div class="bg-blue-50 rounded-2xl p-4 border border-blue-200">
        <p class="text-xs text-blue-700 mb-1 font-bold">${getThaiMonth(m1)} ${year1 > 2400 ? year1 : year1 + 543}</p>
        <p class="text-3xl font-black text-blue-900">${reports1.length}</p>
        <p class="text-xs text-blue-600 mt-1">คดีทั้งหมดในเดือน</p>
      </div>
      <div class="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
        <p class="text-xs text-emerald-700 mb-1 font-bold">${getThaiMonth(m2)} ${year2 > 2400 ? year2 : year2 + 543}</p>
        <p class="text-3xl font-black text-emerald-900">${reports2.length}</p>
        <p class="text-xs ${change >= 0 ? 'text-rose-600' : 'text-emerald-700'} font-bold mt-1">
          ${change >= 0 ? '🔺 เพิ่มขึ้น' : '🔻 ลดลง'} ${Math.abs(change)} คดี (${Math.abs(changePercent)}%)
        </p>
      </div>
    `;
  }
}

// ==================== Modus Operandi (M.O.) Analysis ====================
function initMoAnalysis() {
  // 1. Vehicle Type Breakdown
  const typeCounts = { 'จักรยานยนต์': 0, 'รถยนต์': 0, 'รถกระบะ': 0 };
  reports.forEach(r => {
    const t = r.vehicleType || 'จักรยานยนต์';
    if (typeCounts[t] !== undefined) typeCounts[t]++;
    else typeCounts['จักรยานยนต์']++;
  });

  const chartTypeEl = document.getElementById('chart-vehicle-type');
  if (chartTypeEl) {
    const options = {
      series: Object.values(typeCounts),
      chart: { type: 'donut', height: 240, fontFamily: 'Prompt, sans-serif' },
      labels: Object.keys(typeCounts),
      colors: ['#3B82F6', '#F59E0B', '#10B981'],
      legend: { position: 'bottom', fontSize: '12px', fontWeight: 600 }
    };
    if (charts.vehicleType) charts.vehicleType.destroy();
    charts.vehicleType = new ApexCharts(chartTypeEl, options);
    charts.vehicleType.render();
  }

  // 2. Modus Operandi Methods
  const methodCounts = {
    'ต่อสายตรง / ทำลายเบ้ากุญแจ': 0,
    'กุญแจผี / อุปกรณ์สะเดาะ': 0,
    'ไม่ได้ล็อคคอ / เสียบกุญแจคา': 0,
    'ยกรถขึ้นกระบะ': 0,
    'สวมรอย / หลอกลวงยืม': 0
  };

  reports.forEach(r => {
    const det = (r.details || '').toLowerCase();
    if (det.includes('ต่อสายตรง') || det.includes('เบ้ากุญแจ') || det.includes('สายตรง')) methodCounts['ต่อสายตรง / ทำลายเบ้ากุญแจ']++;
    else if (det.includes('กุญแจผี') || det.includes('สะเดาะ')) methodCounts['กุญแจผี / อุปกรณ์สะเดาะ']++;
    else if (det.includes('เสียบ') || det.includes('ไม่ล็อค') || det.includes('ไม่ได้ล็อค')) methodCounts['ไม่ได้ล็อคคอ / เสียบกุญแจคา']++;
    else if (det.includes('ยก') || det.includes('กระบะ')) methodCounts['ยกรถขึ้นกระบะ']++;
    else methodCounts['ต่อสายตรง / ทำลายเบ้ากุญแจ']++;
  });

  const chartMoEl = document.getElementById('chart-mo-methods');
  if (chartMoEl) {
    const options = {
      series: [{ name: 'จำนวนคดี', data: Object.values(methodCounts) }],
      chart: { type: 'bar', height: 240, toolbar: { show: false }, fontFamily: 'Prompt, sans-serif' },
      plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: '55%' } },
      colors: ['#8B5CF6'],
      xaxis: { categories: Object.keys(methodCounts), labels: { style: { fontSize: '10px' } } },
      dataLabels: { enabled: true, style: { fontWeight: 800 } }
    };
    if (charts.moMethods) charts.moMethods.destroy();
    charts.moMethods = new ApexCharts(chartMoEl, options);
    charts.moMethods.render();
  }

  // 3. Top Target Profiles
  const profileContainer = document.getElementById('mo-target-profiles');
  if (profileContainer) {
    const brandModelCounts = {};
    reports.forEach(r => {
      const k = `${r.brand || ''} ${r.model || ''}`.trim() || 'จักรยานยนต์ทั่วไป';
      brandModelCounts[k] = (brandModelCounts[k] || 0) + 1;
    });

    const topModels = Object.entries(brandModelCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    profileContainer.innerHTML = topModels.map(([modelName, count], idx) => `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-black px-2 py-0.5 rounded-full ${idx === 0 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}">อันดับ ${idx + 1}</span>
          <span class="text-sm font-black text-slate-800">${count} คัน</span>
        </div>
        <div class="font-extrabold text-sm text-police-blue">${modelName}</div>
        <p class="text-[11px] text-slate-500 mt-1">เป้าหมายเสี่ยงสูงในการนำไปชำแหละอะไหล่หรือส่งข้ามพื้นที่</p>
      </div>
    `).join('');
  }
}

// ==================== Monthly Strategic Report ====================
function generateMonthlyReport() {
  const container = document.getElementById('monthly-report-content');
  if (!container) return;

  const now = new Date();
  const currentMonthReports = reports.filter(r => {
    const d = parseDateSafe(r.incidentDate);
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const total = currentMonthReports.length;
  const arrested = currentMonthReports.filter(r => r.status === 'arrested' || r.status === 'found').length;
  const investigating = currentMonthReports.filter(r => r.status === 'investigating').length;
  const pending = currentMonthReports.filter(r => r.status === 'pending').length;
  const arrestRate = total > 0 ? ((arrested / total) * 100).toFixed(1) : 0;

  const areaCounts = {};
  currentMonthReports.forEach(r => {
    if (r.area) areaCounts[r.area] = (areaCounts[r.area] || 0) + 1;
  });
  const topAreas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  container.innerHTML = `
    <div class="space-y-4">
      <div class="glass-card p-5 text-white shadow-xl" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);">
        <h4 class="font-extrabold text-base mb-3 flex items-center gap-2">
          <span>📌</span> <span>สรุปสถานการณ์โจรกรรมรถ - ประจำเดือน ${getThaiMonth(now.getMonth() + 1)} ${now.getFullYear() > 2400 ? now.getFullYear() : now.getFullYear() + 543}</span>
        </h4>
        <div class="grid grid-cols-3 gap-3">
          <div class="text-center bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <p class="text-2xl sm:text-3xl font-black">${total}</p>
            <p class="text-[11px] text-blue-200 font-semibold">รับแจ้งในเดือนนี้</p>
          </div>
          <div class="text-center bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <p class="text-2xl sm:text-3xl font-black text-emerald-300">${arrested}</p>
            <p class="text-[11px] text-emerald-100 font-semibold">จับกุม/พบรถ</p>
          </div>
          <div class="text-center bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
            <p class="text-2xl sm:text-3xl font-black text-amber-300">${arrestRate}%</p>
            <p class="text-[11px] text-amber-100 font-semibold">Clearance Rate</p>
          </div>
        </div>
      </div>

      <div class="glass-card p-4 border-l-4 border-l-rose-500">
        <h4 class="font-bold text-rose-700 mb-2.5 text-sm flex items-center gap-1.5">
          <span>🚨</span> <span>พื้นที่เกิดเหตุสูงสุด 3 อันดับแรกในเดือนนี้</span>
        </h4>
        <div class="space-y-2">
          ${topAreas.length ? topAreas.map(([area, count], i) => `
            <div class="flex items-center justify-between text-xs p-2.5 bg-rose-50 rounded-xl border border-rose-100">
              <span class="font-bold text-slate-800">${i + 1}. ${area}</span>
              <span class="font-black text-rose-700">${count} คดี</span>
            </div>
          `).join('') : '<p class="text-xs text-slate-400">ยังไม่มีรายงานในเดือนนี้</p>'}
        </div>
      </div>

      <div class="glass-card p-4 border-l-4 border-l-emerald-600 bg-emerald-50/50">
        <h4 class="font-bold text-emerald-800 mb-2 text-sm">🛡️ ข้อเสนอแนะเชิงยุทธวิธีฝ่ายป้องกันและสืบสวน</h4>
        <ul class="text-xs space-y-1.5 text-slate-700">
          <li>• <strong>ปรับแผนสายตรวจ:</strong> เน้นการตั้งจุดตรวจเคลื่อนที่เร็วในพื้นที่เสี่ยงสูงสุดช่วงหัวค่ำถึงดึก</li>
          <li>• <strong>มาตรการเชิงรุก:</strong> ประชาสัมพันธ์ร้านค้า/หอพักให้ผู้ขับขี่ล็อคดิสเบรกและไม่เสียบกุญแจคา</li>
          <li>• <strong>สายสืบและกล้องวงจรปิด:</strong> ตรวจสอบเส้นทางหลักที่คนร้ายมักใช้หลบหนีเพื่อสกัดจับทันควัน</li>
        </ul>
      </div>
    </div>
  `;
}

function copyMonthlyReport() {
  const contentEl = document.getElementById('monthly-report-content');
  if (!contentEl) return;
  navigator.clipboard.writeText(contentEl.innerText).then(() => {
    showToast('คัดลอกรายงานสรุปประจำเดือนแล้ว', 'success');
  });
}

// ==================== Export & Print Functions ====================

// 1. ส่งออกไฟล์ Excel (.xlsx)
function exportExcel() {
  const dataToExport = filteredReports.length > 0 ? filteredReports : reports;
  if (!dataToExport || dataToExport.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับส่งออก Excel', 'warning');
    return;
  }

  if (typeof XLSX === 'undefined') {
    showToast('ไม่พบไลบรารี XLSX กรุณารีเฟรชหน้าจอ', 'error');
    return;
  }

  try {
    const formattedData = dataToExport.map((r, index) => ({
      'ลำดับ': index + 1,
      'รหัสรายงาน': r.id || '',
      'ประเภทรถ': r.vehicleType || '',
      'ยี่ห้อ': r.brand || '',
      'รุ่น': r.model || '',
      'สี': r.color || '',
      'ทะเบียนรถ': r.licensePlate || '',
      'สถานที่เกิดเหตุ': r.location || '',
      'พื้นที่': r.area || '',
      'วันที่เกิดเหตุ': r.incidentDate || '',
      'เวลาเกิดเหตุ': r.incidentTime || '',
      'ช่วงเวลา': r.timePeriod || '',
      'ผลัดเวร': r.shift || '',
      'ผู้รายงาน': r.reporter || '',
      'สถานะคดี': getStatusText(r.status),
      'รายละเอียด': r.details || '',
      'ละติจูด': r.latitude || '',
      'ลองจิจูด': r.longitude || '',
      'วันที่บันทึก': r.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายการรถหาย');

    const fileName = `รายงานคดีรถหาย_สภ_นิคมพัฒนา_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showToast('ส่งออก Excel เรียบร้อยแล้ว', 'success');
  } catch (error) {
    console.error('Export Excel error:', error);
    showToast('เกิดข้อผิดพลาดในการส่งออก Excel', 'error');
  }
}

// 2. พิมพ์ประกาศสืบสวนติดตามรถหาย (Wanted Poster / Notice)
function printLostCarReport(id) {
  const report = reports.find(r => r.id === id);
  if (!report) {
    showToast('ไม่พบข้อมูลรถหายรายการนี้', 'error');
    return;
  }

  const printModalId = 'lostcar-print-modal';
  let modal = document.getElementById(printModalId);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = printModalId;
    modal.className = 'fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
    document.body.appendChild(modal);
  }

  const mapLink = report.latitude && report.longitude ? `https://maps.google.com/?q=${report.latitude},${report.longitude}` : '';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] overflow-y-auto">
      
      <!-- Action Bar (ไม่แสดงตอนพิมพ์) -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div class="flex items-center gap-2">
          <span class="text-xl">📄</span>
          <span class="font-extrabold text-police-blue text-sm sm:text-base">พิมพ์ประกาศสืบสวนรถหาย</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95">
            🖨️ สั่งพิมพ์ / บันทึก PDF
          </button>
          <button onclick="document.getElementById('${printModalId}').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition">
            ✕
          </button>
        </div>
      </div>

      <!-- Printable Area -->
      <div class="printable-poster text-slate-800 space-y-4">
        
        <!-- Header Banner -->
        <div class="text-center pb-3 border-b-2 border-rose-600">
          <div class="inline-block px-4 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase mb-1.5 shadow-sm">
            🚨 ประกาศสืบสวนติดตามรถหาย (WANTED VEHICLE)
          </div>
          <h2 class="text-xl sm:text-2xl font-black text-police-blue">สถานีตำรวจภูธรนิคมพัฒนา ภ.จว.ระยอง</h2>
          <p class="text-xs text-slate-500 font-medium">รหัสบันทึกข้อมูล: <span class="font-mono font-bold text-slate-800">${report.id}</span> | วันที่ออกประกาศ: ${new Date().toLocaleDateString('th-TH')}</p>
        </div>

        <!-- Main Vehicle Target Display -->
        <div class="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 sm:p-5 text-center shadow-inner">
          <div class="text-xs font-bold text-rose-700 uppercase tracking-widest mb-1">หมายเลขทะเบียนรถเป้าหมาย</div>
          <div class="text-3xl sm:text-4xl font-black text-rose-900 tracking-wider font-mono">${report.licensePlate}</div>
          <div class="text-base sm:text-lg font-extrabold text-slate-800 mt-1">
            ${getVehicleIcon(report.vehicleType)} ${report.vehicleType} ${report.brand} ${report.model || ''}
          </div>
          <div class="inline-block mt-2 px-3 py-0.5 rounded-full bg-white border border-rose-300 text-xs font-bold text-rose-800">
            🎨 สีรถ: ${report.color}
          </div>
        </div>

        <!-- Incident Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-bold block mb-1">📍 สถานที่เกิดเหตุ:</span>
            <span class="font-extrabold text-slate-900">${report.location || '-'}</span>
            <span class="text-slate-600 block">พื้นที่: ${report.area || '-'}</span>
          </div>

          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-bold block mb-1">⏰ วันและเวลาเกิดเหตุ:</span>
            <span class="font-extrabold text-slate-900">${formatThaiDate(report.incidentDate)} เวลา ${formatTime(report.incidentTime)} น.</span>
            <span class="text-amber-700 font-semibold block">${report.timePeriod || '-'}</span>
          </div>

          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-bold block mb-1">👮 เจ้าหน้าที่รับแจ้ง:</span>
            <span class="font-extrabold text-slate-900">${report.reporter || '-'}</span>
            <span class="text-slate-600 block">ผลัดเวร: ${report.shift || '-'}</span>
          </div>

          <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span class="text-slate-500 font-bold block mb-1">📊 สถานะคดี:</span>
            <span class="status-badge status-${report.status}">${getStatusText(report.status)}</span>
            ${mapLink ? `<a href="${mapLink}" target="_blank" class="text-blue-600 font-bold block mt-1 underline">🗺️ ดูพิกัดแผนที่เกิดเหตุ</a>` : ''}
          </div>
        </div>

        <!-- Details / Circumstances -->
        ${report.details ? `
          <div class="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 text-xs sm:text-sm">
            <span class="text-blue-900 font-bold block mb-1">📝 พฤติการณ์และลักษณะพิเศษ:</span>
            <p class="text-slate-700 leading-relaxed">${report.details}</p>
          </div>
        ` : ''}

        <!-- Hotlines & Contact Footer -->
        <div class="bg-slate-900 text-white rounded-2xl p-4 text-center">
          <div class="text-xs font-bold text-amber-400 mb-1">📞 พบเห็นหรือมีเบาะแส กรุณาแจ้งทันที</div>
          <div class="text-sm sm:text-base font-black">งานสืบสวน สภ.นิคมพัฒนา หรือ โทร. 191 ตลอด 24 ชั่วโมง</div>
        </div>

      </div>
    </div>
  `;
}

// 3. พิมพ์รายงานสรุปข้อมูลคดีรถหาย PDF (Executive Summary Report)
function exportPDF() {
  const dataToPrint = filteredReports.length > 0 ? filteredReports : reports;
  if (!dataToPrint || dataToPrint.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับพิมพ์สรุป PDF', 'warning');
    return;
  }

  const printSummaryId = 'lostcar-summary-modal';
  let modal = document.getElementById(printSummaryId);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = printSummaryId;
    modal.className = 'fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto';
    document.body.appendChild(modal);
  }

  const total = dataToPrint.length;
  const pending = dataToPrint.filter(r => r.status === 'pending').length;
  const investigating = dataToPrint.filter(r => r.status === 'investigating').length;
  const arrested = dataToPrint.filter(r => r.status === 'arrested').length;
  const clearanceRate = total > 0 ? Math.round((arrested / total) * 100) : 0;

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-auto max-h-[92vh] overflow-y-auto">
      
      <!-- Action Bar (ไม่แสดงตอนพิมพ์) -->
      <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
        <div class="flex items-center gap-2">
          <span class="text-xl">📊</span>
          <span class="font-extrabold text-police-blue text-sm sm:text-base">รายงานสรุปข้อมูลคดีรถหาย (PDF Report)</span>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.print()" class="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-1.5 active:scale-95">
            🖨️ สั่งพิมพ์ / บันทึก PDF
          </button>
          <button onclick="document.getElementById('${printSummaryId}').remove()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition">
            ✕
          </button>
        </div>
      </div>

      <!-- Printable Report Document -->
      <div class="printable-summary text-slate-800 space-y-4">
        
        <!-- Header -->
        <div class="text-center pb-3 border-b-2 border-police-blue">
          <h2 class="text-lg sm:text-xl font-black text-police-blue">รายงานสรุปข้อมูลการรับแจ้งและสืบสวนคดีรถหาย</h2>
          <p class="text-xs sm:text-sm font-bold text-slate-700">สถานีตำรวจภูธรนิคมพัฒนา กองบังคับการตำรวจภูธรจังหวัดระยอง</p>
          <p class="text-xs text-slate-500 mt-0.5">ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} (รวม ${total} คดี)</p>
        </div>

        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-4 gap-2 text-center text-xs">
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div class="text-slate-500 font-bold">คดีทั้งหมด</div>
            <div class="text-lg font-black text-police-blue">${total}</div>
          </div>
          <div class="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <div class="text-amber-800 font-bold">รอดำเนินการ</div>
            <div class="text-lg font-black text-amber-700">${pending}</div>
          </div>
          <div class="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
            <div class="text-blue-800 font-bold">กำลังสืบสวน</div>
            <div class="text-lg font-black text-blue-700">${investigating}</div>
          </div>
          <div class="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <div class="text-emerald-800 font-bold">จับกุมได้ (${clearanceRate}%)</div>
            <div class="text-lg font-black text-emerald-700">${arrested}</div>
          </div>
        </div>

        <!-- Table of Cases -->
        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                <th class="p-2 text-center">ลำดับ</th>
                <th class="p-2">ทะเบียนรถ</th>
                <th class="p-2">ประเภท / ยี่ห้อ / สี</th>
                <th class="p-2">วันเวลาเกิดเหตุ</th>
                <th class="p-2">สถานที่ / พื้นที่</th>
                <th class="p-2">ผลัดเวร / ผู้รับแจ้ง</th>
                <th class="p-2 text-center">สถานะคดี</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              ${dataToPrint.map((r, i) => `
                <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}">
                  <td class="p-2 text-center font-bold">${i + 1}</td>
                  <td class="p-2 font-mono font-black text-police-blue">${r.licensePlate}</td>
                  <td class="p-2 font-medium">${r.vehicleType} ${r.brand} (${r.color})</td>
                  <td class="p-2">${formatThaiDate(r.incidentDate)} ${formatTime(r.incidentTime)}</td>
                  <td class="p-2">${r.location || '-'} <span class="text-slate-400">(${r.area || '-'})</span></td>
                  <td class="p-2">${r.shift || '-'} / ${r.reporter || '-'}</td>
                  <td class="p-2 text-center">
                    <span class="status-badge status-${r.status}">${getStatusText(r.status)}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Signatures Section -->
        <div class="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-700">
          <div>
            <p>ลงชื่อ ...........................................................</p>
            <p class="mt-1 font-bold">( ........................................................... )</p>
            <p class="text-slate-500">เจ้าหน้าที่ผู้รวบรวมรายงาน</p>
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

// ==================== Toast Notifications ====================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-blue-600',
    warning: 'bg-amber-600'
  };

  toast.className = `toast ${colors[type] || 'bg-blue-600'} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 min-w-64 font-bold text-xs transform transition-all`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️')}</span> <span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ==================== Initialize ====================
async function init() {
  await initElementSdk();
  await loadSettings();

  const incDateEl = document.getElementById('incident-date');
  if (incDateEl) incDateEl.value = new Date().toISOString().split('T')[0];

  if (config.liff_id) {
    await initLiff();
  }

  await loadReports();
}

init();