/**
 * Kanji Number Converter — JS Logic Module
 * japancalc.com
 *
 * Converts between Arabic numerals and Japanese kanji number notation.
 * Supports standard, daiji (formal), and mixed styles.
 *
 * Exports: toKanjiNumber, fromKanjiNumber, numberToReading, getCommonNumbers
 */

const KANJI_DIGITS = ['〇','一','二','三','四','五','六','七','八','九'];
const DAIJI_DIGITS = ['〇','壱','弐','参','四','伍','六','七','八','九'];

const PLACE_VALUES = [
  { value: 1_000_000_000_000, kanji: '兆', daiji: '兆' },
  { value: 100_000_000,       kanji: '億', daiji: '億' },
  { value: 10_000,            kanji: '万', daiji: '万' },
  { value: 1_000,             kanji: '千', daiji: '千' },
  { value: 100,               kanji: '百', daiji: '百' },
  { value: 10,                kanji: '十', daiji: '拾' }
];

const MAX_VALUE = 9_999_999_999_999;

// Reading data for numbers 0-9
const DIGIT_READINGS = ['', 'いち', 'に', 'さん', 'し', 'ご', 'ろく', 'しち', 'はち', 'きゅう'];
const PLACE_READINGS = {
  10:   { base: 'じゅう' },
  100:  { base: 'ひゃく', special: { 3: 'びゃく', 6: 'ぴゃく', 8: 'ぴゃく' } },
  1000: { base: 'せん',   special: { 3: 'ぜん', 8: 'ぜん' } }
};

/**
 * Convert a number (within a 4-digit group) to kanji.
 * @param {number} n - Number 0-9999
 * @param {boolean} useDaiji - Use daiji characters
 * @param {boolean} useIchi - Show 一 before 千/百/十
 * @returns {string}
 */
function groupToKanji(n, useDaiji, useIchi) {
  if (n === 0) return '';
  const digits = useDaiji ? DAIJI_DIGITS : KANJI_DIGITS;
  let result = '';

  const places = [
    { val: 1000, k: useDaiji ? '千' : '千' },
    { val: 100,  k: useDaiji ? '百' : '百' },
    { val: 10,   k: useDaiji ? '拾' : '十' }
  ];

  let rem = n;
  for (const p of places) {
    const d = Math.floor(rem / p.val);
    if (d > 0) {
      if (d === 1 && !useIchi) {
        result += p.k;
      } else {
        result += digits[d] + p.k;
      }
      rem %= p.val;
    }
  }
  if (rem > 0) {
    result += digits[rem];
  }
  return result;
}

/**
 * Convert an Arabic number to Japanese kanji notation.
 * @param {number|string} number - The number to convert
 * @param {Object} [options]
 * @param {'standard'|'daiji'|'mixed'} [options.style='standard'] - Output style
 * @param {boolean} [options.showZero=false] - Show 〇 for zero components
 * @param {boolean} [options.currency=false] - Append 円
 * @param {boolean} [options.useIchi=false] - Show 一 before 千/百/十
 * @returns {Object} Result with output, reading, daiji, mixed fields
 */
export function toKanjiNumber(number, options = {}) {
  let num = typeof number === 'string' ? parseFloat(number) : number;

  if (num == null || isNaN(num)) {
    return { error: 'Invalid input — please enter a number' };
  }
  if (num < 0) {
    return { error: 'Negative numbers are not supported' };
  }

  let note;
  if (!Number.isInteger(num)) {
    num = Math.floor(num);
    note = 'Decimal truncated to integer';
  }

  if (num > MAX_VALUE) {
    return { error: 'Number too large (maximum: 9,999,999,999,999)' };
  }

  const style = options.style || 'standard';
  const useIchi = options.useIchi !== undefined ? options.useIchi : false;
  const currency = options.currency || false;

  // Zero
  if (num === 0) {
    const out = '零';
    const result = {
      input: num, output: out, reading: 'れい',
      daiji: out, mixed: '0', style
    };
    if (currency) result.withYen = out + '円';
    if (note) result.note = note;
    return result;
  }

  // Standard conversion
  const stdOutput = buildKanji(num, false, useIchi);
  const daijiOutput = buildKanji(num, true, useIchi);
  const mixedOutput = buildMixed(num);
  const reading = numberToReading(num);

  let output;
  if (style === 'daiji') output = daijiOutput;
  else if (style === 'mixed') output = mixedOutput;
  else output = stdOutput;

  const result = {
    input: num, output, reading,
    daiji: daijiOutput, mixed: mixedOutput, style
  };
  if (currency) result.withYen = output + '円';
  if (note) result.note = note;
  return result;
}

/**
 * Build full kanji string for a number.
 */
function buildKanji(num, useDaiji, useIchi) {
  let result = '';
  let remaining = num;

  // 兆, 億, 万 — large place values (always show coefficient)
  const largePlaces = [
    { value: 1_000_000_000_000, kanji: '兆' },
    { value: 100_000_000,       kanji: '億' },
    { value: 10_000,            kanji: '万' }
  ];

  for (const p of largePlaces) {
    const group = Math.floor(remaining / p.value);
    if (group > 0) {
      result += groupToKanji(group, useDaiji, useIchi) + p.kanji;
      remaining %= p.value;
    }
  }

  // Remaining 0-9999
  if (remaining > 0) {
    result += groupToKanji(remaining, useDaiji, useIchi);
  }

  return result;
}

/**
 * Build mixed notation (Arabic + kanji for 万/億/兆).
 */
function buildMixed(num) {
  if (num < 10000) return String(num);

  let result = '';
  let remaining = num;

  const largePlaces = [
    { value: 1_000_000_000_000, kanji: '兆' },
    { value: 100_000_000,       kanji: '億' },
    { value: 10_000,            kanji: '万' }
  ];

  for (const p of largePlaces) {
    const group = Math.floor(remaining / p.value);
    if (group > 0) {
      result += group + p.kanji;
      remaining %= p.value;
    }
  }

  if (remaining > 0) {
    result += remaining;
  }

  return result;
}

/**
 * Convert Japanese kanji number notation back to Arabic numeral.
 * @param {string} kanjiStr - Kanji number string
 * @returns {Object} { input, output, style } or { error }
 */
export function fromKanjiNumber(kanjiStr) {
  if (typeof kanjiStr !== 'string' || kanjiStr.trim() === '') {
    return { error: 'Invalid input' };
  }

  const str = kanjiStr.trim();

  if (str === '零' || str === '〇') {
    return { input: str, output: 0, style: 'standard' };
  }

  // Mixed notation: contains Arabic digits + kanji markers
  if (/\d/.test(str)) {
    return parseMixed(str);
  }

  // Detect style
  const hasDaiji = /[壱弐参伍拾]/.test(str);
  const style = hasDaiji ? 'daiji' : 'standard';

  const result = parseKanji(str);
  if (result === null) {
    return { error: 'Cannot parse: unrecognized kanji' };
  }

  return { input: str, output: result, style };
}

/**
 * Parse mixed notation like "1万2345" or "1億2345万6789"
 */
function parseMixed(str) {
  let total = 0;
  let current = '';

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '兆') {
      total += parseInt(current || '0') * 1_000_000_000_000;
      current = '';
    } else if (ch === '億') {
      total += parseInt(current || '0') * 100_000_000;
      current = '';
    } else if (ch === '万') {
      total += parseInt(current || '0') * 10_000;
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) total += parseInt(current);

  return { input: str, output: total, style: 'mixed' };
}

/**
 * Parse standard or daiji kanji number string.
 */
function parseKanji(str) {
  // Build digit map for both standard and daiji
  const digitMap = {};
  KANJI_DIGITS.forEach((k, i) => { digitMap[k] = i; });
  DAIJI_DIGITS.forEach((k, i) => { digitMap[k] = i; });

  let total = 0;
  let currentGroup = 0; // accumulates within 万 group
  let currentDigit = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];

    if (ch === '兆') {
      currentGroup += (currentDigit || 1);
      total += currentGroup * 1_000_000_000_000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (ch === '億') {
      currentGroup += (currentDigit || 1);
      total += currentGroup * 100_000_000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (ch === '万') {
      currentGroup += (currentDigit || 1);
      total += currentGroup * 10_000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (ch === '千') {
      currentGroup += (currentDigit || 1) * 1000;
      currentDigit = 0;
    } else if (ch === '百') {
      currentGroup += (currentDigit || 1) * 100;
      currentDigit = 0;
    } else if (ch === '十' || ch === '拾') {
      currentGroup += (currentDigit || 1) * 10;
      currentDigit = 0;
    } else if (digitMap[ch] !== undefined) {
      currentDigit = digitMap[ch];
    } else {
      return null; // unrecognized
    }
  }

  total += currentGroup + currentDigit;
  return total;
}

/**
 * Get the hiragana reading for numbers 0–9999.
 * @param {number} number - Number to read (0–9999)
 * @returns {string} Hiragana reading, empty string if > 9999
 */
export function numberToReading(number) {
  if (!Number.isFinite(number) || number < 0) return '';
  const num = Math.floor(number);
  if (num > 9999) return '';
  if (num === 0) return 'れい';

  let result = '';
  let remaining = num;

  // 千
  const sen = Math.floor(remaining / 1000);
  if (sen > 0) {
    const pr = PLACE_READINGS[1000];
    if (sen === 1) {
      result += pr.base;
    } else {
      const digitReading = DIGIT_READINGS[sen];
      const placeReading = pr.special && pr.special[sen] ? pr.special[sen] : pr.base;
      result += digitReading + placeReading;
    }
    remaining %= 1000;
  }

  // 百
  const hyaku = Math.floor(remaining / 100);
  if (hyaku > 0) {
    const pr = PLACE_READINGS[100];
    if (hyaku === 1) {
      result += pr.base;
    } else {
      const digitReading = DIGIT_READINGS[hyaku];
      const placeReading = pr.special && pr.special[hyaku] ? pr.special[hyaku] : pr.base;
      result += digitReading + placeReading;
    }
    remaining %= 100;
  }

  // 十
  const juu = Math.floor(remaining / 10);
  if (juu > 0) {
    const pr = PLACE_READINGS[10];
    if (juu === 1) {
      result += pr.base;
    } else {
      result += DIGIT_READINGS[juu] + pr.base;
    }
    remaining %= 10;
  }

  // 一の位
  if (remaining > 0) {
    // Special reading for 4 at end: し instead of し/よん — use し for counter context
    if (remaining === 4) {
      result += 'し';
    } else if (remaining === 7) {
      result += 'しち';
    } else if (remaining === 9) {
      result += 'きゅう';
    } else {
      result += DIGIT_READINGS[remaining];
    }
  }

  return result;
}

/**
 * Get pre-computed array of common numbers for the quick reference table.
 * @returns {Array<Object>} Array of { arabic, standard, daiji, reading }
 */
export function getCommonNumbers() {
  const COMMON = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                  20, 30, 100, 1000, 10000, 100000000];
  return COMMON.map(n => {
    const std = toKanjiNumber(n);
    const dj  = toKanjiNumber(n, { style: 'daiji' });
    return {
      arabic: n,
      standard: std.output,
      daiji: dj.output,
      reading: numberToReading(n)
    };
  });
}


// ============ UNIT TESTS ============

export function runTests() {
  const results = [];
  let pass = 0;
  let fail = 0;

  function assert(name, condition, actual) {
    if (condition) {
      pass++;
      results.push({ name, status: 'PASS' });
      console.log('  PASS: ' + name);
    } else {
      fail++;
      results.push({ name, status: 'FAIL', actual });
      console.error('  FAIL: ' + name + ' | actual: ' + JSON.stringify(actual));
    }
  }

  console.log('=== Kanji Number Module Tests ===');

  // T1: 1 → 一
  assert('T1: 1 → 一', toKanjiNumber(1).output === '一', toKanjiNumber(1).output);

  // T2: 10 → 十 (NOT 一十)
  assert('T2: 10 → 十', toKanjiNumber(10).output === '十', toKanjiNumber(10).output);

  // T3: 100 → 百
  assert('T3: 100 → 百', toKanjiNumber(100).output === '百', toKanjiNumber(100).output);

  // T4: 1000 → 千
  assert('T4: 1000 → 千', toKanjiNumber(1000).output === '千', toKanjiNumber(1000).output);

  // T5: 1234 → 千二百三十四
  assert('T5: 1234 → 千二百三十四', toKanjiNumber(1234).output === '千二百三十四', toKanjiNumber(1234).output);

  // T6: 10000 → 一万
  assert('T6: 10000 → 一万', toKanjiNumber(10000).output === '一万', toKanjiNumber(10000).output);

  // T7: 12345 → 一万二千三百四十五
  assert('T7: 12345 → 一万二千三百四十五', toKanjiNumber(12345).output === '一万二千三百四十五', toKanjiNumber(12345).output);

  // T8: 1234 daiji → 千弐百参拾四
  assert('T8: 1234 daiji', toKanjiNumber(1234, { style: 'daiji' }).output === '千弐百参拾四', toKanjiNumber(1234, { style: 'daiji' }).output);

  // T9: 12345 mixed → 1万2345
  assert('T9: 12345 mixed', toKanjiNumber(12345, { style: 'mixed' }).output === '1万2345', toKanjiNumber(12345, { style: 'mixed' }).output);

  // T10: 0 → 零
  assert('T10: 0 → 零', toKanjiNumber(0).output === '零', toKanjiNumber(0).output);

  // T11: -1 → error
  assert('T11: -1 → error', !!toKanjiNumber(-1).error, toKanjiNumber(-1));

  // T12: fromKanji 千二百三十四 → 1234
  assert('T12: fromKanji 千二百三十四', fromKanjiNumber('千二百三十四').output === 1234, fromKanjiNumber('千二百三十四').output);

  // T13: fromKanji 一万二千三百四十五 → 12345
  assert('T13: fromKanji 一万二千三百四十五', fromKanjiNumber('一万二千三百四十五').output === 12345, fromKanjiNumber('一万二千三百四十五').output);

  // T14: reading 1234
  assert('T14: reading 1234', numberToReading(1234) === 'せんにひゃくさんじゅうし', numberToReading(1234));

  // T15: getCommonNumbers length
  assert('T15: getCommonNumbers length=18', getCommonNumbers().length === 18, getCommonNumbers().length);

  console.log('\n=== Results: ' + pass + '/' + (pass + fail) + ' PASS ===');
  return { pass, fail, total: pass + fail, results };
}
