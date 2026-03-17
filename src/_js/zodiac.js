/**
 * japancalc.com — Zodiac Calculator Logic Module
 * Spec: PRD v1.0 Section 3.4 (FR-ZOD-001)
 *
 * Exports: getZodiacByYear, getZodiacByDOB, getZodiacTable, getCurrentYearZodiac, runTests
 */

// ============ INLINED ZODIAC DATA ============

var ZODIAC_ANIMALS = [
  { index: 0,  id: 'rat',     kanji: '\u5B50', romaji: 'Ne',      english: 'Rat',     japanese: '\u306D\u305A\u307F',       traits: ['Clever', 'Adaptable', 'Quick-witted', 'Resourceful'], luckyColors: ['Blue', 'Gold', 'Green'],   compatible: ['Dragon', 'Monkey', 'Ox'],              avoid: ['Horse', 'Rooster'],                         recentYears: [2008, 2020, 2032], element: 'Water' },
  { index: 1,  id: 'ox',      kanji: '\u4E11', romaji: 'Ushi',    english: 'Ox',      japanese: '\u3046\u3057',             traits: ['Diligent', 'Dependable', 'Strong', 'Determined'],     luckyColors: ['White', 'Yellow', 'Green'], compatible: ['Rat', 'Snake', 'Rooster'],              avoid: ['Goat', 'Horse', 'Dog'],                     recentYears: [2009, 2021, 2033], element: 'Earth' },
  { index: 2,  id: 'tiger',   kanji: '\u5BC5', romaji: 'Tora',    english: 'Tiger',   japanese: '\u3068\u3089',             traits: ['Brave', 'Confident', 'Competitive', 'Unpredictable'], luckyColors: ['Blue', 'Grey', 'Orange'],   compatible: ['Horse', 'Dog', 'Pig'],                  avoid: ['Ox', 'Goat', 'Snake'],                      recentYears: [2010, 2022, 2034], element: 'Wood' },
  { index: 3,  id: 'rabbit',  kanji: '\u536F', romaji: 'U',       english: 'Rabbit',  japanese: '\u3046\u3055\u304E',       traits: ['Gentle', 'Quiet', 'Elegant', 'Alert'],                luckyColors: ['Pink', 'Red', 'Purple'],    compatible: ['Goat', 'Pig', 'Dog'],                   avoid: ['Rat', 'Dragon', 'Rooster', 'Snake'],         recentYears: [2011, 2023, 2035], element: 'Wood' },
  { index: 4,  id: 'dragon',  kanji: '\u8FB0', romaji: 'Tatsu',   english: 'Dragon',  japanese: '\u305F\u3064',             traits: ['Confident', 'Intelligent', 'Enthusiastic', 'Ambitious'], luckyColors: ['Gold', 'Silver', 'Grey'], compatible: ['Rat', 'Monkey', 'Rooster'],             avoid: ['Ox', 'Goat', 'Dog'],                        recentYears: [2012, 2024, 2036], element: 'Earth' },
  { index: 5,  id: 'snake',   kanji: '\u5DF3', romaji: 'Mi',      english: 'Snake',   japanese: '\u3078\u3073',             traits: ['Wise', 'Intuitive', 'Elegant', 'Cautious'],           luckyColors: ['Black', 'Red', 'Yellow'],   compatible: ['Ox', 'Rooster'],                        avoid: ['Tiger', 'Rabbit', 'Goat', 'Pig'],            recentYears: [2013, 2025, 2037], element: 'Fire' },
  { index: 6,  id: 'horse',   kanji: '\u5348', romaji: 'Uma',     english: 'Horse',   japanese: '\u3046\u307E',             traits: ['Energetic', 'Independent', 'Impatient', 'Adventurous'], luckyColors: ['Yellow', 'Green', 'Red'],  compatible: ['Tiger', 'Goat', 'Dog'],                 avoid: ['Rat', 'Ox', 'Rabbit', 'Horse'],              recentYears: [2014, 2026, 2038], element: 'Fire' },
  { index: 7,  id: 'goat',    kanji: '\u672A', romaji: 'Hitsuji', english: 'Goat',    japanese: '\u3072\u3064\u3058',       traits: ['Gentle', 'Compassionate', 'Creative', 'Shy'],         luckyColors: ['Brown', 'Red', 'Purple'],   compatible: ['Rabbit', 'Horse', 'Pig'],               avoid: ['Ox', 'Dog', 'Rat', 'Snake'],                 recentYears: [2015, 2027, 2039], element: 'Earth' },
  { index: 8,  id: 'monkey',  kanji: '\u7533', romaji: 'Saru',    english: 'Monkey',  japanese: '\u3055\u308B',             traits: ['Witty', 'Intelligent', 'Inventive', 'Mischievous'],   luckyColors: ['White', 'Blue', 'Gold'],    compatible: ['Rat', 'Dragon', 'Snake'],               avoid: ['Tiger', 'Pig'],                              recentYears: [2016, 2028, 2040], element: 'Metal' },
  { index: 9,  id: 'rooster', kanji: '\u9149', romaji: 'Tori',    english: 'Rooster', japanese: '\u3068\u308A',             traits: ['Observant', 'Hardworking', 'Courageous', 'Vain'],     luckyColors: ['Gold', 'Brown', 'Yellow'],  compatible: ['Ox', 'Dragon', 'Snake'],                avoid: ['Rat', 'Rabbit', 'Dog', 'Rooster'],           recentYears: [2017, 2029, 2041], element: 'Metal' },
  { index: 10, id: 'dog',     kanji: '\u620C', romaji: 'Inu',     english: 'Dog',     japanese: '\u3044\u306C',             traits: ['Loyal', 'Honest', 'Amiable', 'Kind'],                 luckyColors: ['Red', 'Green', 'Purple'],   compatible: ['Rabbit', 'Tiger', 'Horse'],             avoid: ['Dragon', 'Goat', 'Rooster'],                 recentYears: [2018, 2030, 2042], element: 'Earth' },
  { index: 11, id: 'pig',     kanji: '\u4EA5', romaji: 'I',       english: 'Pig',     japanese: '\u3044\u306E\u3057\u3057', traits: ['Diligent', 'Compassionate', 'Generous', 'Naive'],      luckyColors: ['Yellow', 'Grey', 'Brown'],  compatible: ['Tiger', 'Rabbit', 'Goat'],              avoid: ['Snake', 'Monkey'],                           recentYears: [2019, 2031, 2043], element: 'Water' }
];

// ============ HELPERS ============

function getIndex(year) {
  return ((year - 4) % 12 + 12) % 12;
}

function buildResult(year, animal) {
  var nextOcc = year + 1;
  while (getIndex(nextOcc) !== animal.index) nextOcc++;
  var prevOcc = year - 1;
  while (getIndex(prevOcc) !== animal.index) prevOcc--;

  return {
    year:            year,
    index:           animal.index,
    id:              animal.id,
    kanji:           animal.kanji,
    romaji:          animal.romaji,
    english:         animal.english,
    japanese:        animal.japanese,
    element:         animal.element,
    traits:          animal.traits,
    luckyColors:     animal.luckyColors,
    compatible:      animal.compatible,
    avoid:           animal.avoid,
    recentYears:     animal.recentYears,
    nextOccurrence:  nextOcc,
    prevOccurrence:  prevOcc
  };
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Look up the Japanese zodiac animal for a Gregorian year.
 * @param {number} year - Gregorian year (e.g. 2025)
 * @returns {{ year: number, index: number, id: string, kanji: string, romaji: string, english: string, japanese: string, element: string, traits: string[], luckyColors: string[], compatible: string[], avoid: string[], recentYears: number[], nextOccurrence: number, prevOccurrence: number } | { error: string }}
 */
export function getZodiacByYear(year) {
  if (typeof year !== 'number' || !Number.isInteger(year)) {
    return { error: 'Year must be a valid integer' };
  }
  if (year < 1868) {
    return { error: 'Year must be 1868 or later (Meiji era)' };
  }
  if (year > 2100) {
    return { error: 'Year must be 2100 or earlier' };
  }

  var idx = getIndex(year);
  return buildResult(year, ZODIAC_ANIMALS[idx]);
}

/**
 * Look up the Japanese zodiac animal for a date of birth.
 * Japanese eto uses solar calendar — year starts January 1.
 * @param {string} dobString - ISO date string "YYYY-MM-DD"
 * @returns {{ year: number, index: number, id: string, kanji: string, romaji: string, english: string, japanese: string, element: string, traits: string[], luckyColors: string[], compatible: string[], avoid: string[], recentYears: number[], nextOccurrence: number, prevOccurrence: number } | { error: string }}
 */
export function getZodiacByDOB(dobString) {
  if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) {
    return { error: 'Invalid date format. Use YYYY-MM-DD.' };
  }
  var parts = dobString.split('-');
  var year = parseInt(parts[0], 10);
  return getZodiacByYear(year);
}

/**
 * Get zodiac data for a range of years (inclusive).
 * @param {number} startYear - First year in range
 * @param {number} endYear - Last year in range
 * @returns {Array<{ year: number, english: string, kanji: string, romaji: string, element: string }>}
 */
export function getZodiacTable(startYear, endYear) {
  var results = [];
  for (var y = startYear; y <= endYear; y++) {
    var idx = getIndex(y);
    var a = ZODIAC_ANIMALS[idx];
    results.push({
      year:    y,
      english: a.english,
      kanji:   a.kanji,
      romaji:  a.romaji,
      element: a.element
    });
  }
  return results;
}

/**
 * Get the zodiac animal for the current year.
 * @returns {{ year: number, index: number, id: string, kanji: string, romaji: string, english: string, japanese: string, element: string, traits: string[], luckyColors: string[], compatible: string[], avoid: string[], recentYears: number[], nextOccurrence: number, prevOccurrence: number }}
 */
export function getCurrentYearZodiac() {
  return getZodiacByYear(new Date().getFullYear());
}

// ============ UNIT TESTS ============

export function runTests() {
  var pass = 0;
  var fail = 0;
  var total = 10;

  function assert(label, condition, actual) {
    if (condition) {
      pass++;
      console.log('PASS: ' + label);
    } else {
      fail++;
      console.log('FAIL: ' + label + ' | actual: ' + JSON.stringify(actual));
    }
  }

  // T1: 2025 = Snake
  var t1 = getZodiacByYear(2025);
  assert('T1 2025 = Snake', t1.english === 'Snake' && t1.kanji === '\u5DF3', t1);

  // T2: 2024 = Dragon
  var t2 = getZodiacByYear(2024);
  assert('T2 2024 = Dragon', t2.english === 'Dragon' && t2.kanji === '\u8FB0', t2);

  // T3: 2023 = Rabbit
  var t3 = getZodiacByYear(2023);
  assert('T3 2023 = Rabbit', t3.english === 'Rabbit' && t3.kanji === '\u536F', t3);

  // T4: 2020 = Rat
  var t4 = getZodiacByYear(2020);
  assert('T4 2020 = Rat', t4.english === 'Rat' && t4.kanji === '\u5B50', t4);

  // T5: 1900 = Rat
  var t5 = getZodiacByYear(1900);
  assert('T5 1900 = Rat', t5.english === 'Rat', t5);

  // T6: DOB 1990-01-01 = Horse
  var t6 = getZodiacByDOB('1990-01-01');
  assert('T6 DOB 1990-01-01 = Horse', t6.english === 'Horse', t6);

  // T7: DOB 1990-12-31 = Horse (same year, solar calendar)
  var t7 = getZodiacByDOB('1990-12-31');
  assert('T7 DOB 1990-12-31 = Horse', t7.english === 'Horse', t7);

  // T8: nextOccurrence(2025) = 2037
  var t8 = getZodiacByYear(2025);
  assert('T8 nextOccurrence(2025) = 2037', t8.nextOccurrence === 2037, t8.nextOccurrence);

  // T9: getZodiacTable(2020, 2031) = 12 items, first year 2020
  var t9 = getZodiacTable(2020, 2031);
  assert('T9 table 2020-2031 = 12 items', t9.length === 12 && t9[0].year === 2020, { length: t9.length, firstYear: t9[0].year });

  // T10: year 1867 = error
  var t10 = getZodiacByYear(1867);
  assert('T10 year 1867 = error', !!t10.error, t10);

  console.log('---');
  console.log('Results: ' + pass + '/' + total + ' PASS, ' + fail + ' FAIL');
  return { pass: pass, fail: fail, total: total };
}
