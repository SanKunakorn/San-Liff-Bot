/**
 * ========================================================
 * San BOT - Central Configuration, API Bridge & RBAC Auth
 * ========================================================
 */

const CONFIG = {
  // LINE LIFF ID
  LIFF_ID: "2004593216-XbA9wj26",

  // Google Apps Script Api หน้าสืบสวน
  GAS_URL: "https://script.google.com/macros/s/AKfycbzHh2whTRjedoCy-5NPwL1gvuCqSDLASRIFdjurzTQOBJux4bI7rTj8wUh5dWWn6xJi-Q/exec",

  // Google Apps Script Api หน้าแจ้งเหตุการณ์
  GAS_URL_LOSTCAR: "https://script.google.com/macros/s/AKfycbxs3oWfi4tNCbO4nZ5q0aVIg5sTrdbWVcxkVGpWTuBYR87GcqBkm0BoUrnui0Ybsz1v/exec",


  // Google Drive Folder ID for Image Uploads (Leave empty to save in root or set specific folder ID)
  DRIVE_FOLDER_ID: "1tWgdC1x44kYPH8JdjyeOj8Evx4z4ky-D",//Folder San Bot

  // Telegram Bot Configuration (ย้ายไปเก็บที่ Script Properties ของ Google Apps Script เพื่อความปลอดภัย)
  // ให้เป็นค่าว่างในไฟล์นี้ ระบบจะส่งผ่าน Google Apps Script Backend Proxy โดยอัตโนมัติ
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",

  // App Metadata
  APP_NAME: "San BOT",
  VERSION: "2.3.0"
};

// Global fallback for legacy references
var LIFF_ID = CONFIG.LIFF_ID;
var GAS_URL = CONFIG.GAS_URL;
var GAS_URL_LOSTCAR = CONFIG.GAS_URL_LOSTCAR;
var TELEGRAM_BOT_TOKEN = CONFIG.TELEGRAM_BOT_TOKEN;
var TELEGRAM_CHAT_ID = CONFIG.TELEGRAM_CHAT_ID;

/**
 * ฟังก์ชันกลางสำหรับติดต่อ Google Apps Script (GAS)
 * รองรับ 2 Endpoints: หน้าสืบสวน (GAS_URL) และ หน้ารถหาย/แจ้งเหตุ (GAS_URL_LOSTCAR)
 * รองรับทั้ง GET และ POST, ป้องกันปัญหา CORS และ handle error อัตโนมัติ
 * 
 * @param {string} action - Action ที่ต้องการเรียกใน GAS เช่น 'readLostCar', 'createLostCar', 'readSuspects'
 * @param {object} payloadData - ข้อมูลที่จะส่ง (กรณี POST) หรือ query parameters (กรณี GET)
 * @param {string} method - 'GET' หรือ 'POST' (ค่าเริ่มต้น: 'GET')
 * @param {string} targetApi - 'investigation' หรือ 'lostcar' (ถ้าไม่ระบุ ระบบจะเลือกให้อัตโนมัติตาม action)
 * @returns {Promise<object>} ผลลัพธ์ที่ได้จาก GAS
 */
async function callGasApi(action, payloadData = {}, method = 'GET', targetApi = null) {
  // ตรวจสอบปลายทาง API อัตโนมัติ
  const lostCarActions = [
    'getReports', 'createReport', 'updateReport', 'deleteReport', 'updateStatus',
    'getSceneReports', 'readSceneReports', 'createSceneReport', 'updateSceneReport', 'deleteSceneReport', 'migrateSceneReports',
    'getSettings', 'readSettings', 'readLostCar', 'createLostCar', 'getNotes', 'addNote',
    'getTimeline', 'addTimeline', 'readSuspects', 'createSuspect', 'saveSuspect',
    'deleteSuspect', 'readTimeline', 'createTimeline', 'saveTimeline', 'deleteTimeline', 'readNotes',
    'getReportTemplates', 'getTemplates', 'saveReportTemplate', 'deleteReportTemplate',
    'sendTelegram', 'testTelegram', 'pingTelegram'
  ];

  const primaryUrl = (targetApi === 'lostcar' || (!targetApi && lostCarActions.includes(action)))
    ? (CONFIG.GAS_URL_LOSTCAR || CONFIG.GAS_URL)
    : (CONFIG.GAS_URL || CONFIG.GAS_URL_LOSTCAR);

  const fallbackUrl = (primaryUrl === CONFIG.GAS_URL) ? CONFIG.GAS_URL_LOSTCAR : CONFIG.GAS_URL;
  const urlsToTry = [primaryUrl, fallbackUrl].filter(u => u && !u.includes('YOUR_GAS_URL'));

  if (!urlsToTry.length) {
    console.error('GAS_URL is not configured properly.');
    throw new Error('ยังไม่ได้กำหนด URL ของ Google Apps Script');
  }

  let lastError = null;
  for (const baseUrl of urlsToTry) {
    try {
      let response;

      if (method.toUpperCase() === 'GET') {
        const params = new URLSearchParams({ action, ...payloadData });
        const url = `${baseUrl}?${params.toString()}`;
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
      } else {
        const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const requesterUid = (payloadData && payloadData.uid) || (currentUser && currentUser.lineId) || '';

        response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: action,
            uid: requesterUid,
            data: payloadData,
            ...payloadData
          })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (pe) {
        throw new Error(`Non-JSON response: ${text.slice(0, 100)}`);
      }

      return result;

    } catch (error) {
      console.warn(`API Call [${action}] failed on ${baseUrl}, trying next endpoint...`, error);
      lastError = error;
    }
  }

  throw lastError || new Error('การเชื่อมต่อ Google Apps Script ล้มเหลว');
}

/**
 * ตรวจสอบสิทธิ์ผู้ใช้งานจาก LINE UID
 * @param {string} uid - LINE User ID
 * @param {string} displayName - ชื่อแสดงผล LINE
 * @param {string} rank - ยศ/ตำแหน่ง
 * @returns {Promise<{success: boolean, access: boolean, user: object, message: string}>}
 */
async function checkUserAuth(uid, displayName = '', rank = '') {
  try {
    const result = await callGasApi('checkAuth', { uid, name: displayName, rank }, 'GET');
    if (result && result.user) {
      sessionStorage.setItem('sanbot_user', JSON.stringify(result.user));
      localStorage.setItem('sanbot_user', JSON.stringify(result.user));
    }
    return result;
  } catch (err) {
    console.warn('Auth check server unreachable, allowing graceful access:', err);
    const cached = getCurrentUser();
    if (cached) {
      return { success: true, access: true, user: cached, cached: true };
    }
    // Safe Graceful Fallback สำหรับเจ้าหน้าที่ที่ล็อกอินผ่าน LINE
    return {
      success: true,
      access: true,
      user: {
        lineId: uid,
        name: displayName || 'เจ้าหน้าที่',
        role: 'Investigator',
        status: 'approved'
      },
      offline: true,
      message: 'เชื่อมต่อแบบออฟไลน์'
    };
  }
}

/**
 * ดึงข้อมูลผู้ใช้ปัจจุบันจาก Storage
 */
function getCurrentUser() {
  try {
    const userStr = sessionStorage.getItem('sanbot_user') || localStorage.getItem('sanbot_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

/**
 * ตรวจสอบว่าผู้ใช้ปัจจุบันมีบทบาทตามที่ระบุหรือไม่ (เช่น isAdmin, isOfficer)
 */
function hasRole(allowedRoles = ['Admin']) {
  const user = getCurrentUser();
  if (!user) return false;
  if (user.role === 'Admin') return true; // Admin มีสิทธิ์ทุกฟังก์ชัน
  return allowedRoles.includes(user.role);
}

/**
 * แปลงไฟล์รูปภาพ (File object) เป็น Base64 String พร้อมตัด header data:image/... ออก
 * @param {File} file - ไฟล์รูปภาพ
 * @returns {Promise<{base64: string, mimeType: string, fileName: string}>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64Data = result.split(',')[1];
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      resolve({
        base64: base64Data,
        mimeType: mimeType,
        fileName: file.name
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}
