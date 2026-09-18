// ==========================================
// INVESTIGATION MODULE - MAIN SCRIPT
// ==========================================

// ---- ข้อมูลใน Memory ----
const invData = {
    suspects: JSON.parse(localStorage.getItem('inv_suspects') || '[]'),
    timeline: JSON.parse(localStorage.getItem('inv_timeline') || '[]'),
    sceneReports: JSON.parse(localStorage.getItem('inv_scene_reports') || '[]'),
};
// ---- สลับ Tab 4 หมวดหลัก ----
function switchInvTab(tab) {
    document.querySelectorAll('.inv-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.inv-tab-pill').forEach(b => b.classList.remove('active'));
    const section = document.getElementById('inv-section-' + tab);
    const tabBtn = document.getElementById('inv-tab-' + tab);
    if (section) section.classList.add('active');
    if (tabBtn) {
        tabBtn.classList.add('active');
        try {
            tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch(e) {}
    }
    try { sessionStorage.setItem('inv_active_tab', tab); } catch(e) {}
}

// ---- ตัวควบคุมการเปิด-ปิดฟอร์มแบบพับเก็บได้ (Collapsible Forms) ----
function toggleTimelineForm(forceState) {
    const form = document.getElementById('timeline-form-container');
    const btn = document.getElementById('btn-toggle-timeline-form');
    if (!form) return;
    const isOpening = (typeof forceState === 'boolean') ? forceState : (form.style.display === 'none');
    form.style.display = isOpening ? 'block' : 'none';
    if (btn) btn.innerHTML = isOpening ? '<span>✕</span> <span>ปิดฟอร์ม</span>' : '<span>➕</span> <span>เพิ่มเหตุการณ์</span>';
    if (isOpening) {
        const dInput = document.getElementById('tl-date');
        if (dInput && !dInput.value) dInput.value = new Date().toISOString().split('T')[0];
        const tInput = document.getElementById('tl-time');
        if (tInput && !tInput.value) {
            const now = new Date();
            tInput.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        }
        try { form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) {}
    }
}

function toggleSuspectForm(forceState) {
    const form = document.getElementById('suspect-form-container');
    const btn = document.getElementById('btn-toggle-suspect-form');
    if (!form) return;
    const isOpening = (typeof forceState === 'boolean') ? forceState : (form.style.display === 'none');
    form.style.display = isOpening ? 'block' : 'none';
    if (btn) btn.innerHTML = isOpening ? '<span>✕</span> <span>ปิดฟอร์ม</span>' : '<span>➕</span> <span>เพิ่มบุคคล</span>';
    if (isOpening) {
        try { form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e) {}
    }
}

function selectRoleChip(roleName) {
    const hiddenInput = document.getElementById('inv-role');
    if (hiddenInput) hiddenInput.value = roleName;
    const chips = document.querySelectorAll('#role-chips-group .role-chip');
    chips.forEach(c => {
        if (c.textContent.trim() === roleName) {
            c.classList.add('selected');
        } else {
            c.classList.remove('selected');
        }
    });
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
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <div class="text-3xl mb-1">👥</div>
                <p class="font-semibold text-sm">ยังไม่มีบันทึกข้อมูลบุคคล</p>
                <p class="text-xs text-slate-400">แตะปุ่ม "➕ เพิ่มบุคคล" เพื่อบันทึกผู้ต้องสงสัยหรือพยาน</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-700">👥 รายชื่อบุคคลที่เกี่ยวข้อง (${invData.suspects.length} ราย)</span>
            <span class="text-[11px] text-slate-400">บันทึกล่าสุด</span>
        </div>
    ` + invData.suspects.map(s => {
        const titleName = ((s.fname || s.officerName || s.title || '') + ' ' + (s.lname || '')).trim();
        const roleText = s.role || s.noteType || 'ผู้ต้องสงสัย';
        const detailText = s.note || s.content || s.details || '';

        let roleBadgeClass = 'bg-red-50 text-red-700 border-red-200';
        if (roleText.includes('พยาน')) roleBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        else if (roleText.includes('สายสืบ')) roleBadgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
        else if (roleText.includes('ผู้เสียหาย')) roleBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
        else if (roleText.includes('ผู้ถูกจับกุม')) roleBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';

        return `
        <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div class="flex items-start justify-between gap-2">
                <div>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${roleBadgeClass}">
                        ${roleText}
                    </span>
                    <span class="font-extrabold text-blue-950 text-sm ml-1.5">${titleName || 'ไม่ระบุชื่อ'}</span>
                    ${s.age ? `<span class="text-xs text-slate-500 ml-1">(${s.age} ปี / ${s.gender || '-'})</span>` : ''}
                </div>
                <button type="button" class="text-red-500 hover:text-red-700 p-1 text-xs rounded transition flex-shrink-0" onclick="deleteSuspect('${s.id}')" title="ลบข้อมูล">
                    🗑️
                </button>
            </div>

            ${s.phone ? `
                <div class="mt-1.5 text-xs text-slate-600 flex items-center gap-1">
                    <span>📞</span> <b>เบอร์โทร:</b> 
                    <a href="tel:${s.phone}" class="text-blue-600 font-bold hover:underline">${s.phone}</a>
                </div>
            ` : ''}

            ${s.appearance ? `
                <div class="mt-1 text-xs text-slate-600">
                    👁️ <b>รูปพรรณ:</b> ${s.appearance}
                </div>
            ` : ''}

            ${s.address ? `
                <div class="mt-1 text-xs text-slate-600">
                    📍 <b>ที่อยู่:</b> ${s.address}
                </div>
            ` : ''}

            ${detailText ? `
                <div class="mt-2 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 leading-relaxed">
                    📝 ${detailText}
                </div>
            ` : ''}

            <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <button type="button" onclick="prepareTrackingForSuspect('${s.id}')" class="bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-xs font-bold py-1 px-2.5 rounded-lg shadow-xs flex items-center gap-1 hover:brightness-105 active:scale-95 transition">
                    <span>🎯</span> <span>ดักพิกัดบุคคลนี้</span>
                </button>
                <div class="text-[11px] text-slate-400">
                    บันทึก: ${s.savedAt || s.createdAt || '-'}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function prepareTrackingForSuspect(suspectId) {
    const suspect = (invData.suspects || []).find(s => String(s.id) === String(suspectId));
    if (!suspect) return;
    const name = ((suspect.fname || '') + ' ' + (suspect.lname || '')).trim();
    const phone = suspect.phone || '';
    
    // เติมข้อมูลลงในฟอร์มดักพิกัด
    const nameInput = document.getElementById('track-target-name');
    const phoneInput = document.getElementById('track-target-phone');
    if (nameInput) nameInput.value = name;
    if (phoneInput) phoneInput.value = phone;
    
    // สลับไปยังแท็บดักพิกัด
    switchInvTab('tracking');
    showInvAlert('success', `ส่งข้อมูล "${name || 'เป้าหมาย'}" ไปยังศูนย์ดักพิกัดแล้ว`);
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
    const genderEl = document.getElementById('inv-gender');
    if (genderEl) genderEl.selectedIndex = 0;
    selectRoleChip('ผู้ต้องสงสัย');
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
    toggleTimelineForm(false);

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
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <div class="text-3xl mb-1">⏱️</div>
                <p class="font-semibold text-sm">ยังไม่มีเหตุการณ์ใน Timeline</p>
                <p class="text-xs text-slate-400">แตะปุ่ม "➕ เพิ่มเหตุการณ์" ด้านบนเพื่อเริ่มบันทึก</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-slate-700">⏱️ รายการเหตุการณ์ทั้งหมด (${invData.timeline.length} รายการ)</span>
            <span class="text-[11px] text-slate-400">เรียงตามวัน-เวลา</span>
        </div>
    ` + invData.timeline.map((item, i) => {
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
        <div class="timeline-card-item">
            <div class="timeline-card-dot"></div>
            <div class="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-1.5">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            ${badgeDate} ${badgeTime}
                        </span>
                        ${item.location ? `<span class="text-xs text-slate-600 font-medium">📍 ${item.location}</span>` : ''}
                    </div>
                    <button type="button" class="text-red-500 hover:text-red-700 p-1 text-xs rounded transition flex-shrink-0" onclick="deleteTimeline('${item.id}')" title="ลบเหตุการณ์">
                        🗑️
                    </button>
                </div>
                <p class="text-xs sm:text-sm text-slate-800 font-normal leading-relaxed mt-2">${eventText}</p>
                ${item.person ? `
                    <div class="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-xs font-semibold text-indigo-700">
                        <span>👤</span> <span>ผู้เกี่ยวข้อง: ${item.person}</span>
                    </div>
                ` : ''}
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

    // เลือกว่าจะ mount modal ไว้ที่ window.parent.document (หากรันอยู่ใน iframe ของ index.html) หรือ document ปกติ
    let targetDoc = document;
    let isParentFrame = false;
    try {
        if (window.parent && window.parent !== window && window.parent.document && window.parent.document.body) {
            targetDoc = window.parent.document;
            isParentFrame = true;
        }
    } catch(e) {
        targetDoc = document;
        isParentFrame = false;
    }

    // ลบ Modal เก่าถ้ามีค้างอยู่ใน DOM
    const oldLocal = document.getElementById('report-print-modal');
    if (oldLocal) oldLocal.remove();
    if (isParentFrame) {
        try {
            const oldParent = targetDoc.getElementById('report-print-modal');
            if (oldParent) oldParent.remove();
        } catch(e) {}
    }

    // สร้าง Modal Overlay หลักพร้อมคุณสมบัติการจัดกึ่งกลางหน้าจอมือถือ (iOS / Android / Desktop)
    const modalEl = targetDoc.createElement('div');
    modalEl.id = 'report-print-modal';
    modalEl.style.cssText = `
        position: fixed !important;
        inset: 0 !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        background: rgba(15, 23, 42, 0.82) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        z-index: 9999999 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left)) !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
    `;

    const reportContentHtml = `
        <div id="print-area" style="background:#ffffff;color:#0f172a;border-radius:20px;width:100%;max-width:min(860px, calc(100vw - 20px));max-height:calc(100dvh - 24px);max-height:calc(100vh - 24px);display:flex;flex-direction:column;box-shadow:0 25px 60px -15px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.2);font-family:'Sarabun',-apple-system,BlinkMacSystemFont,sans-serif;font-size:13.5px;line-height:1.6;margin:auto;box-sizing:border-box;overflow:hidden;">
            <!-- Modal Header Actions (Sticky / Pinned Top) -->
            <div class="no-print" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px;border-bottom:2px solid #e2e8f0;background:#ffffff;flex-shrink:0;z-index:10;box-sizing:border-box;">
                <div style="font-weight:800;color:#1e3a8a;font-size:clamp(13.5px, 3.8vw, 16px);display:flex;align-items:center;gap:6px;min-width:0;">
                    <span style="font-size:18px;">📄</span>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">ตัวอย่างรายงานการสืบสวน</span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
                    <button id="btn-print-report" type="button" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#ffffff;font-weight:700;padding:7px 11px;border-radius:10px;border:none;cursor:pointer;font-size:12px;box-shadow:0 3px 8px rgba(37,99,235,0.3);display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">
                        <span>🖨️</span> <span>พิมพ์ / PDF</span>
                    </button>
                    <button id="btn-copy-report" type="button" style="background:#f1f5f9;color:#334155;font-weight:700;padding:7px 10px;border-radius:10px;border:1px solid #cbd5e1;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">
                        <span>📋</span> <span>คัดลอก</span>
                    </button>
                    <button id="btn-close-report" type="button" style="background:#fee2e2;color:#dc2626;font-weight:700;padding:7px 10px;border-radius:10px;border:none;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;">
                        <span>✖️</span> <span>ปิด</span>
                    </button>
                </div>
            </div>

            <!-- Report Document Body (Smooth Scrollable Container) -->
            <div id="report-scroll-body" style="flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:16px 20px;box-sizing:border-box;">
                <div style="text-align:center;font-weight:800;font-size:19px;color:#0f172a;margin-bottom:14px;text-decoration:underline;">
                    บันทึกรายงานการสืบสวนคดี
                </div>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:16px;font-size:12.5px;line-height:1.75;">
                    <div><b>วันที่จัดทำรายงาน:</b> ${reportDate}</div>
                    <div><b>หน่วยงาน:</b> ชุดปฏิบัติการสืบสวนพิเศษ (San BOT System)</div>
                    <div><b>ผู้จัดทำรายงาน:</b> ${officerName}</div>
                </div>

                ${invData.suspects.length > 0 ? `
                    <div style="font-weight:800;font-size:14.5px;color:#1e3a8a;margin-top:16px;margin-bottom:8px;border-bottom:2px solid #94a3b8;padding-bottom:4px;">
                        ๑. บัญชีรายชื่อบุคคลที่เกี่ยวข้อง / ผู้ต้องสงสัย (${invData.suspects.length} ราย)
                    </div>
                    <div class="table-responsive" style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:18px;border:1px solid #cbd5e1;border-radius:8px;">
                        <table style="min-width:540px;width:100%;border-collapse:collapse;font-size:12px;background:#ffffff;">
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
                    </div>
                ` : ''}

                ${invData.timeline.length > 0 ? `
                    <div style="font-weight:800;font-size:14.5px;color:#1e3a8a;margin-top:16px;margin-bottom:8px;border-bottom:2px solid #94a3b8;padding-bottom:4px;">
                        ๒. ลำดับเหตุการณ์และพฤติการณ์แห่งคดี (Timeline) (${invData.timeline.length} เหตุการณ์)
                    </div>
                    <div class="table-responsive" style="width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:18px;border:1px solid #cbd5e1;border-radius:8px;">
                        <table style="min-width:540px;width:100%;border-collapse:collapse;font-size:12px;background:#ffffff;">
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
                    </div>
                ` : ''}

                <div style="margin-top:32px;margin-bottom:12px;text-align:right;padding-right:16px;page-break-inside:avoid;">
                    <div style="display:inline-block;text-align:center;width:260px;font-size:13px;line-height:1.7;">
                        <br><br>
                        ลงชื่อ ..............................................................<br>
                        ( ${officerName} )<br>
                        เจ้าหน้าที่ผู้สืบสวนและรวบรวมรายงาน
                    </div>
                </div>
            </div>
        </div>
    `;

    modalEl.innerHTML = reportContentHtml;
    targetDoc.body.appendChild(modalEl);

    // ป้องกันหน้าพื้นหลังเลื่อนขณะเปิดดูรายงาน
    try { targetDoc.body.style.overflow = 'hidden'; } catch(e) {}
    try { document.body.style.overflow = 'hidden'; } catch(e) {}

    // ผูก Event Listeners ปลอดภัยสำหรับปุ่มด้านใน
    const btnPrint = modalEl.querySelector('#btn-print-report');
    const btnCopy = modalEl.querySelector('#btn-copy-report');
    const btnClose = modalEl.querySelector('#btn-close-report');

    if (btnPrint) {
        btnPrint.onclick = (e) => {
            e.stopPropagation();
            triggerDirectPrint();
        };
    }

    if (btnCopy) {
        btnCopy.onclick = (e) => {
            e.stopPropagation();
            copyFullReportText();
            const originalContent = btnCopy.innerHTML;
            btnCopy.innerHTML = '<span>✅</span> <span>คัดลอกแล้ว</span>';
            btnCopy.style.background = '#dcfce7';
            btnCopy.style.color = '#15803d';
            btnCopy.style.borderColor = '#86efac';
            setTimeout(() => {
                if (btnCopy) {
                    btnCopy.innerHTML = originalContent;
                    btnCopy.style.background = '#f1f5f9';
                    btnCopy.style.color = '#334155';
                    btnCopy.style.borderColor = '#cbd5e1';
                }
            }, 2000);
        };
    }

    if (btnClose) {
        btnClose.onclick = (e) => {
            e.stopPropagation();
            closePrintModal();
        };
    }

    // แตะพื้นที่มืดภายนอกกรอบเพื่อปิด Modal
    modalEl.onclick = (e) => {
        if (e.target === modalEl) {
            closePrintModal();
        }
    };

    // กดปุ่ม Escape บนคีย์บอร์ดเพื่อปิด Modal
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closePrintModal();
            try { targetDoc.removeEventListener('keydown', handleEsc); } catch(err) {}
            try { document.removeEventListener('keydown', handleEsc); } catch(err) {}
        }
    };
    try { targetDoc.addEventListener('keydown', handleEsc); } catch(e) {}
    try { document.addEventListener('keydown', handleEsc); } catch(e) {}
}

function closePrintModal() {
    // ลบออกจาก document ท้องถิ่น
    const localEl = document.getElementById('report-print-modal');
    if (localEl) localEl.remove();

    // ลบออกจาก parent document (หากรันใน iframe)
    try {
        if (window.parent && window.parent.document) {
            const parentEl = window.parent.document.getElementById('report-print-modal');
            if (parentEl) parentEl.remove();
            window.parent.document.body.style.overflow = '';
        }
    } catch(e) {}

    try { document.body.style.overflow = ''; } catch(e) {}
}

function triggerDirectPrint() {
    let printArea = null;
    try {
        if (window.parent && window.parent.document) {
            printArea = window.parent.document.getElementById('print-area');
        }
    } catch(e) {}
    if (!printArea) {
        printArea = document.getElementById('print-area');
    }

    if (!printArea) {
        window.print();
        return;
    }

    // เลือกว่าจะสร้าง iframe สำหรับสั่งพิมพ์ใน document ใด
    const targetDoc = (window.parent && window.parent.document) ? window.parent.document : document;
    const iframe = targetDoc.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:100%;height:100%;border:none;';
    targetDoc.body.appendChild(iframe);

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
                .table-responsive { overflow: visible !important; border: none !important; margin: 0 0 20px 0 !important; }
                table { width: 100% !important; min-width: 100% !important; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; }
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
        setTimeout(() => iframe.remove(), 2500);
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

// ผูกฟังก์ชันสำหรับการเรียกใช้งานข้าม Frame หรือ Event Handler
window.printOfficialInvestigationReport = printOfficialInvestigationReport;
window.closePrintModal = closePrintModal;
window.triggerDirectPrint = triggerDirectPrint;
window.copyFullReportText = copyFullReportText;
try {
    if (window.parent && window.parent !== window) {
        window.parent.closePrintModal = closePrintModal;
        window.parent.triggerDirectPrint = triggerDirectPrint;
        window.parent.copyFullReportText = copyFullReportText;
    }
} catch(e) {}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
function updateStats() {
    const s1 = document.getElementById('stat-scenes');
    const s2 = document.getElementById('stat-timeline');
    const s3 = document.getElementById('stat-suspects');
    if (s1) s1.textContent = (invData.sceneReports || []).length;
    if (s2) s2.textContent = (invData.timeline || []).length;
    if (s3) s3.textContent = (invData.suspects || []).length;
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

    // คืนค่าแท็บล่าสุดที่เคยเปิดไว้
    try {
        const savedTab = sessionStorage.getItem('inv_active_tab');
        if (savedTab && ['scenes', 'timeline', 'suspect', 'tracking'].includes(savedTab)) {
            switchInvTab(savedTab);
        }
    } catch(e) {}

    // ดึงข้อมูลออนไลน์จาก Google Sheets
    fetchSceneReports();
    fetchSuspects();
    fetchTimeline();
})();

