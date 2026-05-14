import * as XLSX from 'xlsx';

/**
 * Parse an uploaded file (CSV or XLSX) and return sheet data.
 * @param {File} file
 * @returns {Promise<{sheetNames: string[], sheets: Object}>}
 */
export async function parseSpreadsheet(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });

  const sheets = {};
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
    const merges = ws['!merges'] || [];
    sheets[name] = { rawData, merges };
  }

  return { sheetNames: workbook.SheetNames, sheets };
}

/**
 * Convert an Excel serial date number to a JS Date.
 * Excel epoch: 1900-01-01 (with the 1900 leap year bug).
 */
export function excelSerialToDate(serial) {
  if (typeof serial !== 'number' || serial < 1) return null;
  // Excel incorrectly treats 1900 as a leap year, so subtract 1 for dates after Feb 28, 1900
  const utcDays = serial - 25569; // 25569 = days between 1900-01-01 and 1970-01-01
  const utcMs = utcDays * 86400 * 1000;
  return new Date(utcMs);
}

/**
 * Try to parse a value as a date. Handles:
 *   - Excel serial numbers (e.g. 46238)
 *   - DD/MM/YY, DD-MM-YY, DD/MM/YYYY, DD-MM-YYYY
 *   - YYYY-MM-DD
 * @returns {string|null} ISO date string (YYYY-MM-DD) or null
 */
export function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;

  // Excel serial number
  if (typeof value === 'number' && value > 40000 && value < 55000) {
    const d = excelSerialToDate(value);
    if (d && !isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  }

  const str = String(value).trim();
  if (!str) return null;

  // YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // DD/MM/YY or DD/MM/YYYY or DD-MM-YY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    let [, d, m, y] = dmyMatch;
    if (y.length === 2) {
      const yn = parseInt(y);
      y = yn >= 50 ? `19${y}` : `20${y}`;
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

/**
 * Extract a compact summary of the sheet for the AI agent.
 * Returns the first N rows, column count, total row count, and merge info.
 */
export function getSheetSummary(sheetData, maxRows = 6) {
  const { rawData, merges } = sheetData;
  const totalRows = rawData.length;
  const maxCols = rawData.reduce((max, row) => Math.max(max, row.length), 0);

  // Find the header row (first non-empty row)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, rawData.length); i++) {
    const nonEmpty = rawData[i].filter(c => c !== '').length;
    if (nonEmpty > 3) {
      headerRowIdx = i;
      break;
    }
  }

  const sampleRows = rawData.slice(0, Math.min(headerRowIdx + maxRows + 1, totalRows));

  // Describe merges in human-readable form
  const mergeDescriptions = merges.slice(0, 15).map(m =>
    `Cells [Row ${m.s.r}, Col ${m.s.c}] to [Row ${m.e.r}, Col ${m.e.c}]`
  );

  return {
    totalRows,
    totalCols: maxCols,
    headerRowIdx,
    sampleRows,
    mergeDescriptions,
  };
}

/**
 * Given AI-identified column mappings, extract structured student+attendance data.
 */
export function extractAttendanceData(rawData, mapping) {
  const {
    headerRowIndex,
    nameCol,
    usnCol,
    emailCol,
    branchCol,
    admissionCol,
    attendanceCols, // array of { colIndex, date, hasDate }
  } = mapping;

  const students = [];
  const dataStartRow = headerRowIndex + 1;

  for (let r = dataStartRow; r < rawData.length; r++) {
    const row = rawData[r];
    const name = row[nameCol] ? String(row[nameCol]).trim() : '';
    if (!name) continue; // skip empty rows

    const student = {
      name,
      usn: usnCol !== null && usnCol !== undefined ? String(row[usnCol] || '').trim() : '',
      email: emailCol !== null && emailCol !== undefined ? String(row[emailCol] || '').trim() : '',
      branch: branchCol !== null && branchCol !== undefined ? String(row[branchCol] || '').trim() : '',
      admission_number: admissionCol !== null && admissionCol !== undefined ? String(row[admissionCol] || '').trim() : '',
      attendance: {},
    };

    for (const ac of attendanceCols) {
      if (!ac.date) continue;
      const val = row[ac.colIndex];
      // Interpret attendance: true, "P", "Present", 1, "1", "Y" => present
      const present = interpretAttendance(val);
      student.attendance[ac.date] = present;
    }

    students.push(student);
  }

  return students;
}

/**
 * Interpret a cell value as attendance boolean.
 */
function interpretAttendance(val) {
  if (val === true || val === 1) return true;
  if (val === false || val === 0) return false;
  if (val === '' || val === null || val === undefined) return false;
  const s = String(val).trim().toLowerCase();
  if (['true', 'p', 'present', 'yes', 'y', '1'].includes(s)) return true;
  if (['false', 'a', 'absent', 'no', 'n', '0'].includes(s)) return false;
  return false;
}
