/**
 * japancalc.com — Era Conversion Logic Module
 * Spec: Tech Spec v1.0 Section 3.1
 *
 * Exports: eraToGregorian, gregorianToEra, formatJPY, getDayOfWeek, getEraList
 */

// ============ ERA DATA (inlined from src/_data/era-config.json) ============

const ERA_CONFIG = {
  eras: [
    {
      id: "reiwa",
      kanji: "令和",
      romaji: "Reiwa",
      english: "Beautiful Harmony",
      startGregorian: 2019,
      startDate: "2019-05-01",
      endDate: null,
      offset: 2018,
      gannenYear: 1,
      active: true
    },
    {
      id: "heisei",
      kanji: "平成",
      romaji: "Heisei",
      english: "Achieving Peace",
      startGregorian: 1989,
      startDate: "1989-01-08",
      endDate: "2019-04-30",
      offset: 1988,
      gannenYear: 1,
      active: false
    },
    {
      id: "showa",
      kanji: "昭和",
      romaji: "Showa",
      english: "Radiant Japan",
      startGregorian: 1926,
      startDate: "1926-12-25",
      endDate: "1989-01-07",
      offset: 1925,
      gannenYear: 1,
      active: false
    },
    {
      id: "taisho",
      kanji: "大正",
      romaji: "Taisho",
      english: "Great Righteousness",
      startGregorian: 1912,
      startDate: "1912-07-30",
      endDate: "1926-12-24",
      offset: 1911,
      gannenYear: 1,
      active: false
    },
    {
      id: "meiji",
      kanji: "明治",
      romaji: "Meiji",
      english: "Enlightened Rule",
      startGregorian: 1868,
      startDate: "1868-01-25",
      endDate: "1912-07-29",
      offset: 1867,
      gannenYear: 1,
      active: false
    }
  ]
};

// ============ HELPERS ============

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday"
];

/**
 * Parse a "YYYY-MM-DD" string into a local Date without UTC timezone issues.
 * @param {string} dateStr - Date string in "YYYY-MM-DD" format
 * @returns {Date}
 */
function parseLocalDate(dateStr) {
  var parts = dateStr.split("-");
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Convert Japanese era year to Gregorian year.
 * @param {string} eraId - "reiwa"|"heisei"|"showa"|"taisho"|"meiji"
 * @param {number|string} eraYear - Era year number, or "元" / "元年" (= year 1)
 * @param {number|null} [month] - 1–12, optional
 * @param {number|null} [day] - 1–31, optional
 * @returns {{ gregorianYear: number, eraId: string, eraKanji: string, eraRomaji: string, eraYear: number, jpNotation: string, enNotation: string, fullDate: string|null, dayOfWeek: string|null, isGannen: boolean } | { error: string }}
 */
export function eraToGregorian(eraId, eraYear, month, day) {
  var era = ERA_CONFIG.eras.find(function(e) { return e.id === eraId; });
  if (!era) return { error: "Invalid era" };

  var normalizedYear;
  if (eraYear === "元" || eraYear === "元年") {
    normalizedYear = 1;
  } else {
    normalizedYear = parseInt(eraYear, 10);
  }
  if (isNaN(normalizedYear) || normalizedYear < 1) {
    return { error: "Invalid year number" };
  }

  var gregorianYear = era.offset + normalizedYear;

  // Upper bound check
  if (era.endDate) {
    var endDate = parseLocalDate(era.endDate);
    var testDate;
    if (month && day) {
      testDate = new Date(gregorianYear, month - 1, day);
    } else {
      testDate = new Date(gregorianYear, 0, 1);
    }
    if (testDate > endDate) {
      return { error: era.romaji + " " + normalizedYear + " is out of range" };
    }
  }

  // Lower bound check (only if full date provided)
  if (month && day) {
    var startDate = parseLocalDate(era.startDate);
    var checkDate = new Date(gregorianYear, month - 1, day);
    if (checkDate < startDate) {
      return { error: "Date is before " + era.romaji + " era start" };
    }
  }

  // Build JP notation
  var yearLabel = normalizedYear === 1 ? "元" : String(normalizedYear);
  var jpNotation = era.kanji + yearLabel + "年";
  if (month) jpNotation += month + "月";
  if (month && day) jpNotation += day + "日";

  // Build EN notation
  var enNotation = era.romaji + " " + normalizedYear;
  if (month && day) {
    enNotation = era.romaji + " " + normalizedYear + ", " + MONTH_NAMES[month - 1] + " " + gregorianYear;
  }

  // Full date and day of week
  var fullDate = null;
  var dayOfWeek = null;
  if (month && day) {
    var dateObj = new Date(gregorianYear, month - 1, day);
    fullDate = day + " " + MONTH_NAMES[month - 1] + " " + gregorianYear;
    dayOfWeek = DAY_NAMES[dateObj.getDay()];
  }

  return {
    gregorianYear: gregorianYear,
    eraId: era.id,
    eraKanji: era.kanji,
    eraRomaji: era.romaji,
    eraYear: normalizedYear,
    jpNotation: jpNotation,
    enNotation: enNotation,
    fullDate: fullDate,
    dayOfWeek: dayOfWeek,
    isGannen: normalizedYear === 1
  };
}

/**
 * Convert Gregorian date to Japanese era.
 * For transition years (1989, 2019) with year-only input, returns dualEra result.
 * @param {number} year - Gregorian year
 * @param {number|null} [month] - 1–12, optional
 * @param {number|null} [day] - 1–31, optional
 * @returns {{ eraId: string, eraKanji: string, eraRomaji: string, eraYear: number, jpNotation: string, enNotation: string, eraStart: number, eraEnd: number|string, isGannen: boolean, fullDate: string|null, dayOfWeek: string|null } | { dualEra: true, year: number, eras: Array, note: string } | { error: string }}
 */
export function gregorianToEra(year, month, day) {
  if (year < 1868) {
    return { error: "Year before Meiji era (1868)" };
  }

  var hasFullDate = month && day;
  var testDate = hasFullDate ? new Date(year, month - 1, day) : null;

  // Full date: find exact era match
  if (testDate) {
    for (var i = 0; i < ERA_CONFIG.eras.length; i++) {
      var era = ERA_CONFIG.eras[i];
      var start = parseLocalDate(era.startDate);
      var end = era.endDate ? parseLocalDate(era.endDate) : new Date(2099, 11, 31);

      if (testDate >= start && testDate <= end) {
        var eraYear = year - era.offset;
        var yearLabel = eraYear === 1 ? "元" : String(eraYear);
        var jpNotation = era.kanji + yearLabel + "年" + month + "月" + day + "日";
        var fullDate = day + " " + MONTH_NAMES[month - 1] + " " + year;
        var dayOfWeek = DAY_NAMES[testDate.getDay()];

        return {
          eraId: era.id,
          eraKanji: era.kanji,
          eraRomaji: era.romaji,
          eraYear: eraYear,
          jpNotation: jpNotation,
          enNotation: era.romaji + " " + eraYear,
          eraStart: era.startGregorian,
          eraEnd: era.endDate ? parseInt(era.endDate.split("-")[0], 10) : "present",
          isGannen: eraYear === 1,
          fullDate: fullDate,
          dayOfWeek: dayOfWeek
        };
      }
    }
    return { error: "Date out of supported range (post-1868)" };
  }

  // Year-only: check for transition years (dual era)
  var matchingEras = [];
  for (var j = 0; j < ERA_CONFIG.eras.length; j++) {
    var era2 = ERA_CONFIG.eras[j];
    var eraStartYear = era2.startGregorian;
    var eraEndYear = era2.endDate ? parseInt(era2.endDate.split("-")[0], 10) : 9999;

    if (year >= eraStartYear && year <= eraEndYear) {
      var ey = year - era2.offset;
      matchingEras.push({
        eraId: era2.id,
        eraKanji: era2.kanji,
        eraRomaji: era2.romaji,
        eraYear: ey,
        jpNotation: era2.kanji + (ey === 1 ? "元" : String(ey)) + "年",
        enNotation: era2.romaji + " " + ey,
        eraStart: era2.startGregorian,
        eraEnd: era2.endDate ? parseInt(era2.endDate.split("-")[0], 10) : "present",
        isGannen: ey === 1
      });
    }
  }

  if (matchingEras.length === 0) {
    return { error: "Year out of supported range (post-1868)" };
  }

  if (matchingEras.length > 1) {
    return {
      dualEra: true,
      year: year,
      eras: matchingEras,
      note: year + " spans two eras. Provide month and day for an exact match."
    };
  }

  var result = matchingEras[0];
  result.fullDate = null;
  result.dayOfWeek = null;
  return result;
}

/**
 * Format a number as Japanese Yen with thousand separators.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string e.g. "¥1,000"
 */
export function formatJPY(amount) {
  return "\u00A5" + Number(amount).toLocaleString("ja-JP");
}

/**
 * Get the full day-of-week name from a Date object.
 * @param {Date} date - A Date object
 * @returns {string} Day name e.g. "Saturday"
 */
export function getDayOfWeek(date) {
  return DAY_NAMES[date.getDay()];
}

/**
 * Returns the era list for populating dropdowns.
 * @returns {Array} Array of era objects from ERA_CONFIG
 */
export function getEraList() {
  return ERA_CONFIG.eras;
}

// ============ UNIT TESTS ============
// Run in browser console: import module or copy-paste functions above (remove export keywords)

export function runTests() {
  var pass = 0;
  var fail = 0;
  var total = 12;

  function assert(label, condition, actual) {
    if (condition) {
      pass++;
      console.log("PASS: " + label);
    } else {
      fail++;
      console.log("FAIL: " + label + " | actual: " + JSON.stringify(actual));
    }
  }

  // T1: eraToGregorian("reiwa", 7) → 2025
  var t1 = eraToGregorian("reiwa", 7);
  assert("T1 reiwa 7 → 2025", t1.gregorianYear === 2025, t1);

  // T2: eraToGregorian("reiwa", 1) → 2019, isGannen: true
  var t2 = eraToGregorian("reiwa", 1);
  assert("T2 reiwa 1 → 2019, isGannen", t2.gregorianYear === 2019 && t2.isGannen === true, t2);

  // T3: eraToGregorian("reiwa", "元") → 2019
  var t3 = eraToGregorian("reiwa", "\u5143");
  assert("T3 reiwa \u5143 → 2019", t3.gregorianYear === 2019 && t3.isGannen === true, t3);

  // T4: eraToGregorian("reiwa", "元年") → 2019
  var t4 = eraToGregorian("reiwa", "\u5143\u5E74");
  assert("T4 reiwa \u5143\u5E74 → 2019", t4.gregorianYear === 2019 && t4.isGannen === true, t4);

  // T5: eraToGregorian("heisei", 31, 4, 30) → 2019 (last day of Heisei)
  var t5 = eraToGregorian("heisei", 31, 4, 30);
  assert("T5 heisei 31/4/30 → 2019", t5.gregorianYear === 2019 && !t5.error, t5);

  // T6: eraToGregorian("heisei", 31, 5, 1) → error
  var t6 = eraToGregorian("heisei", 31, 5, 1);
  assert("T6 heisei 31/5/1 → error", !!t6.error, t6);

  // T7: eraToGregorian("showa", 64, 1, 7) → 1989 (last day of Showa)
  var t7 = eraToGregorian("showa", 64, 1, 7);
  assert("T7 showa 64/1/7 → 1989", t7.gregorianYear === 1989 && !t7.error, t7);

  // T8: eraToGregorian("showa", 64, 1, 8) → error
  var t8 = eraToGregorian("showa", 64, 1, 8);
  assert("T8 showa 64/1/8 → error", !!t8.error, t8);

  // T9: gregorianToEra(2019, 5, 1) → reiwa, eraYear 1, isGannen
  var t9 = gregorianToEra(2019, 5, 1);
  assert("T9 2019/5/1 → reiwa gannen", t9.eraId === "reiwa" && t9.eraYear === 1 && t9.isGannen === true, t9);

  // T10: gregorianToEra(2019, 4, 30) → heisei 31
  var t10 = gregorianToEra(2019, 4, 30);
  assert("T10 2019/4/30 → heisei 31", t10.eraId === "heisei" && t10.eraYear === 31, t10);

  // T11: gregorianToEra(1989, 1, 7) → showa 64
  var t11 = gregorianToEra(1989, 1, 7);
  assert("T11 1989/1/7 → showa 64", t11.eraId === "showa" && t11.eraYear === 64, t11);

  // T12: gregorianToEra(2019) → dualEra
  var t12 = gregorianToEra(2019);
  assert("T12 2019 year-only → dualEra", t12.dualEra === true && t12.eras && t12.eras.length === 2, t12);

  console.log("---");
  console.log("Results: " + pass + "/" + total + " PASS, " + fail + " FAIL");
  return { pass: pass, fail: fail, total: total };
}
