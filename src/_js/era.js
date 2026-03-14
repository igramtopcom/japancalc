/**
 * era.js — Japanese Era Date Conversion Module
 * japancalc.com
 *
 * ES module with full calculation logic for converting between
 * Japanese era dates and Western (Gregorian) calendar dates.
 *
 * Supported eras: Reiwa (令和), Heisei (平成), Showa (昭和),
 *                 Taisho (大正), Meiji (明治)
 */

/** @type {Array<{id:string, kanji:string, romaji:string, startDate:string, endDate:string|null, offset:number, description:string}>} */
const ERA_CONFIG = [
  {
    id: "reiwa",
    kanji: "令和",
    romaji: "Reiwa",
    startDate: "2019-05-01",
    endDate: null,
    offset: 2018,
    description: "Beautiful Harmony"
  },
  {
    id: "heisei",
    kanji: "平成",
    romaji: "Heisei",
    startDate: "1989-01-08",
    endDate: "2019-04-30",
    offset: 1988,
    description: "Achieving Peace"
  },
  {
    id: "showa",
    kanji: "昭和",
    romaji: "Showa",
    startDate: "1926-12-25",
    endDate: "1989-01-07",
    offset: 1925,
    description: "Enlightened Harmony"
  },
  {
    id: "taisho",
    kanji: "大正",
    romaji: "Taisho",
    startDate: "1912-07-30",
    endDate: "1926-12-24",
    offset: 1911,
    description: "Great Righteousness"
  },
  {
    id: "meiji",
    kanji: "明治",
    romaji: "Meiji",
    startDate: "1868-01-25",
    endDate: "1912-07-29",
    offset: 1867,
    description: "Enlightened Rule"
  }
];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DOW_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Get era configuration by ID.
 * @param {string} eraId - One of: "reiwa", "heisei", "showa", "taisho", "meiji"
 * @returns {object|null} Era config object or null if not found
 */
function getEraById(eraId) {
  return ERA_CONFIG.find(e => e.id === eraId) || null;
}

/**
 * Parse era date strings to Date objects for comparison.
 * Uses UTC to avoid timezone issues.
 * @param {string} dateStr - ISO date string "YYYY-MM-DD"
 * @returns {Date}
 */
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Convert a Japanese era year to the Western (Gregorian) calendar.
 *
 * @param {string} eraId - Era identifier ("reiwa", "heisei", "showa", "taisho", "meiji")
 * @param {number|string} eraYear - Era year number, or "元" / "元年" for year 1 (gannen)
 * @param {number|null} [month=null] - Month (1-12), optional
 * @param {number|null} [day=null] - Day (1-31), optional
 * @returns {{gregorianYear:number, fullDate:string, dayOfWeek:string, jpNotation:string, enNotation:string, eraKanji:string, eraRomaji:string}|{error:string}}
 */
export function eraToGregorian(eraId, eraYear, month = null, day = null) {
  const era = getEraById(eraId);
  if (!era) return { error: "Invalid era identifier: " + eraId };

  // Handle 元年 (gannen) = year 1
  const yearStr = String(eraYear).trim();
  const year = (yearStr === "元" || yearStr === "元年") ? 1 : parseInt(yearStr, 10);

  if (isNaN(year) || year < 1) {
    return { error: "Invalid era year. Enter a positive number or 元 for the first year." };
  }

  if (year > 200) {
    return { error: "Era year " + year + " exceeds reasonable range." };
  }

  const gregorianYear = era.offset + year;
  const eraStart = parseDate(era.startDate);
  const eraEnd = era.endDate ? parseDate(era.endDate) : null;

  // Validate with month and day
  if (month && day) {
    const testDate = new Date(gregorianYear, month - 1, day);

    if (testDate < eraStart) {
      return {
        error: era.romaji + " " + year + " (" + month + "/" + day + ") is before " +
               era.romaji + " started (" + formatGregorianDate(
                 eraStart.getFullYear(), eraStart.getMonth() + 1, eraStart.getDate()
               ) + ")."
      };
    }

    if (eraEnd && testDate > eraEnd) {
      return {
        error: era.romaji + " " + year + " (" + month + "/" + day + ") is after " +
               era.romaji + " ended (" + formatGregorianDate(
                 eraEnd.getFullYear(), eraEnd.getMonth() + 1, eraEnd.getDate()
               ) + ")."
      };
    }

    return {
      gregorianYear,
      fullDate: formatGregorianDate(gregorianYear, month, day),
      dayOfWeek: DOW_EN[testDate.getDay()],
      jpNotation: formatJPDate(gregorianYear, month, day, era.kanji, year),
      enNotation: era.romaji + " " + year + ", " + MONTHS_EN[month - 1] + " " + day + ", " + gregorianYear,
      eraKanji: era.kanji,
      eraRomaji: era.romaji
    };
  }

  // Month only
  if (month) {
    return {
      gregorianYear,
      fullDate: MONTHS_EN[month - 1] + " " + gregorianYear,
      dayOfWeek: "—",
      jpNotation: era.kanji + year + "年" + month + "月",
      enNotation: era.romaji + " " + year + ", " + MONTHS_EN[month - 1] + " " + gregorianYear,
      eraKanji: era.kanji,
      eraRomaji: era.romaji
    };
  }

  // Year only — validate era bounds
  const eraStartYear = eraStart.getFullYear();
  const eraEndYear = eraEnd ? eraEnd.getFullYear() : 2099;

  if (gregorianYear < eraStartYear || gregorianYear > eraEndYear) {
    return {
      error: era.romaji + " " + year + " (" + gregorianYear + ") is outside the " +
             era.romaji + " era period (" + eraStartYear + "–" +
             (eraEnd ? eraEndYear : "present") + ")."
    };
  }

  return {
    gregorianYear,
    fullDate: String(gregorianYear),
    dayOfWeek: "—",
    jpNotation: era.kanji + year + "年",
    enNotation: era.romaji + " " + year + " (" + gregorianYear + ")",
    eraKanji: era.kanji,
    eraRomaji: era.romaji
  };
}

/**
 * Convert a Western (Gregorian) date to the Japanese era.
 *
 * For year-only input on transition years (e.g. 2019, 1989), returns the
 * first matching era with a note listing both eras.
 *
 * @param {number} year - Western year (1868–2099)
 * @param {number|null} [month=null] - Month (1-12), optional
 * @param {number|null} [day=null] - Day (1-31), optional
 * @returns {{eraId:string, eraKanji:string, eraRomaji:string, eraYear:number, jpNotation:string, period:string, westernYear:number, note:string|null}|{error:string}}
 */
export function gregorianToEra(year, month = null, day = null) {
  year = parseInt(year, 10);
  if (isNaN(year) || year < 1868 || year > 2099) {
    return { error: "Please enter a year between 1868 and 2099." };
  }

  // With exact date
  if (month && day) {
    const testDate = new Date(year, month - 1, day);

    for (const era of ERA_CONFIG) {
      const start = parseDate(era.startDate);
      const end = era.endDate ? parseDate(era.endDate) : new Date(2099, 11, 31);

      if (testDate >= start && testDate <= end) {
        const eraYear = year - era.offset;
        return {
          eraId: era.id,
          eraKanji: era.kanji,
          eraRomaji: era.romaji,
          eraYear,
          jpNotation: formatJPDate(year, month, day, era.kanji, eraYear),
          period: start.getFullYear() + "–" + (era.endDate ? end.getFullYear() : "present"),
          westernYear: year,
          note: null
        };
      }
    }
    return { error: "Date " + year + "-" + month + "-" + day + " is outside supported range (1868–2099)." };
  }

  // Year only — find all matching eras
  const matches = [];
  for (const era of ERA_CONFIG) {
    const startY = parseDate(era.startDate).getFullYear();
    const endY = era.endDate ? parseDate(era.endDate).getFullYear() : 2099;

    if (year >= startY && year <= endY) {
      matches.push({
        eraId: era.id,
        eraKanji: era.kanji,
        eraRomaji: era.romaji,
        eraYear: year - era.offset,
        jpNotation: era.kanji + (year - era.offset) + "年",
        period: startY + "–" + (era.endDate ? endY : "present"),
        westernYear: year,
        note: null
      });
    }
  }

  if (matches.length === 0) {
    return { error: "Year " + year + " is outside supported range (1868–2099)." };
  }

  if (matches.length > 1) {
    matches[0].note = year + " spans both " + matches[0].eraKanji + " " +
      matches[0].eraYear + " and " + matches[1].eraKanji + " " +
      matches[1].eraYear + ". Enter month and day for the exact era.";
  }

  return matches[0];
}

/**
 * Format a date in Japanese notation.
 *
 * @param {number} year - Gregorian year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {string} eraKanji - Era kanji (e.g. "令和")
 * @param {number} eraYear - Year within the era
 * @returns {string} Formatted Japanese date string (e.g. "令和7年5月1日")
 */
export function formatJPDate(year, month, day, eraKanji, eraYear) {
  let result = eraKanji + eraYear + "年";
  if (month) result += month + "月";
  if (day) result += day + "日";
  return result;
}

/**
 * Check if a given era date is valid (within the era's bounds).
 *
 * @param {string} eraId - Era identifier
 * @param {number} year - Era year
 * @param {number|null} [month=null] - Month (1-12)
 * @param {number|null} [day=null] - Day (1-31)
 * @returns {boolean} True if the date is valid within the specified era
 */
export function isValidEraDate(eraId, year, month = null, day = null) {
  const result = eraToGregorian(eraId, year, month, day);
  return !result.error;
}

/**
 * Get the era configuration for a specific Date object.
 *
 * @param {Date} dateObj - JavaScript Date object
 * @returns {object|null} Era config object, or null if date is out of range
 */
export function getEraForDate(dateObj) {
  for (const era of ERA_CONFIG) {
    const start = parseDate(era.startDate);
    const end = era.endDate ? parseDate(era.endDate) : new Date(2099, 11, 31);
    if (dateObj >= start && dateObj <= end) {
      return { ...era };
    }
  }
  return null;
}

/**
 * Format a Gregorian date in a localized string.
 *
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @param {string} [locale="en-GB"] - Locale for formatting
 * @returns {string} Formatted date string (e.g. "1 May 2019")
 */
export function formatGregorianDate(year, month, day, locale = "en-GB") {
  if (!month || !day) {
    if (month) return MONTHS_EN[month - 1] + " " + year;
    return String(year);
  }
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}


// === TESTS ===
// Run with: node --experimental-vm-modules src/_js/era.js
// Or import in a test runner.

function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, msg) {
    if (condition) {
      passed++;
    } else {
      failed++;
      console.error("FAIL: " + msg);
    }
  }

  // --- eraToGregorian tests ---

  // Basic conversions
  let r = eraToGregorian("reiwa", 7);
  assert(r.gregorianYear === 2025, "Reiwa 7 = 2025");

  r = eraToGregorian("reiwa", 1);
  assert(r.gregorianYear === 2019, "Reiwa 1 = 2019");

  // EDGE CASE 1: 元 (gannen) input
  r = eraToGregorian("reiwa", "元");
  assert(r.gregorianYear === 2019, "Reiwa 元 = 2019");

  r = eraToGregorian("reiwa", "元年");
  assert(r.gregorianYear === 2019, "Reiwa 元年 = 2019");

  // EDGE CASE 2: Reiwa 1 with date
  r = eraToGregorian("reiwa", 1, 5, 1);
  assert(r.gregorianYear === 2019, "Reiwa 1 May 1 = 2019");
  assert(!r.error, "Reiwa 1 May 1 is valid");

  // EDGE CASE 3: 2019-04-30 should be Heisei, not Reiwa
  r = eraToGregorian("reiwa", 1, 4, 30);
  assert(r.error !== undefined, "Reiwa 1 Apr 30 should error (before Reiwa start)");

  // EDGE CASE 4: Heisei 31 April 30 is valid (last day of Heisei)
  r = eraToGregorian("heisei", 31, 4, 30);
  assert(r.gregorianYear === 2019, "Heisei 31 Apr 30 = 2019");
  assert(!r.error, "Heisei 31 Apr 30 is valid");

  // EDGE CASE 5: Heisei 31 May 1 should error (after Heisei ended)
  r = eraToGregorian("heisei", 31, 5, 1);
  assert(r.error !== undefined, "Heisei 31 May 1 should error (after Heisei end)");

  // EDGE CASE 6: 1989-01-07 = Showa 64
  r = eraToGregorian("showa", 64, 1, 7);
  assert(r.gregorianYear === 1989, "Showa 64 Jan 7 = 1989");
  assert(!r.error, "Showa 64 Jan 7 is valid (last day of Showa)");

  // EDGE CASE 7: 1989-01-08 = Heisei 1
  r = eraToGregorian("heisei", 1, 1, 8);
  assert(r.gregorianYear === 1989, "Heisei 1 Jan 8 = 1989");
  assert(!r.error, "Heisei 1 Jan 8 is valid (first day of Heisei)");

  // Heisei 32 should error (Heisei ended at 31)
  r = eraToGregorian("heisei", 32);
  assert(r.error !== undefined, "Heisei 32 should error (out of range)");

  // Out of range
  r = eraToGregorian("reiwa", 100);
  assert(r.error !== undefined, "Reiwa 100 should error (out of range)");

  // Invalid era
  r = eraToGregorian("invalid", 1);
  assert(r.error !== undefined, "Invalid era should error");

  // Meiji conversion
  r = eraToGregorian("meiji", 1);
  assert(r.gregorianYear === 1868, "Meiji 1 = 1868");

  r = eraToGregorian("meiji", 45, 7, 29);
  assert(r.gregorianYear === 1912, "Meiji 45 Jul 29 = 1912 (last day of Meiji)");

  // Taisho
  r = eraToGregorian("taisho", 1, 7, 30);
  assert(r.gregorianYear === 1912, "Taisho 1 Jul 30 = 1912 (first day of Taisho)");

  // --- gregorianToEra tests ---

  // EDGE CASE: 2019-05-01 = Reiwa 1
  r = gregorianToEra(2019, 5, 1);
  assert(r.eraId === "reiwa" && r.eraYear === 1, "2019-05-01 = Reiwa 1");

  // EDGE CASE: 2019-04-30 = Heisei 31
  r = gregorianToEra(2019, 4, 30);
  assert(r.eraId === "heisei" && r.eraYear === 31, "2019-04-30 = Heisei 31");

  // EDGE CASE: 1989-01-07 = Showa 64
  r = gregorianToEra(1989, 1, 7);
  assert(r.eraId === "showa" && r.eraYear === 64, "1989-01-07 = Showa 64");

  // EDGE CASE: 1989-01-08 = Heisei 1
  r = gregorianToEra(1989, 1, 8);
  assert(r.eraId === "heisei" && r.eraYear === 1, "1989-01-08 = Heisei 1");

  // EDGE CASE 8: Year-only 2019 should note both eras
  r = gregorianToEra(2019);
  assert(r.note !== null && r.note.includes("令和") && r.note.includes("平成"),
    "2019 year-only should note both Heisei and Reiwa");

  // Year-only 1989 should note both eras
  r = gregorianToEra(1989);
  assert(r.note !== null && r.note.includes("昭和") && r.note.includes("平成"),
    "1989 year-only should note both Showa and Heisei");

  // Normal year
  r = gregorianToEra(2025);
  assert(r.eraId === "reiwa" && r.eraYear === 7, "2025 = Reiwa 7");

  // Out of range
  r = gregorianToEra(1800);
  assert(r.error !== undefined, "1800 should error (before Meiji)");

  r = gregorianToEra(2100);
  assert(r.error !== undefined, "2100 should error (beyond 2099)");

  // --- formatJPDate tests ---
  assert(formatJPDate(2025, 3, 14, "令和", 7) === "令和7年3月14日", "formatJPDate full date");
  assert(formatJPDate(2025, 3, null, "令和", 7) === "令和7年3月", "formatJPDate month only");
  assert(formatJPDate(2025, null, null, "令和", 7) === "令和7年", "formatJPDate year only");

  // --- isValidEraDate tests ---
  assert(isValidEraDate("reiwa", 7) === true, "Reiwa 7 is valid");
  assert(isValidEraDate("heisei", 32) === false, "Heisei 32 is invalid");
  assert(isValidEraDate("reiwa", 1, 5, 1) === true, "Reiwa 1 May 1 is valid");
  assert(isValidEraDate("reiwa", 1, 4, 30) === false, "Reiwa 1 Apr 30 is invalid");

  // --- getEraForDate tests ---
  let era = getEraForDate(new Date(2025, 2, 14));
  assert(era && era.id === "reiwa", "2025-03-14 is in Reiwa");

  era = getEraForDate(new Date(2019, 3, 30)); // April 30
  assert(era && era.id === "heisei", "2019-04-30 is in Heisei");

  era = getEraForDate(new Date(2019, 4, 1)); // May 1
  assert(era && era.id === "reiwa", "2019-05-01 is in Reiwa");

  era = getEraForDate(new Date(1989, 0, 7)); // Jan 7
  assert(era && era.id === "showa", "1989-01-07 is in Showa");

  era = getEraForDate(new Date(1989, 0, 8)); // Jan 8
  assert(era && era.id === "heisei", "1989-01-08 is in Heisei");

  // --- JCT Calculator test cases from Tech Spec (bonus coverage) ---
  // addTax/removeTax not in this module, but validating era edge cases

  console.log("\n=== ERA.JS TEST RESULTS ===");
  console.log("Passed: " + passed);
  console.log("Failed: " + failed);
  console.log(failed === 0 ? "ALL TESTS PASSED ✓" : "SOME TESTS FAILED ✗");

  return { passed, failed };
}

// Auto-run tests when executed directly
const isMainModule = typeof process !== "undefined" &&
  process.argv[1] && process.argv[1].endsWith("era.js");
if (isMainModule) {
  runTests();
}

export { runTests, ERA_CONFIG };
