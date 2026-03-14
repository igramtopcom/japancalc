/**
 * japancalc.com — Era Converter JS Logic Module
 * Converts between Japanese era dates and Gregorian dates.
 * Source of truth: src/_data/era-config.json (embedded inline).
 */

const ERA_CONFIG = {
  eras: [
    { id: "reiwa",  kanji: "令和", romaji: "Reiwa",  startGregorian: 2019, startDate: "2019-05-01", endDate: null,         offset: 2018 },
    { id: "heisei", kanji: "平成", romaji: "Heisei", startGregorian: 1989, startDate: "1989-01-08", endDate: "2019-04-30", offset: 1988 },
    { id: "showa",  kanji: "昭和", romaji: "Showa",  startGregorian: 1926, startDate: "1926-12-25", endDate: "1989-01-07", offset: 1925 },
    { id: "taisho", kanji: "大正", romaji: "Taisho", startGregorian: 1912, startDate: "1912-07-30", endDate: "1926-12-24", offset: 1911 },
    { id: "meiji",  kanji: "明治", romaji: "Meiji",  startGregorian: 1868, startDate: "1868-01-25", endDate: "1912-07-29", offset: 1867 }
  ]
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Parse a "YYYY-MM-DD" string into a local Date (avoids UTC midnight bug).
 * @param {string} dateStr
 * @returns {Date}
 */
function parseLocalDate(dateStr) {
  var parts = dateStr.split("-");
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

/**
 * Convert a Japanese era date to Gregorian.
 * @param {string} eraId - Era identifier: "reiwa"|"heisei"|"showa"|"taisho"|"meiji"
 * @param {number|string} eraYear - Era year number, or "元" or "元年" for year 1
 * @param {number|null} [month=null] - Month 1–12 (optional)
 * @param {number|null} [day=null] - Day 1–31 (optional)
 * @returns {object} Result object with gregorianYear, jpNotation, etc., or { error }
 * @example
 * eraToGregorian("reiwa", 7) // → { gregorianYear: 2025, jpNotation: "令和7年", ... }
 * eraToGregorian("reiwa", "元") // → { gregorianYear: 2019, jpNotation: "令和元年", ... }
 */
export function eraToGregorian(eraId, eraYear, month, day) {
  month = month != null ? month : null;
  day = day != null ? day : null;

  var era = ERA_CONFIG.eras.find(function(e) { return e.id === eraId; });
  if (!era) {
    return { error: "Invalid era ID" };
  }

  var year;
  if (eraYear === "元" || eraYear === "元年") {
    year = 1;
  } else {
    year = parseInt(eraYear, 10);
    if (isNaN(year) || year < 1) {
      return { error: "Invalid year" };
    }
  }

  var gregorianYear = era.offset + year;

  if (month !== null && day !== null) {
    var testDate = new Date(gregorianYear, month - 1, day);
    var eraStart = parseLocalDate(era.startDate);
    if (testDate < eraStart) {
      return { error: era.romaji + " " + year + " is before the era start date (" + era.startDate + ")" };
    }
    if (era.endDate !== null) {
      var eraEnd = parseLocalDate(era.endDate);
      if (testDate > eraEnd) {
        return { error: era.romaji + " " + year + " " + month + "/" + day + " is after the era end date (" + era.endDate + ")" };
      }
    }
  } else {
    if (era.endDate !== null) {
      var eraEndDate = parseLocalDate(era.endDate);
      var testEndOfYear = new Date(gregorianYear, 11, 31);
      var eraStartDate = parseLocalDate(era.startDate);
      if (testEndOfYear < eraStartDate) {
        return { error: era.romaji + " " + year + " is before the era began" };
      }
      if (new Date(gregorianYear, 0, 1) > eraEndDate) {
        return { error: era.romaji + " " + year + " is after the era ended" };
      }
    }
  }

  var yearDisplay = year === 1 ? "元" : String(year);
  var jpNotation = era.kanji + yearDisplay + "年";
  var enNotation = era.romaji + " " + year;

  if (month !== null) {
    jpNotation += month + "月";
    if (day !== null) {
      jpNotation += day + "日";
    }
  }

  var result = {
    gregorianYear: gregorianYear,
    eraId: era.id,
    eraKanji: era.kanji,
    eraRomaji: era.romaji,
    eraYear: year,
    jpNotation: jpNotation,
    enNotation: enNotation
  };

  if (month !== null && day !== null) {
    var d = new Date(gregorianYear, month - 1, day);
    result.fullDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    result.dayOfWeek = DAY_NAMES[d.getDay()];
    result.isoDate = gregorianYear + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    result.enNotation = era.romaji + " " + year + ", " + day + " " + MONTH_NAMES[month - 1] + " " + gregorianYear;
  }

  return result;
}

/**
 * Convert a Gregorian date to Japanese era.
 * @param {number} year - Gregorian year (required)
 * @param {number|null} [month=null] - Month 1–12 (optional)
 * @param {number|null} [day=null] - Day 1–31 (optional)
 * @returns {object} Result object with eraId, eraYear, jpNotation, etc., or { error } or { dualEra }
 * @example
 * gregorianToEra(2025, 3, 15) // → { eraId: "reiwa", eraYear: 7, ... }
 * gregorianToEra(2019) // → { dualEra: true, ... }
 */
export function gregorianToEra(year, month, day) {
  month = month != null ? month : null;
  day = day != null ? day : null;

  if (year < 1868) {
    return { error: "Year out of supported range (Meiji era begins 1868)" };
  }

  if (month !== null && day !== null) {
    var testDate = new Date(year, month - 1, day);
    for (var i = 0; i < ERA_CONFIG.eras.length; i++) {
      var era = ERA_CONFIG.eras[i];
      var eraStart = parseLocalDate(era.startDate);
      var eraEnd = era.endDate !== null ? parseLocalDate(era.endDate) : new Date(2099, 11, 31);
      if (testDate >= eraStart && testDate <= eraEnd) {
        var eraYear = year - era.offset;
        var yearDisplay = eraYear === 1 ? "元" : String(eraYear);
        var jpNotation = era.kanji + yearDisplay + "年" + month + "月" + day + "日";
        var enNotation = era.romaji + " " + eraYear + ", " + day + " " + MONTH_NAMES[month - 1] + " " + year;
        return {
          gregorianYear: year,
          eraId: era.id,
          eraKanji: era.kanji,
          eraRomaji: era.romaji,
          eraYear: eraYear,
          jpNotation: jpNotation,
          enNotation: enNotation,
          fullDate: testDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          dayOfWeek: DAY_NAMES[testDate.getDay()],
          isoDate: year + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0"),
          eraStart: era.startGregorian,
          eraEnd: era.endDate ? parseInt(era.endDate.split("-")[0], 10) : "present"
        };
      }
    }
    return { error: "No matching era found for this date" };
  }

  // Year-only lookup
  if (year === 1989) {
    return {
      dualEra: true,
      year: year,
      note: "1989 spans two eras: Showa 64 (Jan 1\u20137) and Heisei 1 (Jan 8\u2013Dec 31). Enter a full date for exact conversion.",
      eras: [
        { eraId: "showa",  eraKanji: "昭和", eraRomaji: "Showa",  eraYear: 64 },
        { eraId: "heisei", eraKanji: "平成", eraRomaji: "Heisei", eraYear: 1 }
      ]
    };
  }

  if (year === 2019) {
    return {
      dualEra: true,
      year: year,
      note: "2019 spans two eras: Heisei 31 (Jan 1\u2013Apr 30) and Reiwa 1 (May 1\u2013Dec 31). Enter a full date for exact conversion.",
      eras: [
        { eraId: "heisei", eraKanji: "平成", eraRomaji: "Heisei", eraYear: 31 },
        { eraId: "reiwa",  eraKanji: "令和", eraRomaji: "Reiwa",  eraYear: 1 }
      ]
    };
  }

  // Non-transition year
  for (var j = 0; j < ERA_CONFIG.eras.length; j++) {
    var e = ERA_CONFIG.eras[j];
    var startY = e.startGregorian;
    var endY = e.endDate !== null ? parseInt(e.endDate.split("-")[0], 10) : 9999;
    if (year >= startY && year <= endY) {
      var ey = year - e.offset;
      var yd = ey === 1 ? "元" : String(ey);
      return {
        gregorianYear: year,
        eraId: e.id,
        eraKanji: e.kanji,
        eraRomaji: e.romaji,
        eraYear: ey,
        jpNotation: e.kanji + yd + "年",
        enNotation: e.romaji + " " + ey,
        eraStart: e.startGregorian,
        eraEnd: e.endDate ? parseInt(e.endDate.split("-")[0], 10) : "present"
      };
    }
  }

  return { error: "No matching era found for year " + year };
}

/**
 * Format a number as Japanese Yen currency string.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string e.g. "¥1,000"
 * @example
 * formatJPY(1000) // → "¥1,000"
 */
export function formatJPY(amount) {
  if (!isFinite(amount)) return "¥0";
  return "¥" + amount.toLocaleString("ja-JP");
}

// === UNIT TESTS ===
// Run in browser console: import('./era.js').then(m => m.runTests())

export function runTests() {
  var results = [];
  function assert(label, condition) {
    results.push({ label: label, pass: !!condition });
  }

  // --- eraToGregorian tests ---
  var r1 = eraToGregorian("reiwa", 7);
  assert("R7 → 2025", r1.gregorianYear === 2025);

  var r2 = eraToGregorian("reiwa", 1);
  assert("Reiwa 1 → 2019", r2.gregorianYear === 2019);

  var r3 = eraToGregorian("reiwa", "元");
  assert("元 input → gregorianYear 2019", r3.gregorianYear === 2019);

  var r4 = eraToGregorian("reiwa", "元年");
  assert("元年 input → gregorianYear 2019", r4.gregorianYear === 2019);

  var r5 = eraToGregorian("reiwa", "元");
  assert("元年 jpNotation uses 元", r5.jpNotation === "令和元年");

  var r6 = eraToGregorian("heisei", 31, 4, 30);
  assert("Heisei 31 Apr 30 → 2019", r6.gregorianYear === 2019);

  var r7 = eraToGregorian("heisei", 31, 5, 1);
  assert("Heisei 31 May 1 → error", !!r7.error);

  var r8 = eraToGregorian("heisei", 32);
  assert("Heisei 32 year-only → error", !!r8.error);

  var r9 = eraToGregorian("showa", 64, 1, 7);
  assert("Showa 64 Jan 7 → 1989", r9.gregorianYear === 1989);

  var r10 = eraToGregorian("showa", 64, 1, 8);
  assert("Showa 64 Jan 8 → error", !!r10.error);

  var r11 = eraToGregorian("invalid_era", 1);
  assert("Invalid eraId → error", !!r11.error);

  // --- gregorianToEra tests ---
  var g1 = gregorianToEra(2025, 3, 15);
  assert("2025-03-15 → reiwa", g1.eraId === "reiwa");

  var g2 = gregorianToEra(2025, 3, 15);
  assert("2025-03-15 → Reiwa 7", g2.eraYear === 7);

  var g3 = gregorianToEra(2019, 5, 1);
  assert("2019-05-01 → reiwa", g3.eraId === "reiwa");

  var g4 = gregorianToEra(2019, 4, 30);
  assert("2019-04-30 → heisei", g4.eraId === "heisei");

  var g5 = gregorianToEra(2019, 4, 30);
  assert("2019-04-30 → Heisei 31", g5.eraYear === 31);

  var g6 = gregorianToEra(1989, 1, 7);
  assert("1989-01-07 → showa", g6.eraId === "showa");

  var g7 = gregorianToEra(1989, 1, 7);
  assert("1989-01-07 → Showa 64", g7.eraYear === 64);

  var g8 = gregorianToEra(1989, 1, 8);
  assert("1989-01-08 → heisei", g8.eraId === "heisei");

  var g9 = gregorianToEra(2019);
  assert("Year-only 2019 → dualEra", g9.dualEra === true);

  var g10 = gregorianToEra(1989);
  assert("Year-only 1989 → dualEra", g10.dualEra === true);

  var g11 = gregorianToEra(1800);
  assert("Year 1800 → error", !!g11.error);

  // --- formatJPY tests ---
  var f1 = formatJPY(1000);
  assert("¥1000 formatted", f1 === "¥1,000");

  var f2 = formatJPY(0);
  assert("¥0 formatted", f2 === "¥0");

  var f3 = formatJPY(Infinity);
  assert("Infinity → ¥0", f3 === "¥0");

  // --- Summary ---
  var passed = results.filter(function(r) { return r.pass; }).length;
  var failed = results.filter(function(r) { return !r.pass; });
  console.log("Tests: " + passed + "/" + results.length + " passed");
  if (failed.length) {
    console.warn("FAILED:", failed.map(function(r) { return r.label; }));
  }
  return results;
}
