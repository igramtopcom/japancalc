/**
 * Japan Measurement Converter — JS Logic Module
 * Converts height, weight, temperature, clothing, shoe, and ring sizes
 * between Japanese and Western systems.
 *
 * @module measurement
 */

// ── Constants ──────────────────────────────────────────────

const CM_PER_INCH = 2.54;
const INCHES_PER_FOOT = 12;
const KG_PER_LB = 0.45359237;
const LBS_PER_STONE = 14;

const WOMENS_TOP_SIZES = [
  { jp: 5,  us: 'XS', eu: 32, uk: 4,  bust_cm: [76, 79] },
  { jp: 7,  us: 'S',  eu: 34, uk: 6,  bust_cm: [79, 82] },
  { jp: 9,  us: 'S',  eu: 36, uk: 8,  bust_cm: [82, 85] },
  { jp: 11, us: 'M',  eu: 38, uk: 10, bust_cm: [85, 88] },
  { jp: 13, us: 'L',  eu: 40, uk: 12, bust_cm: [88, 92] },
  { jp: 15, us: 'L',  eu: 42, uk: 14, bust_cm: [92, 96] },
  { jp: 17, us: 'XL', eu: 44, uk: 16, bust_cm: [96, 100] },
  { jp: 19, us: '2XL',eu: 46, uk: 18, bust_cm: [100, 106] }
];

const MENS_TOP_SIZES = [
  { jp: 'S',  us: 'S',  eu: 44, uk: 34, chest_cm: [86, 90] },
  { jp: 'M',  us: 'M',  eu: 46, uk: 36, chest_cm: [90, 94] },
  { jp: 'L',  us: 'L',  eu: 48, uk: 38, chest_cm: [94, 98] },
  { jp: 'LL', us: 'XL', eu: 50, uk: 40, chest_cm: [98, 102] },
  { jp: '3L', us: 'XXL',eu: 52, uk: 42, chest_cm: [102, 108] }
];

const WOMENS_SHOE_SIZES = [
  { jp: 22.0, us: 5.0,  eu: 35 },
  { jp: 22.5, us: 5.5,  eu: 35.5 },
  { jp: 23.0, us: 6.0,  eu: 36 },
  { jp: 23.5, us: 6.5,  eu: 37 },
  { jp: 24.0, us: 7.0,  eu: 37.5 },
  { jp: 24.5, us: 7.5,  eu: 38 },
  { jp: 25.0, us: 8.0,  eu: 38.5 },
  { jp: 25.5, us: 8.5,  eu: 39 },
  { jp: 26.0, us: 9.0,  eu: 40 }
];

const MENS_SHOE_SIZES = [
  { jp: 24.5, us: 6.5,  eu: 39 },
  { jp: 25.0, us: 7.0,  eu: 40 },
  { jp: 25.5, us: 7.5,  eu: 40.5 },
  { jp: 26.0, us: 8.0,  eu: 41 },
  { jp: 26.5, us: 8.5,  eu: 42 },
  { jp: 27.0, us: 9.0,  eu: 42.5 },
  { jp: 27.5, us: 9.5,  eu: 43 },
  { jp: 28.0, us: 10.0, eu: 44 },
  { jp: 28.5, us: 10.5, eu: 44.5 },
  { jp: 29.0, us: 11.0, eu: 45 }
];

const RING_SIZES = [
  { jp: 1,  us: 1.0,  eu: 40.8, diameter_mm: 13.0 },
  { jp: 3,  us: 2.0,  eu: 42.8, diameter_mm: 13.6 },
  { jp: 5,  us: 3.0,  eu: 44.8, diameter_mm: 14.3 },
  { jp: 7,  us: 4.0,  eu: 46.8, diameter_mm: 14.9 },
  { jp: 9,  us: 5.0,  eu: 49.3, diameter_mm: 15.7 },
  { jp: 11, us: 6.0,  eu: 51.5, diameter_mm: 16.4 },
  { jp: 13, us: 7.0,  eu: 54.0, diameter_mm: 17.2 },
  { jp: 15, us: 8.0,  eu: 57.0, diameter_mm: 18.1 },
  { jp: 17, us: 9.0,  eu: 59.5, diameter_mm: 18.9 },
  { jp: 19, us: 10.0, eu: 62.0, diameter_mm: 19.7 }
];

// ── Helpers ────────────────────────────────────────────────

function round1(n) { return Math.round(n * 10) / 10; }

function buildHeightResult(cm) {
  const totalInches = round1(cm / CM_PER_INCH);
  const feet = Math.floor(totalInches / INCHES_PER_FOOT);
  const remInches = round1(totalInches - feet * INCHES_PER_FOOT);
  const displayInches = Math.round(cm / CM_PER_INCH % INCHES_PER_FOOT);
  return {
    cm: round1(cm),
    totalInches,
    feet,
    inches: remInches,
    feetInches: feet + "'" + Math.round(totalInches - feet * INCHES_PER_FOOT) + '"',
    formatted: {
      cm: round1(cm) + ' cm',
      feetInches: feet + "'" + Math.round(totalInches - feet * INCHES_PER_FOOT) + '"'
    }
  };
}

function findNearest(table, key, value) {
  const numVal = Number(value);
  if (typeof table[0][key] === 'number' || !isNaN(numVal)) {
    let best = null;
    let bestDiff = Infinity;
    for (const row of table) {
      const rowVal = Number(row[key]);
      if (isNaN(rowVal)) continue;
      const diff = Math.abs(rowVal - numVal);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = row;
      }
    }
    return best;
  }
  // String match (case-insensitive)
  const strVal = String(value).toUpperCase();
  for (const row of table) {
    if (String(row[key]).toUpperCase() === strVal) return row;
  }
  return null;
}

// ── Exports ────────────────────────────────────────────────

/**
 * Convert height between cm and feet/inches.
 * @param {number} value - Height value
 * @param {'cm'|'inches'} fromUnit - Source unit
 * @returns {Object} Conversion result or { error }
 */
export function convertHeight(value, fromUnit) {
  const n = Number(value);
  if (isNaN(n) || n <= 0) return { error: 'Invalid height — must be a positive number' };

  if (fromUnit === 'cm') {
    if (n > 300) return { error: 'Height too large (maximum 300 cm)' };
    return buildHeightResult(n);
  }
  if (fromUnit === 'inches') {
    if (n > 120) return { error: 'Height too large (maximum 120 inches)' };
    return buildHeightResult(n * CM_PER_INCH);
  }
  return { error: 'Unknown unit: ' + fromUnit };
}

/**
 * Convert feet + inches to cm and other units.
 * @param {number} feet - Feet component
 * @param {number} inches - Inches component
 * @returns {Object} Conversion result or { error }
 */
export function convertHeightFeetInches(feet, inches) {
  const f = Number(feet);
  const i = Number(inches);
  if (isNaN(f) || isNaN(i) || f < 0 || i < 0) return { error: 'Invalid input' };
  const totalInches = f * INCHES_PER_FOOT + i;
  if (totalInches <= 0) return { error: 'Height must be positive' };
  if (totalInches > 120) return { error: 'Height too large' };
  return buildHeightResult(totalInches * CM_PER_INCH);
}

/**
 * Convert weight between kg, lbs, and stone.
 * @param {number} value - Weight value
 * @param {'kg'|'lbs'|'stone'} fromUnit - Source unit
 * @returns {Object} Conversion result or { error }
 */
export function convertWeight(value, fromUnit) {
  const n = Number(value);
  if (isNaN(n) || n <= 0) return { error: 'Invalid weight — must be a positive number' };

  let kg;
  if (fromUnit === 'kg') {
    if (n > 500) return { error: 'Weight too large (maximum 500 kg)' };
    kg = n;
  } else if (fromUnit === 'lbs') {
    if (n > 1100) return { error: 'Weight too large (maximum 1100 lbs)' };
    kg = n * KG_PER_LB;
  } else if (fromUnit === 'stone') {
    const lbs = n * LBS_PER_STONE;
    if (lbs > 1100) return { error: 'Weight too large' };
    kg = lbs * KG_PER_LB;
  } else {
    return { error: 'Unknown unit: ' + fromUnit };
  }

  const lbs = kg / KG_PER_LB;
  const totalStone = lbs / LBS_PER_STONE;
  const stoneWhole = Math.floor(totalStone);
  const stoneLbsRem = Math.round(lbs - stoneWhole * LBS_PER_STONE);

  return {
    kg: round1(kg),
    lbs: round1(lbs),
    stone: round1(totalStone),
    stoneLbs: stoneWhole + ' st ' + stoneLbsRem + ' lb',
    formatted: {
      kg: round1(kg) + ' kg',
      lbs: round1(lbs) + ' lbs',
      stoneLbs: stoneWhole + ' st ' + stoneLbsRem + ' lb'
    }
  };
}

/**
 * Convert temperature between Celsius and Fahrenheit.
 * @param {number} value - Temperature value
 * @param {'C'|'F'} fromUnit - Source unit
 * @returns {Object} Conversion result or { error }
 */
export function convertTemperature(value, fromUnit) {
  const n = Number(value);
  if (isNaN(n)) return { error: 'Invalid temperature' };

  let celsius, fahrenheit;
  if (fromUnit === 'C') {
    celsius = n;
    fahrenheit = round1((n * 9 / 5) + 32);
  } else if (fromUnit === 'F') {
    fahrenheit = n;
    celsius = round1((n - 32) * 5 / 9);
  } else {
    return { error: 'Unknown unit: ' + fromUnit };
  }

  return {
    celsius,
    fahrenheit,
    formatted: {
      celsius: celsius + '\u00B0C',
      fahrenheit: fahrenheit + '\u00B0F'
    }
  };
}

/**
 * Find equivalent clothing sizes across systems.
 * @param {string|number} size - Input size
 * @param {'jp'|'us'|'eu'|'uk'} fromSystem - Source sizing system
 * @param {'women'|'men'} gender - Gender category
 * @returns {Object|null} Size equivalents or null
 */
export function convertClothingSize(size, fromSystem, gender) {
  const table = gender === 'men' ? MENS_TOP_SIZES : WOMENS_TOP_SIZES;
  const match = findNearest(table, fromSystem, size);
  if (!match) return null;
  return {
    jp: match.jp,
    us: match.us,
    eu: match.eu,
    uk: match.uk,
    note: 'Sizes are approximate. Try before buying.'
  };
}

/**
 * Find equivalent shoe sizes across systems.
 * @param {number} size - Shoe size number
 * @param {'jp'|'us'|'eu'} fromSystem - Source sizing system
 * @param {'women'|'men'} gender - Gender category
 * @returns {Object|null} Size equivalents or null
 */
export function convertShoeSize(size, fromSystem, gender) {
  const table = gender === 'men' ? MENS_SHOE_SIZES : WOMENS_SHOE_SIZES;
  const match = findNearest(table, fromSystem, size);
  if (!match) return null;
  return {
    jp: match.jp,
    us: match.us,
    eu: match.eu,
    note: 'Japanese shoe sizes = foot length in cm.'
  };
}

/**
 * Find equivalent ring sizes across systems.
 * @param {number} size - Ring size number
 * @param {'jp'|'us'|'eu'} fromSystem - Source sizing system
 * @returns {Object|null} Size equivalents or null
 */
export function convertRingSize(size, fromSystem) {
  const match = findNearest(RING_SIZES, fromSystem, size);
  if (!match) return null;
  return {
    jp: match.jp,
    us: match.us,
    eu: match.eu,
    diameter_mm: match.diameter_mm
  };
}

/**
 * Run all unit tests.
 * @returns {{ pass: number, fail: number, total: number, results: Array }}
 */
export function runTests() {
  const results = [];
  function assert(name, actual, expected, approx) {
    let pass;
    if (approx) {
      pass = Math.abs(actual - expected) <= approx;
    } else {
      pass = actual === expected;
    }
    results.push({ name, status: pass ? 'PASS' : 'FAIL', actual, expected });
    if (!pass) console.log('FAIL:', name, '| actual:', actual, '| expected:', expected);
  }

  // T1: 170cm → 5'7"
  const h1 = convertHeight(170, 'cm');
  assert('T1: 170cm feetInches', h1.feet, 5);
  // inches should be ~6.9, rounded display = 7
  const h1display = parseInt(h1.feetInches.split("'")[1]);
  assert('T1: 170cm display inches', h1display, 7, 1);

  // T2: 5'7" → cm
  const h2 = convertHeightFeetInches(5, 7);
  assert('T2: 5ft7in → cm', h2.cm, 170.2, 0.2);

  // T3: 70kg → lbs
  const w1 = convertWeight(70, 'kg');
  assert('T3: 70kg → lbs', w1.lbs, 154.3, 0.1);

  // T4: 154 lbs → kg
  const w2 = convertWeight(154, 'lbs');
  assert('T4: 154lbs → kg', w2.kg, 69.9, 0.1);

  // T5: 37°C → 98.6°F
  const t1 = convertTemperature(37, 'C');
  assert('T5: 37C → F', t1.fahrenheit, 98.6);

  // T6: 98.6°F → 37°C
  const t2 = convertTemperature(98.6, 'F');
  assert('T6: 98.6F → C', t2.celsius, 37);

  // T7: JP 11 women → US M
  const c1 = convertClothingSize(11, 'jp', 'women');
  assert('T7: JP11 women → US', c1.us, 'M');

  // T8: US M men → JP M
  const c2 = convertClothingSize('M', 'us', 'men');
  assert('T8: US M men → JP', c2.jp, 'M');

  // T9: JP 25.0 women shoe → US 8.0 (per data table: jp 25.0 = us 8.0)
  const s1 = convertShoeSize(25.0, 'jp', 'women');
  assert('T9: JP25 women shoe → US', s1.us, 8.0);

  // T10: US 8.0 women shoe → JP 25.0
  const s2 = convertShoeSize(8.0, 'us', 'women');
  assert('T10: US8 women shoe → JP', s2.jp, 25.0);

  // T11: JP ring 11 → US 6.0
  const r1 = convertRingSize(11, 'jp');
  assert('T11: JP ring 11 → US', r1.us, 6.0);

  // T12: height 0 → error
  const h0 = convertHeight(0, 'cm');
  assert('T12: height 0 → error', !!h0.error, true);

  const pass = results.filter(r => r.status === 'PASS').length;
  const fail = results.filter(r => r.status === 'FAIL').length;
  return { pass, fail, total: results.length, results };
}
