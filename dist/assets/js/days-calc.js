/**
 * JapanCalc — Days Between Dates / N Days Later Calculator
 */

const DAYS_OF_WEEK_JP = ['日', '月', '火', '水', '木', '金', '土'];
const DAYS_OF_WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calculate days between two dates
 * @param {string} fromStr — YYYY-MM-DD
 * @param {string} toStr   — YYYY-MM-DD
 * @param {boolean} includeStart — include start date in count
 * @param {boolean} includeEnd   — include end date in count
 * @returns {{ totalDays, weeks, remainDays, toDate, toDayOfWeekJP, toDayOfWeekEN, error }}
 */
export function calcDaysBetween(fromStr, toStr, includeStart = false, includeEnd = true) {
  const from = new Date(fromStr + 'T00:00:00');
  const to   = new Date(toStr   + 'T00:00:00');

  if (isNaN(from.getTime()) || isNaN(to.getTime()))
    return { error: '日付を正しく入力してください' };

  const diffMs   = to - from;
  let totalDays  = Math.round(diffMs / 86400000);

  if (includeStart) totalDays += 1;
  if (!includeEnd)  totalDays -= 1;

  const isNegative = totalDays < 0;
  const absDays    = Math.abs(totalDays);
  const weeks      = Math.floor(absDays / 7);
  const remainDays = absDays % 7;

  return {
    totalDays,
    absDays,
    weeks,
    remainDays,
    isNegative,
    fromDate:        formatDateJP(from),
    toDate:          formatDateJP(to),
    fromDayOfWeekJP: DAYS_OF_WEEK_JP[from.getDay()],
    toDayOfWeekJP:   DAYS_OF_WEEK_JP[to.getDay()],
    toDayOfWeekEN:   DAYS_OF_WEEK_EN[to.getDay()],
    toDateStr:       toStr,
  };
}

/**
 * Calculate a date N days from a starting date
 * @param {string} fromStr — YYYY-MM-DD
 * @param {number} days — positive = future, negative = past
 * @returns {{ resultDate, resultStr, dayOfWeekJP, dayOfWeekEN, totalDays, error }}
 */
export function calcDaysLater(fromStr, days) {
  const from = new Date(fromStr + 'T00:00:00');
  if (isNaN(from.getTime()))
    return { error: '基準日を正しく入力してください' };
  if (isNaN(days))
    return { error: '日数を入力してください' };

  const result = new Date(from);
  result.setDate(result.getDate() + days);

  return {
    resultDate:    formatDateJP(result),
    resultStr:     toDateStr(result),
    dayOfWeekJP:   DAYS_OF_WEEK_JP[result.getDay()],
    dayOfWeekEN:   DAYS_OF_WEEK_EN[result.getDay()],
    totalDays:     days,
    fromDate:      formatDateJP(from),
  };
}

/**
 * Count business days between two dates (excludes weekends + JP holidays)
 * @param {string} fromStr
 * @param {string} toStr
 * @param {Object} holidayLookup — { "YYYY-MM-DD": "holiday name" }
 * @returns {number}
 */
export function calcBusinessDays(fromStr, toStr, holidayLookup = {}) {
  const from = new Date(fromStr + 'T00:00:00');
  const to   = new Date(toStr   + 'T00:00:00');
  if (from > to) return 0;

  let count = 0;
  const cur = new Date(from);
  while (cur <= to) {
    const dow = cur.getDay();
    const str = toDateStr(cur);
    if (dow !== 0 && dow !== 6 && !holidayLookup[str]) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export function formatDateJP(d) {
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
