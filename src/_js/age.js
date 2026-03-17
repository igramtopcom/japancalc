/**
 * japancalc.com — Age Calculator Logic Module
 * Spec: PRD v1.0 Section 3.4 (FR-AGE-001)
 *
 * Exports: calculateAge, formatDateJP, getAgeDescription, validateDOB, runTests
 */

// ============ INLINED ERA DATA ============

var ERA_OFFSETS = [
  { id: 'reiwa',  romaji: 'Reiwa',  kanji: '\u4EE4\u548C', start: '2019-05-01', offset: 2018 },
  { id: 'heisei', romaji: 'Heisei', kanji: '\u5E73\u6210', start: '1989-01-08', offset: 1988 },
  { id: 'showa',  romaji: 'Showa',  kanji: '\u662D\u548C', start: '1926-12-25', offset: 1925 },
  { id: 'taisho', romaji: 'Taisho', kanji: '\u5927\u6B63', start: '1912-07-30', offset: 1911 },
  { id: 'meiji',  romaji: 'Meiji',  kanji: '\u660E\u6CBB', start: '1868-01-25', offset: 1867 }
];

var MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

var DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday'
];

// ============ HELPERS ============

function parseLocalDate(dateStr) {
  var parts = dateStr.split('-');
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var d = parseInt(parts[2], 10);
  var date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) {
    return null;
  }
  return date;
}

function formatDate(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, '0');
  var d = String(date.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

function formatDateLong(date) {
  return date.getDate() + ' ' + MONTH_NAMES[date.getMonth()] + ' ' + date.getFullYear();
}

function lookupBirthEra(dobDate) {
  var dobStr = formatDate(dobDate);
  for (var i = 0; i < ERA_OFFSETS.length; i++) {
    var era = ERA_OFFSETS[i];
    if (dobStr >= era.start) {
      var eraYear = dobDate.getFullYear() - era.offset;
      if (eraYear === 1) {
        return era.romaji + ' 1 / Gannen (' + era.kanji + '\u5143\u5E74)';
      }
      return era.romaji + ' ' + eraYear + ' (' + era.kanji + eraYear + '\u5E74)';
    }
  }
  return '';
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Calculate Japanese age (満年齢 and 数え年) from date of birth.
 * @param {string} dobString - ISO date string "YYYY-MM-DD" — date of birth
 * @param {string|null} [referenceDateString] - ISO date string "YYYY-MM-DD" — defaults to today
 * @returns {{ manNenrei: number, kazoedoshi: number, years: number, months: number, days: number, dob: string, dobFormatted: string, birthEra: string, birthDayOfWeek: string, nextBirthday: string, nextBirthdayFormatted: string, daysUntilBirthday: number, referenceDate: string, isBirthdayToday: boolean } | { error: string }}
 */
export function calculateAge(dobString, referenceDateString) {
  var dob = parseLocalDate(dobString);
  if (!dob) {
    return { error: 'Invalid date' };
  }

  var ref;
  if (referenceDateString) {
    ref = parseLocalDate(referenceDateString);
    if (!ref) return { error: 'Invalid date' };
  } else {
    var now = new Date();
    ref = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Validation
  var meijiStart = new Date(1868, 0, 25);
  if (dob < meijiStart) {
    return { error: 'Date of birth is before the Meiji era (1868)' };
  }
  if (dob > ref) {
    return { error: 'Date of birth cannot be in the future' };
  }

  // 満年齢 (man-nenrei) — standard Western age
  var manNenrei = ref.getFullYear() - dob.getFullYear();
  var birthdayThisYear = new Date(ref.getFullYear(), dob.getMonth(), dob.getDate());
  if (ref < birthdayThisYear) {
    manNenrei--;
  }

  // 数え年 (kazoedoshi) — traditional counting age
  var kazoedoshi = ref.getFullYear() - dob.getFullYear() + 1;

  // Detailed breakdown: years, months, days
  var years = manNenrei;
  var months, days;

  var tempYear = dob.getFullYear() + years;
  var tempMonth = dob.getMonth();
  var tempDay = dob.getDate();

  // Find months
  months = ref.getMonth() - tempMonth;
  if (months < 0) {
    months += 12;
  }
  // Check if days need adjustment
  var afterAddingMonths = new Date(tempYear, tempMonth + months, tempDay);
  if (afterAddingMonths > ref) {
    months--;
    if (months < 0) months += 12;
  }

  // Calculate days
  var startOfLastMonth = new Date(ref.getFullYear(), ref.getMonth(), dob.getDate());
  if (startOfLastMonth > ref) {
    // Go back one month
    startOfLastMonth = new Date(ref.getFullYear(), ref.getMonth() - 1, dob.getDate());
    // Handle day overflow
    var maxDay = daysInMonth(ref.getFullYear(), ref.getMonth() - 1);
    if (dob.getDate() > maxDay) {
      startOfLastMonth = new Date(ref.getFullYear(), ref.getMonth() - 1, maxDay);
    }
  }
  days = Math.floor((ref - startOfLastMonth) / (1000 * 60 * 60 * 24));
  if (days < 0) days = 0;

  // Birthday check
  var isBirthdayToday = ref.getMonth() === dob.getMonth() && ref.getDate() === dob.getDate();

  // Next birthday
  var nextBday = new Date(ref.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBday <= ref && !isBirthdayToday) {
    nextBday = new Date(ref.getFullYear() + 1, dob.getMonth(), dob.getDate());
  } else if (isBirthdayToday) {
    nextBday = new Date(ref.getFullYear() + 1, dob.getMonth(), dob.getDate());
  }

  var daysUntilBirthday = isBirthdayToday
    ? 0
    : Math.ceil((nextBday - ref) / (1000 * 60 * 60 * 24));

  return {
    manNenrei: manNenrei,
    kazoedoshi: kazoedoshi,
    years: years,
    months: months,
    days: days,
    dob: dobString,
    dobFormatted: formatDateLong(dob),
    birthEra: lookupBirthEra(dob),
    birthDayOfWeek: DAY_NAMES[dob.getDay()],
    nextBirthday: formatDate(nextBday),
    nextBirthdayFormatted: formatDateLong(nextBday),
    daysUntilBirthday: daysUntilBirthday,
    referenceDate: formatDate(ref),
    isBirthdayToday: isBirthdayToday
  };
}

/**
 * Format a date string to Japanese notation.
 * @param {string} dateString - ISO date string "YYYY-MM-DD"
 * @returns {string} Japanese formatted date e.g. "2000年3月15日"
 */
export function formatDateJP(dateString) {
  var parts = dateString.split('-');
  return parseInt(parts[0], 10) + '\u5E74' + parseInt(parts[1], 10) + '\u6708' + parseInt(parts[2], 10) + '\u65E5';
}

/**
 * Returns a contextual description string for the age with Japanese milestone names.
 * @param {number} manNenrei - Age in full years (満年齢)
 * @returns {string} Description string
 */
export function getAgeDescription(manNenrei) {
  if (manNenrei === 0) return 'Less than 1 year old';
  if (manNenrei === 1) return '1 year old';

  var milestones = {
    20:  '\u6210\u4EBA \u2014 adult in Japan',
    60:  '\u9084\u66A6 \u2014 kanreki, 60th birthday',
    70:  '\u53E4\u7A00 \u2014 koki',
    77:  '\u559C\u5BFF \u2014 kiju',
    80:  '\u5098\u5BFF \u2014 sanju',
    88:  '\u7C73\u5BFF \u2014 beiju',
    99:  '\u767D\u5BFF \u2014 hakuju',
    100: '\u767E\u5BFF \u2014 hyakuju, centenarian'
  };

  var milestone = milestones[manNenrei];
  if (milestone) {
    return manNenrei + ' years old (' + milestone + ')';
  }
  return manNenrei + ' years old';
}

/**
 * Input validation helper for date of birth.
 * @param {string} dobString - Raw user input string in "YYYY-MM-DD" format
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateDOB(dobString) {
  if (dobString === '' || dobString === null || dobString === undefined) {
    return { valid: false, error: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD.' };
  }

  var date = parseLocalDate(dobString);
  if (!date) {
    return { valid: false, error: 'Invalid date' };
  }

  var meijiStart = new Date(1868, 0, 25);
  if (date < meijiStart) {
    return { valid: false, error: 'Date of birth is before the Meiji era (1868)' };
  }

  var today = new Date();
  var todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date > todayLocal) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  return { valid: true, error: null };
}

// ============ UNIT TESTS ============
// Run in browser console: copy-paste functions above (remove export keywords), then call runTests()

export function runTests() {
  var pass = 0;
  var fail = 0;
  var total = 12;

  function assert(label, condition, actual) {
    if (condition) {
      pass++;
      console.log('PASS: ' + label);
    } else {
      fail++;
      console.log('FAIL: ' + label + ' | actual: ' + JSON.stringify(actual));
    }
  }

  // T1: Age on birthday = 25
  var t1 = calculateAge('2000-03-15', '2025-03-15');
  assert('T1 age on birthday = 25', t1.manNenrei === 25 && t1.isBirthdayToday === true, t1);

  // T2: Day before birthday = 24
  var t2 = calculateAge('2000-03-15', '2025-03-14');
  assert('T2 day before birthday = 24', t2.manNenrei === 24, t2);

  // T3: Day after birthday = 25
  var t3 = calculateAge('2000-03-15', '2025-03-16');
  assert('T3 day after birthday = 25', t3.manNenrei === 25, t3);

  // T4: kazoedoshi correct
  var t4 = calculateAge('2000-01-01', '2025-06-15');
  assert('T4 kazoedoshi = 26', t4.kazoedoshi === 26, t4);

  // T5: birthEra Heisei (1989-01-08)
  var t5 = calculateAge('1989-01-08', '2025-01-01');
  assert('T5 birthEra contains Heisei', t5.birthEra.indexOf('Heisei') !== -1, t5.birthEra);

  // T6: birthEra Reiwa (2019-05-01)
  var t6 = calculateAge('2019-05-01', '2025-01-01');
  assert('T6 birthEra contains Reiwa', t6.birthEra.indexOf('Reiwa') !== -1, t6.birthEra);

  // T7: birthEra Heisei (2019-04-30 — last day of Heisei)
  var t7 = calculateAge('2019-04-30', '2025-01-01');
  assert('T7 birthEra 2019-04-30 = Heisei', t7.birthEra.indexOf('Heisei') !== -1, t7.birthEra);

  // T8: Leap year DOB valid
  var t8 = calculateAge('2000-02-29', '2025-03-01');
  assert('T8 leap year DOB valid', !t8.error, t8);

  // T9: Future DOB → error
  var t9 = calculateAge('2025-06-15', '2025-03-15');
  assert('T9 future DOB error', !!t9.error, t9);

  // T10: Pre-Meiji → error
  var t10 = calculateAge('1867-01-01', '2025-01-01');
  assert('T10 pre-Meiji error', !!t10.error, t10);

  // T11: daysUntilBirthday for 1960-12-31 as of 2025-01-01
  var t11 = calculateAge('1960-12-31', '2025-01-01');
  assert('T11 daysUntilBirthday reasonable', t11.daysUntilBirthday === 364 || t11.daysUntilBirthday === 365, t11.daysUntilBirthday);

  // T12: getAgeDescription(60) contains 還暦
  var t12 = getAgeDescription(60);
  assert('T12 getAgeDescription(60) contains \u9084\u66A6', t12.indexOf('\u9084\u66A6') !== -1, t12);

  console.log('---');
  console.log('Results: ' + pass + '/' + total + ' PASS, ' + fail + ' FAIL');
  return { pass: pass, fail: fail, total: total };
}
