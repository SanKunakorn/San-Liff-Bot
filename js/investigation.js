// ==========================================
// INVESTIGATION MODULE - MAIN SCRIPT
// ==========================================

// ---- ข้อมูลใน Memory ----
const invData = {
    suspects: JSON.parse(localStorage.getItem('inv_suspects') || '[]'),
    timeline: JSON.parse(localStorage.getItem('inv_timeline') || '[]'),
    sceneReports: JSON.parse(localStorage.getItem('inv_scene_reports') || '[]'),
};

let qrVideoStream = null;
let qrAnimFrame = null;

// ---- สลับ Tab ----
function switchInvTab(tab) {
    document.querySelectorAll('.inv-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.remove('active'));
    const section = document.getElementById('inv-section-' + tab);
    const tabBtn = document.getElementById('inv-tab-' + tab);
    if (section) section.classList.add('active');
    if (tabBtn) tabBtn.classList.add('active');

    // หยุดกล้องเมื่อเปลี่ยน tab
    if (tab !== 'qrscan') stopQRScanner();
}

// ==========================================
// SCENE REPORTS INTEGRATION (ตรวจที่เกิดเหตุ - แยกชีต SceneReports)
// ==========================================
async function fetchSceneReports(isManual = false) {
    const container = document.getElementById('scene-report-list');
    if (isManual && container) {
        container.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#64748b;"><div class="skeleton" style="width:100%;height:60px;margin-bottom:10px;"></div><p style="font-size:0.85rem;">กำลังโหลดข้อมูลจาก Google Sheets (SceneReports)...</p></div>';
    }

    try {
        let result;
        if (typeof callGasApi === 'function') {
            result = await callGasApi('getSceneReports');
        } else {
            const url = getGasApiUrl();
            const res = await fetch(`${url}?action=getSceneReports`);
            result = await res.json();
        }

        const dataArr = Array.isArray(result) ? result : (result && (result.data || result.reports || result.items));
        if (result && (result.success === true || result.status === 'success' || Array.isArray(dataArr))) {
            invData.sceneReports = Array.isArray(dataArr) ? dataArr : (result.data || []);
            invData.sceneReports.sort((a, b) => {
                const dtA = (a.date || a.createdAt || '') + ' ' + (a.time || '');
                const dtB = (b.date || b.createdAt || '') + ' ' + (b.time || '');
                return dtB.localeCompare(dtA);
            });
            localStorage.setItem('inv_scene_reports', JSON.stringify(invData.sceneReports));
            updateStats();
            renderSceneReports();
            if (isManual) showInvAlert('success', `ซิงค์ข้อมูลตรวจที่เกิดเหตุแล้ว (${invData.sceneReports.length} รายการ)`);
        } else {
            renderSceneReports();
        }
    } catch (err) {
        console.warn('Cannot fetch scene reports from GAS, using local cache:', err);
        renderSceneReports();
        if (isManual) showInvAlert('warning', 'ใช้งานข้อมูลออฟไลน์ (ไม่สามารถต่อชีตได้)');
    }
}

function renderSceneReports(filteredList = null) {
    const container = document.getElementById('scene-report-list');
    if (!container) return;
    const list = filteredList || invData.sceneReports || [];

    if (!list.length) {
        container.innerHTML = `
            <div style="text-align:center;padding:2.5rem;color:#94a3b8;">
                <div style="font-size:2.8rem;margin-bottom:8px;">📍</div>
                <p style="font-weight:700;color:#475569;font-size:1rem;">ยังไม่มีรายงานตรวจที่เกิดเหตุ</p>
                <p style="font-size:0.85rem;">เมื่อมีการบันทึกตรวจที่เกิดเหตุจากระบบใหม่ ข้อมูลจะจัดเก็บและแสดงที่นี่</p>
                <button onclick="fetchSceneReports(true)" class="btn-secondary" style="margin-top:10px;font-size:0.8rem;padding:6px 14px;">🔄 ซิงค์ข้อมูลชีต</button>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <h4 style="font-weight:800;color:#1e3a8a;margin:0;font-size:0.95rem;">📍 รายการตรวจที่เกิดเหตุ (${list.length} รายการ)</h4>
            <span style="font-size:0.75rem;color:#64748b;">จัดเก็บในชีต SceneReports</span>
        </div>
    ` + list.map(r => {
        const officerName = r.officer || r.Reporter || 'เจ้าหน้าที่';
        const dateStr = formatThaiDate(r.date || r.createdAt);
        const timeStr = r.time ? (r.time.endsWith('น.') ? r.time : `${r.time} น.`) : '';
        const mapUrl = r.mapLink || (r.latitude && r.longitude ? `https://maps.google.com/?q=${r.latitude},${r.longitude}` : (r.location && r.location.includes(',') ? `https://maps.google.com/?q=${r.location}` : ''));
        const details = r.details || r.Details || 'ตรวจความเรียบร้อยสถานที่เกิดเหตุ';

        let badgeBg = 'badge-blue';
        if (officerName.includes('สืบสวน')) badgeBg = 'badge-blue';
        else if (officerName.includes('20')) badgeBg = 'badge-red';
        else if (officerName.includes('เขต')) badgeBg = 'badge-green';
        else if (officerName.includes('ตู้ยาม')) badgeBg = 'badge-yellow';

        return `
        <div class="card-gradient" style="background:rgba(255,255,255,0.95);border:2px solid #e0e7ff;border-radius:14px;padding:14px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span class="badge ${badgeBg}">${officerName}</span>
                    <span style="font-weight:800;color:#1e3a8a;font-size:0.95rem;">${dateStr} ${timeStr}</span>
                    ${r.shift ? `<span style="font-size:0.75rem;color:#64748b;background:#f1f5f9;padding:2px 6px;border-radius:6px;">${r.shift}</span>` : ''}
                </div>
                ${r.id ? `<span style="font-size:0.75rem;color:#94a3b8;font-family:monospace;">#${r.id}</span>` : ''}
            </div>

            <div style="margin-top:8px;font-size:0.9rem;color:#334155;line-height:1.5;background:#f8fafc;padding:10px 12px;border-radius:10px;border:1px solid #f1f5f9;">
                📝 <b>รายละเอียด:</b> ${details}
            </div>

            ${r.location || mapUrl ? `
                <div style="margin-top:8px;font-size:0.82rem;color:#475569;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                    <span>📍 <b>พิกัด/สถานที่:</b> ${r.location || (r.latitude + ',' + r.longitude)}</span>
                    ${mapUrl ? `<a href="${mapUrl}" target="_blank" rel="noopener" style="color:#2563eb;font-weight:bold;text-decoration:underline;">เปิด Google Maps ↗</a>` : ''}
                </div>
            ` : ''}

            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;border-top:1px solid #f1f5f9;padding-top:10px;align-items:center;">
                <button class="btn-primary" onclick="importSceneToTimeline('${r.id}')" style="font-size:0.8rem;padding:6px 12px;background:linear-gradient(135deg,#7c3aed,#8b5cf6);display:flex;align-items:center;gap:4px;">
                    <span>➕</span> <span>นำเข้า Timeline คดี</span>
                </button>
                <button class="btn-secondary" onclick="createSuspectFromScene('${r.id}')" style="font-size:0.8rem;padding:6px 12px;display:flex;align-items:center;gap:4px;">
                    <span>🕵️</span> <span>เพิ่มเป็นบุคคลในคดี</span>
                </button>
                ${mapUrl ? `
                    <a href="${mapUrl}" target="_blank" rel="noopener" class="btn-secondary" style="font-size:0.8rem;padding:6px 10px;text-decoration:none;display:flex;align-items:center;gap:4px;">
                        <span>🗺️</span> <span>แผนที่</span>
                    </a>
                ` : ''}
                <button onclick="deleteSceneReportItem('${r.id}')" style="font-size:0.8rem;padding:6px 12px;background:#fee2e2;color:#dc2626;border:1px solid #fecaca;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:4px;margin-left:auto;font-weight:700;transition:all 0.2s;" onmouseover="this.style.background='#fca5a5'" onmouseout="this.style.background='#fee2e2'" title="ลบรายการตรวจที่เกิดเหตุนี้">
                    <span>🗑️</span> <span>ลบ</span>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

async function deleteSceneReportItem(id) {
    if (!id) return;

    if (typeof Swal !== 'undefined') {
        const confirmRes = await Swal.fire({
            title: 'ยืนยันการลบรายงาน?',
            text: 'ต้องการลบข้อมูลรายงานตรวจที่เกิดเหตุนี้ใช่หรือไม่ ข้อมูลในชีต SceneReports จะถูกลบออกถาวร',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: '🗑️ ลบรายงาน',
            cancelButtonText: 'ยกเลิก'
        });
        if (!confirmRes.isConfirmed) return;
    }

    // ลบออกจาก State และ Cache ในเครื่องทันที
    invData.sceneReports = (invData.sceneReports || []).filter(r => String(r.id) !== String(id));
    try {
        localStorage.setItem('inv_scene_reports', JSON.stringify(invData.sceneReports));
        localStorage.setItem('san_scene_reports_cache', JSON.stringify(invData.sceneReports));
    } catch(e) {}
    updateStats();
    renderSceneReports();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังลบข้อมูลจากชีต...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });
    }

    try {
        let res = null;
        if (typeof callGasApi === 'function') {
            res = await callGasApi('deleteSceneReport', { id: id }, 'POST');
        } else {
            const url = getGasApiUrl();
            const fetchRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'deleteSceneReport', id: id })
            });
            res = await fetchRes.json();
        }

        if (typeof Swal !== 'undefined') Swal.close();
        showInvAlert('success', 'ลบรายงานตรวจที่เกิดเหตุเรียบร้อยแล้ว');
    } catch (err) {
        if (typeof Swal !== 'undefined') Swal.close();
        console.warn('Delete SceneReport error:', err);
        showInvAlert('warning', 'ลบจากหน้าจอแล้ว แต่เชื่อมต่อชีตไม่สำเร็จ: ' + err.message);
    }
}

function filterSceneReports() {
    const officerFilter = (document.getElementById('scene-filter-officer') ? document.getElementById('scene-filter-officer').value : '').trim();
    const keyword = (document.getElementById('scene-search-keyword') ? document.getElementById('scene-search-keyword').value : '').toLowerCase().trim();

    const filtered = (invData.sceneReports || []).filter(r => {
        const off = (r.officer || r.Reporter || '').toLowerCase();
        const det = (r.details || r.Details || '').toLowerCase();
        const loc = (r.location || '').toLowerCase();
        const idStr = (r.id || '').toLowerCase();

        const matchOfficer = !officerFilter || off.includes(officerFilter.toLowerCase());
        const matchKw = !keyword || off.includes(keyword) || det.includes(keyword) || loc.includes(keyword) || idStr.includes(keyword);
        return matchOfficer && matchKw;
    });

    renderSceneReports(filtered);
}

async function importSceneToTimeline(reportId) {
    const report = (invData.sceneReports || []).find(r => String(r.id) === String(reportId));
    if (!report) {
        showInvAlert('warning', 'ไม่พบรายงานตรวจที่เกิดเหตุ');
        return;
    }
    const tlItem = {
        id: 'TL-SCN-' + (report.id || Date.now()),
        date: report.date || new Date().toISOString().split('T')[0],
        time: report.time || '12:00',
        location: report.location || report.mapLink || 'ที่เกิดเหตุ',
        event: `[ตรวจที่เกิดเหตุ] ${report.details || 'ตรวจสอบที่เกิดเหตุ'} (เจ้าหน้าที่: ${report.officer || 'สายตรวจ'})`,
        person: report.officer || 'ชุดตรวจที่เกิดเหตุ'
    };

    const exists = invData.timeline.some(t => t.id === tlItem.id || (t.event && t.event.includes(report.id)));
    if (exists) {
        showInvAlert('info', 'เหตุการณ์นี้อยู่ใน Timeline แล้ว');
        switchInvTab('timeline');
        return;
    }

    invData.timeline.push(tlItem);
    invData.timeline.sort((a, b) => ((a.date || a.timestamp || '') + (a.time || '')).localeCompare((b.date || b.timestamp || '') + (b.time || '')));
    localStorage.setItem('inv_timeline', JSON.stringify(invData.timeline));
    updateStats();
    renderTimeline();

    try {
        if (typeof callGasApi === 'function') {
            await callGasApi('createTimeline', tlItem, 'POST');
        } else {
            const url = getGasApiUrl();
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'createTimeline', data: tlItem, ...tlItem })
            });
        }
    } catch(e) {
        console.warn('Sync timeline to GAS failed:', e);
    }

    showInvAlert('success', 'นำเข้า Timeline สืบสวนเรียบร้อย');
    switchInvTab('timeline');
}

function createSuspectFromScene(reportId) {
    const report = (invData.sceneReports || []).find(r => String(r.id) === String(reportId));
    if (!report) return;
    switchInvTab('suspect');
    const noteEl = document.getElementById('inv-note');
    const addrEl = document.getElementById('inv-address');
    if (noteEl) {
        noteEl.value = `[เชื่อมโยงจากตรวจที่เกิดเหตุ ID: ${report.id || ''}] วันที่: ${report.date || ''} โดย: ${report.officer || ''}\nรายละเอียด: ${report.details || ''}`;
    }
    if (addrEl && report.location) {
        addrEl.value = report.location;
    }
    const fnameEl = document.getElementById('inv-fname');
    if (fnameEl) fnameEl.focus();
    showInvAlert('info', 'คัดลอกข้อมูลจากที่เกิดเหตุลงฟอร์มแล้ว');
}

function goToNewSceneReport() {
    if (window.self !== window.top) {
        try {
            if (window.parent && typeof window.parent.showPage === 'function') {
                window.parent.showPage('report');
                return;
            }
        } catch(e) {}
    }
    window.location.href = 'index.html';
}

// ==========================================
// TARGET TRACKING (แกะรอยเป้าหมาย & TELEGRAM / FLEX)
// ==========================================
function generateSuspectTrackingLink(suspectId) {
    const suspect = (invData.suspects || []).find(s => String(s.id) === String(suspectId));
    if (!suspect) {
        showInvAlert('warning', 'ไม่พบข้อมูลเป้าหมาย');
        return;
    }
    const name = (suspect.fname || '') + ' ' + (suspect.lname || '');
    const phone = suspect.phone || '';
    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const trackUrl = `${basePath}/link.html?target=${encodeURIComponent(suspect.id)}&name=${encodeURIComponent(name.trim())}&campaign=investigation`;
    const flexUrl = `tracking.html?targetId=${encodeURIComponent(suspect.id)}&targetName=${encodeURIComponent(name.trim())}&phone=${encodeURIComponent(phone)}`;

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: `🎯 แคมเปญแกะรอย: ${name.trim() || 'เป้าหมาย'}`,
            html: `
                <div style="text-align:left;font-size:0.9rem;">
                    <div style="background:#f1f5f9;padding:12px;border-radius:12px;margin-bottom:12px;">
                        <div style="font-weight:bold;color:#1e3a8a;margin-bottom:6px;">🔗 ลิงก์ดักพิกัด & ถ่ายภาพ (Silent Camera / GPS):</div>
                        <input type="text" id="swal-track-url" value="${trackUrl}" readonly style="width:100%;padding:8px;font-size:0.8rem;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-family:monospace;">
                        <button onclick="copyToClipboard('${trackUrl}'); showInvAlert('success', 'คัดลอกลิงก์ดักพิกัดแล้ว');" style="margin-top:8px;width:100%;padding:8px;background:#10b981;color:white;border:none;border-radius:8px;font-weight:bold;font-size:0.85rem;cursor:pointer;">📋 คัดลอกลิงก์นี้</button>
                    </div>
                    <div style="margin-bottom:14px;color:#475569;font-size:0.82rem;line-height:1.5;">
                        💡 <b>การทำงาน:</b> เมื่อเป้าหมายกดเปิดลิงก์นี้ ระบบจะจับพิกัดดาวเทียม, ลายนิ้วมือเครื่อง และถ่ายภาพส่งเข้า <b>Telegram Bot</b> ทันที
                    </div>
                    <div>
                        <a href="${flexUrl}" target="_blank" style="display:block;text-align:center;padding:10px;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;text-decoration:none;border-radius:10px;font-weight:bold;font-size:0.85rem;box-shadow:0 4px 12px rgba(2,132,199,0.3);">
                            ⚡ เปิดห้องสร้างสื่อล่อลวง & ดักพิกัด (Tracking Studio)
                        </a>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: 520
        });
    } else {
        copyToClipboard(trackUrl);
        alert('คัดลอกลิงก์แกะรอยแล้ว: ' + trackUrl);
    }
}

function generateCustomTrackingLink() {
    const targetName = (document.getElementById('track-target-name') ? document.getElementById('track-target-name').value : '').trim();
    const targetPhone = (document.getElementById('track-target-phone') ? document.getElementById('track-target-phone').value : '').trim();
    const targetTheme = (document.getElementById('track-target-theme') ? document.getElementById('track-target-theme').value : 'flash');
    const targetCase = (document.getElementById('track-target-case') ? document.getElementById('track-target-case').value : '').trim();

    const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const targetId = 'TRK-' + Date.now();
    const trackUrl = `${basePath}/link.html?target=${encodeURIComponent(targetId)}&name=${encodeURIComponent(targetName || 'เป้าหมาย')}&phone=${encodeURIComponent(targetPhone)}&theme=${encodeURIComponent(targetTheme)}&case=${encodeURIComponent(targetCase)}`;

    const resultBox = document.getElementById('track-link-result-box');
    const urlInput = document.getElementById('track-generated-url');
    if (resultBox && urlInput) {
        urlInput.value = trackUrl;
        resultBox.style.display = 'block';
    }
    showInvAlert('success', 'สร้างลิงก์ดักพิกัดสำเร็จ!');
}

function copyGeneratedTrackUrl() {
    const urlInput = document.getElementById('track-generated-url');
    if (urlInput && urlInput.value) {
        copyToClipboard(urlInput.value);
        showInvAlert('success', 'คัดลอกลิงก์แล้ว สามารถส่งให้เป้าหมายได้ทันที');
    }
}

function openFlexStudioDirect() {
    const targetName = (document.getElementById('track-target-name') ? document.getElementById('track-target-name').value : '').trim();
    const targetPhone = (document.getElementById('track-target-phone') ? document.getElementById('track-target-phone').value : '').trim();
    const flexUrl = `tracking.html?targetName=${encodeURIComponent(targetName)}&phone=${encodeURIComponent(targetPhone)}`;
    window.open(flexUrl, '_blank');
}

async function testTelegramBotPing() {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังทดสอบเชื่อมต่อ Telegram Bot...',
            text: 'ตรวจสอบสัญญาณผ่าน Google Apps Script Backend Proxy',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    try {
        // 1. ทดสอบผ่าน Google Apps Script Backend Proxy (ปลอดภัยสูงสุด ไม่ต้องเปิดเผย Bot Token บนเว็บ)
        if (typeof callGasApi === 'function') {
            const gasRes = await callGasApi('testTelegram');
            if (gasRes && gasRes.success) {
                if (typeof Swal !== 'undefined') Swal.close();
                showInvAlert('success', `เชื่อมต่อ Telegram Bot ผ่าน Server สำเร็จ! (${gasRes.botName || 'Bot'} ออนไลน์)`);
                return;
            }
        }

        // 2. Fallback: หากยังไม่ได้ตั้งใน GAS ตรวจสอบใน localStorage หรือ config
        const token = localStorage.getItem('SANBOT_TELEGRAM_BOT_TOKEN') || (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM_BOT_TOKEN) || '';
        const chatId = localStorage.getItem('SANBOT_TELEGRAM_CHAT_ID') || (typeof CONFIG !== 'undefined' && CONFIG.TELEGRAM_CHAT_ID) || '';

        if (!token || !chatId) {
            if (typeof Swal !== 'undefined') Swal.close();
            showInvAlert('warning', 'ยังไม่ได้ตั้งค่า TELEGRAM_BOT_TOKEN ใน Script Properties ของ Apps Script หรือในระบบ');
            return;
        }

        const msg = `🔔 *[San BOT - Investigation Hub]*\nทดสอบสัญญาณเชื่อมต่อระบบสืบสวนและแกะรอยเป้าหมาย\n⏰ เวลา: ${new Date().toLocaleString('th-TH')}`;
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: msg,
                parse_mode: 'Markdown'
            })
        });
        const data = await res.json();
        if (typeof Swal !== 'undefined') Swal.close();
        if (data.ok) {
            showInvAlert('success', 'เชื่อมต่อ Telegram Bot สำเร็จ! ข้อความส่งถึงแล้ว');
        } else {
            showInvAlert('error', 'เชื่อมต่อไม่สำเร็จ: ' + (data.description || 'Unknown error'));
        }
    } catch(err) {
        if (typeof Swal !== 'undefined') Swal.close();
        showInvAlert('error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ Telegram: ' + err.message);
    }
}

// ==========================================
// TAB 1: SUSPECT RECORD
// ==========================================
function getGasApiUrl() {
    return (typeof CONFIG !== 'undefined' && CONFIG.GAS_URL_LOSTCAR) ? CONFIG.GAS_URL_LOSTCAR : ((typeof CONFIG !== 'undefined' && CONFIG.GAS_URL) ? CONFIG.GAS_URL : (window.GAS_URL || ''));
}

async function fetchSuspects(isManual = false) {
    const container = document.getElementById('suspect-list');
    if (isManual && container) {
        container.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#64748b;"><div class="skeleton" style="width:100%;height:60px;margin-bottom:10px;"></div><p style="font-size:0.85rem;">กำลังโหลดข้อมูลจาก Google Sheets...</p></div>';
    }

    try {
        let result;
        if (typeof callGasApi === 'function') {
            result = await callGasApi('readSuspects');
        } else {
            const url = getGasApiUrl();
            const res = await fetch(`${url}?action=readSuspects`);
            result = await res.json();
        }

        const dataArr = Array.isArray(result) ? result : (result && (result.data || result.items || result.notes));
        if (result && (result.status === 'success' || result.success === true || Array.isArray(dataArr))) {
            invData.suspects = Array.isArray(dataArr) ? dataArr : (result.data || []);
            localStorage.setItem('inv_suspects', JSON.stringify(invData.suspects));
            updateStats();
            renderSuspectList();
            if (isManual) showInvAlert('success', 'ซิงค์ข้อมูลสายสืบเรียบร้อยแล้ว');
        } else {
            renderSuspectList();
        }
    } catch (err) {
        console.warn('Cannot fetch suspects from GAS, using local cache:', err);
        renderSuspectList();
        if (isManual) showInvAlert('warning', 'ใช้งานข้อมูลออฟไลน์ (ไม่สามารถต่อชีตได้)');
    }
}

async function saveSuspect() {
    const fname = document.getElementById('inv-fname').value.trim();
    const lname = document.getElementById('inv-lname').value.trim();
    if (!fname && !lname) {
        showInvAlert('warning', 'กรุณากรอกชื่อ-นามสกุล');
        return;
    }
    const suspect = {
        id: 'INV-' + Date.now(),
        fname, lname,
        age: document.getElementById('inv-age').value,
        gender: document.getElementById('inv-gender').value,
        role: document.getElementById('inv-role').value,
        phone: document.getElementById('inv-phone').value.trim(),
        address: document.getElementById('inv-address').value.trim(),
        appearance: document.getElementById('inv-appearance').value.trim(),
        note: document.getElementById('inv-note').value.trim(),
        savedAt: new Date().toLocaleString('th-TH')
    };

    // บันทึกลง local ทันทีเพื่อความรวดเร็ว
    invData.suspects.unshift(suspect);
    localStorage.setItem('inv_suspects', JSON.stringify(invData.suspects));
    updateStats();
    renderSuspectList();
    clearSuspectForm();

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังบันทึกลง Google Sheets...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    try {
        if (typeof callGasApi === 'function') {
            await callGasApi('createSuspect', suspect, 'POST');
        } else {
            const url = getGasApiUrl();
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'createSuspect', data: suspect, ...suspect })
            });
        }
        if (typeof Swal !== 'undefined') Swal.close();
        showInvAlert('success', 'บันทึกข้อมูลและส่งชีตเรียบร้อย');
    } catch (e) {
        if (typeof Swal !== 'undefined') Swal.close();
        showInvAlert('info', 'บันทึกในเครื่องแล้ว (จะอัปเดตชีตเมื่อมีเน็ต)');
    }
}

function renderSuspectList() {
    const container = document.getElementById('suspect-list');
    if (!container) return;
    if (!invData.suspects.length) {
        container.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#94a3b8;"><div style="font-size:2rem;">📋</div><p style="font-weight:600;">ยังไม่มีบันทึก</p></div>';
        return;
    }
    container.innerHTML = `<h4 style="font-weight:800;color:#1e3a8a;margin-bottom:10px;">📋 บันทึกที่บันทึกไว้ (${invData.suspects.length} รายการ)</h4>` +
    invData.suspects.map(s => {
        const titleName = (s.fname || s.officerName || s.title || '') + ' ' + (s.lname || '');
        const roleText = s.role || s.noteType || s.officerRank || 'ข้อมูลสืบสวน';
        const detailText = s.note || s.content || s.details || '';
        const badgeColor = roleText.includes('ผู้ต้องสงสัย') ? 'badge-red' : (roleText.includes('พยาน') ? 'badge-blue' : 'badge-amber');

        return `
        <div class="card-gradient" style="background:rgba(255,255,255,0.95);border:2px solid #e0e7ff;border-radius:14px;padding:14px;margin-bottom:10px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;">
                <div>
                    <span class="badge ${badgeColor}">${roleText}</span>
                    <span style="font-weight:800;color:#1e3a8a;font-size:1rem;margin-left:6px;">${titleName || 'ไม่ระบุชื่อ'}</span>
                    ${s.age ? `<span style="font-size:0.8rem;color:#64748b;">(${s.age} ปี / ${s.gender||'-'})</span>` : ''}
                </div>
                <button class="btn-danger" onclick="deleteSuspect('${s.id}')" style="padding:4px 10px;font-size:0.8rem;">🗑️ ลบ</button>
            </div>
            ${s.phone ? `<div style="margin-top:6px;font-size:0.85rem;color:#334155;">📞 <b>เบอร์:</b> <a href="tel:${s.phone}" style="color:#2563eb;">${s.phone}</a></div>` : ''}
            ${s.appearance ? `<div style="margin-top:4px;font-size:0.85rem;color:#334155;">👁️ <b>รูปพรรณ:</b> ${s.appearance}</div>` : ''}
            ${s.address ? `<div style="margin-top:4px;font-size:0.85rem;color:#334155;">📍 <b>ที่อยู่/สถานที่:</b> ${s.address}</div>` : ''}
            ${detailText ? `<div style="margin-top:6px;font-size:0.85rem;color:#d97706;background:#fffbeb;padding:8px 10px;border-radius:8px;border:1px solid #fef3c7;">📝 ${detailText}</div>` : ''}
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9;flex-wrap:wrap;gap:8px;">
                <button class="btn-copy" onclick="generateSuspectTrackingLink('${s.id}')" style="background:linear-gradient(135deg,#4f46e5,#6366f1);font-size:0.8rem;padding:5px 12px;border-radius:8px;display:flex;align-items:center;gap:4px;">
                    <span>🎯</span> <span>สร้างลิงก์แกะรอย (Flex/Telegram)</span>
                </button>
                <div style="font-size:0.75rem;color:#94a3b8;">บันทึก: ${s.savedAt || s.createdAt || '-'}</div>
            </div>
        </div>
        `;
    }).join('');
}

async function deleteSuspect(id) {
    if (typeof Swal !== 'undefined') {
        const confirmRes = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: 'ต้องการลบข้อมูลนี้ใช่หรือไม่',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบข้อมูล',
            cancelButtonText: 'ยกเลิก'
        });
        if (!confirmRes.isConfirmed) return;
    }

    invData.suspects = invData.suspects.filter(s => String(s.id) !== String(id));
    localStorage.setItem('inv_suspects', JSON.stringify(invData.suspects));
    updateStats();
    renderSuspectList();

    try {
        if (typeof callGasApi === 'function') {
            await callGasApi('deleteSuspect', { id }, 'POST');
        } else {
            const url = getGasApiUrl();
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'deleteSuspect', id: id })
            });
        }
        showInvAlert('success', 'ลบข้อมูลเรียบร้อยแล้ว');
    } catch (e) {
        console.warn('Cannot delete from GAS:', e);
    }
}

function clearSuspectForm() {
    ['inv-fname','inv-lname','inv-age','inv-phone','inv-address','inv-appearance','inv-note'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    ['inv-gender','inv-role'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.selectedIndex = 0;
    });
}

// ==========================================
// TAB 2: TIMELINE
// ==========================================
async function fetchTimeline(isManual = false) {
    const container = document.getElementById('timeline-display');
    if (isManual && container) {
        container.innerHTML = '<div style="text-align:center;padding:1.5rem;color:#64748b;"><div class="skeleton" style="width:100%;height:60px;margin-bottom:10px;"></div><p style="font-size:0.85rem;">กำลังโหลด Timeline จาก Google Sheets...</p></div>';
    }

    try {
        let result;
        if (typeof callGasApi === 'function') {
            result = await callGasApi('readTimeline');
        } else {
            const url = getGasApiUrl();
            const res = await fetch(`${url}?action=readTimeline`);
            result = await res.json();
        }

        const dataArr = Array.isArray(result) ? result : (result && (result.data || result.items || result.timeline));
        if (result && (result.status === 'success' || result.success === true || Array.isArray(dataArr))) {
            invData.timeline = Array.isArray(dataArr) ? dataArr : (result.data || []);
            invData.timeline.sort((a, b) => ((a.date || a.timestamp || '') + (a.time || '')).localeCompare((b.date || b.timestamp || '') + (b.time || '')));
            localStorage.setItem('inv_timeline', JSON.stringify(invData.timeline));
            updateStats();
            renderTimeline();
            if (isManual) showInvAlert('success', 'ซิงค์ข้อมูล Timeline เรียบร้อยแล้ว');
        } else {
            renderTimeline();
        }
    } catch (err) {
        console.warn('Cannot fetch timeline from GAS, using local cache:', err);
        renderTimeline();
        if (isManual) showInvAlert('warning', 'ใช้งานข้อมูลออฟไลน์ (ไม่สามารถต่อชีตได้)');
    }
}

async function addTimelineEvent() {
    const date = document.getElementById('tl-date').value;
    const time = document.getElementById('tl-time').value;
    const location = document.getElementById('tl-location').value.trim();
    const event = document.getElementById('tl-event').value.trim();
    const person = document.getElementById('tl-person').value.trim();

    if (!date || !event) {
        showInvAlert('warning', 'กรุณากรอกวันที่และรายละเอียดเหตุการณ์');
        return;
    }
    const tlItem = {
        id: 'TL-' + Date.now(),
        date, time, location, event, person
    };
    invData.timeline.push(tlItem);
    invData.timeline.sort((a, b) => ((a.date || a.timestamp || '') + (a.time || '')).localeCompare((b.date || b.timestamp || '') + (b.time || '')));
    localStorage.setItem('inv_timeline', JSON.stringify(invData.timeline));
    updateStats();
    renderTimeline();

    // Clear fields
    ['tl-date','tl-time','tl-location','tl-event','tl-person'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'กำลังบันทึกลง Google Sheets...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });
    }

    try {
        if (typeof callGasApi === 'function') {
            await callGasApi('createTimeline', tlItem, 'POST');
        } else {
            const url = getGasApiUrl();
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'createTimeline', data: tlItem, ...tlItem })
            });
        }
        if (typeof Swal !== 'undefined') Swal.close();
        showInvAlert('success', 'เพิ่มเหตุการณ์และบันทึกลงชีตเรียบร้อย');
    } catch (e) {
        if (typeof Swal !== 'undefined') Swal.close();
        showInvAlert('info', 'บันทึกในเครื่องแล้ว (จะอัปเดตชีตเมื่อมีเน็ต)');
    }
}

function renderTimeline() {
    const container = document.getElementById('timeline-display');
    if (!container) return;
    if (!invData.timeline.length) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><div style="font-size:3rem;">⏱️</div><p style="font-weight:600;">ยังไม่มีเหตุการณ์</p></div>';
        return;
    }
    container.innerHTML = `<h4 style="font-weight:800;color:#1e3a8a;margin-bottom:12px;">📅 Timeline เหตุการณ์ (${invData.timeline.length} รายการ)</h4>` +
    invData.timeline.map((item, i) => {
        let dVal = item.date;
        let tVal = item.time || '';
        if (!dVal || dVal.startsWith('RPT-') || dVal.startsWith('CASE-')) {
            if (item.time && item.time.includes('-')) {
                const p = item.time.split(/[\sT]+/);
                dVal = p[0];
                tVal = p[1] || '';
            } else if (item.timestamp && item.timestamp.includes('-')) {
                const p = item.timestamp.split(/[\sT]+/);
                dVal = p[0];
                tVal = p[1] || '';
            }
        }
        const badgeDate = formatThaiDate(dVal);
        const badgeTime = tVal ? (tVal.endsWith('น.') ? tVal : `${tVal} น.`) : '';
        const eventText = item.event || item.detail || item.title || '-';

        return `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div style="background:rgba(255,255,255,0.9);border:2px solid #e0e7ff;border-radius:14px;padding:12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;">
                    <div>
                        <span class="badge badge-blue">${badgeDate} ${badgeTime}</span>
                        ${item.location ? `<span style="font-size:0.82rem;color:#64748b;margin-left:6px;">📍 ${item.location}</span>` : ''}
                    </div>
                    <button class="btn-danger" onclick="deleteTimeline('${item.id}')" style="padding:3px 8px;font-size:0.75rem;">🗑️</button>
                </div>
                <p style="margin:8px 0 0;color:#1e293b;font-size:0.9rem;line-height:1.5;">${eventText}</p>
                ${item.person ? `<div style="margin-top:6px;font-size:0.82rem;color:#7c3aed;">👤 ${item.person}</div>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

async function deleteTimeline(id) {
    if (typeof Swal !== 'undefined') {
        const confirmRes = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: 'ต้องการลบเหตุการณ์นี้ออกจาก Timeline ใช่หรือไม่',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ลบเหตุการณ์',
            cancelButtonText: 'ยกเลิก'
        });
        if (!confirmRes.isConfirmed) return;
    }

    invData.timeline = invData.timeline.filter(t => t.id !== id);
    localStorage.setItem('inv_timeline', JSON.stringify(invData.timeline));
    updateStats();
    renderTimeline();

    const url = getGasApiUrl();
    if (url) {
        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ action: 'deleteTimeline', id: id })
            });
            showInvAlert('success', 'ลบเหตุการณ์เรียบร้อยแล้ว');
        } catch (e) {
            console.warn('Cannot delete timeline item from GAS:', e);
        }
    }
}

function exportTimeline() {
    if (!invData.timeline.length) {
        showInvAlert('warning', 'ยังไม่มีเหตุการณ์ใน Timeline');
        return;
    }
    const text = 'TIMELINE เหตุการณ์\n' + '='.repeat(40) + '\n\n' +
        invData.timeline.map((item, i) => 
            `[${i+1}] ${formatThaiDate(item.date)} ${item.time || ''}\n` +
            `📍 สถานที่: ${item.location || '-'}\n` +
            `📝 เหตุการณ์: ${item.event}\n` +
            (item.person ? `👤 บุคคล: ${item.person}\n` : '') +
            '─'.repeat(30)
        ).join('\n');
    copyToClipboard(text);
    showInvAlert('success', 'คัดลอก Timeline แล้ว');
}

/**
 * สร้างหน้าต่างรายงานราชการสำหรับการพิมพ์และบันทึกเป็น PDF
 */
function printOfficialInvestigationReport() {
    if (!invData.timeline.length && !invData.suspects.length) {
        showInvAlert('warning', 'ไม่มีข้อมูลสายสืบหรือ Timeline สำหรับสร้างรายงาน');
        return;
    }

    const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
    const officerName = currentUser ? `${currentUser.rank || ''} ${currentUser.name || ''}`.trim() : 'เจ้าหน้าที่ชุดสืบสวน';
    const reportDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    let suspectsTableRows = '';
    if (invData.suspects.length > 0) {
        suspectsTableRows = invData.suspects.map((s, i) => {
            const ageText = s.age ? ('อายุ ' + s.age + ' ปี / ' + (s.gender || '-')) : '';
            const appText = s.appearance ? ('<div><b>รูปพรรณ:</b> ' + s.appearance + '</div>') : '';
            const addrText = s.address ? ('<div><b>ที่อยู่:</b> ' + s.address + '</div>') : '';
            const noteText = s.note ? ('<div><b>หมายเหตุ:</b> ' + s.note + '</div>') : '';
            return '<tr>' +
                '<td style="text-align:center;">' + (i + 1) + '</td>' +
                '<td><b>' + s.fname + ' ' + s.lname + '</b><br><small>' + ageText + '</small></td>' +
                '<td>' + (s.role || 'ทั่วไป') + '</td>' +
                '<td>' + (s.phone || '-') + '</td>' +
                '<td>' + appText + addrText + noteText + '</td>' +
                '</tr>';
        }).join('');
    }

    let timelineTableRows = '';
    if (invData.timeline.length > 0) {
        timelineTableRows = invData.timeline.map((t, i) => {
            let dVal = t.date;
            let tVal = t.time || '-';

            // ถ้า t.date ไม่มี หรือมี Case ID ปนมา ให้ดึงจาก time/timestamp
            if (!dVal || dVal.startsWith('RPT-') || dVal.startsWith('CASE-')) {
                if (t.time && t.time.includes('-')) {
                    const p = t.time.split(/[\sT]+/);
                    dVal = p[0];
                    tVal = p[1] || '-';
                } else if (t.timestamp && t.timestamp.includes('-')) {
                    const p = t.timestamp.split(/[\sT]+/);
                    dVal = p[0];
                    tVal = p[1] || '-';
                }
            }

            const formattedDate = formatThaiDate(dVal);
            const formattedTime = (tVal && tVal !== '-') ? (tVal.endsWith('น.') ? tVal : `${tVal} น.`) : '-';

            return '<tr>' +
                '<td style="text-align:center;">' + (i + 1) + '</td>' +
                '<td>' + formattedDate + '<br><b>เวลา:</b> ' + formattedTime + '</td>' +
                '<td>' + (t.location || '-') + '</td>' +
                '<td>' + (t.event || t.detail || t.title || '-') + '</td>' +
                '<td>' + (t.person || t.source || '-') + '</td>' +
                '</tr>';
        }).join('');
    }

    // สร้าง In-Page Modal สำหรับดูตัวอย่างและพิมพ์บนมือถือ/PC
    let modalEl = document.getElementById('report-print-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'report-print-modal';
        modalEl.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.85);backdrop-filter:blur(4px);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;';
        document.body.appendChild(modalEl);
    }

    const reportContentHtml = `
        <div id="print-area" style="background:#fff;color:#000;padding:24px;border-radius:16px;max-width:850px;width:100%;max-height:82vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);font-family:'Sarabun',sans-serif;font-size:14px;line-height:1.6;">
            <!-- Modal Header Actions -->
            <div class="no-print" style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:18px;position:sticky;top:0;background:#fff;z-index:10;">
                <div style="font-weight:800;color:#1e3a8a;font-size:16px;display:flex;align-items:center;gap:6px;">
                    <span>📄</span> <span>ตัวอย่างรายงานการสืบสวน</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button onclick="triggerDirectPrint()" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;font-weight:700;padding:8px 14px;border-radius:10px;border:none;cursor:pointer;font-size:13px;box-shadow:0 4px 10px rgba(37,99,235,0.3);">
                        🖨️ พิมพ์ / บันทึก PDF
                    </button>
                    <button onclick="copyFullReportText()" style="background:#f1f5f9;color:#334155;font-weight:700;padding:8px 12px;border-radius:10px;border:1px solid #cbd5e1;cursor:pointer;font-size:13px;">
                        📋 คัดลอก
                    </button>
                    <button onclick="closePrintModal()" style="background:#fee2e2;color:#dc2626;font-weight:700;padding:8px 12px;border-radius:10px;border:none;cursor:pointer;font-size:13px;">
                        ✖️ ปิด
                    </button>
                </div>
            </div>

            <!-- Report Document Body -->
            <div style="text-align:center;font-weight:800;font-size:20px;color:#0f172a;margin-bottom:16px;text-decoration:underline;">
                บันทึกรายงานการสืบสวนคดี
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:13px;line-height:1.7;">
                <div><b>วันที่จัดทำรายงาน:</b> ${reportDate}</div>
                <div><b>หน่วยงาน:</b> ชุดปฏิบัติการสืบสวนพิเศษ (San BOT System)</div>
                <div><b>ผู้จัดทำรายงาน:</b> ${officerName}</div>
            </div>

            ${invData.suspects.length > 0 ? `
                <div style="font-weight:800;font-size:15px;color:#1e3a8a;margin-top:16px;margin-bottom:8px;border-bottom:2px solid #94a3b8;padding-bottom:4px;">
                    ๑. บัญชีรายชื่อบุคคลที่เกี่ยวข้อง / ผู้ต้องสงสัย (${invData.suspects.length} ราย)
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="border:1px solid #cbd5e1;padding:8px 6px;text-align:center;width:7%;">ลำดับ</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:23%;">ชื่อ - นามสกุล</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:16%;">สถานะ/บทบาท</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:18%;">เบอร์โทรศัพท์</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:36%;">ตำหนิรูปพรรณ / ที่อยู่ / หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>${suspectsTableRows}</tbody>
                </table>
            ` : ''}

            ${invData.timeline.length > 0 ? `
                <div style="font-weight:800;font-size:15px;color:#1e3a8a;margin-top:16px;margin-bottom:8px;border-bottom:2px solid #94a3b8;padding-bottom:4px;">
                    ๒. ลำดับเหตุการณ์และพฤติการณ์แห่งคดี (Timeline) (${invData.timeline.length} เหตุการณ์)
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:12px;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="border:1px solid #cbd5e1;padding:8px 6px;text-align:center;width:7%;">ลำดับ</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:22%;">วัน เวลาเกิดเหตุ</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:24%;">สถานที่เกิดเหตุ</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:32%;">รายละเอียดพฤติการณ์เหตุการณ์</th>
                            <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;width:15%;">ผู้เกี่ยวข้อง</th>
                        </tr>
                    </thead>
                    <tbody>${timelineTableRows}</tbody>
                </table>
            ` : ''}

            <div style="margin-top:40px;text-align:right;padding-right:20px;page-break-inside:avoid;">
                <div style="display:inline-block;text-align:center;width:260px;font-size:13px;">
                    <br><br>
                    ลงชื่อ ..............................................................<br>
                    ( ${officerName} )<br>
                    เจ้าหน้าที่ผู้สืบสวนและรวบรวมรายงาน
                </div>
            </div>
        </div>
    `;

    modalEl.innerHTML = reportContentHtml;
    modalEl.style.display = 'flex';
}

function closePrintModal() {
    const modalEl = document.getElementById('report-print-modal');
    if (modalEl) modalEl.style.display = 'none';
}

function triggerDirectPrint() {
    const printArea = document.getElementById('print-area');
    if (!printArea) {
        window.print();
        return;
    }

    // สร้าง Print Frame เฉพาะส่วนรายงาน
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:100%;height:100%;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <title>รายงานการสืบสวนคดี - San BOT</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
                body { font-family: 'Sarabun', sans-serif; font-size: 13pt; line-height: 1.6; color: #000; padding: 2cm 1.5cm; margin: 0; background: #fff; }
                .no-print { display: none !important; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
                th, td { border: 1px solid #333; padding: 6px 8px; font-size: 11pt; vertical-align: top; }
                th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
                @page { size: A4; margin: 1.5cm 1cm; }
            </style>
        </head>
        <body>
            ${printArea.innerHTML}
        </body>
        </html>
    `);
    doc.close();

    setTimeout(() => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch(e) {
            window.print();
        }
        setTimeout(() => iframe.remove(), 2000);
    }, 500);
}

function copyFullReportText() {
    let fullText = '📋 บันทึกรายงานการสืบสวนคดี (San BOT)\n';
    fullText += `วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
    fullText += '═'.repeat(35) + '\n\n';

    if (invData.suspects.length > 0) {
        fullText += `๑. รายชื่อบุคคลที่เกี่ยวข้อง (${invData.suspects.length} ราย):\n`;
        invData.suspects.forEach((s, i) => {
            fullText += `[${i+1}] ${s.fname} ${s.lname} (${s.role || 'ทั่วไป'})\n`;
            if (s.phone) fullText += `   📞 เบอร์โทร: ${s.phone}\n`;
            if (s.address) fullText += `   📍 ที่อยู่: ${s.address}\n`;
            if (s.note) fullText += `   📝 หมายเหตุ: ${s.note}\n`;
        });
        fullText += '\n';
    }

    if (invData.timeline.length > 0) {
        fullText += `๒. ลำดับเหตุการณ์ (Timeline) (${invData.timeline.length} เหตุการณ์):\n`;
        invData.timeline.forEach((t, i) => {
            let d = t.date && !t.date.startsWith('RPT-') ? t.date : (t.timestamp ? t.timestamp.split(' ')[0] : '-');
            let tm = t.time || '-';
            fullText += `[${i+1}] ${formatThaiDate(d)} เวลา: ${tm}\n`;
            fullText += `   📍 สถานที่: ${t.location || '-'}\n`;
            fullText += `   📝 เหตุการณ์: ${t.event || t.detail || '-'}\n`;
            if (t.person) fullText += `   👤 ผู้เกี่ยวข้อง: ${t.person}\n`;
        });
    }

    copyToClipboard(fullText);
    showInvAlert('success', 'คัดลอกข้อความรายงานทั้งหมดเรียบร้อยแล้ว');
}

// ==========================================
// TAB 3: QR SCANNER
// ==========================================
function startQRScanner() {
    const videoEl = document.getElementById('qr-video');
    const container = document.getElementById('qr-video-container');
    const startBtn = document.getElementById('qr-start-btn');
    const stopBtn = document.getElementById('qr-stop-btn');
    const resultArea = document.getElementById('qr-result-area');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showInvAlert('error', 'เบราว์เซอร์นี้ไม่รองรับการใช้กล้อง กรุณาเปิดในแอป LINE หรือ Chrome');
        return;
    }

    resultArea.innerHTML = '<div style="text-align:center;"><div class="skeleton" style="width:80px;height:80px;border-radius:50%;margin:0 auto 12px;"></div><p style="color:#64748b;font-weight:600;">กำลังเปิดกล้อง...</p></div>';

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            qrVideoStream = stream;
            videoEl.srcObject = stream;
            container.style.display = 'block';
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            resultArea.innerHTML = '<div style="text-align:center;"><div style="width:12px;height:12px;background:#22c55e;border-radius:50%;animation:pulse-green 1s infinite;margin:0 auto 8px;"></div><p style="color:#16a34a;font-weight:700;">เล็งกล้องไปที่ QR Code</p></div>';
            scanQRFrame();
        })
        .catch(err => {
            const msg = err && err.message ? err.message : 'กรุณาอนุญาตการใช้งานกล้อง';
            resultArea.innerHTML = '<div style="text-align:center;"><span style="font-size:2rem;">❌</span><p style="color:#dc2626;font-weight:700;margin-top:8px;">ไม่สามารถเปิดกล้องได้</p><p style="font-size:0.82rem;color:#64748b;">' + msg + '</p></div>';
            showInvAlert('error', 'ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตการใช้งานกล้อง');
        });
}

function scanQRFrame() {
    const videoEl = document.getElementById('qr-video');
    const canvas = document.getElementById('qr-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    function tick() {
        if (videoEl && videoEl.readyState === videoEl.HAVE_ENOUGH_DATA && ctx && canvas) {
            canvas.width = videoEl.videoWidth;
            canvas.height = videoEl.videoHeight;
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            if (typeof jsQR !== 'undefined') {
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
                if (code) {
                    stopQRScanner();
                    handleQRResult(code.data);
                    return;
                }
            }
        }
        qrAnimFrame = requestAnimationFrame(tick);
    }
    qrAnimFrame = requestAnimationFrame(tick);
}

function stopQRScanner() {
    if (qrAnimFrame) { cancelAnimationFrame(qrAnimFrame); qrAnimFrame = null; }
    if (qrVideoStream) {
        qrVideoStream.getTracks().forEach(t => t.stop());
        qrVideoStream = null;
    }
    const container = document.getElementById('qr-video-container');
    const startBtn = document.getElementById('qr-start-btn');
    const stopBtn = document.getElementById('qr-stop-btn');
    if (container) container.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
}

let lastScannedData = '';
function handleQRResult(data) {
    const resultArea = document.getElementById('qr-result-area');
    let badge = '<span class="badge badge-green">สแกนสำเร็จ</span>';
    let extra = '';

    if (/^\d{13}$/.test(data)) {
        badge = '<span class="badge badge-blue">เลขบัตรประชาชน</span>';
        extra = `<div style="margin-top:8px;"><button class="btn-copy" style="font-size:0.8rem;" onclick="copyToClipboard('${data}');showInvAlert('success','คัดลอกเลขบัตรแล้ว');">🔍 คัดลอกเลขบัตร</button></div>`;
    } else if (/^https?:\/\//.test(data)) {
        badge = '<span class="badge badge-yellow">URL</span>';
        extra = `<div style="margin-top:8px;"><a href="${data}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="font-size:0.82rem;">🔗 เปิดลิงก์</a></div>`;
    } else if (/^[\d-\u0E00-\u0E7F]+$/.test(data) && data.length < 20) {
        badge = '<span class="badge badge-yellow">ทะเบียน/รหัส</span>';
    }

    lastScannedData = data;
    resultArea.innerHTML = `
        <div style="width:100%;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">${badge}<span style="font-weight:700;color:#1e3a8a;">สแกนสำเร็จ!</span></div>
            <div id="qr-result-text" style="background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:12px;word-break:break-all;font-family:monospace;font-size:0.9rem;color:#0369a1;"></div>
            ${extra}
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                <button class="btn-copy" onclick="copyLastScannedQR()">📋 คัดลอก</button>
                <button class="btn-secondary" onclick="startQRScanner()">🔄 สแกนใหม่</button>
            </div>
        </div>
    `;
    const txtBox = document.getElementById('qr-result-text');
    if (txtBox) txtBox.textContent = data;
}

function copyLastScannedQR() {
    if (lastScannedData) {
        copyToClipboard(lastScannedData);
        showInvAlert('success', 'คัดลอกข้อมูลแล้ว');
    }
}

function manualInputQR() {
    const val = prompt('กรอกข้อมูลที่ต้องการ (เลขบัตร, ทะเบียนรถ, หรือ URL):');
    if (val && val.trim()) handleQRResult(val.trim());
}

// ==========================================
// TAB 4: TEMPLATES
// ==========================================
const templates = {
    arrest: {
        title: '🚔 บันทึกการจับกุม',
        fields: [
            { id: 'arr-officer', label: 'เจ้าหน้าที่ผู้จับกุม', type: 'text', placeholder: 'ยศ ชื่อ-นามสกุล' },
            { id: 'arr-date', label: 'วันที่จับกุม', type: 'date' },
            { id: 'arr-time', label: 'เวลา', type: 'time' },
            { id: 'arr-location', label: 'สถานที่จับกุม', type: 'text', placeholder: 'สถานที่เกิดเหตุ' },
            { id: 'arr-name', label: 'ชื่อ-นามสกุลผู้ถูกจับ', type: 'text', placeholder: 'ชื่อ-นามสกุล' },
            { id: 'arr-charge', label: 'ข้อหา', type: 'text', placeholder: 'ข้อหาความผิด' },
            { id: 'arr-evidence', label: 'หลักฐาน / ของกลาง', type: 'textarea', placeholder: 'ระบุหลักฐาน/ของกลาง' },
        ],
        generate: (f) => `บันทึกการจับกุม
━━━━━━━━━━━━━━━━━━━━━━━
วันที่: ${formatThaiDate(f['arr-date'])} เวลา ${f['arr-time']} น.
เจ้าหน้าที่: ${f['arr-officer']}
สถานที่: ${f['arr-location']}

ผู้ถูกจับกุม: ${f['arr-name']}
ข้อหา: ${f['arr-charge']}

หลักฐาน/ของกลาง:
${f['arr-evidence']}
━━━━━━━━━━━━━━━━━━━━━━━
ลงชื่อ: ................................................
ผู้บันทึก: ${f['arr-officer']}`
    },
    interrogate: {
        title: '🗣️ บันทึกสอบปากคำ',
        fields: [
            { id: 'int-date', label: 'วันที่', type: 'date' },
            { id: 'int-time', label: 'เวลา', type: 'time' },
            { id: 'int-officer', label: 'ผู้ทำการสอบ', type: 'text', placeholder: 'ยศ ชื่อ-นามสกุล' },
            { id: 'int-name', label: 'ชื่อ-นามสกุลผู้ถูกสอบ', type: 'text', placeholder: 'ชื่อ-นามสกุล' },
            { id: 'int-role', label: 'ฐานะ', type: 'text', placeholder: 'พยาน / ผู้ต้องหา / ผู้เสียหาย' },
            { id: 'int-content', label: 'สาระสำคัญจากการสอบ', type: 'textarea', placeholder: 'บันทึกคำให้การ...' },
        ],
        generate: (f) => `บันทึกสอบปากคำ
━━━━━━━━━━━━━━━━━━━━━━━
วันที่: ${formatThaiDate(f['int-date'])} เวลา ${f['int-time']} น.
ผู้ทำการสอบ: ${f['int-officer']}

ผู้ถูกสอบ: ${f['int-name']} (${f['int-role']})

สาระสำคัญ:
${f['int-content']}
━━━━━━━━━━━━━━━━━━━━━━━
ลงชื่อผู้ให้การ: ................................................
ลงชื่อผู้สอบ: ................................................`
    },
    complaint: {
        title: '📜 บันทึกร้องทุกข์',
        fields: [
            { id: 'com-date', label: 'วันที่', type: 'date' },
            { id: 'com-officer', label: 'พนักงานสอบสวนผู้รับเรื่อง', type: 'text', placeholder: 'ยศ ชื่อ-นามสกุล' },
            { id: 'com-name', label: 'ผู้ร้องทุกข์', type: 'text', placeholder: 'ชื่อ-นามสกุล ผู้ร้องทุกข์' },
            { id: 'com-against', label: 'ร้องทุกข์กล่าวหา', type: 'text', placeholder: 'ชื่อผู้ถูกกล่าวหา หรือ "ผู้กระทำผิดที่ไม่ทราบชื่อ"' },
            { id: 'com-offense', label: 'ข้อหา/ฐานความผิด', type: 'text', placeholder: 'ฐานความผิด' },
            { id: 'com-detail', label: 'เหตุการณ์โดยย่อ', type: 'textarea', placeholder: 'บรรยายเหตุการณ์...' },
        ],
        generate: (f) => `บันทึกร้องทุกข์
━━━━━━━━━━━━━━━━━━━━━━━
วันที่รับเรื่อง: ${formatThaiDate(f['com-date'])}
พนักงานสอบสวน: ${f['com-officer']}
ผู้ร้องทุกข์: ${f['com-name']}
ร้องทุกข์กล่าวหา: ${f['com-against']}
ข้อหา: ${f['com-offense']}
รายละเอียด: ${f['com-detail']}
━━━━━━━━━━━━━━━━━━━━━━━
ลงชื่อผู้ร้องทุกข์: ................................................
ลงชื่อพนักงานสอบสวน: ................................................`
    },
    patrol: {
        title: '🚓 บันทึกตรวจสถานที่',
        fields: [
            { id: 'pat-date', label: 'วันที่', type: 'date' },
            { id: 'pat-time', label: 'เวลา', type: 'time' },
            { id: 'pat-officer', label: 'ผู้ปฏิบัติงาน', type: 'text', placeholder: 'ยศ ชื่อ-นามสกุล / ชุดปฏิบัติงาน' },
            { id: 'pat-location', label: 'สถานที่ตรวจ', type: 'text', placeholder: 'ที่อยู่/สถานที่' },
            { id: 'pat-finding', label: 'สิ่งที่ตรวจพบ', type: 'textarea', placeholder: 'ระบุสิ่งที่พบในที่เกิดเหตุ...' },
            { id: 'pat-result', label: 'ผลการปฏิบัติงาน', type: 'textarea', placeholder: 'สรุปผลการตรวจ/ปฏิบัติงาน...' },
        ],
        generate: (f) => `บันทึกการตรวจสถานที่
━━━━━━━━━━━━━━━━━━━━━━━
วันที่: ${formatThaiDate(f['pat-date'])} เวลา ${f['pat-time']} น.
ผู้ปฏิบัติงาน: ${f['pat-officer']}
สถานที่: ${f['pat-location']}
สิ่งที่ตรวจพบ: ${f['pat-finding']}
ผลการปฏิบัติงาน: ${f['pat-result']}
━━━━━━━━━━━━━━━━━━━━━━━
ลงชื่อ: ................................................
(${f['pat-officer']})`
    },
    surv: {
        title: '🔭 รายงานสืบสวน',
        fields: [
            { id: 'surv-date', label: 'วันที่รายงาน', type: 'date' },
            { id: 'surv-case', label: 'คดี/เรื่อง', type: 'text', placeholder: 'ชื่อคดีหรือเรื่องที่สืบสวน' },
            { id: 'surv-officer', label: 'ผู้รายงาน', type: 'text', placeholder: 'ยศ ชื่อ-นามสกุล' },
            { id: 'surv-period', label: 'ระยะเวลาสืบสวน', type: 'text', placeholder: 'เช่น 1-15 ส.ค. 2567' },
            { id: 'surv-method', label: 'วิธีการสืบสวน', type: 'textarea', placeholder: 'ระบุวิธีการที่ใช้...' },
            { id: 'surv-result', label: 'ผลการสืบสวน', type: 'textarea', placeholder: 'สรุปผลที่ได้จากการสืบสวน...' },
            { id: 'surv-suggest', label: 'ข้อเสนอแนะ', type: 'textarea', placeholder: 'ข้อเสนอแนะในการดำเนินการต่อ...' },
        ],
        generate: (f) => `รายงานการสืบสวน
━━━━━━━━━━━━━━━━━━━━━━━
วันที่รายงาน: ${formatThaiDate(f['surv-date'])}
คดี: ${f['surv-case']}
ผู้รายงาน: ${f['surv-officer']}
ระยะเวลาสืบสวน: ${f['surv-period']}
วิธีการสืบสวน: ${f['surv-method']}
ผลการสืบสวน: ${f['surv-result']}
ข้อเสนอแนะ: ${f['surv-suggest']}
━━━━━━━━━━━━━━━━━━━━━━━
ลงชื่อ: ................................................
(${f['surv-officer']})`
    }
};

let currentTemplate = null;

function loadTemplate(key) {
    currentTemplate = key;
    const t = templates[key];
    document.getElementById('template-editor-title').textContent = t.title;
    const fieldsDiv = document.getElementById('template-fields');
    fieldsDiv.innerHTML = t.fields.map(f => `
        <div style="margin-bottom:10px;">
            <label class="inv-label">${f.label}</label>
            ${f.type === 'textarea' 
                ? `<textarea id="${f.id}" class="inv-input" rows="3" placeholder="${f.placeholder || ''}"></textarea>`
                : `<input type="${f.type}" id="${f.id}" class="inv-input" placeholder="${f.placeholder || ''}">`
            }
        </div>
    `).join('');
    document.getElementById('template-editor').style.display = 'block';
    document.getElementById('template-output').value = '';
    document.getElementById('template-editor').scrollIntoView({ behavior: 'smooth' });
}

function generateTemplate() {
    const t = templates[currentTemplate];
    const fieldValues = {};
    t.fields.forEach(f => {
        const el = document.getElementById(f.id);
        fieldValues[f.id] = el ? el.value.trim() : '';
    });
    document.getElementById('template-output').value = t.generate(fieldValues);
}

function copyTemplate() {
    const val = document.getElementById('template-output').value;
    if (!val) { showInvAlert('warning', 'กรุณากด "สร้างรายงาน" ก่อน'); return; }
    copyToClipboard(val);
    showInvAlert('success', 'คัดลอกรายงานเรียบร้อยแล้ว');
}

function closeTemplateEditor() {
    document.getElementById('template-editor').style.display = 'none';
    currentTemplate = null;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function updateStats() {
    const s1 = document.getElementById('stat-suspects');
    const s2 = document.getElementById('stat-timeline');
    const s3 = document.getElementById('stat-scenes');
    if (s1) s1.textContent = (invData.suspects || []).length;
    if (s2) s2.textContent = (invData.timeline || []).length;
    if (s3) s3.textContent = (invData.sceneReports || []).length;
}

function parseDateSafe(dateVal) {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
    
    let str = String(dateVal).trim();
    if (!str || str.startsWith('RPT-') || str.startsWith('CASE-') || str.startsWith('TL-')) return null;

    // ถ้ามีส่วนเวลาปนมา เช่น 2026-08-26 14:15 หรือ 2026-08-26T14:15:00
    if (str.includes(' ') || str.includes('T')) {
        str = str.split(/[\sT]+/)[0];
    }

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

function formatThaiDate(dateStr) {
    if (!dateStr) return 'ไม่ระบุวันที่';
    const d = parseDateSafe(dateStr);
    if (!d) {
        const s = String(dateStr).trim();
        return (s.startsWith('RPT-') || s.startsWith('CASE-')) ? '-' : s;
    }

    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const thaiYear = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543;
    return `${d.getDate()} ${thaiMonths[d.getMonth()]} ${thaiYear}`;
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
}

function showInvAlert(type, title) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: type, title: title, timer: 2000, showConfirmButton: false, confirmButtonColor: '#1e3a8a' });
    } else {
        alert(title);
    }
}

// ==========================================
// INIT
// ==========================================
(function initInvestigation() {
    updateStats();
    renderSceneReports();
    renderSuspectList();
    renderTimeline();
    
    // ตั้งวันที่วันนี้
    const today = new Date().toISOString().split('T')[0];
    ['tl-date'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });

    // ดึงข้อมูลออนไลน์จาก Google Sheets
    fetchSceneReports();
    fetchSuspects();
    fetchTimeline();
})();

