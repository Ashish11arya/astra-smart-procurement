/**
 * Official Indian Standard Time (IST / Asia/Kolkata) date utilities for Astra Procurement Portal.
 * Prevents UTC day-shift distortions (e.g. 23 September shifting to 22 September in database queries).
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 3600 * 1000;

/**
 * Returns today's date formatted as canonical 'YYYY-MM-DD' in Indian Standard Time (IST).
 */
export function getTodayIstDateStr(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Formats any Date or ISO string as canonical 'YYYY-MM-DD' in Indian Standard Time (IST).
 */
export function formatIstDateStr(d: Date | string): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj);
}

/**
 * Converts a canonical date string ('YYYY-MM-DD') into exact UTC start and end bounds
 * matching the 00:00:00 to 23:59:59 IST procurement calendar day.
 */
export function parseIstDateRange(dateStr: string): {
  startOfDay: Date;
  endOfDay: Date;
  canonicalDateStr: string;
} {
  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [year, month, day] = cleanStr.split('-').map(Number);

  // 00:00:00 IST is (UTC midnight - 5.5h)
  const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS);
  // Next day 00:00:00 IST
  const endOfDay = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0) - IST_OFFSET_MS);

  const canonicalDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    startOfDay,
    endOfDay,
    canonicalDateStr,
  };
}
