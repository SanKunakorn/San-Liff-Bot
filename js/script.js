
// Reference Central CONFIG with fallback
var LIFF_ID = (typeof CONFIG !== 'undefined' && CONFIG.LIFF_ID) ? CONFIG.LIFF_ID : "2004593216-XbA9wj26";
var GAS_URL = (typeof CONFIG !== 'undefined' && CONFIG.GAS_URL) ? CONFIG.GAS_URL : "https://script.google.com/macros/s/AKfycbzHh2whTRjedoCy-5NPwL1gvuCqSDLASRIFdjurzTQOBJux4bI7rTj8wUh5dWWn6xJi-Q/exec";

let mapId = '';
let mapUrl = ''; // ✅ แก้ไข: ประกาศตัวแปร mapUrl ในระดับ Global ป้องกัน ReferenceError
let phonenetwork = '';
let selectedImageUrl = "";
let _isSending = false; // ✅ debounce flag ป้องกัน double submit

async function loadMap(lat, lon) {
  // ✅ ถ้ามีข้อมูล map อยู่แล้ว ให้ return เลย
  if (mapUrl && mapId) {
    return { mapId, mapUrl };
  }
  else {
    try {
      const response = await fetch(`${GAS_URL}?getMap=true&latitude=${lat}&longitude=${lon}`);
      const data = await response.json();
      if (data && data.fileUrl) {
        mapId = data.fileId || '';
        mapUrl = data.fileUrl || '';
      }
      return { mapId, mapUrl };
    } catch (err) {
      console.warn("Failed to load map from GAS:", err);
      return { mapId: '', mapUrl: '' };
    }
  }
}

let currentActiveTemplateKey = '';

async function settext() {
  let user = document.getElementById("user").value.trim();
  let datetimeInput = document.getElementById("datetime");
  let datetime = datetimeInput.value ? new Date(datetimeInput.value) : new Date();
  let detail = document.getElementById("detail").value.trim();
  let latlong = document.getElementById("latlong").value.trim();
  let options = { year: 'numeric', month: 'short', day: 'numeric' };
  let thaiDate = datetime.toLocaleDateString('th-TH', options);
  let mapLink = "https://maps.google.com?q=" + latlong;
  let qrurl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(mapLink);

  // ตรวจจับชื่อหมวดหมู่จาก Template ที่เลือก
  let categoryName = '';
  if (currentActiveTemplateKey && DETAIL_TEMPLATES[currentActiveTemplateKey]) {
    categoryName = DETAIL_TEMPLATES[currentActiveTemplateKey].name;
  }

  // จัดโครงสร้างข้อความรายงานอย่างเป็นระเบียบ (รองรับทั้ง Template และรายงานทั่วไป)
  const isMultiline = detail.includes('\n');
  let message = '';

  if (categoryName || isMultiline) {
    message = [
      'เรียน ผู้บังคับบัญชา',
      '-------------------------',
      `     วันนี้ ( ${thaiDate} )`,
      `👮 ${user || 'เจ้าหน้าที่สายตรวจ'}`,
      categoryName ? `📋 ว.4 ${categoryName}` : '',
      '📝 รายละเอียดการปฏิบัติ:',
      detail,
      '',
      `📍 แผนที่: ${mapLink}`,
      '-------------------------',
      '     จึงเรียนมาเพื่อโปรดทราบ'
    ].filter(line => line !== '').join('\n');
  } else {
    message = 'เรียน ผู้บังคับบัญชา\n-------------------------\n     วันนี้( ' + thaiDate + ' )\n' + (user ? user + ' ' : '') + detail + '\nแผนที่: ' + mapLink + '\n     จึงเรียนมาเพื่อโปรดทราบ';
  }


  // 👇 รอให้โหลดภาพแผนที่เสร็จ
  var latitude = parseFloat(latlong.split(',')[0]);
  var longitude = parseFloat(latlong.split(',')[1]);

  const { mapId, mapUrl } = await loadMap(latitude, longitude);

  return { message, mapLink, qrurl, mapId, mapUrl, categoryName };
}



async function showResult() {
  Swal.fire({
    title: 'กรุณารอสักครู่...',
    text: 'กำลังสร้างแผนที่และส่งข้อมูล',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const { message, mapLink, qrurl, mapId, mapUrl } = await settext();
    // แสดงข้อมูลในหน้าเว็บ
    document.getElementById("showResultmap").style.display = "block";
    document.getElementById("resultMessage").textContent = message;
    document.getElementById("mapLink").href = mapLink;
    document.getElementById("mapLink").textContent = mapLink;
    document.getElementById("qrImage").src = qrurl;
    document.getElementById("map-img").src = 'https://lh3.googleusercontent.com/d/' + mapId;
    Swal.close(); // ปิดแจ้งเตือนเมื่อเสร็จ
    Swal.fire({
      icon: 'success',
      title: 'ส่งข้อมูลสำเร็จ!',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.close(); // ปิด loading
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถส่งข้อมูลได้'
    });
  }
}


// ✅ ฟังก์ชัน validation ตรวจสอบฟอร์มก่อนส่งรายงาน
function validateReportForm() {
  const datetime = document.getElementById("datetime").value;
  const user = document.getElementById("user").value.trim();
  const detail = document.getElementById("detail").value.trim();
  const latlong = document.getElementById("latlong").value.trim();

  if (!datetime) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเลือกวันที่', confirmButtonColor: '#1e3a8a' });
    return false;
  }
  if (!user) {
    Swal.fire({ icon: 'warning', title: 'กรุณาระบุผู้ปฏิบัติงาน', confirmButtonColor: '#1e3a8a' });
    return false;
  }
  if (!detail) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกรายละเอียด', confirmButtonColor: '#1e3a8a' });
    return false;
  }
  if (!latlong) {
    Swal.fire({ icon: 'warning', title: 'กรุณาระบุพิกัด', text: 'กดปุ่ม "ตำแหน่งปัจจุบัน" หรือกรอกพิกัดด้วยตนเอง', confirmButtonColor: '#1e3a8a' });
    return false;
  }
  return true;
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("btnsettext").addEventListener("click", function () {
    if (!validateReportForm()) return; // ✅ validate ก่อน
    showResult();
  });

  document.getElementById("btnsendrp").addEventListener("click", function () {
    if (!validateReportForm()) return; // ✅ validate ก่อน
    if (_isSending) return; // ✅ debounce ป้องกัน double submit
    _isSending = true;
    handleSend().finally(() => { _isSending = false; });
  });

  document.getElementById("btnShare").addEventListener("click", async function () {
    if (!validateReportForm()) return; // ✅ validate ก่อน
    if (_isSending) return; // ✅ debounce
    _isSending = true;
    Swal.fire({
      title: 'กรุณารอสักครู่...',
      text: 'กำลังสร้างแผนที่และส่งข้อมูล',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      const content = await settext();      // โหลดข้อมูล
      await shareMessage(content.message, content.mapLink, content.qrurl, content.mapUrl);
      Swal.close();// ปิดแจ้งเตือนเมื่อเสร็จ
      Swal.fire({
        icon: 'success',
        title: 'ส่งข้อมูลสำเร็จ!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.close(); // ปิด loading
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถส่งข้อมูลได้'
      });
    } finally {
      _isSending = false;
    }
  });


  const btnCheckIp = document.getElementById("btncheckip");
  if (btnCheckIp) btnCheckIp.addEventListener("click", checkIP);

  const btnIdCheck = document.getElementById("btnidcheck");
  if (btnIdCheck) btnIdCheck.addEventListener("click", checkIDCard);

  const txtId = document.getElementById("txtid");
  if (txtId) txtId.addEventListener("input", validateIDCard);

  const btnCheckPhone = document.getElementById("btncheckphone");
  if (btnCheckPhone) btnCheckPhone.addEventListener("click", checkPhone);

  const btnCheckVehicle = document.getElementById("btncheckvehicle");
  if (btnCheckVehicle) btnCheckVehicle.addEventListener("click", checkVehicle);

  renderRecentSearches();
  loadReportTemplatesFromGas();
});

// ========================================
// UTILITIES
// ========================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 0. Tab Switching
function switchSearchTab(tab) {
  document.querySelectorAll('.search-tab-pill').forEach(t => {
    t.classList.remove('active', 'active-phone', 'active-ip', 'active-idcard', 'active-vehicle');
  });
  document.querySelectorAll('.search-content').forEach(c => c.classList.add('hidden'));

  const tabBtn = document.getElementById(`tab-${tab}`);
  const tabContent = document.getElementById(`search-${tab}`);

  if (tabBtn) {
    tabBtn.classList.add('active', `active-${tab}`);
  }

  if (tabContent) {
    tabContent.classList.remove('hidden');
  }
}

// 0.1 Recent Searches Manager (LocalStorage)
const RECENT_SEARCHES_KEY = 'san_police_recent_searches';

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addRecentSearch(type, query) {
  if (!query) return;
  try {
    let list = getRecentSearches().filter(item => !(item.type === type && item.query === query));
    list.unshift({ type, query, timestamp: Date.now() });
    if (list.length > 8) list = list.slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    renderRecentSearches();
  } catch (e) { }
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
  renderRecentSearches();
}

function renderRecentSearches() {
  const container = document.getElementById('recent-search-chips');
  if (!container) return;
  const list = getRecentSearches();

  if (list.length === 0) {
    container.innerHTML = '<span class="text-xs text-slate-400 italic py-1">ยังไม่มีประวัติการค้นหาล่าสุด</span>';
    return;
  }

  const badgeColors = {
    phone: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    ip: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100',
    idcard: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
    vehicle: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
  };

  const icons = {
    phone: '📱',
    ip: '🌐',
    idcard: '🆔',
    vehicle: '🚗'
  };

  container.innerHTML = list.map(item => `
    <button onclick="clickRecentSearch('${item.type}', '${encodeURIComponent(item.query)}')" 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm ${badgeColors[item.type] || 'bg-slate-50 text-slate-700 border-slate-200'}">
      <span>${icons[item.type] || '🔍'}</span>
      <span class="font-mono">${escapeHtml(item.query)}</span>
    </button>
  `).join('');
}

function clickRecentSearch(type, encodedQuery) {
  const query = decodeURIComponent(encodedQuery);
  fillAndSearch(type, query);
}

function fillAndSearch(tab, value) {
  switchSearchTab(tab);
  if (tab === 'phone') {
    const el = document.getElementById('txtphone');
    if (el) el.value = value;
    checkPhone();
  } else if (tab === 'ip') {
    const el = document.getElementById('txtip');
    if (el) el.value = value;
    checkIP();
  } else if (tab === 'idcard') {
    const el = document.getElementById('txtid');
    if (el) el.value = value;
    validateIDCard();
    checkIDCard();
  } else if (tab === 'vehicle') {
    const el = document.getElementById('txtvehicle');
    if (el) el.value = value;
    checkVehicle();
  }
}

// 0.2 Quick Universal Search & Detect
function quickDetectAndSearch() {
  const input = document.getElementById('universal-search-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) {
    Swal.fire({ icon: 'info', title: 'กรุณากรอกข้อมูลที่ต้องการค้นหา', text: 'เบอร์โทร, IP, เลขบัตร หรือทะเบียนรถ', confirmButtonColor: '#1e3a8a' });
    return;
  }

  const cleanDigits = raw.replace(/[- ]/g, '');
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;

  // Check IP
  if (ipRegex.test(raw)) {
    fillAndSearch('ip', raw);
    return;
  }

  // Check 13 digits ID Card
  if (/^\d{13}$/.test(cleanDigits)) {
    fillAndSearch('idcard', cleanDigits);
    return;
  }

  // Check Phone number (9-10 digits starting with 0)
  if (/^0\d{8,9}$/.test(cleanDigits)) {
    fillAndSearch('phone', cleanDigits);
    return;
  }

  // Otherwise assume Vehicle / License Plate or general keyword
  fillAndSearch('vehicle', raw);
}

async function pasteUniversalSearch() {
  try {
    const text = await navigator.clipboard.readText();
    const input = document.getElementById('universal-search-input');
    if (input && text) {
      input.value = text.trim();
      quickDetectAndSearch();
    }
  } catch (e) {
    Swal.fire({ icon: 'info', title: 'ไม่สามารถอ่านจากคลิปบอร์ดได้', text: 'กรุณาวางข้อมูลในช่องค้นหาโดยตรง', confirmButtonColor: '#1e3a8a' });
  }
}

function clearUniversalSearch() {
  const input = document.getElementById('universal-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
}

async function pasteToInput(inputId) {
  try {
    const text = await navigator.clipboard.readText();
    const input = document.getElementById(inputId);
    if (input && text) {
      input.value = text.trim();
      if (inputId === 'txtid') validateIDCard();
    }
  } catch (e) {
    Swal.fire({ icon: 'info', title: 'ไม่สามารถอ่านคลิปบอร์ด', text: 'กรุณาวางด้วยการกด Ctrl+V หรือแตะค้างวาง' });
  }
}

async function fetchMyCurrentIP() {
  const input = document.getElementById('txtip');
  try {
    Swal.fire({ title: 'กำลังดึง IP เครื่อง...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    Swal.close();
    if (data && data.ip) {
      if (input) input.value = data.ip;
      checkIP();
    }
  } catch (e) {
    Swal.close();
    Swal.fire({ icon: 'error', title: 'ไม่สามารถดึง IP ได้', text: e.message });
  }
}

// 0.3 In-Page Result Dashboard Console
let currentSearchSummaryForCopy = '';
let currentSearchResultData = null;

function renderSearchResultPanel(config) {
  const panel = document.getElementById('search-results-panel');
  const badgeEl = document.getElementById('result-type-badge');
  const timeEl = document.getElementById('result-timestamp');
  const bodyEl = document.getElementById('result-card-body');
  if (!panel || !bodyEl) return;

  currentSearchSummaryForCopy = config.rawSummary || '';
  currentSearchResultData = config;

  if (badgeEl) {
    badgeEl.textContent = config.badgeText || 'ผลการสืบค้น';
    badgeEl.className = `px-2.5 py-1 text-xs font-bold rounded-lg ${config.badgeClass || 'bg-slate-100 text-slate-700'}`;
  }

  if (timeEl) {
    const now = new Date();
    timeEl.textContent = `ค้นหาเมื่อ: ${now.toLocaleTimeString('th-TH')}`;
  }

  bodyEl.innerHTML = config.htmlContent || '';
  panel.classList.remove('hidden');
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeSearchResultPanel() {
  const panel = document.getElementById('search-results-panel');
  if (panel) panel.classList.add('hidden');
}

function copySearchResultText() {
  if (!currentSearchSummaryForCopy) {
    Swal.fire({ icon: 'info', title: 'ไม่มีข้อความที่จะคัดลอก' });
    return;
  }
  navigator.clipboard.writeText(currentSearchSummaryForCopy).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'คัดลอกผลการสืบค้นเรียบร้อยแล้ว',
      timer: 1500,
      showConfirmButton: false
    });
  }).catch(() => {
    Swal.fire({ icon: 'error', title: 'คัดลอกไม่สำเร็จ' });
  });
}

function saveSearchToInvestigationTimeline() {
  if (!currentSearchResultData) return;
  const summary = currentSearchSummaryForCopy;

  try {
    let invTimeline = [];
    const storedInv = localStorage.getItem('inv_timeline');
    if (storedInv) {
      try { invTimeline = JSON.parse(storedInv); } catch (e) { invTimeline = []; }
    }

    let officerName = 'เจ้าหน้าที่สืบสวน';
    try {
      const storedName = localStorage.getItem('sanbot_displayName');
      if (storedName) officerName = storedName;
    } catch (e) { }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);

    const invItem = {
      id: 'TL-SRCH-' + Date.now(),
      date: dateStr,
      time: timeStr,
      event: `[สืบค้น ${currentSearchResultData.badgeText || 'ข้อมูล'}]\n${summary}`,
      location: 'ศูนย์สืบค้น SanBot Intelligence Hub',
      officer: officerName,
      type: 'Intelligence'
    };

    invTimeline.push(invItem);
    localStorage.setItem('inv_timeline', JSON.stringify(invTimeline));

    // ซิงค์กับ GAS ถ้ามี
    if (typeof callGasApi === 'function') {
      callGasApi('createTimeline', invItem, 'POST').catch(err => console.warn('GAS timeline sync:', err));
    }

    // แจ้งเตือน iframe investigation ถ้าเปิดอยู่
    const invFrame = document.getElementById('investigation-frame');
    if (invFrame && invFrame.contentWindow) {
      try {
        invFrame.contentWindow.postMessage({ action: 'reloadTimeline', item: invItem }, '*');
      } catch (e) { }
    }

    // สลับไปยังหน้าสืบสวน
    if (typeof showPage === 'function') {
      showPage('investigation');
    }

    Swal.fire({
      icon: 'success',
      title: 'บันทึกลง Timeline สืบสวนแล้ว',
      text: 'ข้อมูลการสืบค้นถูกบันทึกลงในระบบไทม์ไลน์คดีเรียบร้อยแล้ว',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (err) {
    console.error('Error saving to investigation timeline:', err);
    copySearchResultText();
  }
}

// 1. ตรวจสอบหมายเลขโทรศัพท์และค้นหาประวัติ
async function checkPhone() {
  const phoneInput = document.getElementById("txtphone");
  const phone = phoneInput ? phoneInput.value.trim().replace(/[- ]/g, '') : '';

  if (!phone || phone.length < 9) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง', confirmButtonColor: '#1e3a8a' });
    return;
  }

  addRecentSearch('phone', phone);

  Swal.fire({
    title: 'กำลังตรวจสอบเบอร์โทร...',
    text: `ตรวจสอบ: ${phone}`,
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    // ระบุเครือข่ายตามคำนำหน้า (Prefix analysis)
    let network = 'ไม่ทราบเครือข่าย';
    let carrierColor = 'text-slate-700';
    let carrierBg = 'bg-slate-100';
    const p3 = phone.substring(0, 3);
    const p2 = phone.substring(0, 2);

    if (['081', '082', '087', '092', '093', '097', '098', '061', '062', '065'].includes(p3)) {
      network = 'AIS (Advanced Info Service)';
      carrierColor = 'text-emerald-700';
      carrierBg = 'bg-emerald-50 border-emerald-200';
    } else if (['080', '083', '084', '089', '090', '091', '094', '095', '096', '063', '064'].includes(p3)) {
      network = 'TrueMove H / Dtac';
      carrierColor = 'text-rose-700';
      carrierBg = 'bg-rose-50 border-rose-200';
    } else if (['086', '088', '066'].includes(p3)) {
      network = 'True / Dtac / AIS (เบอร์จัดสรรร่วม)';
      carrierColor = 'text-blue-700';
      carrierBg = 'bg-blue-50 border-blue-200';
    } else if (p2 === '02') {
      network = 'เบอร์โทรศัพท์บ้าน กทม. และปริมณฑล (NT / True)';
      carrierColor = 'text-amber-700';
      carrierBg = 'bg-amber-50 border-amber-200';
    } else if (['03', '04', '05', '07'].includes(p2)) {
      network = 'เบอร์โทรศัพท์บ้านภูมิภาค (NT)';
      carrierColor = 'text-purple-700';
      carrierBg = 'bg-purple-50 border-purple-200';
    }

    // ตรวจสอบประวัติคดีที่เกี่ยวข้องจาก Sheets
    let matchCases = [];
    try {
      if (typeof callGasApi === 'function') {
        const reportsRes = await callGasApi('getReports');
        if (reportsRes && reportsRes.data) {
          matchCases = reportsRes.data.filter(r =>
            (r.details && r.details.includes(phone)) ||
            (r.reporter && r.reporter.includes(phone)) ||
            (r.phone && r.phone.includes(phone))
          );
        }
      }
    } catch (e) { }

    Swal.close();

    const formattedPhone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    const rawSummary = `[สืบค้นเบอร์โทร]\nหมายเลข: ${formattedPhone}\nเครือข่าย: ${network}\nผลเทียบฐานข้อมูลคดี: พบ ${matchCases.length} รายการ`;

    const matchCasesHtml = matchCases.length > 0 ? `
      <div class="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2">
        <div class="flex items-center gap-2 text-xs font-bold text-red-800">
          <span>🚨</span>
          <span>พบประวัติเบอร์นี้เกี่ยวข้องกับคดีในระบบ (${matchCases.length} คดี):</span>
        </div>
        <div class="space-y-1.5 text-xs text-red-700">
          ${matchCases.map(c => `
            <div class="p-2 bg-white/80 rounded-lg border border-red-100 flex items-center justify-between">
              <div>
                <span class="font-bold">คดี #${c.id || '-'}:</span> ${escapeHtml(c.brand || '')} ${escapeHtml(c.model || '')} (${escapeHtml(c.status || 'รอตรวจสอบ')})
              </div>
              <span class="text-[10px] text-slate-500">${c.date || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
        <span>✅</span>
        <span>ไม่พบประวัติเบอร์นี้ในระบบคดีตรวจที่เกิดเหตุหรือแจ้งรถหาย</span>
      </div>
    `;

    renderSearchResultPanel({
      badgeText: '📱 เบอร์โทรศัพท์',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      rawSummary: rawSummary,
      htmlContent: `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span class="text-xs text-slate-400 font-semibold block">หมายเลขโทรศัพท์</span>
              <span class="text-xl font-mono font-black text-slate-800 tracking-wider">${formattedPhone}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg border text-xs font-bold ${carrierBg} ${carrierColor}">
              🏢 ${network}
            </div>
          </div>

          ${matchCasesHtml}

          <div class="grid grid-cols-2 gap-2 text-xs pt-1">
            <a href="tel:${phone}" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all">
              <span>📞</span> โทรออก
            </a>
            <button onclick="navigator.clipboard.writeText('${formattedPhone}'); Swal.fire({icon:'success', title:'คัดลอกเบอร์แล้ว', timer:1000, showConfirmButton:false});" class="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all">
              <span>📋</span> คัดลอกเบอร์
            </button>
          </div>
        </div>
      `
    });

  } catch (err) {
    Swal.close();
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message || 'ไม่สามารถตรวจสอบได้' });
  }
}

// 2. ตรวจสอบ IP Address
async function checkIP() {
  const ipInput = document.getElementById("txtip");
  const ip = ipInput ? ipInput.value.trim() : '';

  if (!ip) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอก IP Address', confirmButtonColor: '#1e3a8a' });
    return;
  }

  addRecentSearch('ip', ip);

  Swal.fire({
    title: 'กำลังตรวจสอบ IP Address...',
    text: `ตรวจสอบ: ${ip}`,
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    const data = await res.json();

    Swal.close();

    if (data && !data.error) {
      const rawSummary = `[สืบค้น IP Address]\nIP: ${data.ip || ip}\nISP/Org: ${data.org || data.asn || '-'}\nตำแหน่ง: ${data.city || '-'}, ${data.region || '-'}, ${data.country_name || '-'}\nพิกัด: ${data.latitude || '-'}, ${data.longitude || '-'}`;

      renderSearchResultPanel({
        badgeText: '🌐 IP Address',
        badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200',
        rawSummary: rawSummary,
        htmlContent: `
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span class="text-xs text-slate-400 font-semibold block">IP Address ที่ตรวจสอบ</span>
                <span class="text-xl font-mono font-black text-sky-700 tracking-wider">${data.ip || ip}</span>
              </div>
              <div class="px-3 py-1.5 rounded-lg border bg-sky-50 border-sky-200 text-sky-800 text-xs font-bold">
                🏢 ${data.org || data.asn || 'ไม่ระบุผู้ให้บริการ'}
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span class="text-slate-400 font-semibold block">📍 ตำแหน่งและภูมิภาค</span>
                <p class="font-bold text-slate-800 text-sm">${data.city || '-'}, ${data.region || '-'}</p>
                <p class="text-slate-600">ประเทศ: <span class="font-bold">${data.country_name || '-'} (${data.country_code || '-'})</span></p>
                <p class="text-slate-500">รหัสไปรษณีย์: ${data.postal || '-'}</p>
              </div>

              <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                <span class="text-slate-400 font-semibold block">📡 ข้อมูลโครงข่าย (Network)</span>
                <p class="text-slate-700">ASN: <span class="font-mono font-bold">${data.asn || '-'}</span></p>
                <p class="text-slate-700">โซนเวลา: <span class="font-bold">${data.timezone || '-'}</span></p>
                <p class="text-slate-700">พิกัด: <span class="font-mono font-bold text-blue-600">${data.latitude || '-'}, ${data.longitude || '-'}</span></p>
              </div>
            </div>

            ${data.latitude && data.longitude ? `
              <div class="pt-1">
                <a href="https://maps.google.com/?q=${data.latitude},${data.longitude}" target="_blank" class="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all">
                  <span>🗺️</span> เปิดดูพิกัดโดยประมาณบน Google Maps
                </a>
              </div>
            ` : ''}
          </div>
        `
      });

    } else {
      Swal.fire({ icon: 'info', title: 'ไม่พบข้อมูล IP', text: data.reason || 'กรุณาตรวจสอบความถูกต้องของ IP' });
    }
  } catch (err) {
    Swal.close();
    Swal.fire({ icon: 'error', title: 'ตรวจสอบ IP ล้มเหลว', text: err.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูล IP ได้' });
  }
}

// 3. ตรวจสอบความถูกต้องของเลขบัตรประชาชน (Modulo 11 Checksum)
function validateIDCard() {
  const input = document.getElementById("txtid");
  const checkEl = document.getElementById("idcheck");
  if (!input) return;

  const id = input.value.trim().replace(/[- ]/g, '');
  if (!checkEl) return;

  if (id.length < 13) {
    checkEl.innerHTML = '';
    return;
  }

  if (id.length === 13) {
    if (isValidThaiNationalID(id)) {
      checkEl.innerHTML = '<span class="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✅ ถูกต้อง</span>';
    } else {
      checkEl.innerHTML = '<span class="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">❌ ไม่ถูกต้อง</span>';
    }
  }
}

function isValidThaiNationalID(id) {
  if (!/^[0-9]{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i), 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id.charAt(12), 10);
}

function checkIDCard() {
  const input = document.getElementById("txtid");
  const id = input ? input.value.trim().replace(/[- ]/g, '') : '';

  if (!id || id.length !== 13) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกเลขบัตรประชาชน 13 หลัก', confirmButtonColor: '#1e3a8a' });
    return;
  }

  addRecentSearch('idcard', id);

  const isValid = isValidThaiNationalID(id);
  const formattedID = id.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');

  if (isValid) {
    // ถอดรหัสโครงสร้างเลข 13 หลัก
    const p1 = id.charAt(0); // ประเภทบุคคล
    let personType = 'บุคคลสัญชาติไทยทั่วไป';
    let personDesc = 'ประเภท 1 หรือ 2 ผู้มีสัญชาติไทยและแจ้งเกิดตามกำหนดเวลา';
    if (p1 === '1') {
      personType = 'สัญชาติไทย แจ้งเกิดตามกำหนด';
      personDesc = 'บุคคลสัญชาติไทย เกิดและแจ้งเกิดภายในกำหนดเวลา (15 วัน)';
    } else if (p1 === '2') {
      personType = 'สัญชาติไทย แจ้งเกิดตามกำหนด (สูติบัตรย้อนหลัง)';
      personDesc = 'บุคคลสัญชาติไทย เกิดและแจ้งเกิดตามกำหนดเวลา';
    } else if (p1 === '3') {
      personType = 'สัญชาติไทย แจ้งเกิดเกินกำหนด';
      personDesc = 'บุคคลสัญชาติไทย แต่แจ้งเกิดเกินกำหนดเวลาที่กฎหมายกำหนด';
    } else if (p1 === '4') {
      personType = 'คนไทยที่ตกหล่น แจ้งเกิดภายหลัง';
      personDesc = 'บุคคลสัญชาติไทยที่ไม่มีสูติบัตรหรือแจ้งเกิดเกินกำหนด';
    } else if (p1 === '5') {
      personType = 'บุคคลที่ได้รับการเพิ่มชื่อในทะเบียนบ้าน';
      personDesc = 'บุคคลสัญชาติไทยที่ได้รับอนุมัติให้เพิ่มชื่อในทะเบียนบ้านในกรณีตกสำรวจ';
    } else if (p1 === '6') {
      personType = 'ผู้เข้าเมืองโดยไม่ชอบด้วยกฎหมาย / ชนกลุ่มน้อย';
      personDesc = 'บุคคลที่เข้าเมืองโดยไม่ชอบด้วยกฎหมาย หรือรอการส่งกลับ';
    } else if (p1 === '7') {
      personType = 'บุตรของบุคคลประเภท 6';
      personDesc = 'บุตรของบุคคลที่เข้าเมืองโดยไม่ชอบด้วยกฎหมายที่เกิดในประเทศไทย';
    } else if (p1 === '8') {
      personType = 'คนต่างด้าวที่ได้รับสัญชาติไทย';
      personDesc = 'คนต่างด้าวที่ได้รับสัญชาติไทยถูกต้องตามกฎหมายหรือแปลงสัญชาติ';
    }

    const provinceCode = id.substring(1, 3);
    const districtCode = id.substring(3, 5);
    const checkDigit = id.charAt(12);

    const rawSummary = `[สืบค้นเลขบัตรประชาชน 13 หลัก]\nหมายเลข: ${formattedID}\nสถานะ: ถูกต้องตามหลักคำนวณ Modulo 11\nหมวดบุคคล: ${personType} (${personDesc})\nรหัสพื้นที่: จังหวัดรหัส ${provinceCode}, อำเภอ/เขต ${districtCode}\nหลักตรวจสอบ (Check Digit): ${checkDigit}`;

    renderSearchResultPanel({
      badgeText: '🆔 บัตรประจำตัวประชาชน',
      badgeClass: 'bg-purple-100 text-purple-800 border border-purple-200',
      rawSummary: rawSummary,
      htmlContent: `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span class="text-xs text-slate-400 font-semibold block">เลขประจำตัวประชาชน</span>
              <span class="text-xl font-mono font-black text-purple-900 tracking-wider">${formattedID}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
              <span>✅</span> ผ่านการตรวจสอบ Modulo 11
            </div>
          </div>

          <div class="space-y-2">
            <div class="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
              <span class="text-xs font-bold text-purple-900 block">👤 หมวดประเภทบุคคล (หลักที่ 1 = ${p1}):</span>
              <p class="text-xs font-semibold text-purple-800 mt-0.5">${personType}</p>
              <p class="text-[11px] text-purple-600 mt-0.5">${personDesc}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span class="text-slate-400 block text-[11px]">รหัสจังหวัด (หลักที่ 2-3)</span>
                <span class="font-mono font-bold text-slate-800 text-sm">รหัส ${provinceCode}</span>
              </div>
              <div class="p-2.5 bg-white border border-slate-200 rounded-xl">
                <span class="text-slate-400 block text-[11px]">รหัสอำเภอ/เขต (หลักที่ 4-5)</span>
                <span class="font-mono font-bold text-slate-800 text-sm">รหัส ${districtCode}</span>
              </div>
            </div>
          </div>

          <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
            ℹ️ <strong>หมายเหตุ:</strong> การตรวจสอบนี้เป็นการคำนวณตามสูตรคณิตศาสตร์ Modulo 11 ของสำนักบริหารการทะเบียน กรมการปกครอง เพื่อยืนยันว่าเลขบัตรถูกสร้างขึ้นตามแบบแผนที่ถูกต้อง
          </div>
        </div>
      `
    });

  } else {
    renderSearchResultPanel({
      badgeText: '🆔 บัตรประจำตัวประชาชน',
      badgeClass: 'bg-rose-100 text-rose-800 border border-rose-200',
      rawSummary: `[ตรวจสอบเลขบัตรประชาชน 13 หลัก]\nหมายเลข: ${formattedID}\nสถานะ: ❌ ไม่ถูกต้อง (Check Digit ไม่ตรงตามสูตร Modulo 11)`,
      htmlContent: `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-rose-800">
          <div class="flex items-center gap-2 font-bold text-sm">
            <span>❌</span> เลขบัตรประชาชนไม่ถูกต้องตามหลักคณิตศาสตร์
          </div>
          <p class="text-xs text-rose-700">
            หมายเลข <strong class="font-mono">${formattedID}</strong> ไม่ผ่านการตรวจสอบหลัก Check Digit (Modulo 11) กรุณาตรวจสอบตัวเลขอีกครั้ง
          </p>
        </div>
      `
    });
  }
}

// 4. ตรวจสอบข้อมูลรถ / ทะเบียนรถ (Vehicle Cross-Search)
async function checkVehicle() {
  const input = document.getElementById("txtvehicle");
  const query = input ? input.value.trim() : '';

  if (!query) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลรถหรือเลขทะเบียน', confirmButtonColor: '#1e3a8a' });
    return;
  }

  addRecentSearch('vehicle', query);

  Swal.fire({
    title: 'กำลังสืบค้นฐานข้อมูลยานพาหนะ...',
    text: `ค้นหา: ${query}`,
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    const cleanQuery = query.toLowerCase().replace(/[- ]/g, '');
    let matchedReports = [];
    let matchedLostCars = [];

    if (typeof callGasApi === 'function') {
      try {
        const [reportsRes, lostCarsRes] = await Promise.allSettled([
          callGasApi('getReports'),
          callGasApi('getLostCarReports')
        ]);

        if (reportsRes.status === 'fulfilled' && reportsRes.value && reportsRes.value.data) {
          matchedReports = reportsRes.value.data.filter(r => {
            const plate = (r.plate || '').toLowerCase().replace(/[- ]/g, '');
            const brand = (r.brand || '').toLowerCase();
            const model = (r.model || '').toLowerCase();
            const details = (r.details || '').toLowerCase();
            return plate.includes(cleanQuery) || brand.includes(cleanQuery) || model.includes(cleanQuery) || details.includes(cleanQuery);
          });
        }

        if (lostCarsRes.status === 'fulfilled' && lostCarsRes.value && lostCarsRes.value.data) {
          matchedLostCars = lostCarsRes.value.data.filter(r => {
            const plate = (r.plate || '').toLowerCase().replace(/[- ]/g, '');
            const brand = (r.brand || '').toLowerCase();
            const model = (r.model || '').toLowerCase();
            const details = (r.details || '').toLowerCase();
            return plate.includes(cleanQuery) || brand.includes(cleanQuery) || model.includes(cleanQuery) || details.includes(cleanQuery);
          });
        }
      } catch (e) { }
    }

    Swal.close();

    const totalMatches = matchedReports.length + matchedLostCars.length;
    const rawSummary = `[สืบค้นข้อมูลยานพาหนะ]\nคำค้น: ${query}\nพบในชีตรถหาย: ${matchedLostCars.length} รายการ\nพบในชีตตรวจที่เกิดเหตุ: ${matchedReports.length} รายการ`;

    const lostCarsHtml = matchedLostCars.length > 0 ? `
      <div class="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
        <div class="flex items-center gap-1.5 text-xs font-bold text-red-800">
          <span>🚨</span> ฐานข้อมูลแจ้งรถหาย (${matchedLostCars.length} คดี):
        </div>
        <div class="space-y-1.5 text-xs">
          ${matchedLostCars.map(c => `
            <div class="p-2 bg-white rounded-lg border border-red-100 flex flex-col gap-0.5">
              <div class="flex justify-between items-center">
                <span class="font-bold text-red-700">ทะเบียน: ${escapeHtml(c.plate || '-')}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold">${escapeHtml(c.status || 'แจ้งหาย')}</span>
              </div>
              <div class="text-slate-600">${escapeHtml(c.brand || '')} ${escapeHtml(c.model || '')} (${escapeHtml(c.color || '-')})</div>
              <div class="text-[11px] text-slate-500">ผู้แจ้ง: ${escapeHtml(c.reporter || '-')} | โทร: ${escapeHtml(c.phone || '-')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
        <span>✅</span> ไม่พบรายการในฐานข้อมูลแจ้งรถหาย
      </div>
    `;

    const reportsHtml = matchedReports.length > 0 ? `
      <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
        <div class="flex items-center gap-1.5 text-xs font-bold text-blue-800">
          <span>🚓</span> ฐานข้อมูลตรวจที่เกิดเหตุ (${matchedReports.length} คดี):
        </div>
        <div class="space-y-1.5 text-xs">
          ${matchedReports.map(c => `
            <div class="p-2 bg-white rounded-lg border border-blue-100 flex flex-col gap-0.5">
              <div class="flex justify-between items-center">
                <span class="font-bold text-blue-700">ทะเบียน: ${escapeHtml(c.plate || '-')}</span>
                <span class="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">${escapeHtml(c.caseType || c.status || 'ตรวจที่เกิดเหตุ')}</span>
              </div>
              <div class="text-slate-600">${escapeHtml(c.brand || '')} ${escapeHtml(c.model || '')} (${escapeHtml(c.color || '-')})</div>
              <div class="text-[11px] text-slate-500">สถานที่: ${escapeHtml(c.location || '-')} | เจ้าหน้าที่: ${escapeHtml(c.officer || '-')}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : `
      <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 flex items-center gap-2">
        <span>ℹ️</span> ไม่พบประวัติในบันทึกตรวจที่เกิดเหตุ
      </div>
    `;

    renderSearchResultPanel({
      badgeText: '🚗 ตรวจสอบยานพาหนะ',
      badgeClass: totalMatches > 0 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      rawSummary: rawSummary,
      htmlContent: `
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span class="text-xs text-slate-400 font-semibold block">คำค้นหายานพาหนะ</span>
              <span class="text-xl font-bold text-slate-800 tracking-wide">${escapeHtml(query)}</span>
            </div>
            <div class="px-3 py-1.5 rounded-lg border text-xs font-bold ${totalMatches > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}">
              ${totalMatches > 0 ? `🚨 พบข้อมูลในระบบ ${totalMatches} รายการ` : '✅ ไม่พบประวัติที่ตรงกัน'}
            </div>
          </div>

          <div class="space-y-3">
            ${lostCarsHtml}
            ${reportsHtml}
          </div>
        </div>
      `
    });

  } catch (err) {
    Swal.close();
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการสืบค้น', text: err.message || 'ไม่สามารถสืบค้นฐานข้อมูลได้' });
  }
}





async function shareMessage(message, mapLink, qrurl, mapUrl) {
  const result = await liff.shareTargetPicker([
    {
      type: 'text',
      text: message
    },
    {
      type: 'location',
      title: 'ตำแหน่งที่แจ้ง',
      address: 'ดูบน Google Maps',
      latitude: parseFloat(mapLink.split('=')[1].split(',')[0]),
      longitude: parseFloat(mapLink.split('=')[1].split(',')[1])
    },
    {
      type: 'image',
      originalContentUrl: qrurl,
      previewImageUrl: qrurl
    },
    {
      type: 'image',
      originalContentUrl: mapUrl,
      previewImageUrl: mapUrl
    }
  ])

  if (result) {
    alert(`[${result.status}] Message sent!`)
  } else {
    const [majorVer, minorVer, patchVer] = (liff.getLineVersion() || "").split('.');
    if (minorVer === undefined) {
      alert('ShareTargetPicker was canceled in external browser')
    }
    if (parseInt(majorVer) >= 10 && parseInt(minorVer) >= 10 && parseInt(patchVer) > 0) {
      alert('ShareTargetPicker was canceled in LINE app')
    }
  }
}

async function sendMapQr({ message, qrurl, mapUrl }) {
  try {
    await liff.sendMessages([
      {
        type: 'text',
        text: message
      },
      /*{
        type: 'location',
        title: 'ตำแหน่งที่แจ้ง',
        address: 'ดูบน Google Maps',
        latitude: parseFloat(mapLink.split('=')[1].split(',')[0]),
        longitude: parseFloat(mapLink.split('=')[1].split(',')[1])
      },*/
      {
        type: 'image',
        originalContentUrl: qrurl,
        previewImageUrl: qrurl
      },
      {
        type: 'image',
        originalContentUrl: mapUrl,
        previewImageUrl: mapUrl
      }
    ]);
    alert("ส่งข้อความสำเร็จ!");
    liff.closeWindow();
  } catch (error) {
    alert("เกิดข้อผิดพลาดในการส่งข้อความ: " + error);
  }
}

// บันทึกและส่งรายงานตรวจที่เกิดเหตุ (เชื่อมต่อ Google Sheets จริง)
async function sendReport() {
  if (!validateReportForm()) return;
  if (_isSending) return;
  _isSending = true;
  await handleSend().finally(() => { _isSending = false; });
}

async function shareReport() {
  if (!validateReportForm()) return;
  if (_isSending) return;
  _isSending = true;
  Swal.fire({
    title: 'กรุณารอสักครู่...',
    text: 'กำลังสร้างแผนที่และแชร์ข้อมูล',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });
  try {
    const content = await settext();
    await shareMessage(content.message, content.mapLink, content.qrurl, content.mapUrl);
    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'แชร์ข้อมูลสำเร็จ!',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถแชร์ข้อมูลได้'
    });
  } finally {
    _isSending = false;
  }
}

// แสดงแจ้งเตือนระหว่างประมวลผล และบันทึกลง Google Sheets
async function handleSend() {
  Swal.fire({
    title: 'กำลังส่งข้อมูล...',
    text: 'กำลังบันทึกลงระบบและส่งรายงาน',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  try {
    const content = await settext();      // โหลดข้อความและแผนที่

    // 1. ดึงข้อมูลจากฟอร์มเพื่อบันทึกลง Google Sheets
    const datetime = document.getElementById("datetime").value;
    const user = document.getElementById("user").value.trim();
    const detail = document.getElementById("detail").value.trim();
    const latlong = document.getElementById("latlong").value.trim();
    const [lat, lng] = latlong.split(',').map(s => s.trim());

    const sceneReportPayload = {
      action: 'createSceneReport',
      id: 'SCN-' + Date.now(),
      date: datetime,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      officer: user || 'เจ้าหน้าที่',
      shift: 'เวรตรวจ',
      details: detail,
      latitude: lat || '',
      longitude: lng || '',
      location: latlong,
      caseType: (content && content.categoryName) || (currentActiveTemplateKey && DETAIL_TEMPLATES[currentActiveTemplateKey] ? DETAIL_TEMPLATES[currentActiveTemplateKey].category : 'ตรวจที่เกิดเหตุ'),
      mapLink: content ? content.mapLink : (lat && lng ? `https://maps.google.com/?q=${latlong}` : ''),
      status: 'completed',
      // ฟิลด์สำรองเพื่อความเข้ากันได้
      Shift: 'เวรตรวจ',
      Vehicle_Type: 'ตรวจที่เกิดเหตุ',
      Case_Type: (content && content.categoryName) || (currentActiveTemplateKey && DETAIL_TEMPLATES[currentActiveTemplateKey] ? DETAIL_TEMPLATES[currentActiveTemplateKey].category : 'ตรวจที่เกิดเหตุ'),
      Reporter: user || 'เจ้าหน้าที่',
      Details: detail
    };

    // บันทึกลงชีต SceneReports ผ่าน callGasApi
    let saveResult = null;
    try {
      if (typeof callGasApi === 'function') {
        saveResult = await callGasApi('createSceneReport', sceneReportPayload, 'POST');
      }
    } catch (sheetErr) {
      console.warn('Google Sheets save warning:', sheetErr);
    }

    // 2. ส่งข้อความเข้าห้องแชท LINE ถ้าอยู่ใน LIFF Client
    try {
      if (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient()) {
        await sendMapQr(content);
      }
    } catch (liffErr) {
      console.warn('LIFF Message Send warning:', liffErr);
    }

    Swal.close();
    Swal.fire({
      icon: 'success',
      title: 'บันทึกและส่งข้อมูลสำเร็จ!',
      text: saveResult && saveResult.message ? saveResult.message : 'ระบบได้บันทึกข้อมูลเรียบร้อยแล้ว',
      timer: 2200,
      showConfirmButton: false
    });

  } catch (error) {
    Swal.close(); // ปิด loading
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถส่งข้อมูลได้'
    });
  }
}


async function sendMessagebot(message) {
  try {
    // เรียกใช้ LIFF API เพื่อส่งข้อความ
    await liff.sendMessages([
      {
        type: 'text',
        text: message, // ข้อความที่ต้องการส่ง
      }
      // สามารถเพิ่มประเภทของข้อความและข้อมูลเพิ่มเติมตามต้องการ
    ]);
    alert("Message sent successfully!");
    liff.closeWindow();
  } catch (error) {
    alert("Error occurred while trying to send message:", error);
  }
}






// ========================================
// AUTHENTICATION & LIFF WINDOW
// ========================================
function logOut() {
  const isLiffApp = (typeof liff !== 'undefined' && liff.isInClient && liff.isInClient());
  const confirmTitle = isLiffApp ? 'ปิดหน้าต่าง San BOT?' : 'ออกจากระบบ?';
  const confirmText = isLiffApp ? 'คุณต้องการปิดหน้าต่างโปรแกรมกลับไปยังห้องแชท LINE ใช่หรือไม่?' : 'คุณต้องการออกจากระบบหรือไม่?';
  const confirmBtnText = isLiffApp ? '🚪 ปิดหน้าต่าง' : 'ออกจากระบบ';

  Swal.fire({
    icon: 'question',
    title: confirmTitle,
    text: confirmText,
    showCancelButton: true,
    confirmButtonText: confirmBtnText,
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280'
  }).then((result) => {
    if (result.isConfirmed) {
      if (isLiffApp) {
        liff.closeWindow();
      } else {
        sessionStorage.clear();
        localStorage.removeItem('sanbot_user');
        if (typeof liff !== 'undefined' && liff.isLoggedIn && liff.isLoggedIn()) {
          liff.logout();
        }
        window.location.href = "login.html";
      }
    }
  });
}


// 1. ดึงโปรไฟล์และอัปเดตข้อมูลเจ้าหน้าที่เข้าสู่องค์ประกอบหน้าจอ
async function getUserProfile() {
  try {
    let picture = '';
    let name = '';
    let uid = '';
    let statusMsg = '';
    let emailStr = '';

    // วิธีที่ 1: ดึงจาก idToken (เร็วที่สุดและไม่ติด network latency)
    try {
      const decodedToken = liff.getDecodedIDToken ? liff.getDecodedIDToken() : null;
      if (decodedToken) {
        if (decodedToken.picture) picture = decodedToken.picture;
        if (decodedToken.name) name = decodedToken.name;
        if (decodedToken.email) emailStr = decodedToken.email;
      }
    } catch (e) { }

    // วิธีที่ 2: ดึงจาก liff.getProfile()
    try {
      const profile = await liff.getProfile();
      if (profile) {
        if (profile.pictureUrl) picture = profile.pictureUrl;
        if (profile.displayName) name = profile.displayName;
        if (profile.userId) uid = profile.userId;
        if (profile.statusMessage) statusMsg = profile.statusMessage;
      }
    } catch (e) {
      console.warn("liff.getProfile error, using token/cache fallback:", e);
    }

    // วิธีที่ 3: ดึงจาก Cache ถ้ายังไม่มี
    if (!picture) picture = localStorage.getItem("sanbot_pictureUrl") || '';
    if (!name) name = localStorage.getItem("sanbot_displayName") || '';

    // อัปเดตลง DOM
    const pictureUrlEl = document.getElementById("pictureUrl");
    const displayNameEl = document.getElementById("displayName");
    const userIdEl = document.getElementById("userId");
    const statusMessageEl = document.getElementById("statusMessage");
    const emailEl = document.getElementById("email");

    if (picture) {
      localStorage.setItem("sanbot_pictureUrl", picture);
      if (pictureUrlEl) {
        pictureUrlEl.removeAttribute("crossorigin");
        pictureUrlEl.referrerPolicy = "no-referrer";
        pictureUrlEl.src = picture;
      }
    }

    if (name) {
      localStorage.setItem("sanbot_displayName", name);
      if (displayNameEl) displayNameEl.textContent = name;
    }

    if (userIdEl && uid) userIdEl.innerHTML = uid;
    if (statusMessageEl && statusMsg) statusMessageEl.innerHTML = statusMsg;
    if (emailEl && emailStr) emailEl.innerHTML = emailStr;

    return { userId: uid, displayName: name, pictureUrl: picture, statusMessage: statusMsg, email: emailStr };
  } catch (error) {
    console.error("❌ ไม่สามารถดึงข้อมูลโปรไฟล์ผู้ใช้งานได้:", error);
    const cachedPic = localStorage.getItem("sanbot_pictureUrl");
    const cachedName = localStorage.getItem("sanbot_displayName");
    const pictureUrl = document.getElementById("pictureUrl");
    const displayName = document.getElementById("displayName");
    if (pictureUrl && cachedPic) pictureUrl.src = cachedPic;
    if (displayName && cachedName) displayName.textContent = cachedName;
    return null;
  }
}

// 2. จัดการสถานะปุ่มล็อกอิน / เอาท์ และควบคุมสิทธิ์เบื้องต้น
async function handleLogin() {
  const btnLogin = document.getElementById("btnLogin");
  const btnLogOut = document.getElementById("btnLogOut");

  if (liff.isLoggedIn()) {
    // โหลดประวัติผู้ใช้มาแสดงผลหน้าจอ
    const profile = await getUserProfile();

    // ซ่อนปุ่มเข้าสู่ระบบ และเปิดปุ่มออกจากระบบ (ใช้สไตล์คลาสขยับของ Tailwind)
    if (btnLogin) btnLogin.classList.add("hidden");
    if (btnLogOut) btnLogOut.classList.remove("hidden");

    // 🔒 ส่งข้อมูลเข้าสู่ระบบสืบสวนคัดกรองความปลอดภัยผ่าน Google Sheets หลังบ้านเดิมของคุณต่อทันที
    if (profile) {
      await verifyPoliceAuthentication(profile.userId, profile.displayName, profile.pictureUrl);
    }

  } else {
    // กรณีที่ยังไม่ได้ล็อกอินในระบบจริง
    if (btnLogin) btnLogin.classList.remove("hidden");
    if (btnLogOut) btnLogOut.classList.add("hidden");

    // รีเซ็ตข้อความหน้าจอให้กลับเป็นสถานะรอเปิดสิทธิ์
    const displayName = document.getElementById("displayName");
    if (displayName) displayName.innerHTML = "กรุณาเข้าสู่ระบบ";
  }
}



function eventFlex() {
  const imageUrlInput = document.getElementById("image-url");
  const imagePreview = document.getElementById("image-preview");
  const previewPlaceholder = document.getElementById("preview-placeholder");
  const previewContainer = document.getElementById("preview-container");
  const btnShareflex = document.getElementById("btn-shareflex");
  const btnsendflex = document.getElementById("btn-sendflex");
  const btnResetFlex = document.getElementById("btn-resetflex");
  const btnCopyFlex = document.getElementById("btn-copyflex");
  const btnFillReport = document.getElementById("btn-fill-report");
  const flexTitleInput = document.getElementById("flex-title");
  const flexDetailInput = document.getElementById("flex-detail");
  const targetUrlInput = document.getElementById("target-url");
  const targetNameInput = document.getElementById("target-name");
  const btnSendTelegram = document.getElementById("btn-sendtelegram");
  const btnTestLink = document.getElementById("btn-testlink");
  const btnTelegramConfig = document.getElementById("btn-telegram-config");

  if (!imageUrlInput || !imagePreview || !previewPlaceholder || !previewContainer || !btnsendflex || !btnShareflex || !flexTitleInput || !flexDetailInput) {
    console.warn("⚠️ คอมโพเนนต์ระบบสร้าง Flex ยังโหลดไม่ครบถ้วนในระบบ DOM");
    return;
  }

  if (imageUrlInput.dataset.flexReady === "true") {
    return;
  }
  imageUrlInput.dataset.flexReady = "true";

  function resetPreview(message, isError) {
    imagePreview.classList.add("hidden");
    previewPlaceholder.classList.remove("hidden");
    previewPlaceholder.innerText = message;

    if (isError) {
      previewPlaceholder.className = "block text-[11px] font-semibold tracking-wide text-cyber-pink";
    } else {
      previewPlaceholder.className = "block text-[11px] font-medium tracking-wide text-slate-500";
    }

    previewContainer.classList.remove("preview-verified");
    previewContainer.classList.add("border-slate-700");
  }

  function fillFlexFromCurrentReport() {
    const date = document.getElementById("datetime")?.value || new Date().toISOString().slice(0, 10);
    const user = document.getElementById("user")?.value?.trim() || "เจ้าหน้าที่สืบสวน";
    const detail = document.getElementById("detail")?.value?.trim() || "ข้อมูลเหตุการณ์ยังไม่ครบ";
    const latlong = document.getElementById("latlong")?.value?.trim() || "";

    if (flexTitleInput) {
      flexTitleInput.value = `📌 ${user} | ${date}`;
    }

    if (flexDetailInput) {
      flexDetailInput.value = detail.length > 240 ? detail.slice(0, 240) + "..." : detail;
    }

    if (targetUrlInput && latlong) {
      targetUrlInput.value = `https://maps.google.com/?q=${encodeURIComponent(latlong)}`;
    }

    if (typeof syncTargetUrl === 'function') {
      syncTargetUrl();
    }
    if (typeof updateLivePreviewText === 'function') {
      updateLivePreviewText();
    }
  }

  function resetFlexForm() {
    imageUrlInput.value = "";
    flexTitleInput.value = "";
    flexDetailInput.value = "";
    targetUrlInput.value = "";
    if (targetNameInput) targetNameInput.value = "";
    const destInput = document.getElementById("destination-url");
    if (destInput) destInput.value = "";
    resetPreview("⏳ รอระบบตรวจสอบและดึงตัวอย่างรูปภาพ...", false);
    imagePreview.src = "";
    if (typeof syncTargetUrl === 'function') {
      syncTargetUrl();
    }
    if (typeof updateLivePreviewText === 'function') {
      updateLivePreviewText();
    }
  }

  imageUrlInput.addEventListener("input", function () {
    const url = this.value.trim();

    if (url && url.startsWith("https://")) {
      imagePreview.src = url;
      imagePreview.classList.remove("hidden");
      previewPlaceholder.classList.add("hidden");
      previewContainer.classList.remove("border-slate-700");
      previewContainer.classList.add("preview-verified");
    } else if (url && url.startsWith("http://")) {
      imagePreview.classList.add("hidden");
      previewPlaceholder.classList.remove("hidden");
      previewPlaceholder.innerText = "❌ ลิงก์ไม่ปลอดภัย (ต้องขึ้นต้นด้วย https เท่านั้น)";
      previewPlaceholder.className = "block text-[11px] font-medium tracking-wide text-cyber-pink";
      previewContainer.classList.remove("preview-verified");
      previewContainer.classList.add("border-slate-700");
    } else {
      resetPreview("⏳ รอระบบตรวจสอบและดึงตัวอย่างรูปภาพ...", false);
    }
  });

  imagePreview.addEventListener("error", function () {
    resetPreview("❌ ไม่สามารถโหลดรูปภาพจาก URL นี้ได้ (ลิงก์เสีย)", true);
  });

  btnsendflex.addEventListener("click", function () {
    processFlexAction('send');
  });

  btnShareflex.addEventListener("click", function () {
    processFlexAction('share');
  });

  if (btnResetFlex) {
    btnResetFlex.addEventListener("click", resetFlexForm);
  }

  if (btnCopyFlex) {
    btnCopyFlex.addEventListener("click", function () {
      const payload = buildFlexPayloadFromFields();
      if (!payload) return;
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2)).then(() => {
        Swal.fire({ icon: 'success', title: 'คัดลอก JSON ของ Flex แล้ว', timer: 1200, showConfirmButton: false });
      }).catch(() => {
        Swal.fire({ icon: 'error', title: 'คัดลอกไม่สำเร็จ', text: 'กรุณาคัดลอกด้วยตนเอง' });
      });
    });
  }

  if (btnFillReport) {
    btnFillReport.addEventListener("click", fillFlexFromCurrentReport);
  }

  if (btnSendTelegram) {
    btnSendTelegram.addEventListener("click", sendDirectToTelegram);
  }

  if (btnTestLink) {
    btnTestLink.addEventListener("click", testOpenTargetUrl);
  }

  if (btnTelegramConfig) {
    btnTelegramConfig.addEventListener("click", () => configureTelegramBot(false));
  }
}

// ---------------------------------------------------------
// ฟังก์ชันส่งแคมเปญล่อลวงเข้า Telegram Bot โดยตรง (Telegram Bot Campaign)
// ---------------------------------------------------------
async function sendDirectToTelegram() {
  const targetUrl = document.getElementById("target-url")?.value || "";
  const title = document.getElementById("flex-title")?.value?.trim() || "";
  const detail = document.getElementById("flex-detail")?.value?.trim() || "";
  const imageUrl = document.getElementById("image-url")?.value?.trim() || "";
  const btnText = document.getElementById("flex-btn-text")?.value?.trim() || "👉 เปิดดูข้อมูล";
  const toggleImgOnly = document.getElementById("toggle-image-only")?.checked;
  const targetName = document.getElementById("target-name")?.value?.trim() || "เป้าหมายทั่วไป";

  const botToken = localStorage.getItem('SANBOT_TELEGRAM_BOT_TOKEN') || (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM_BOT_TOKEN) || "";
  const chatId = localStorage.getItem('SANBOT_TELEGRAM_CHAT_ID') || (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM_CHAT_ID) || "";

  if (!targetUrl) {
    Swal.fire({ icon: 'warning', title: 'กรุณาระบุ URL ปลายทาง', confirmButtonColor: '#0284c7' });
    return;
  }

  Swal.fire({
    title: 'กำลังส่งการ์ดเข้า Telegram Bot...',
    text: 'กำลังเชื่อมต่อกับระบบ Telegram (Server Proxy)',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const isLocalhost = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');
    let caption = `🎯 <b>[ลิงก์จำลองเพื่อการสืบสวน / Bait Campaign]</b>\n\n`;
    if (!toggleImgOnly && title) {
      caption += `📌 <b>${title}</b>\n`;
    }
    if (!toggleImgOnly && detail) {
      caption += `📝 ${detail}\n\n`;
    }
    caption += `🎯 <b>เป้าหมาย:</b> <code>${targetName}</code>\n`;
    caption += `🔗 <b>ลิงก์ดักจับข้อมูล:</b>\n${targetUrl}`;

    if (isLocalhost) {
      caption += `\n\n💡 <i>(หมายเหตุ: รันบน Localhost สามารถกดแตะลิงก์ด้านบนในข้อความนี้ได้)</i>`;
    }

    const replyMarkup = (!isLocalhost && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) ? {
      inline_keyboard: [
        [{ text: btnText || "👉 เปิดตรวจสอบข้อมูล", url: targetUrl }]
      ]
    } : undefined;

    // 1. ถ้ามี Bot Token ในเครื่อง (Local) ส่งตรงได้
    if (botToken && chatId) {
      const botUrl = `https://api.telegram.org/bot${botToken}`;
      const requestBody = {
        chat_id: chatId,
        parse_mode: 'HTML'
      };
      if (replyMarkup) requestBody.reply_markup = replyMarkup;

      let res;
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        requestBody.photo = imageUrl;
        requestBody.caption = caption;
        res = await fetch(`${botUrl}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      } else {
        requestBody.text = caption;
        res = await fetch(`${botUrl}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        });
      }

      const data = await res.json();
      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'ส่งเข้า Telegram สำเร็จ!',
          text: 'ข้อความและปุ่มลิงก์ถูกส่งเข้าห้องแชท Telegram เรียบร้อยแล้ว',
          confirmButtonColor: '#0284c7'
        });
        return;
      }
    }

    // 2. ถ้าไม่มี Token ในเครื่อง ให้ส่งผ่าน Google Apps Script Backend Proxy (ปลอดภัย ไม่เปิดเผย Token)
    if (typeof callGasApi === 'function') {
      const gasPayload = {
        text: caption,
        photo: imageUrl,
        reply_markup: replyMarkup
      };
      const gasRes = await callGasApi('sendTelegram', gasPayload, 'POST');
      if (gasRes && (gasRes.ok || gasRes.success)) {
        Swal.fire({
          icon: 'success',
          title: 'ส่งเข้า Telegram สำเร็จ!',
          text: 'ส่งข้อมูลผ่านเซิร์ฟเวอร์ Google Apps Script เรียบร้อยแล้ว (ปลอดภัย 100%)',
          confirmButtonColor: '#0284c7'
        });
        return;
      } else if (gasRes && gasRes.message && gasRes.message.includes('ไม่ได้กำหนดค่า')) {
        configureTelegramBot(true);
        return;
      }
    }

    // หากไม่สำเร็จทั้งสองทาง ให้เปิดหน้าต่างตั้งค่า
    configureTelegramBot(true);
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'เชื่อมต่อล้มเหลว',
      text: err.message,
      confirmButtonColor: '#ef4444'
    });
  }
}

// ---------------------------------------------------------
// ฟังก์ชันตั้งค่า Telegram Bot Token และ Chat ID
// ---------------------------------------------------------
function configureTelegramBot(autoRetry = false) {
  const currentToken = localStorage.getItem('SANBOT_TELEGRAM_BOT_TOKEN') || (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM_BOT_TOKEN) || "";
  const currentChatId = localStorage.getItem('SANBOT_TELEGRAM_CHAT_ID') || (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM_CHAT_ID) || "";

  Swal.fire({
    title: '⚙️ ตั้งค่า Telegram Bot',
    html: `
      <div class="text-left text-xs space-y-3 pt-2 font-sans">
        <p class="text-slate-600">ระบุ Bot Token และ Chat ID สำหรับส่งการ์ดล่อลวง และรับการแจ้งเตือนพิกัดสด</p>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Telegram Bot Token:</label>
          <input id="swal-tele-token" class="swal2-input !m-0 !w-full text-xs font-mono" placeholder="เช่น 7401648126:AAHJiOVvD0DX..." value="${currentToken}">
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Telegram Chat ID (ห้องแชทหรือกลุ่ม):</label>
          <input id="swal-tele-chatid" class="swal2-input !m-0 !w-full text-xs font-mono" placeholder="เช่น 7628326176 หรือ -100xxxxxxx" value="${currentChatId}">
        </div>
        <div class="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          💡 รับ Token จาก <a href="https://t.me/BotFather" target="_blank" class="text-blue-600 underline font-bold">@BotFather</a> และตรวจ Chat ID ผ่าน <a href="https://t.me/userinfobot" target="_blank" class="text-blue-600 underline font-bold">@userinfobot</a>
        </div>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'บันทึกการตั้งค่า',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#0284c7',
    preConfirm: () => {
      const token = document.getElementById('swal-tele-token').value.trim();
      const chatId = document.getElementById('swal-tele-chatid').value.trim();
      if (!token || !chatId) {
        Swal.showValidationMessage('กรุณากรอกทั้ง Bot Token และ Chat ID ให้ครบถ้วน');
        return false;
      }
      return { token, chatId };
    }
  }).then((res) => {
    if (res.isConfirmed && res.value) {
      localStorage.setItem('SANBOT_TELEGRAM_BOT_TOKEN', res.value.token);
      localStorage.setItem('SANBOT_TELEGRAM_CHAT_ID', res.value.chatId);
      Swal.fire({
        icon: 'success',
        title: 'บันทึกการตั้งค่าแล้ว!',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        if (autoRetry) {
          sendDirectToTelegram();
        }
      });
    }
  });
}

// ---------------------------------------------------------
// ฟังก์ชันทดสอบเปิดลิงก์จริง
// ---------------------------------------------------------
function testOpenTargetUrl() {
  const targetUrl = document.getElementById("target-url")?.value;
  if (targetUrl) {
    window.open(targetUrl, '_blank');
  } else {
    Swal.fire({ icon: 'warning', title: 'ยังไม่มี URL ปลายทาง', text: 'กรุณากรอก URL ในฟอร์มก่อนทดสอบ' });
  }
}

function buildFlexPayloadFromFields() {
  const imageUrlInput = document.getElementById("image-url");
  const targetUrlInput = document.getElementById("target-url");
  const flexTitleInput = document.getElementById("flex-title");
  const flexDetailInput = document.getElementById("flex-detail");
  const flexBtnTextInput = document.getElementById("flex-btn-text");
  const toggleImgOnly = document.getElementById("toggle-image-only");

  const isImageOnly = toggleImgOnly ? toggleImgOnly.checked : false;

  const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "";
  const targetUrl = targetUrlInput ? targetUrlInput.value.trim() : "";
  const flexTitle = (flexTitleInput && flexTitleInput.value.trim()) ? flexTitleInput.value.trim() : "📌 รูปภาพจากระบบ San BOT";
  const flexDetail = (flexDetailInput && flexDetailInput.value.trim()) ? flexDetailInput.value.trim() : "";
  const flexBtnText = (flexBtnTextInput && flexBtnTextInput.value.trim()) ? flexBtnTextInput.value.trim() : "อ่านเพิ่มเติม >";

  if (!imageUrl) {
    Swal.fire({ icon: 'warning', title: 'กรุณาใส่ URL รูปภาพ', confirmButtonColor: '#00d4ff' });
    return null;
  }
  if (!imageUrl.startsWith("https://")) {
    Swal.fire({ icon: 'error', title: 'URL ไม่ปลอดภัย', text: 'รูปภาพต้องขึ้นต้นด้วย https:// เท่านั้น', confirmButtonColor: '#ff2e97' });
    return null;
  }
  if (!targetUrl) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอก URL ปลายทาง', confirmButtonColor: '#00d4ff' });
    return null;
  }

  // 🖼️ โหมดรูปภาพล้วน (Image Only Bubble - ไม่มี text/footer button)
  if (isImageOnly || (!flexDetail && (!flexTitleInput || !flexTitleInput.value.trim()))) {
    return [{
      "type": "flex",
      "altText": flexTitle || "รูปภาพ",
      "contents": {
        "type": "bubble",
        "size": "mega",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "image",
              "url": imageUrl,
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover",
              "action": {
                "type": "uri",
                "label": "เปิดดูรูปภาพ",
                "uri": targetUrl
              }
            }
          ],
          "paddingAll": "0px"
        }
      }
    }];
  }

  // 📋 โหมดการ์ดเต็มรูปแบบ (Full Card With Body & Subtle Link Footer)
  return [{
    "type": "flex",
    "altText": flexTitle,
    "contents": {
      "type": "bubble",
      "hero": {
        "type": "image",
        "url": imageUrl,
        "size": "full",
        "aspectRatio": "20:13",
        "aspectMode": "cover",
        "action": { "type": "uri", "label": "รูปภาพ", "uri": targetUrl }
      },
      "body": {
        "type": "box",
        "layout": "vertical",
        "spacing": "md",
        "contents": [
          { "type": "text", "text": flexTitle, "weight": "bold", "size": "sm", "color": "#1e3a8a", "wrap": true },
          { "type": "text", "text": flexDetail || "กดที่รูปภาพด้านบน หรือข้อความด้านล่างเพื่อตรวจสอบรายละเอียด", "wrap": true, "size": "xs", "color": "#4b5563" }
        ]
      },
      "footer": {
        "type": "box",
        "layout": "vertical",
        "contents": [{
          "type": "button",
          "style": "link",
          "color": "#64748b",
          "action": { "type": "uri", "label": flexBtnText, "uri": targetUrl },
          "height": "sm"
        }],
        "paddingTop": "0px"
      }
    }
  }];
}

async function processFlexAction(mode) {
  const flexPayload = buildFlexPayloadFromFields();
  if (!flexPayload) return;

  Swal.fire({
    title: 'กำลังตรวจสอบโทเค็น LINE...',
    allowOutsideClick: false,
    didOpen: () => { Swal.showLoading(); }
  });

  try {
    if (mode === 'send') {
      if (liff.isInClient()) {
        await liff.sendMessages(flexPayload);
        showSuccessAlert('ส่งเข้าห้องแชทสำเร็จ!', true);
      } else {
        showTestConsole(flexPayload);
      }
    } else if (mode === 'share') {
      if (liff.isApiAvailable('shareTargetPicker')) {
        const shareResult = await liff.shareTargetPicker(flexPayload);
        if (shareResult) {
          showSuccessAlert('กระจายส่งลิงก์สำเร็จ!', false);
        } else {
          Swal.close();
        }
      } else {
        Swal.fire({ icon: 'warning', title: 'ฟีเจอร์ไม่พร้อมใช้งาน', text: 'กรุณาเปิดระบบใช้งานผ่านแอปพลิเคชัน LINE เท่านั้น', confirmButtonColor: '#ff2e97' });
      }
    }
  } catch (error) {
    console.error(`❌ LINE LIFF Error [${mode}]:`, error);
    Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการส่งข้อมูล', text: error.message });
  }
}

// ฟังก์ชันเปิด Alert แจ้งส่งงานสำเร็จ
function showSuccessAlert(titleText, shouldCloseWindow) {
  Swal.fire({ icon: 'success', title: titleText, timer: 1500, showConfirmButton: false });
  if (shouldCloseWindow) {
    setTimeout(() => { liff.closeWindow(); }, 1500);
  }
}

// ฟังก์ชันแสดงล็อกพรีวิวสำหรับโหมดทดสอบบนเว็บเบราวเซอร์ PC
function showTestConsole(payload) {
  console.log("🎯 [โหมดทดสอบภายนอก LINE] พิมพ์โครงสร้าง JSON สำเร็จ:", JSON.stringify(payload, null, 2));
  Swal.fire({
    icon: 'info',
    title: 'โหมดจำลองพรีวิวข้อมูล',
    text: 'ระบบจำลองบันทึกโครงสร้างลง Console Log แล้วเรียบร้อย (กด F12 ตรวจสอบ)',
    confirmButtonColor: '#00d4ff'
  });
}



initializeLiff()
async function initializeLiff() {
  try {
    // 1. เริ่มต้นระบบ LIFF 
    await liff.init({ liffId: LIFF_ID });

    // 🟢 [สำหรับตอน DEV บนคอม] : ปลดล็อกให้ผ่านหน้าจอสีดำ และจำลอง Profile เพื่อเทสบนเบราว์เซอร์
    const IS_DEV_MODE = false; // ตั้งเป็น false สำหรับการทดสอบ flow จริงในสภาพแวดล้อม LIFF (ยังสามารถบังคับด้วย ?dev=true หรือรันบน localhost)

    // 🔴 [สำหรับตอนเอาขึ้นใช้งานจริง (Deploy)] : เปิดระบบความปลอดภัย บล็อกคอมพิวเตอร์ทั่วไป
    // const IS_DEV_MODE = false; 
    // =========================================================================

    const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const urlParams = new URLSearchParams(window.location.search);
    const hasDevParam = urlParams.get('dev') === 'true';

    // ตรวจสอบเงื่อนไขความปลอดภัย
    if (!liff.isInClient() && !isLocalHost && !hasDevParam && !IS_DEV_MODE) {
      // 🔒 บล็อกบราวเซอร์ภายนอกเมื่อไม่ได้อยู่ในโหมดพัฒนา
      document.body.innerHTML = `
        <div style="text-align:center; padding:60px 20px; font-family:'Sarabun',sans-serif; background:#060b19; color:#fff; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <h2 style="color:#ff2e97; font-size:22px; font-weight:bold; margin-bottom:15px;">⚠️ ระบบปิดสำหรับงานราชการลับ</h2>
            <p style="color:#94a3b8; max-width:400px; font-size:13px; line-height:1.6;">
                ระบบสนับสนุนงานสืบสวนนี้สงวนสิทธิ์เฉพาะเจ้าหน้าที่ตำรวจเท่านั้น ไม่อนุญาตให้เปิดบนบราวเซอร์ทั่วไป กรุณาเปิดผ่านลิงก์เมนูภายในแอปพลิเคชัน LINE บนมือถือเท่านั้น
            </p>
        </div>
      `;
      window.stop();
      return;
    }

    // 🚀 ถ้าตรวจพบว่าเป็นโหมดพัฒนา (เปิด Switch ไว้, รันด้วยคอมตัวเอง หรือใส่ลิงก์ ?dev=true)
    if (IS_DEV_MODE || isLocalHost || hasDevParam) {
      console.log("🚧 [Dev Mode Active] ระบบข้ามการตรวจสอบ LINE Client อัตโนมัติเพื่อความสะดวกในการเขียนโค้ด");

      // ตั้งค่าข้อมูลโปรไฟล์จำลองให้ Element ต่างๆ บนหน้าจอเพื่อป้องกันสคริปต์พัง (Crash) 
      const nameHeader = document.getElementById("displayName") || document.getElementById("user-name");
      const avatarHeader = document.getElementById("pictureUrl");
      if (nameHeader) nameHeader.textContent = "เจ้าหน้าที่สืบสวน (ทดสอบ)";
      if (avatarHeader) avatarHeader.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

      // แสดง overlay แจ้งสถานะว่าอยู่ในโหมดพัฒนา (main.html จะมี overlay ถ้าโหลด)
      showAuthStatus('โหมดพัฒนา: ข้ามการตรวจสอบ LIFF', false);

      // 🔓 เรียกใช้งานการดักจับ Event ทันที เพื่อให้ทดสอบฟังก์ชันพรีวิวภาพบนคอมพิวเตอร์ได้เลย
      eventFlex();
      return; // สิ้นสุดกระบวนการสำหรับโหมด Dev
    }

    // 2. กู้คืนโปรไฟล์จากแคชทันที
    try {
      const cachedPic = localStorage.getItem("sanbot_pictureUrl");
      const cachedName = localStorage.getItem("sanbot_displayName");
      const pictureUrlEl = document.getElementById("pictureUrl");
      const displayNameEl = document.getElementById("displayName");
      if (pictureUrlEl && cachedPic) {
        pictureUrlEl.removeAttribute("crossorigin");
        pictureUrlEl.referrerPolicy = "no-referrer";
        pictureUrlEl.src = cachedPic;
      }
      if (displayNameEl && cachedName) displayNameEl.textContent = cachedName;
    } catch (e) { }

    // 3. ตรวจสอบการล็อกอิน
    if (!liff.isLoggedIn()) {
      // ถ้าไม่ได้อยู่ใน LINE Client และไม่ได้อยู่ใน iframe ให้เรียก login
      if (window.self !== window.top) {
        console.warn('Running inside an iframe: skipping liff.login()');
      } else if (!liff.isInClient()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
    }

    // 4. 🚀 [ดึงโปรไฟล์และอัปเดต UI ทันทีระดับ 0.1 วินาที] ไม่ต้องรอ Backend
    let userProfile = null;
    try {
      userProfile = await getUserProfile();
    } catch (profErr) {
      console.warn("Fast profile load warning:", profErr);
    }

    // 5. ปรับสีพื้นหลังตาม OS
    try {
      const bodyEl = document.body;
      const osEl = document.getElementById("os-display");
      const currentOS = liff.getOS ? liff.getOS() : 'web';
      if (osEl) osEl.innerHTML = 'OS: ' + currentOS;
      if (currentOS === "android") bodyEl.style.backgroundColor = "#111827";
      else if (currentOS === "web") bodyEl.style.backgroundColor = "#0f172a";
      else if (currentOS === "ios") bodyEl.style.backgroundColor = "#1e293b";
    } catch (e) { }

    // 6. ดำเนินการตรวจสอบสิทธิ์ความปลอดภัยในเบื้องหลัง (Background Verification)
    if (userProfile && userProfile.userId) {
      verifyPoliceAuthentication(userProfile.userId, userProfile.displayName, userProfile.pictureUrl)
        .catch(err => console.warn("Background auth warning:", err));
    } else {
      // Fallback ดึง profile อีกครั้ง
      liff.getProfile().then(p => {
        if (p) {
          getUserProfile();
          verifyPoliceAuthentication(p.userId, p.displayName, p.pictureUrl)
            .catch(err => console.warn("Background auth fallback warning:", err));
        }
      }).catch(err => console.warn("getProfile fallback failed:", err));
    }

  } catch (error) {
    console.error('LIFF initialization failed', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ LINE LIFF SDK ได้: ' + error.message, 'error');
    } else {
      alert('เกิดข้อผิดพลาด: ไม่สามารถเชื่อมต่อ LINE LIFF SDK ได้: ' + error.message);
    }
  }
}

// Health check for the Auth/GAS endpoint (เบื้องต้นเรียก endpoint ด้วย ?ping=true เพื่อเช็คสถานะ)
async function checkAuthEndpointHealth(timeout = 3000) {
  if (!GAS_URL) return Promise.reject(new Error('GAS_URL not configured'));
  const url = `${GAS_URL}?ping=true`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`Auth endpoint returned ${res.status}`);
    const txt = await res.text();
    console.log('Auth endpoint health:', txt);
    return txt;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// UI helper: show/hide auth status overlay on main page
function showAuthStatus(message, busy = false) {
  try {
    let el = document.getElementById('auth-status-overlay');
    if (!el) return;
    el.querySelector('.auth-status-text').textContent = message || '';
    if (busy) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  } catch (e) {
    console.warn('showAuthStatus error', e);
  }
}

// ฟังก์ชันคัดกรองบุคคลพ่วงการปลุก Event สคริปต์แยกไฟล์
async function verifyPoliceAuthentication(uid, displayName, pictureUrl) {
  try {
    // 1. อัปเดตข้อมูล Header บนหน้าเว็บหลัก (ถ้ามี Element รองรับ)
    const nameHeader = document.getElementById("displayName");
    const avatarHeader = document.getElementById("pictureUrl");
    if (nameHeader && displayName) nameHeader.textContent = displayName;
    if (avatarHeader && pictureUrl) {
      avatarHeader.removeAttribute("crossorigin");
      avatarHeader.referrerPolicy = "no-referrer";
      avatarHeader.src = pictureUrl;
    }

    // 2. ดึงสิทธิ์จากสเปรดชีตผ่าน GAS API (checkUserAuth)
    const result = await checkUserAuth(uid, displayName);
    console.log("🔒 ผลการตรวจสิทธิ์ราชการลับ:", result);

    // 3. กรณีผลลัพธ์ระบุว่าไม่มีสิทธิ์ชัดเจน (และไม่ใช่กรณี network error)
    if (result && result.access === false && !result.offline) {
      window.location.href = "register.html";
      return;
    }

    // แสดงยศและสถานะในหน้าจอ (ถ้ามี)
    if (result && result.user && result.user.role) {
      if (nameHeader) {
        nameHeader.innerHTML = `${displayName} <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 ml-1 font-normal">${result.user.role}</span>`;
      }
    }

    // 🔓 ผ่านสิทธิ์การตรวจสอบสำเร็จ! -> เรียกใช้งานระบบตรวจสอบปุ่มในหน้าจอทันที
    if (typeof eventFlex === "function") {
      eventFlex();
    }

  } catch (err) {
    console.warn("⚠️ Background Auth check error (Graceful mode active):", err);
    // ไม่บล็อกหน้าจอ ปล่อยให้ใช้งานต่อได้ตามปกติ
    if (typeof eventFlex === "function") {
      eventFlex();
    }
  }
}

// แยกฟังก์ชันแสดงผลหน้าจอถูกบล็อกสิทธิ์ เพื่อให้โค้ดหลักอ่านง่ายและสะอาดขึ้น
function showAccessDeniedScreen(uid) {
  document.body.innerHTML = `
    <div style="text-align:center; padding:50px 20px; font-family:'Sarabun',sans-serif; background:#060b19; color:#fff; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
        <h2 style="font-size:18px; font-weight:bold; color:#ff2e97;">⚠️ สิทธิ์การใช้งานไม่ได้รับการอนุมัติ</h2>
        <p style="color:#94a3b8; font-size:12px; margin-bottom:15px;">กรุณาคัดลอก UID ด้านล่างนี้ ส่งให้แอดมินกลุ่มสืบสวนเพื่อขอเปิดสิทธิ์เข้าระบบ</p>
        <div style="background:#0e172e; border:1px solid #1e293b; padding:12px 18px; border-radius:8px; font-family:monospace; color:#00d4ff; font-size:12px; word-break:break-all; max-width:320px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">${uid}</div>
    </div>`;
  window.stop();
}


// ========================================
// PAGE NAVIGATION (Master LIFF Router)
// ========================================
function showPage(pageName) {
  if (!pageName) return;

  // ✅ ปัด animation ก่อน
  document.querySelectorAll('.page-content').forEach(page => {
    page.classList.add('hidden');
    page.style.animation = 'none';
  });
  const targetPage = document.getElementById('page-' + pageName);
  if (targetPage) {
    targetPage.classList.remove('hidden');
    // เติม animation ใหม่
    targetPage.style.animation = '';
    void targetPage.offsetWidth; // reflow trick
    targetPage.style.animation = 'pageSlideIn 0.25s ease-out';
  }

  // 🔄 ซิงค์ URL ใน LIFF เดียวกัน โดยไม่ต้องรีโหลดหน้าเว็บ (Single LIFF Architecture)
  try {
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get('page') !== pageName) {
      currentUrl.searchParams.set('page', pageName);
      window.history.replaceState({ page: pageName }, '', currentUrl.toString());
    }
  } catch (e) { }

  if (pageName === 'investigation') {
    const invFrame = document.getElementById('investigation-frame');
    if (invFrame && typeof adjustInvestigationFrameHeight === 'function') {
      setTimeout(() => adjustInvestigationFrameHeight(invFrame), 100);
    }
  } else if (pageName === 'lostcar') {
    const lostFrame = document.getElementById('lostcar-frame');
    if (lostFrame && typeof adjustLostcarFrameHeight === 'function') {
      setTimeout(() => adjustLostcarFrameHeight(lostFrame), 100);
    }
  } else if (pageName === 'knowledge') {
    const knowFrame = document.getElementById('knowledge-frame');
    if (knowFrame && typeof adjustKnowledgeFrameHeight === 'function') {
      setTimeout(() => adjustKnowledgeFrameHeight(knowFrame), 100);
    }
  }

  // อัปเดต top nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const topNavBtn = document.querySelector(`.nav-btn[onclick*="'${pageName}'"]`);
  if (topNavBtn) {
    topNavBtn.classList.add('active');
  }

  // ✅ อัปเดต bottom nav bar บน mobile
  document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
    btn.classList.remove('active-bottom');
    btn.style.color = '';
  });
  const activeBottomBtn = document.getElementById('bottom-btn-' + pageName);
  if (activeBottomBtn) {
    activeBottomBtn.classList.add('active-bottom');
  }

  if (pageName === 'search') {
    renderRecentSearches();
  }
}

// ตรวจสอบ Parameter หน้าเริ่มต้นจาก LIFF URL (e.g. ?page=lostcar หรือ ?page=timecal)
function checkInitialLiffRoute() {
  try {
    const params = new URLSearchParams(window.location.search);
    const targetPage = params.get('page');
    if (targetPage && document.getElementById('page-' + targetPage)) {
      showPage(targetPage);
    }
  } catch (e) {
    console.warn('Initial LIFF routing notice:', e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkInitialLiffRoute);
} else {
  setTimeout(checkInitialLiffRoute, 50);
}

window.addEventListener('popstate', function (e) {
  const page = (e.state && e.state.page) || new URLSearchParams(window.location.search).get('page') || 'report';
  if (document.getElementById('page-' + page)) {
    showPage(page);
  }
});

// ฟังก์ชันเคลียร์ผลลัพธ์ (รองรับโครงสร้างเดิมหากมีการเรียกใช้)
function clearResult() {
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');
  if (resultDiv) resultDiv.classList.add('hidden');
  if (statusMessage) {
    statusMessage.classList.add('hidden');
    statusMessage.innerHTML = '';
  }
}

// ฟังก์ชันเคลียร์ input fields (safe check)
function clearInputs() {
  currentActiveTemplateKey = '';
  document.querySelectorAll('.template-chip').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-blue-500', 'scale-105');
  });
  ['txtphone', 'txtip', 'txtid', 'txtvehicle', 'universal-search-input'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const idcheck = document.getElementById('idcheck');
  if (idcheck) idcheck.innerHTML = '';
}

// ดึงพิกัด GPS อัตโนมัติในเบื้องหลังตอนเริ่มต้น (แบบ Silent ไม่แสดง Pop-up กวนใจ)
getLocation(false);
let lat, lon;

async function getLocation(isManualClick = true) {
  const latlongInput = document.getElementById("latlong");

  if (!latlongInput) {
    return;
  }

  // แสดง Loading เฉพาะเมื่อผู้ใช้กดปุ่มเอง
  if (isManualClick) {
    Swal.fire({
      title: 'กำลังค้นหาพิกัด GPS...',
      text: 'กรุณารอสักครู่ ระบบกำลังจับสัญญาณดาวเทียมในพื้นที่',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  // ตรวจสอบความพร้อมของระบบ Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;

        // ส่งค่าเข้าระบุใน Textbox
        latlongInput.value = `${lat.toFixed(8)},${lon.toFixed(8)}`;

        // แจ้งเตือนสําเร็จเฉพาะเมื่อผู้ใช้กดปุ่มเอง
        if (isManualClick) {
          Swal.fire({
            icon: 'success',
            title: 'ดึงพิกัดสำเร็จ!',
            text: `พิกัดปัจจุบัน: ${latlongInput.value}`,
            timer: 1500,
            showConfirmButton: false
          });
        }
      },
      (error) => {
        console.error("Geolocation Error Code:", error.code);
        if (isManualClick) {
          handleLocationError(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    if (isManualClick) {
      Swal.fire({
        icon: 'error',
        title: 'ไม่รองรับ GPS',
        text: 'อุปกรณ์หรือบราวเซอร์นี้ไม่รองรับระบบระบุพิกัดดาวเทียม'
      });
    }
  }
}

// ฟังก์ชันดักจับกรณีดึงพิกัดไม่สำเร็จ
function handleLocationError(error) {
  let errorMsg = "ไม่สามารถเข้าถึงพิกัดได้";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      errorMsg = "ปฏิเสธการเข้าถึงสิทธิ์ GPS กรุณาเปิดสิทธิ์ระบุตำแหน่ง";
      break;
    case error.POSITION_UNAVAILABLE:
      errorMsg = "ไม่สามารถระบุตำแหน่งได้เนื่องจากสัญญาณดาวเทียมไม่เสถียร";
      break;
    case error.TIMEOUT:
      errorMsg = "หมดเวลารอคอยสัญญาณ GPS กรุณากดลองใหม่อีกครั้ง";
      break;
  }

  Swal.fire({
    icon: 'warning',
    title: 'ดึงพิกัดล้มเหลว',
    text: errorMsg,
    confirmButtonColor: '#f59e0b'
  });
}







function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      document.getElementById('latlong').value = lat + ',' + lng;
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ!',
        text: 'ได้ตำแหน่ง GPS แล้ว',
        confirmButtonColor: '#1e3a8a'
      });
    }, function (error) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถเข้าถึง GPS ได้',
        confirmButtonColor: '#dc2626'
      });
    });
  }
}

// ========================================
// SEARCH FUNCTIONS (แก้ไขใหม่ - รองรับ API)
// ========================================
// ฟังก์ชันดึงข้อมูล IP จาก API
/**
 * 1. ฟังก์ชันดึงข้อมูลรายละเอียดของ IP จาก API (คืนค่าเป็น Object)
 */
async function getIPFromAPI(userip) {
  try {
    // ปรับเป็น https:// เพื่อความปลอดภัยและทำงานบน Web App ได้เสถียรขึ้น
    const apiUrl = `https://ip-api.com/json/${userip}`;
    const response = await fetch(apiUrl);

    if (response.ok) {
      const data = await response.json();

      if (data.status === "success") {
        // ✅ เปลี่ยนเป็นส่งคู่วัตถุ (Object) กลับไปโดยตรง เพื่อให้ฟังก์ชันแสดงผลนำไปใช้ต่อได้
        return data;
      } else {
        // หาก API ส่งสถานะ fail กลับมา ให้โยน error ออกไป
        throw new Error(data.message || "ไม่สามารถดึงข้อมูลจากระบบได้");
      }
    } else {
      throw new Error(`Response code ${response.status}`);
    }
  } catch (error) {
    // ส่งต่อ Error ไปให้บล็อก catch ของฟังก์ชันหลักจัดการ
    throw error;
  }
}

/**
 * 2. ฟังก์ชันเรนเดอร์ข้อมูล IP ลงอินเตอร์เฟซ (Tailwind UI)
 */
function displayIPInfo(ipInfo) {
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');

  // 🗺️ แก้ไขรูปแบบลิงก์ Google Maps ให้เป็นมาตรฐานโลก
  const googleMapsUrl = `https://www.google.com/maps?q=${ipInfo.lat},${ipInfo.lon}`;

  statusMessage.innerHTML = `
        <div class="border-l-4 border-blue-500 pl-4 text-left">
            <h3 class="text-xl font-bold text-blue-700 mb-4">🌐 ผลการตรวจสอบ IP Address</h3>
            
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">IP Address</p>
                    <p class="text-lg font-bold text-blue-900">${ipInfo.query}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">ประเทศ</p>
                    <p class="text-lg font-bold text-green-900">${ipInfo.country} (${ipInfo.countryCode})</p>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">จังหวัด/รัฐ</p>
                    <p class="text-lg font-bold text-purple-900">${ipInfo.regionName || '-'}</p>
                </div>
                
                <div class="bg-orange-50 p-4 rounded-lg">
                    <p class="text-sm text-gray-600 mb-1">เมือง</p>
                    <p class="text-lg font-bold text-orange-900">${ipInfo.city || '-'}</p>
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <p class="text-sm font-bold text-gray-700 mb-2">📍 พิกัดโดยประมาณ (เสาสัญญาณ)</p>
                <p class="text-gray-800">Latitude: ${ipInfo.lat}, Longitude: ${ipInfo.lon}</p>
                <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="inline-block mt-2 text-blue-600 hover:text-blue-800 font-semibold hover:underline">
                    🗺️ เปิดใน Google Maps
                </a>
            </div>
            
            <div class="bg-indigo-50 p-4 rounded-lg mb-4">
                <p class="text-sm font-bold text-indigo-700 mb-2">🌐 ผู้ให้บริการ (ISP)</p>
                <p class="text-gray-800 mb-1"><strong>ISP:</strong> ${ipInfo.isp || '-'}</p>
                <p class="text-gray-800 mb-1"><strong>Organization:</strong> ${ipInfo.org || '-'}</p>
                <p class="text-gray-800"><strong>AS:</strong> ${ipInfo.as || '-'}</p>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm font-bold text-yellow-700 mb-2">🕐 เขตเวลา</p>
                <p class="text-gray-800">${ipInfo.timezone || '-'}</p>
            </div>
        </div>
    `;

  // เปิดซ่อน element เพื่อแสดงผลการสืบค้น
  if (resultDiv) resultDiv.classList.remove('hidden');
  if (statusMessage) statusMessage.classList.remove('hidden');

  // สั่งเลื่อนหน้าจอลงมาโฟกัสที่ผลลัพธ์อย่างนุ่มนวล
  statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 3. ฟังก์ชันหลักในการรับค่า ตรวจสอบ และควบคุม SweetAlert2
 */
async function checkIP() {
  const txtIpElement = document.getElementById('txtip');
  if (!txtIpElement) return;

  const ip = txtIpElement.value;
  if (!ip || ip.trim() === '') {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอก IP Address ให้ถูกต้อง',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  // แสดงกล่องสถานะกำลังโหลดข้อมูล
  Swal.fire({
    title: 'กำลังตรวจสอบ...',
    html: 'กรุณารอสักครู่ ระบบกำลังค้นหาฐานข้อมูลเครือข่าย',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    // เรียกใช้ API ข้อมูลจะคืนค่ามาเป็น Object นำไปส่งต่อได้ทันที
    const ipInfo = await getIPFromAPI(ip.trim());
    Swal.close();
    displayIPInfo(ipInfo);
  } catch (error) {
    // ตรวจจับและดักจับข้อผิดพลาดทั้งหมดมาแสดงผลที่หน้าจอ
    Swal.fire({
      icon: 'error',
      title: 'เกิดข้อผิดพลาด',
      text: error.message || 'ไม่สามารถดึงข้อมูล IP ได้',
      confirmButtonColor: '#dc2626'
    });
  }
}

function validateThaiID(id) {
  // ตรวจสอบความยาวของเลขบัตรประชาชน
  if (id.length !== 13) {
    return false;
  }
  // ตรวจสอบว่าเป็นตัวเลขทั้งหมดหรือไม่
  if (!/^\d{13}$/.test(id)) {
    return false;
  }
  // คำนวณเช็คดิจิตอล
  var sum = 0;
  for (var i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i)) * (13 - i);
  }
  var checkDigit = (11 - (sum % 11)) % 10;
  // เปรียบเทียบเช็คดิจิตอล
  return parseInt(id.charAt(12)) === checkDigit;
}

function validateIDCard() {
  const id = document.getElementById('txtid').value;
  const checkDiv = document.getElementById('idcheck');
  if (validateThaiID(id)) {
    checkDiv.innerHTML = '<span class="text-green-500 text-2xl">✅</span>';
  } else if (id.length > 0) {
    checkDiv.innerHTML = '<span class="text-red-500 text-2xl">❌</span>';
  } else {
    checkDiv.innerHTML = '';
  }
}


function checkIDCard() {
  const thaiID = document.getElementById('txtid').value;
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');

  if (!validateThaiID(thaiID)) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกหมายเลขบัตรประชาชนให้ถูกต้อง',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }
  // ส่งข้อความไปยัง Bot
  sendMessagebot('Id#' + thaiID);
  // แสดงผลใน div result
  statusMessage.innerHTML = `
        <div class="border-l-4 border-purple-500 pl-4">
            <h3 class="text-xl font-bold text-purple-700 mb-4">🆔 ผลการตรวจสอบบัตรประชาชน</h3>
            
            <div class="bg-green-50 p-4 rounded-lg mb-4">
                <p class="text-green-800 font-semibold mb-2">✅ หมายเลขบัตรถูกต้อง</p>
                <p class="text-gray-800"><strong>เลขบัตร:</strong> ${thaiID}</p>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg mb-4">
                <p class="text-sm font-bold text-blue-700 mb-2">📤 ส่งคำขอตรวจสอบแล้ว</p>
                <p class="text-sm text-blue-600">ระบบได้ส่งคำขอไปยัง Bot เรียบร้อยแล้ว</p>
                <p class="text-sm text-gray-600 mt-2">รหัสคำขอ: Id#${thaiID}</p>
            </div>
            
            <div class="bg-purple-50 p-4 rounded-lg">
                <p class="text-sm text-purple-800">💡 เมื่อเชื่อมต่อ API แล้ว จะแสดงข้อมูล:</p>
                <ul class="text-sm text-purple-700 mt-2 ml-4 list-disc">
                    <li>ชื่อ-นามสกุล</li>
                    <li>วันเกิด อายุ</li>
                    <li>ที่อยู่ตามทะเบียนบ้าน</li>
                    <li>สถานะบัตร (ใช้งานได้/หมดอายุ)</li>
                </ul>
            </div>
        </div>
    `;

  resultDiv.classList.remove('hidden');
  statusMessage.classList.remove('hidden');
  statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  // แสดง Success message
  Swal.fire({
    icon: 'success',
    title: 'ส่งคำขอสำเร็จ',
    text: 'ระบบกำลังตรวจสอบข้อมูล',
    timer: 2000,
    showConfirmButton: false
  });
}



function displaynetwork(info) {
  const resultDiv = document.getElementById('result');
  const statusMessage = document.getElementById('statusMessage');

  statusMessage.innerHTML = `
        <div class="border-l-4 border-green-500 pl-4">
            <h3 class="text-xl font-bold text-green-700 mb-4">📱 ผลการตรวจสอบเบอร์โทร</h3>
            
                <div class="bg-blue-50 p-4 rounded-lg">
                    <p class="text-lg font-bold text-blue-900">${info || 'ไม่ระบุ'}</p>
                </div>
                
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-blue-800">💡 หมายเหตุ: ข้อมูลที่แสดงขึ้นอยู่กับการเชื่อมต่อ API</p>
            </div>
        </div>
    `;

  resultDiv.classList.remove('hidden');
  statusMessage.classList.remove('hidden');
  statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function checkPhone() {
  const phone = document.getElementById('txtphone').value;

  if (!phone || phone.trim() === '') {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกหมายเลขโทรศัพท์ให้ถูกต้อง',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }
  // แสดง loading
  Swal.fire({
    title: 'กำลังตรวจสอบ...',
    html: 'กรุณารอสักครู่',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const network = await Checknetwork(phone);
    Swal.close();
    displaynetwork(network);
  } catch (error) {
    Swal.close();
    // แสดงข้อมูล Demo เมื่อ API ไม่พร้อม
    const demoInfo = {
      phone: phone,
      network: 'ตัวอย่าง - ต้องเชื่อมต่อ API',
      type: 'มือถือ',
      status: 'ไม่ทราบ'
    };
    displaynetwork(demoInfo);
    // แสดง warning
    Swal.fire({
      icon: 'info',
      title: 'แสดงข้อมูลตัวอย่าง',
      text: 'ต้องเชื่อมต่อ API เพื่อดูข้อมูลจริง',
      confirmButtonColor: '#3b82f6'
    });
  }
}

async function Checknetwork(phoneno) {
  try {
    const response = await fetch(`${GAS_URL}?phone=${phoneno}`);

    if (!response.ok) {
      return '❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
    }

    const text = await response.text(); // ✅ อ่านเป็นข้อความธรรมดา

    if (text.trim()) {
      return `📞 ผลการตรวจสอบ:\n${text}`;
    } else {
      return 'ไม่พบข้อมูลเบอร์โทรนี้';
    }

  } catch (error) {
    return '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ API';
  }
}


// ========================================
// APP FUNCTIONS
// ========================================
function openCustomUrl() {
  const url = document.getElementById('customAppUrl').value;
  if (!url) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณาใส่ URL',
      text: 'กรุณาใส่ URL ที่ต้องการเปิด',
      confirmButtonColor: '#f59e0b'
    });
    return;
  }

  // Validate URL format
  try {
    const urlObj = new URL(url);
    window.open(url, '_blank', 'noopener,noreferrer');

    Swal.fire({
      icon: 'success',
      title: 'เปิดแล้ว!',
      text: 'เปิดลิงก์ในแท็บใหม่แล้ว',
      timer: 2000,
      showConfirmButton: false
    });
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'URL ไม่ถูกต้อง',
      text: 'กรุณาใส่ URL ที่ถูกต้อง เช่น https://example.com',
      confirmButtonColor: '#dc2626'
    });
  }
}

function showComingSoon(featureName) {
  Swal.fire({
    icon: 'info',
    title: 'เร็วๆ นี้!',
    html: `<p class="text-gray-600">ฟีเจอร์ <strong class="text-police-blue">"${featureName}"</strong> กำลังอยู่ในระหว่างการพัฒนา</p>`,
    confirmButtonColor: '#6366f1',
    confirmButtonText: 'รับทราบ'
  });
}

function openCalculator() {
  Swal.fire({
    icon: 'info',
    title: 'เครื่องคิดเลข',
    text: 'กรุณาเปิดแอพเครื่องคิดเลขในอุปกรณ์ของคุณ หรือใช้เครื่องคิดเลขในเบราว์เซอร์',
    confirmButtonColor: '#14b8a6',
    showCancelButton: true,
    confirmButtonText: 'เปิดออนไลน์',
    cancelButtonText: 'ปิด'
  }).then((result) => {
    if (result.isConfirmed) {
      window.open('https://www.google.com/search?q=calculator', '_blank', 'noopener,noreferrer');
    }
  });
}

// ========================================
// OFFICER SELECTION HELPERS (ตรวจที่เกิดเหตุ)
// ========================================
function toggleOfficerDropdown() {
  const menu = document.getElementById('officer-dropdown-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

function selectOfficer(val) {
  const userInput = document.getElementById('user');
  if (userInput) {
    userInput.value = val;
    userInput.dispatchEvent(new Event('input', { bubbles: true }));
    userInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const menu = document.getElementById('officer-dropdown-menu');
  if (menu) menu.classList.add('hidden');

  // Highlight active chip
  document.querySelectorAll('.officer-chip').forEach(btn => {
    if (btn.textContent.includes(val)) {
      btn.classList.add('bg-blue-600', 'text-white', 'border-blue-600');
      btn.classList.remove('bg-blue-50', 'text-police-blue', 'border-blue-200');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white', 'border-blue-600');
      btn.classList.add('bg-blue-50', 'text-police-blue', 'border-blue-200');
    }
  });
}

function focusOfficerCustom() {
  const userInput = document.getElementById('user');
  if (userInput) {
    userInput.focus();
    userInput.select();
  }
  const menu = document.getElementById('officer-dropdown-menu');
  if (menu) menu.classList.add('hidden');
}

// Close officer dropdown when clicked outside
document.addEventListener('click', function (e) {
  const menu = document.getElementById('officer-dropdown-menu');
  const userEl = document.getElementById('user');
  const toggleBtn = e.target.closest('button[onclick="toggleOfficerDropdown()"]');
  if (menu && !menu.classList.contains('hidden')) {
    if (!menu.contains(e.target) && e.target !== userEl && !toggleBtn) {
      menu.classList.add('hidden');
    }
  }
});

// ========================================
// DETAIL QUICK TEMPLATES (ตรวจที่เกิดเหตุ - โหลดจากชีต ReportTemplates เท่านั้น)
// ========================================

let DETAIL_TEMPLATES = {};

function renderTemplateChips() {
  const container = document.getElementById('template-chips-container');
  if (!container) return;

  const keys = Object.keys(DETAIL_TEMPLATES || {});
  // ถ้าไม่มีข้อมูล หรือโหลดจากชีตไม่ได้ ให้ซ่อนและไม่แสดงปุ่ม
  if (keys.length === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  const colorStyles = [
    'bg-red-50 hover:bg-red-100 text-red-700 border-red-200',
    'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
    'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
    'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300',
    'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200',
    'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
  ];

  const chipsHtml = keys.map((key, idx) => {
    const tpl = DETAIL_TEMPLATES[key];
    const style = tpl.badgeClass || colorStyles[idx % colorStyles.length];
    const isSelected = (currentActiveTemplateKey === key);
    const selectedClass = isSelected ? 'ring-2 ring-blue-600 scale-105 font-black' : '';
    return `
      <button type="button" onclick="applyDetailTemplate('${key}')"
          class="template-chip px-2.5 py-1 text-xs font-bold rounded-lg border transition whitespace-nowrap flex items-center gap-1 shadow-sm ${style} ${selectedClass}">
          <span>${escapeHtml(tpl.name || key)}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <span class="text-xs font-bold text-police-blue whitespace-nowrap flex items-center gap-1">
        <span class="text-amber-500">⚡</span> เลือกด่วน:
    </span>
    ${chipsHtml}
    <button type="button" onclick="openTemplateSelectorModal()"
        class="template-chip px-2.5 py-1 bg-police-blue hover:bg-blue-900 text-white text-xs font-bold rounded-lg transition whitespace-nowrap flex items-center gap-1 shadow-sm"
        title="ดูรายการแม่แบบทั้งหมดพร้อมตัวอย่าง">
        <span>📑</span> ดูทั้งหมด...
    </button>
  `;
  container.classList.remove('hidden');
}

async function loadReportTemplatesFromGas() {
  const container = document.getElementById('template-chips-container');
  try {
    if (typeof callGasApi !== 'function') {
      DETAIL_TEMPLATES = {};
      if (container) {
        container.classList.add('hidden');
        container.innerHTML = '';
      }
      return;
    }

    const res = await callGasApi('getReportTemplates');
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      const gasTemplates = {};
      res.data.forEach((t, idx) => {
        const key = t.key || t.Template_Key || `tpl_${idx}`;
        const text = t.text || t.Template_Text || '';
        if (key && text) {
          gasTemplates[key] = {
            name: t.name || t.Template_Name || key,
            category: t.category || t.Category || 'ทั่วไป',
            text: text
          };
        }
      });

      if (Object.keys(gasTemplates).length > 0) {
        DETAIL_TEMPLATES = gasTemplates;
        renderTemplateChips();
        return;
      }
    }

    // หากไม่มีข้อมูลจากชีต หรือโหลดไม่ได้ ไม่แสดงปุ่มเลือกด่วน
    DETAIL_TEMPLATES = {};
    if (container) {
      container.classList.add('hidden');
      container.innerHTML = '';
    }
  } catch (e) {
    console.warn('โหลด ReportTemplates จากชีตไม่สำเร็จ (ไม่แสดงปุ่มเลือกด่วน):', e);
    DETAIL_TEMPLATES = {};
    if (container) {
      container.classList.add('hidden');
      container.innerHTML = '';
    }
  }
}

function applyDetailTemplate(templateKey) {
  const tpl = DETAIL_TEMPLATES[templateKey];
  if (!tpl) return;

  currentActiveTemplateKey = templateKey;

  const detailEl = document.getElementById('detail');
  const userEl = document.getElementById('user');
  if (!detailEl) return;

  // ปรับข้อความอัตโนมัติตามข้อมูลในฟอร์ม (Dynamic Placeholders)
  let text = tpl.text;
  const currentUser = userEl ? userEl.value.trim() : '';
  if (currentUser) {
    text = text.replace(/เจ้าหน้าที่สายตรวจ/g, currentUser);
  }

  const now = new Date();
  const timeNow = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} น.`;
  text = text.replace(/\[ระบุเวลา\]/g, timeNow);

  // อัปเดตไฮไลต์ชิปที่กำลังใช้งาน
  document.querySelectorAll('.template-chip').forEach(btn => {
    btn.classList.remove('ring-2', 'ring-blue-600', 'scale-105', 'font-black');
  });
  if (event && event.currentTarget && event.currentTarget.classList.contains('template-chip')) {
    event.currentTarget.classList.add('ring-2', 'ring-blue-600', 'scale-105', 'font-black');
  }

  const currentVal = detailEl.value.trim();

  // If empty, insert directly
  if (!currentVal) {
    detailEl.value = text;
    detailEl.focus();
    Swal.fire({
      icon: 'success',
      title: `ใส่แม่แบบ "${tpl.name}" เรียบร้อย`,
      timer: 1200,
      showConfirmButton: false
    });
    return;
  }

  // If already has text, give option to replace or append
  Swal.fire({
    title: `เลือกวิธีใส่แม่แบบ`,
    html: `
      <div class="text-left text-sm space-y-2">
        <p class="font-bold text-slate-800">แม่แบบ: <span class="text-blue-700">${tpl.name}</span></p>
        <p class="text-xs text-slate-500">ในช่องรายละเอียดมีข้อความเดิมอยู่แล้ว ท่านต้องการดำเนินการอย่างไร?</p>
        <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 font-mono max-h-24 overflow-y-auto">
          ${escapeHtml(text)}
        </div>
      </div>
    `,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: '🔄 เขียนทับข้อความเดิม',
    confirmButtonColor: '#1e3a8a',
    denyButtonText: '➕ ต่อท้ายข้อความเดิม',
    denyButtonColor: '#059669',
    cancelButtonText: 'ยกเลิก'
  }).then((result) => {
    if (result.isConfirmed) {
      detailEl.value = text;
      detailEl.focus();
      Swal.fire({ icon: 'success', title: 'เขียนทับข้อความแล้ว', timer: 1000, showConfirmButton: false });
    } else if (result.isDenied) {
      detailEl.value = currentVal + '\n\n' + text;
      detailEl.focus();
      Swal.fire({ icon: 'success', title: 'เพิ่มต่อท้ายข้อความแล้ว', timer: 1000, showConfirmButton: false });
    }
  });
}

function insertCurrentTime() {
  const detailEl = document.getElementById('detail');
  if (!detailEl) return;

  const now = new Date();
  const timeStr = `[เวลา ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.] `;

  const start = detailEl.selectionStart || 0;
  const end = detailEl.selectionEnd || 0;
  const val = detailEl.value;

  detailEl.value = val.substring(0, start) + timeStr + val.substring(end);
  detailEl.focus();
  detailEl.selectionStart = detailEl.selectionEnd = start + timeStr.length;

  Swal.fire({
    icon: 'success',
    title: 'แทรกเวลาปัจจุบันแล้ว',
    timer: 800,
    showConfirmButton: false
  });
}

async function pasteToDetail() {
  const detailEl = document.getElementById('detail');
  if (!detailEl) return;

  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      Swal.fire({ icon: 'info', title: 'คลิปบอร์ดว่างเปล่า' });
      return;
    }

    const start = detailEl.selectionStart || detailEl.value.length;
    const end = detailEl.selectionEnd || detailEl.value.length;
    const val = detailEl.value;

    detailEl.value = val.substring(0, start) + text + val.substring(end);
    detailEl.focus();
    Swal.fire({ icon: 'success', title: 'วางข้อความจากคลิปบอร์ดแล้ว', timer: 1000, showConfirmButton: false });
  } catch (e) {
    Swal.fire({ icon: 'info', title: 'ไม่สามารถอ่านคลิปบอร์ดได้', text: 'กรุณากด Ctrl+V หรือแตะค้างเพื่อวาง' });
  }
}

function clearDetail() {
  const detailEl = document.getElementById('detail');
  if (!detailEl || !detailEl.value.trim()) return;

  Swal.fire({
    title: 'ยืนยันล้างข้อความรายละเอียด?',
    text: 'ข้อความที่กรอกไว้ในช่องรายละเอียดจะถูกลบทั้งหมด',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'ล้างข้อความ',
    cancelButtonText: 'ยกเลิก'
  }).then((result) => {
    if (result.isConfirmed) {
      detailEl.value = '';
      currentActiveTemplateKey = '';
      document.querySelectorAll('.template-chip').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-blue-600', 'scale-105', 'font-black');
      });
      detailEl.focus();
    }
  });
}

function openTemplateSelectorModal() {
  const keys = Object.keys(DETAIL_TEMPLATES || {});
  if (keys.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ไม่พบแม่แบบรายงาน',
      text: 'ไม่สามารถโหลดแม่แบบจากชีต ReportTemplates ได้ หรือยังไม่มีการเพิ่มข้อมูลในชีต',
      confirmButtonColor: '#1e3a8a'
    });
    return;
  }

  const cardsHtml = keys.map(k => {
    const item = DETAIL_TEMPLATES[k];
    return `
      <div onclick="Swal.close(); applyDetailTemplate('${k}');" 
           class="text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer transition-all shadow-sm group">
        <div class="flex items-center justify-between mb-1.5">
          <span class="font-bold text-slate-800 text-sm group-hover:text-police-blue">${item.name}</span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">${item.category}</span>
        </div>
        <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">${escapeHtml(item.text)}</p>
      </div>
    `;
  }).join('');

  Swal.fire({
    title: '📑 เลือกแม่แบบบันทึกที่เกิดเหตุ',
    html: `
      <div class="text-left space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
        <p class="text-xs text-slate-500 mb-2">คลิกเลือกแม่แบบที่ตรงกับเหตุการณ์เพื่อนำไปใส่ในช่องรายละเอียด:</p>
        <div class="grid grid-cols-1 gap-2">
          ${cardsHtml}
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    width: '32rem'
  });
}














