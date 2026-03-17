/**
 * japancalc.com — Holiday Checker Logic Module
 * Spec: PRD v1.0 Section 2.2 (Tool 7 — Japan Public Holiday Checker)
 *
 * Exports: checkDate, getHolidaysForMonth, getHolidaysForYear, getNextHoliday, getSupportedYears
 */

// ============ HOLIDAY DATA (inlined from src/_data/jp-holidays.json) ============

const HOLIDAY_DATA = {
  "2023": [
    { date: "2023-01-01", nameJP: "元日",              nameEN: "New Year's Day",               type: "national",   note: "" },
    { date: "2023-01-02", nameJP: "振替休日",          nameEN: "New Year's Day (substitute)",  type: "substitute", note: "Jan 1 fell on Sunday" },
    { date: "2023-01-09", nameJP: "成人の日",          nameEN: "Coming of Age Day",            type: "national",   note: "2nd Monday of January" },
    { date: "2023-02-11", nameJP: "建国記念の日",      nameEN: "National Foundation Day",      type: "national",   note: "" },
    { date: "2023-02-23", nameJP: "天皇誕生日",        nameEN: "Emperor's Birthday",           type: "national",   note: "" },
    { date: "2023-03-21", nameJP: "春分の日",          nameEN: "Vernal Equinox Day",           type: "national",   note: "" },
    { date: "2023-04-29", nameJP: "昭和の日",          nameEN: "Showa Day",                    type: "national",   note: "" },
    { date: "2023-05-03", nameJP: "憲法記念日",        nameEN: "Constitution Memorial Day",    type: "national",   note: "" },
    { date: "2023-05-04", nameJP: "みどりの日",        nameEN: "Greenery Day",                 type: "national",   note: "" },
    { date: "2023-05-05", nameJP: "こどもの日",        nameEN: "Children's Day",               type: "national",   note: "" },
    { date: "2023-07-17", nameJP: "海の日",            nameEN: "Marine Day",                   type: "national",   note: "3rd Monday of July" },
    { date: "2023-08-11", nameJP: "山の日",            nameEN: "Mountain Day",                 type: "national",   note: "" },
    { date: "2023-09-18", nameJP: "敬老の日",          nameEN: "Respect for the Aged Day",     type: "national",   note: "3rd Monday of September" },
    { date: "2023-09-23", nameJP: "秋分の日",          nameEN: "Autumnal Equinox Day",         type: "national",   note: "" },
    { date: "2023-10-09", nameJP: "スポーツの日",      nameEN: "Sports Day",                   type: "national",   note: "2nd Monday of October" },
    { date: "2023-11-03", nameJP: "文化の日",          nameEN: "Culture Day",                  type: "national",   note: "" },
    { date: "2023-11-23", nameJP: "勤労感謝の日",      nameEN: "Labour Thanksgiving Day",      type: "national",   note: "" }
  ],
  "2024": [
    { date: "2024-01-01", nameJP: "元日",              nameEN: "New Year's Day",               type: "national",   note: "" },
    { date: "2024-01-08", nameJP: "成人の日",          nameEN: "Coming of Age Day",            type: "national",   note: "2nd Monday of January" },
    { date: "2024-02-11", nameJP: "建国記念の日",      nameEN: "National Foundation Day",      type: "national",   note: "" },
    { date: "2024-02-12", nameJP: "振替休日",          nameEN: "National Foundation Day (substitute)", type: "substitute", note: "Feb 11 fell on Sunday" },
    { date: "2024-02-23", nameJP: "天皇誕生日",        nameEN: "Emperor's Birthday",           type: "national",   note: "" },
    { date: "2024-03-20", nameJP: "春分の日",          nameEN: "Vernal Equinox Day",           type: "national",   note: "" },
    { date: "2024-04-29", nameJP: "昭和の日",          nameEN: "Showa Day",                    type: "national",   note: "" },
    { date: "2024-05-03", nameJP: "憲法記念日",        nameEN: "Constitution Memorial Day",    type: "national",   note: "" },
    { date: "2024-05-04", nameJP: "みどりの日",        nameEN: "Greenery Day",                 type: "national",   note: "" },
    { date: "2024-05-05", nameJP: "こどもの日",        nameEN: "Children's Day",               type: "national",   note: "" },
    { date: "2024-05-06", nameJP: "振替休日",          nameEN: "Children's Day (substitute)",  type: "substitute", note: "May 5 fell on Sunday" },
    { date: "2024-07-15", nameJP: "海の日",            nameEN: "Marine Day",                   type: "national",   note: "3rd Monday of July" },
    { date: "2024-08-11", nameJP: "山の日",            nameEN: "Mountain Day",                 type: "national",   note: "" },
    { date: "2024-08-12", nameJP: "振替休日",          nameEN: "Mountain Day (substitute)",    type: "substitute", note: "Aug 11 fell on Sunday" },
    { date: "2024-09-16", nameJP: "敬老の日",          nameEN: "Respect for the Aged Day",     type: "national",   note: "3rd Monday of September" },
    { date: "2024-09-22", nameJP: "秋分の日",          nameEN: "Autumnal Equinox Day",         type: "national",   note: "" },
    { date: "2024-09-23", nameJP: "振替休日",          nameEN: "Autumnal Equinox Day (substitute)", type: "substitute", note: "Sep 22 fell on Sunday" },
    { date: "2024-10-14", nameJP: "スポーツの日",      nameEN: "Sports Day",                   type: "national",   note: "2nd Monday of October" },
    { date: "2024-11-03", nameJP: "文化の日",          nameEN: "Culture Day",                  type: "national",   note: "" },
    { date: "2024-11-04", nameJP: "振替休日",          nameEN: "Culture Day (substitute)",     type: "substitute", note: "Nov 3 fell on Sunday" },
    { date: "2024-11-23", nameJP: "勤労感謝の日",      nameEN: "Labour Thanksgiving Day",      type: "national",   note: "" }
  ],
  "2025": [
    { date: "2025-01-01", nameJP: "元日",              nameEN: "New Year's Day",               type: "national",   note: "" },
    { date: "2025-01-13", nameJP: "成人の日",          nameEN: "Coming of Age Day",            type: "national",   note: "2nd Monday of January" },
    { date: "2025-02-11", nameJP: "建国記念の日",      nameEN: "National Foundation Day",      type: "national",   note: "" },
    { date: "2025-02-23", nameJP: "天皇誕生日",        nameEN: "Emperor's Birthday",           type: "national",   note: "" },
    { date: "2025-02-24", nameJP: "振替休日",          nameEN: "Emperor's Birthday (substitute)", type: "substitute", note: "Feb 23 fell on Sunday" },
    { date: "2025-03-20", nameJP: "春分の日",          nameEN: "Vernal Equinox Day",           type: "national",   note: "" },
    { date: "2025-04-29", nameJP: "昭和の日",          nameEN: "Showa Day",                    type: "national",   note: "" },
    { date: "2025-05-03", nameJP: "憲法記念日",        nameEN: "Constitution Memorial Day",    type: "national",   note: "" },
    { date: "2025-05-04", nameJP: "みどりの日",        nameEN: "Greenery Day",                 type: "national",   note: "" },
    { date: "2025-05-05", nameJP: "こどもの日",        nameEN: "Children's Day",               type: "national",   note: "" },
    { date: "2025-05-06", nameJP: "振替休日",          nameEN: "Children's Day (substitute)",  type: "substitute", note: "May 5 fell on Sunday" },
    { date: "2025-07-21", nameJP: "海の日",            nameEN: "Marine Day",                   type: "national",   note: "3rd Monday of July" },
    { date: "2025-08-11", nameJP: "山の日",            nameEN: "Mountain Day",                 type: "national",   note: "" },
    { date: "2025-09-15", nameJP: "敬老の日",          nameEN: "Respect for the Aged Day",     type: "national",   note: "3rd Monday of September" },
    { date: "2025-09-23", nameJP: "秋分の日",          nameEN: "Autumnal Equinox Day",         type: "national",   note: "" },
    { date: "2025-10-13", nameJP: "スポーツの日",      nameEN: "Sports Day",                   type: "national",   note: "2nd Monday of October" },
    { date: "2025-11-03", nameJP: "文化の日",          nameEN: "Culture Day",                  type: "national",   note: "" },
    { date: "2025-11-23", nameJP: "勤労感謝の日",      nameEN: "Labour Thanksgiving Day",      type: "national",   note: "" },
    { date: "2025-11-24", nameJP: "振替休日",          nameEN: "Labour Thanksgiving Day (substitute)", type: "substitute", note: "Nov 23 fell on Sunday" }
  ],
  "2026": [
    { date: "2026-01-01", nameJP: "元日",              nameEN: "New Year's Day",               type: "national",   note: "" },
    { date: "2026-01-12", nameJP: "成人の日",          nameEN: "Coming of Age Day",            type: "national",   note: "2nd Monday of January" },
    { date: "2026-02-11", nameJP: "建国記念の日",      nameEN: "National Foundation Day",      type: "national",   note: "" },
    { date: "2026-02-23", nameJP: "天皇誕生日",        nameEN: "Emperor's Birthday",           type: "national",   note: "" },
    { date: "2026-03-20", nameJP: "春分の日",          nameEN: "Vernal Equinox Day",           type: "national",   note: "" },
    { date: "2026-04-29", nameJP: "昭和の日",          nameEN: "Showa Day",                    type: "national",   note: "" },
    { date: "2026-05-03", nameJP: "憲法記念日",        nameEN: "Constitution Memorial Day",    type: "national",   note: "" },
    { date: "2026-05-04", nameJP: "みどりの日",        nameEN: "Greenery Day",                 type: "national",   note: "" },
    { date: "2026-05-05", nameJP: "こどもの日",        nameEN: "Children's Day",               type: "national",   note: "" },
    { date: "2026-07-20", nameJP: "海の日",            nameEN: "Marine Day",                   type: "national",   note: "3rd Monday of July" },
    { date: "2026-08-11", nameJP: "山の日",            nameEN: "Mountain Day",                 type: "national",   note: "" },
    { date: "2026-09-21", nameJP: "敬老の日",          nameEN: "Respect for the Aged Day",     type: "national",   note: "3rd Monday of September" },
    { date: "2026-09-22", nameJP: "国民の休日",        nameEN: "National Holiday (bridge day)", type: "national_holiday", note: "Sandwiched between Respect for the Aged Day and Autumnal Equinox" },
    { date: "2026-09-23", nameJP: "秋分の日",          nameEN: "Autumnal Equinox Day",         type: "national",   note: "" },
    { date: "2026-10-12", nameJP: "スポーツの日",      nameEN: "Sports Day",                   type: "national",   note: "2nd Monday of October" },
    { date: "2026-11-03", nameJP: "文化の日",          nameEN: "Culture Day",                  type: "national",   note: "" },
    { date: "2026-11-23", nameJP: "勤労感謝の日",      nameEN: "Labour Thanksgiving Day",      type: "national",   note: "" }
  ]
};

// ============ CONSTANTS ============

const TYPE_LABELS = {
  national:         'National Holiday (祝日)',
  substitute:       'Substitute Holiday (振替休日)',
  national_holiday: 'National Holiday — Bridge Day (国民の休日)'
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUPPORTED_YEARS = Object.keys(HOLIDAY_DATA).map(Number);

// Build a lookup map: "YYYY-MM-DD" → holiday object
const HOLIDAY_MAP = {};
for (const year of Object.keys(HOLIDAY_DATA)) {
  for (const h of HOLIDAY_DATA[year]) {
    HOLIDAY_MAP[h.date] = h;
  }
}

// ============ HELPERS ============

function isValidDate(dateString) {
  if (typeof dateString !== 'string') return false;
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function getDayOfWeek(dateString) {
  const parts = dateString.split('-');
  const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return DAY_NAMES[dt.getDay()];
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Check if a given date is a Japanese public holiday.
 * @param {string} dateString — ISO date "YYYY-MM-DD"
 * @returns {Object} Holiday result, not-holiday result, out-of-range, or error
 */
export function checkDate(dateString) {
  if (!isValidDate(dateString)) {
    return { error: 'Invalid date' };
  }

  const year = parseInt(dateString.substring(0, 4), 10);
  if (!SUPPORTED_YEARS.includes(year)) {
    return {
      isHoliday:  null,
      date:       dateString,
      outOfRange: true,
      message:    'Date is outside the supported range (2023–2026). Please check back for updated data.'
    };
  }

  const holiday = HOLIDAY_MAP[dateString];
  if (holiday) {
    return {
      isHoliday: true,
      date:      holiday.date,
      nameJP:    holiday.nameJP,
      nameEN:    holiday.nameEN,
      type:      holiday.type,
      typeLabel: TYPE_LABELS[holiday.type] || holiday.type,
      note:      holiday.note,
      dayOfWeek: getDayOfWeek(dateString)
    };
  }

  return {
    isHoliday: false,
    date:      dateString,
    dayOfWeek: getDayOfWeek(dateString),
    nameJP:    null,
    nameEN:    null,
    type:      null,
    typeLabel: null,
    note:      null
  };
}

/**
 * Get all holidays in a given month.
 * @param {number} year — 2023–2026
 * @param {number} month — 1–12
 * @returns {Array} Array of holiday objects for that month (empty if none)
 */
export function getHolidaysForMonth(year, month) {
  const yearData = HOLIDAY_DATA[String(year)];
  if (!yearData) return [];
  const prefix = String(year) + '-' + String(month).padStart(2, '0');
  return yearData.filter(h => h.date.startsWith(prefix));
}

/**
 * Get all holidays for a full year.
 * @param {number} year — 2023–2026
 * @returns {Array} Array of all holiday objects for that year (empty if not in data)
 */
export function getHolidaysForYear(year) {
  return HOLIDAY_DATA[String(year)] || [];
}

/**
 * Find the next upcoming holiday from a given date (exclusive of the date itself).
 * @param {string} dateString — ISO date "YYYY-MM-DD"
 * @returns {Object|null} Next holiday with daysUntil, or null if none found
 */
export function getNextHoliday(dateString) {
  if (!isValidDate(dateString)) return null;

  const parts = dateString.split('-');
  const inputDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  // Collect all holidays across all years, sorted by date
  const allHolidays = [];
  for (const year of SUPPORTED_YEARS) {
    for (const h of HOLIDAY_DATA[String(year)]) {
      allHolidays.push(h);
    }
  }

  for (const h of allHolidays) {
    const hp = h.date.split('-');
    const hDate = new Date(parseInt(hp[0], 10), parseInt(hp[1], 10) - 1, parseInt(hp[2], 10));
    if (hDate > inputDate) {
      const diffMs = hDate.getTime() - inputDate.getTime();
      const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return {
        date:      h.date,
        nameJP:    h.nameJP,
        nameEN:    h.nameEN,
        type:      h.type,
        typeLabel: TYPE_LABELS[h.type] || h.type,
        daysUntil: daysUntil
      };
    }
  }

  return null;
}

/**
 * Get the list of supported years.
 * @returns {number[]} Array of supported years [2023, 2024, 2025, 2026]
 */
export function getSupportedYears() {
  return SUPPORTED_YEARS.slice();
}

// ============ UNIT TESTS ============
// Run: copy-paste into browser console, call runTests()

export function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log('  PASS:', name);
      passed++;
    } else {
      console.error('  FAIL:', name);
      failed++;
    }
  }

  console.log('Holiday module — running 12 tests...');

  // T1: 2025-01-01 = holiday
  const t1 = checkDate('2025-01-01');
  assert('T1: 2025-01-01 isHoliday', t1.isHoliday === true);
  assert('T1: 2025-01-01 nameEN', t1.nameEN === "New Year's Day");

  // T2: 2025-01-02 = not a holiday
  const t2 = checkDate('2025-01-02');
  assert('T2: 2025-01-02 not holiday', t2.isHoliday === false);

  // T3: 2025-01-13 = Coming of Age Day
  const t3 = checkDate('2025-01-13');
  assert('T3: 2025-01-13 Coming of Age', t3.isHoliday === true && t3.nameEN === 'Coming of Age Day');

  // T4: 2024-05-06 = substitute holiday
  const t4 = checkDate('2024-05-06');
  assert('T4: 2024-05-06 substitute', t4.isHoliday === true && t4.type === 'substitute');

  // T5: 2026-09-22 = national_holiday (bridge day)
  const t5 = checkDate('2026-09-22');
  assert('T5: 2026-09-22 national_holiday', t5.isHoliday === true && t5.type === 'national_holiday');

  // T6: 2025-05-03 = Constitution Memorial Day
  const t6 = checkDate('2025-05-03');
  assert('T6: 2025-05-03 Constitution Day', t6.isHoliday === true && t6.nameEN === 'Constitution Memorial Day');

  // T7: 2025-05-04 = Greenery Day
  const t7 = checkDate('2025-05-04');
  assert('T7: 2025-05-04 Greenery Day', t7.isHoliday === true && t7.nameEN === 'Greenery Day');

  // T8: 2025-05-05 = Children's Day
  const t8 = checkDate('2025-05-05');
  assert('T8: 2025-05-05 Children\'s Day', t8.isHoliday === true && t8.nameEN === "Children's Day");

  // T9: 2022-01-01 = out of range
  const t9 = checkDate('2022-01-01');
  assert('T9: 2022-01-01 outOfRange', t9.outOfRange === true);

  // T10: 2027-01-01 = out of range
  const t10 = checkDate('2027-01-01');
  assert('T10: 2027-01-01 outOfRange', t10.outOfRange === true);

  // T11: invalid date
  const t11 = checkDate('invalid');
  assert('T11: invalid → error', t11.error === 'Invalid date');

  // T12: GW May 2025 = 4 holidays
  const t12 = getHolidaysForMonth(2025, 5);
  assert('T12: May 2025 = 4 holidays', t12.length === 4);

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  return { passed, failed };
}
