/**
 * ==========================================================================
 * VΩ.Infinity Genba Task Master [v301.0 Server Implementation - starter]
 * Phase 3: Server implementation baseline for schedule/report flows.
 * ==========================================================================
 */

if (typeof window === 'undefined' && typeof globalThis !== 'undefined') {
  globalThis.window = {};
}

const PROPS = PropertiesService.getScriptProperties();
const CONFIG = {
  TIMEZONE: 'Asia/Tokyo'
};

const SHEET_VARIANTS = {
  SCHEDULE: ['日程表', 'T_Schedule', 'Schedule'],
  REPORT: ['日報データ', 'T_Reports', 'Reports'],
  SITE: ['マスタ_現場', 'M_Sites', 'Sites'],
  CLIENT: ['マスタ_顧客', 'M_Contracts', 'Clients']
};

function withRetry_(fn, label, maxRetry, baseSleepMs) {
  const max = maxRetry || 3;
  const base = baseSleepMs || 120;
  let lastErr = null;
  for (let i = 0; i < max; i++) {
    try {
      return fn();
    } catch (e) {
      lastErr = e;
      Utilities.sleep(base * (i + 1));
    }
  }
  throw new Error((label || 'withRetry') + ': ' + String(lastErr || 'unknown'));
}

function getActiveSpreadsheet_() {
  return withRetry_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error('Active spreadsheet not found');
    return ss;
  }, 'getActiveSpreadsheet');
}

function getSheet_(key) {
  const ss = getActiveSpreadsheet_();
  const variants = SHEET_VARIANTS[key] || [];
  for (let i = 0; i < variants.length; i++) {
    const sh = ss.getSheetByName(variants[i]);
    if (sh) return sh;
  }
  return ss.insertSheet(variants[0] || key);
}

function parseJsonCompatible_(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const s = value.trim();
  if (!s) return [];
  if (s.startsWith('[') || s.startsWith('{')) {
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {}
  }
  return s.split(',').map((id) => String(id || '').trim()).filter(Boolean).map((id) => ({ id: id, qty: 1, unit: '' }));
}

function toYmd_(d) {
  const date = (d instanceof Date) ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, CONFIG.TIMEZONE, 'yyyy-MM-dd');
}

function getMasterMaps_() {
  const siteMap = {};
  const clientMap = {};

  const siteSh = getSheet_('SITE');
  if (siteSh.getLastRow() > 1) {
    const rows = siteSh.getRange(2, 1, siteSh.getLastRow() - 1, Math.min(7, siteSh.getLastColumn())).getValues();
    rows.forEach((r) => {
      siteMap[String(r[0] || '')] = { id: String(r[0] || ''), cid: String(r[1] || ''), name: r[2] || '', type: r[6] || '' };
    });
  }

  const clientSh = getSheet_('CLIENT');
  if (clientSh.getLastRow() > 1) {
    const rows = clientSh.getRange(2, 1, clientSh.getLastRow() - 1, Math.min(5, clientSh.getLastColumn())).getValues();
    rows.forEach((r) => {
      clientMap[String(r[0] || '')] = { id: String(r[0] || ''), name: r[1] || '', color: r[4] || '' };
    });
  }

  return { siteMap: siteMap, clientMap: clientMap };
}

function buildReportSubmittedMap_(startStr, endStr) {
  const map = {};
  const sh = getSheet_('REPORT');
  if (sh.getLastRow() < 2) return map;
  const rows = sh.getRange(2, 2, sh.getLastRow() - 1, 10).getValues(); // B-K
  const rs = new Date(startStr); rs.setHours(0, 0, 0, 0);
  const re = new Date(endStr); re.setHours(23, 59, 59, 999);
  rows.forEach((row) => {
    const status = String(row[9] || '').trim().toLowerCase();
    if (!status || status === 'draft' || status === '下書き') return;
    if (!['submitted', 'approved', '提出済', '承認済'].includes(status) && status !== '提出済' && status !== '承認済') return;
    const rDate = new Date(row[0]);
    if (isNaN(rDate.getTime()) || rDate < rs || rDate > re) return;
    const sid = String(row[2] || '').trim();
    if (!sid) return;
    const dateKey = toYmd_(rDate);
    map[`${sid}::${dateKey}`] = true;
  });
  return map;
}

function getSchedules(startStr, endStr) {
  try {
    const sh = getSheet_('SCHEDULE');
    if (sh.getLastRow() < 2) return [];

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return [];
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { siteMap, clientMap } = getMasterMaps_();
    const reportMap = buildReportSubmittedMap_(startStr, endStr);

    const width = Math.min(12, Math.max(1, sh.getLastColumn()));
    const data = sh.getRange(2, 1, sh.getLastRow() - 1, width).getValues();
    const res = [];

    data.forEach((r) => {
      if (!r[0]) return;
      const sDate = new Date(r[1]);
      const eDate = new Date(r[2]);
      if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return;
      if (sDate > endDate || eDate < startDate) return;

      const siteId = String(r[3] || '');
      const siteInfo = siteMap[siteId] || { name: '', cid: '', type: '' };
      const clientInfo = clientMap[siteInfo.cid] || { name: '', color: '' };

      const workers = parseJsonCompatible_(r[4]);
      const machines = parseJsonCompatible_(r[5]);
      const materials = parseJsonCompatible_(r[6]);
      const outsourcing = parseJsonCompatible_(r[7]);
      const works = parseJsonCompatible_(r[8]);
      const content = r[9] || '';
      const calId = r[10] || '';
      const status = r[11] || 'Active';

      const dateKey = toYmd_(sDate);
      const reportSubmitted = !!reportMap[`${siteId}::${dateKey}`];
      const isOffDay = String(siteInfo.name || '').indexOf('休み') !== -1 || String(content).indexOf('休み') !== -1;
      const reportMissing = !isOffDay && (sDate < today) && !reportSubmitted;

      res.push({
        id: r[0],
        start: dateKey,
        end: toYmd_(eDate),
        title: clientInfo.name || '',
        backgroundColor: clientInfo.color || '#888',
        borderColor: clientInfo.color || '#888',
        extendedProps: {
          id: r[0],
          siteId: siteId,
          siteName: siteInfo.name,
          siteType: siteInfo.type || '',
          clientId: siteInfo.cid,
          clientName: clientInfo.name,
          workers: workers,
          machines: machines,
          materials: materials,
          outsourcing: outsourcing,
          works: works,
          content: content,
          calendarEventId: calId,
          status: status,
          realId: r[0],
          reportMissing: reportMissing,
          reportSubmitted: reportSubmitted,
          reportRequired: !isOffDay
        }
      });
    });

    return res;
  } catch (e) {
    return [];
  }
}

function saveScheduleEvent(evt) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { success: false, msg: '処理が混雑しています' };
  try {
    const sh = getSheet_('SCHEDULE');
    if (!evt) return { success: false, msg: 'データが空です' };

    let id = String(evt.id || '').trim();
    if (!id) id = Utilities.getUuid();

    const normalizeList = (list) => {
      const arr = Array.isArray(list) ? list : [];
      return arr.map((it) => ({
        id: String((it && it.id) || ''),
        name: String((it && it.name) || ''),
        qty: Math.max(0, Number((it && it.qty) || 1) || 1),
        unit: String((it && it.unit) || '')
      }));
    };

    const rowData = [
      id,
      String((evt.start || '')).split('T')[0] || '',
      String((evt.end || evt.start || '')).split('T')[0] || '',
      evt.siteId || '',
      JSON.stringify(normalizeList(evt.workers || [])),
      JSON.stringify(normalizeList(evt.machines || [])),
      JSON.stringify(normalizeList(evt.materials || [])),
      JSON.stringify(normalizeList(evt.outsourcing || [])),
      JSON.stringify(Array.isArray(evt.works) ? evt.works : []),
      evt.content || '',
      evt.calendarEventId || '',
      evt.status || 'Active'
    ];

    const data = sh.getDataRange().getValues();
    let foundRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === id) { foundRow = i + 1; break; }
    }

    if (foundRow > 0) sh.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    else sh.appendRow(rowData);

    return { success: true, id: id, msg: '保存しました' };
  } catch (e) {
    return { success: false, msg: String(e) };
  } finally {
    lock.releaseLock();
  }
}


function deleteScheduleEvent(id) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { success: false, msg: '処理が混雑しています' };
  try {
    const targetId = String(id || '').trim();
    if (!targetId) return { success: false, msg: 'IDが必要です' };
    const sh = getSheet_('SCHEDULE');
    if (sh.getLastRow() < 2) return { success: false, msg: '削除対象なし' };
    const data = sh.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || '') === targetId) { rowIndex = i + 1; break; }
    }
    if (rowIndex < 0) return { success: false, msg: '対象が見つかりません' };
    sh.deleteRow(rowIndex);
    SpreadsheetApp.flush();
    return { success: true, msg: '削除しました' };
  } catch (e) {
    return { success: false, msg: String(e) };
  } finally {
    lock.releaseLock();
  }
}

function parseHmToMinutes_(hm) {
  const m = String(hm || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!isFinite(h) || !isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function calcLaborHours_(startHm, endHm, breakMinutes) {
  const s = parseHmToMinutes_(startHm);
  const e = parseHmToMinutes_(endHm);
  if (s === null || e === null) return 0;
  let diff = e - s;
  if (diff <= 0) diff += 24 * 60;
  const br = Math.max(0, Number(breakMinutes) || 0);
  return Math.max(0, diff - br) / 60;
}

function calcLaborQtyFromHours_(hours) {
  const h = Number(hours) || 0;
  if (h <= 0) return 0;
  return Math.max(0.25, Math.ceil((h / 8) * 4) / 4);
}

function normalizeLaborEntryForReport_(row) {
  const src = row || {};
  const name = String(src.name || src.workerName || '').trim();
  const startTime = String(src.startTime || src.start || '08:00').trim() || '08:00';
  const endTime = String(src.endTime || src.end || '17:00').trim() || '17:00';
  const breakMinutes = Math.max(0, Number(src.breakMinutes || src.break || 60) || 60);
  const qtyEditable = !!src.qtyEditable || name.indexOf('常用外注') >= 0;
  const perHoursRaw = Number(src.hours);
  const perHours = (isFinite(perHoursRaw) && perHoursRaw >= 0) ? perHoursRaw : calcLaborHours_(startTime, endTime, breakMinutes);
  let qty = Number(src.qty);
  if (!isFinite(qty) || qty < 0) qty = 0;
  if (!qtyEditable) {
    const autoQty = calcLaborQtyFromHours_(perHours);
    qty = autoQty > 0 ? autoQty : qty;
  }
  let totalHours = Number(src.totalHours);
  if (!isFinite(totalHours) || totalHours < 0) totalHours = qtyEditable ? (perHours * qty) : perHours;
  if (totalHours <= 0 && qty > 0) totalHours = qty * 8;
  return {
    name: name,
    startTime: startTime,
    endTime: endTime,
    breakMinutes: breakMinutes,
    qtyEditable: qtyEditable,
    qty: qty,
    hours: perHours,
    totalHours: totalHours
  };
}

function normalizeLaborListForReport_(laborList) {
  const src = Array.isArray(laborList) ? laborList : [];
  return src.map(normalizeLaborEntryForReport_).filter((x) => x && (x.name || Number(x.qty) > 0 || Number(x.totalHours) > 0));
}

function getReportHistory(startStr, endStr, siteId) {
  try {
    if (!startStr || !endStr) return { success: false, msg: '期間が不正です', list: [] };
    const sh = getSheet_('REPORT');
    if (sh.getLastRow() < 2) return { success: true, list: [] };
    const data = sh.getDataRange().getValues();
    const sDate = new Date(startStr);
    const eDate = new Date(endStr);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return { success: false, msg: '期間が不正です', list: [] };
    sDate.setHours(0,0,0,0); eDate.setHours(23,59,59,999);
    const list = [];
    for (let i = data.length - 1; i >= 1; i--) {
      const row = data[i];
      const rDate = new Date(row[1]);
      if (isNaN(rDate.getTime()) || rDate < sDate || rDate > eDate) continue;
      if (siteId && String(row[3] || '') !== String(siteId)) continue;
      list.push({
        id: String(row[0] || ''),
        date: toYmd_(rDate),
        siteId: String(row[3] || ''),
        siteName: row[5] || '',
        total: Number(row[11]) || 0,
        status: row[10] || ''
      });
      if (list.length >= 100) break;
    }
    return { success: true, list: list };
  } catch (e) {
    return { success: false, msg: String(e), list: [] };
  }
}

function getReportById(id) {
  try {
    const sh = getSheet_('REPORT');
    if (sh.getLastRow() < 2) return { success: false, msg: 'データが見つかりません' };
    const data = sh.getDataRange().getValues();
    const safeParse = (raw) => {
      try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
    };
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[0] || '') !== String(id || '')) continue;
      const resources = safeParse(row[7]);
      const normType = (v) => String(v || '').toUpperCase();
      return {
        success: true,
        data: {
          id: row[0],
          date: toYmd_(row[1]),
          clientId: row[2],
          siteId: row[3],
          clientName: row[4],
          siteName: row[5],
          labor: safeParse(row[6]),
          materials: resources.filter((x) => normType(x.type) === 'MATERIAL'),
          machines: resources.filter((x) => normType(x.type) === 'MACHINE'),
          outsourcing: resources.filter((x) => normType(x.type) === 'OUTSOURCING'),
          works: safeParse(row[8]),
          expenses: safeParse(row[9]),
          status: row[10],
          totalCost: Number(row[11]) || 0,
          weather: row[12] || '',
          temp: row[13] || '',
          photos: safeParse(row[14] || '[]'),
          docs: safeParse(row[15] || '[]')
        }
      };
    }
    return { success: false, msg: 'データが見つかりません' };
  } catch (e) {
    return { success: false, msg: String(e) };
  }
}

function submitDailyReport(d) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { success: false, msg: 'サーバ混雑中' };
  try {
    const reportSh = getSheet_('REPORT');
    const detailSh = getSheet_('REPORT').getParent().getSheetByName('日報明細') || getSheet_('REPORT').getParent().insertSheet('日報明細');

    const id = String((d && d.id) || Utilities.getUuid());
    const laborList = normalizeLaborListForReport_((d && d.labor) || []);
    const makeRes = (list, type) => (Array.isArray(list) ? list : []).map((item) => ({
      id: item.id || '',
      name: item.name || item.item || '',
      type: type,
      qty: Number(item.qty) || 1,
      unit: item.unit || '',
      price: Number(item.price) || 0
    }));
    const resources = [].concat(makeRes(d.materials, 'MATERIAL'), makeRes(d.machines, 'MACHINE'), makeRes(d.outsourcing, 'OUTSOURCING'));

    const rowData = [
      id,
      d.date || '',
      d.clientId || '',
      d.siteId || '',
      d.clientName || '',
      d.siteName || '',
      JSON.stringify(laborList),
      JSON.stringify(resources),
      JSON.stringify(d.works || []),
      JSON.stringify(d.expenses || []),
      d.status || '提出済',
      Number(d.totalCost) || 0,
      d.weather || '',
      d.temp || '',
      JSON.stringify(d.photos || []),
      JSON.stringify(d.docs || [])
    ];

    const rows = reportSh.getDataRange().getValues();
    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '') === id) { targetRow = i + 1; break; }
    }
    if (targetRow > 0) reportSh.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    else reportSh.appendRow(rowData);

    const detailRows = [];
    laborList.forEach((l) => {
      const qty = Number(l.qty) || 0;
      detailRows.push([id, d.date || '', d.siteId || '', 'LABOR', l.name || '', qty, '人工', 0, 0, '']);
    });
    resources.forEach((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      detailRows.push([id, d.date || '', d.siteId || '', item.type, item.name || '', qty, item.unit || '', price, qty * price, '']);
    });
    if (detailRows.length) detailSh.getRange(detailSh.getLastRow() + 1, 1, detailRows.length, detailRows[0].length).setValues(detailRows);

    SpreadsheetApp.flush();
    return { success: true, id: id, msg: '提出完了' };
  } catch (e) {
    return { success: false, msg: '提出エラー: ' + String(e) };
  } finally {
    lock.releaseLock();
  }
}
