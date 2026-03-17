/**
 * japancalc.com — Romaji Converter Logic Module
 * Spec: PRD v1.0 Section 2.2 (Tool 8 — Romaji Converter)
 *
 * Exports: toRomaji, toHiragana, toKatakana, detectScript, splitIntoTokens
 */

// ============ HIRAGANA → ROMAJI MAP ============

const HIRAGANA_MAP = {
  // Compound sounds (digraphs) — checked BEFORE single characters
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
  'しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja', 'じゅ':'ju', 'じょ':'jo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  // Basic vowels
  'あ':'a',  'い':'i',  'う':'u',  'え':'e',  'お':'o',
  // K row
  'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  // S row
  'さ':'sa', 'し':'shi','す':'su', 'せ':'se', 'そ':'so',
  // T row
  'た':'ta', 'ち':'chi','つ':'tsu','て':'te', 'と':'to',
  // N row
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
  // H row
  'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  // M row
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
  // Y row
  'や':'ya', 'ゆ':'yu', 'よ':'yo',
  // R row
  'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
  // W row
  'わ':'wa', 'ゐ':'i',  'ゑ':'e',  'を':'o',
  // N
  'ん':'n',
  // G row
  'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
  // Z row
  'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  // D row
  'だ':'da', 'ぢ':'ji', 'づ':'zu', 'で':'de', 'ど':'do',
  // B row
  'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
  // P row
  'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
  // Small vowels
  'ぁ':'a',  'ぃ':'i',  'ぅ':'u',  'ぇ':'e',  'ぉ':'o',
  'ゃ':'ya', 'ゅ':'yu', 'ょ':'yo',
};

// ============ BUILD KATAKANA → ROMAJI MAP ============

const KATAKANA_MAP = {};

// Convert hiragana map to katakana by offsetting Unicode by 0x60
for (var key of Object.keys(HIRAGANA_MAP)) {
  var katKey = '';
  for (var c = 0; c < key.length; c++) {
    var code = key.charCodeAt(c);
    // Hiragana range U+3041-U+3096 → Katakana U+30A1-U+30F6
    if (code >= 0x3041 && code <= 0x3096) {
      katKey += String.fromCharCode(code + 0x60);
    } else {
      katKey += key[c];
    }
  }
  KATAKANA_MAP[katKey] = HIRAGANA_MAP[key];
}

// Katakana-specific entries
KATAKANA_MAP['\u30F4'] = 'vu';       // ヴ
KATAKANA_MAP['\u30D5\u30A1'] = 'fa'; // ファ
KATAKANA_MAP['\u30D5\u30A3'] = 'fi'; // フィ
KATAKANA_MAP['\u30D5\u30A7'] = 'fe'; // フェ
KATAKANA_MAP['\u30D5\u30A9'] = 'fo'; // フォ
KATAKANA_MAP['\u30C6\u30A3'] = 'ti'; // ティ
KATAKANA_MAP['\u30C7\u30A3'] = 'di'; // ディ
KATAKANA_MAP['\u30C7\u30E5'] = 'dyu';// デュ
KATAKANA_MAP['\u30A6\u30A3'] = 'wi'; // ウィ
KATAKANA_MAP['\u30A6\u30A7'] = 'we'; // ウェ
KATAKANA_MAP['\u30A6\u30A9'] = 'wo'; // ウォ

// Small tsu and long vowel mark for katakana
// ッ is at U+30C3, ー is at U+30FC

// ============ UNICODE HELPERS ============

function isHiragana(ch) {
  var c = ch.charCodeAt(0);
  return c >= 0x3041 && c <= 0x3096;
}

function isKatakana(ch) {
  var c = ch.charCodeAt(0);
  return (c >= 0x30A1 && c <= 0x30F6) || c === 0x30FC || c === 0x30F3;
}

function isKanji(ch) {
  var c = ch.charCodeAt(0);
  return (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3400 && c <= 0x4DBF);
}

function isLatin(ch) {
  var c = ch.charCodeAt(0);
  return (c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A);
}

function isNumber(ch) {
  var c = ch.charCodeAt(0);
  return c >= 0x30 && c <= 0x39;
}

function isVowel(ch) {
  return 'aiueo'.indexOf(ch) !== -1;
}

// ============ CORE CONVERSION ============

function convertToRomaji(text, passthrough) {
  var result = '';
  var i = 0;
  var lastVowel = '';

  while (i < text.length) {
    var ch = text[i];
    var chCode = ch.charCodeAt(0);

    // Small tsu (っ U+3063 or ッ U+30C3) — double next consonant
    if (chCode === 0x3063 || chCode === 0x30C3) {
      // Look ahead to find next consonant
      var nextRomaji = lookupAt(text, i + 1);
      if (nextRomaji && nextRomaji.romaji.length > 0) {
        result += nextRomaji.romaji[0]; // double the first consonant
      }
      i++;
      lastVowel = '';
      continue;
    }

    // Long vowel mark ー (U+30FC)
    if (chCode === 0x30FC) {
      if (lastVowel) {
        result += lastVowel;
      }
      i++;
      continue;
    }

    // Try digraph (2 chars) first, then single char
    var lookup = lookupAt(text, i);
    if (lookup) {
      var romaji = lookup.romaji;

      // Handle ん/ン before vowel or 'y' — add apostrophe
      if (i > 0) {
        var prevCode = text.charCodeAt(i - 1);
        // Check if previous was ん(0x3093) or ン(0x30F3) — but we already processed it
        // Actually we need to check if the last output was 'n' from ん/ン
      }

      // Special ん/ン handling: if this char is ん/ン, check what comes next
      if (ch === 'ん' || ch === '\u30F3') {
        var nextCh = i + 1 < text.length ? text[i + 1] : '';
        var nextLookup = nextCh ? lookupAt(text, i + 1) : null;
        var nextRom = nextLookup ? nextLookup.romaji : '';

        if (nextCh && (isVowel(nextRom[0]) || nextRom[0] === 'y')) {
          result += "n'";
        } else {
          result += 'n';
        }
        lastVowel = '';
        i++;
        continue;
      }

      result += romaji;
      lastVowel = romaji.length > 0 ? romaji[romaji.length - 1] : '';
      if (!isVowel(lastVowel)) lastVowel = '';
      i += lookup.len;
      continue;
    }

    // Non-Japanese character handling
    if (isKanji(ch)) {
      if (passthrough === 'remove') {
        i++;
        continue;
      } else if (passthrough === 'bracket') {
        // Collect consecutive kanji
        var kanjiRun = '';
        while (i < text.length && isKanji(text[i])) {
          kanjiRun += text[i];
          i++;
        }
        result += '[' + kanjiRun + ']';
        lastVowel = '';
        continue;
      }
      // 'keep' — fall through
    }

    // Pass through everything else
    result += ch;
    lastVowel = '';
    i++;
  }

  return result;
}

function lookupAt(text, i) {
  if (i >= text.length) return null;

  // Try 2-char digraph first
  if (i + 1 < text.length) {
    var two = text[i] + text[i + 1];
    if (HIRAGANA_MAP[two] !== undefined) {
      return { romaji: HIRAGANA_MAP[two], len: 2 };
    }
    if (KATAKANA_MAP[two] !== undefined) {
      return { romaji: KATAKANA_MAP[two], len: 2 };
    }
  }

  // Try single char
  var one = text[i];
  if (HIRAGANA_MAP[one] !== undefined) {
    return { romaji: HIRAGANA_MAP[one], len: 1 };
  }
  if (KATAKANA_MAP[one] !== undefined) {
    return { romaji: KATAKANA_MAP[one], len: 1 };
  }

  return null;
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Convert Japanese text (hiragana + katakana) to Hepburn romaji.
 * @param {string} text — input text
 * @param {Object} [options] — conversion options
 * @param {boolean} [options.capitalizeFirst=false] — capitalize first letter
 * @param {boolean} [options.uppercaseAll=false] — all uppercase
 * @param {boolean} [options.spaceWords=false] — add space between word groups
 * @param {string} [options.passthrough='keep'] — handling of kanji/unknown: 'keep' | 'remove' | 'bracket'
 * @returns {Object} Result with input, output, length, hasKanji, warning
 */
export function toRomaji(text, options) {
  if (typeof text !== 'string') {
    return { error: 'Input must be a string' };
  }

  if (text === '') {
    return { input: '', output: '', length: { input: 0, output: 0 }, hasKanji: false, warning: null };
  }

  var opts = options || {};
  var passthrough = opts.passthrough || 'keep';
  var hasKanji = false;

  // Check for kanji
  for (var c = 0; c < text.length; c++) {
    if (isKanji(text[c])) {
      hasKanji = true;
      break;
    }
  }

  var output = convertToRomaji(text, passthrough);

  if (opts.capitalizeFirst && output.length > 0) {
    output = output[0].toUpperCase() + output.slice(1);
  }
  if (opts.uppercaseAll) {
    output = output.toUpperCase();
  }

  var warning = hasKanji
    ? 'Input contains kanji \u2014 kanji cannot be converted to romaji automatically'
    : null;

  return {
    input:    text,
    output:   output,
    length:   { input: text.length, output: output.length },
    hasKanji: hasKanji,
    warning:  warning
  };
}

/**
 * Convert katakana text to hiragana.
 * @param {string} katakana — input katakana string
 * @returns {string} Hiragana string (non-katakana chars passed through)
 */
export function toHiragana(katakana) {
  var result = '';
  for (var i = 0; i < katakana.length; i++) {
    var code = katakana.charCodeAt(i);
    // Katakana U+30A1-U+30F6 → Hiragana U+3041-U+3096
    if (code >= 0x30A1 && code <= 0x30F6) {
      result += String.fromCharCode(code - 0x60);
    } else if (code === 0x30FC) {
      // Long vowel mark — keep as-is in hiragana (no equivalent)
      result += '\u30FC';
    } else {
      result += katakana[i];
    }
  }
  return result;
}

/**
 * Convert hiragana text to katakana.
 * @param {string} hiragana — input hiragana string
 * @returns {string} Katakana string (non-hiragana chars passed through)
 */
export function toKatakana(hiragana) {
  var result = '';
  for (var i = 0; i < hiragana.length; i++) {
    var code = hiragana.charCodeAt(i);
    // Hiragana U+3041-U+3096 → Katakana U+30A1-U+30F6
    if (code >= 0x3041 && code <= 0x3096) {
      result += String.fromCharCode(code + 0x60);
    } else {
      result += hiragana[i];
    }
  }
  return result;
}

/**
 * Detect what Japanese scripts are present in the input.
 * @param {string} text — input text
 * @returns {Object} Script detection result with flags and dominant script
 */
export function detectScript(text) {
  var result = {
    hasHiragana: false,
    hasKatakana: false,
    hasKanji:    false,
    hasLatin:    false,
    hasNumbers:  false,
    isEmpty:     true,
    dominant:    'empty'
  };

  if (!text || text.length === 0) return result;
  result.isEmpty = false;

  var counts = { hiragana: 0, katakana: 0, kanji: 0, latin: 0 };

  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (isHiragana(ch) || ch === '\u3093') { // include ん
      result.hasHiragana = true;
      counts.hiragana++;
    } else if (isKatakana(ch) || ch.charCodeAt(0) === 0x30FC) {
      result.hasKatakana = true;
      counts.katakana++;
    } else if (isKanji(ch)) {
      result.hasKanji = true;
      counts.kanji++;
    } else if (isLatin(ch)) {
      result.hasLatin = true;
      counts.latin++;
    } else if (isNumber(ch)) {
      result.hasNumbers = true;
    }
  }

  // Determine dominant
  var max = 0;
  var dom = 'mixed';
  var scriptCount = 0;
  for (var s of ['hiragana', 'katakana', 'kanji', 'latin']) {
    if (counts[s] > 0) scriptCount++;
    if (counts[s] > max) {
      max = counts[s];
      dom = s;
    }
  }
  result.dominant = scriptCount > 1 ? 'mixed' : (max > 0 ? dom : 'empty');

  return result;
}

/**
 * Split text into tokens by script type.
 * @param {string} text — input text
 * @returns {Array} Array of { text, type } tokens
 */
export function splitIntoTokens(text) {
  if (!text || text.length === 0) return [];

  var tokens = [];
  var currentText = '';
  var currentType = '';

  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    var type;

    if (isHiragana(ch) || ch === '\u3093' || ch.charCodeAt(0) === 0x3063) {
      type = 'hiragana';
    } else if (isKatakana(ch) || ch.charCodeAt(0) === 0x30FC || ch.charCodeAt(0) === 0x30C3) {
      type = 'katakana';
    } else if (isKanji(ch)) {
      type = 'kanji';
    } else if (isLatin(ch)) {
      type = 'latin';
    } else if (isNumber(ch)) {
      type = 'number';
    } else {
      type = 'other';
    }

    if (type === currentType) {
      currentText += ch;
    } else {
      if (currentText) tokens.push({ text: currentText, type: currentType });
      currentText = ch;
      currentType = type;
    }
  }
  if (currentText) tokens.push({ text: currentText, type: currentType });

  return tokens;
}

// ============ UNIT TESTS ============
// Run: copy-paste into browser console, call runTests()

export function runTests() {
  var passed = 0;
  var failed = 0;

  function assert(name, condition) {
    if (condition) {
      console.log('  PASS:', name);
      passed++;
    } else {
      console.error('  FAIL:', name);
      failed++;
    }
  }

  console.log('Romaji module \u2014 running 15 tests...');

  // T1: おはよう → ohayou
  var t1 = toRomaji('\u304A\u306F\u3088\u3046');
  assert('T1: ohayou', t1.output === 'ohayou');

  // T2: ありがとう → arigatou
  var t2 = toRomaji('\u3042\u308A\u304C\u3068\u3046');
  assert('T2: arigatou', t2.output === 'arigatou');

  // T3: すし → sushi
  var t3 = toRomaji('\u3059\u3057');
  assert('T3: sushi', t3.output === 'sushi');

  // T4: ちゃわん → chawan (digraph)
  var t4 = toRomaji('\u3061\u3083\u308F\u3093');
  assert('T4: chawan', t4.output === 'chawan');

  // T5: にっぽん → nippon (っ doubles consonant)
  var t5 = toRomaji('\u306B\u3063\u307D\u3093');
  assert('T5: nippon', t5.output === 'nippon');

  // T6: しんぶん → shinbun or shimbun
  var t6 = toRomaji('\u3057\u3093\u3076\u3093');
  assert('T6: shinbun', t6.output === 'shinbun' || t6.output === 'shimbun');

  // T7: アリガトウ → arigatou (katakana)
  var t7 = toRomaji('\u30A2\u30EA\u30AC\u30C8\u30A6');
  assert('T7: arigatou (katakana)', t7.output === 'arigatou');

  // T8: トーキョー → contains tookyo or toukyou or tokyo
  var t8 = toRomaji('\u30C8\u30FC\u30AD\u30E7\u30FC');
  assert('T8: tokyo variant', t8.output.indexOf('to') === 0 && t8.output.indexOf('ky') !== -1);

  // T9: 東京 → hasKanji + warning
  var t9 = toRomaji('\u6771\u4EAC');
  assert('T9: hasKanji', t9.hasKanji === true && t9.warning !== null);

  // T10: 東京 bracket → [東京]
  var t10 = toRomaji('\u6771\u4EAC', { passthrough: 'bracket' });
  assert('T10: bracket', t10.output === '[\u6771\u4EAC]');

  // T11: 東京 remove → ""
  var t11 = toRomaji('\u6771\u4EAC', { passthrough: 'remove' });
  assert('T11: remove', t11.output === '');

  // T12: カタカナ → かたかな
  var t12 = toHiragana('\u30AB\u30BF\u30AB\u30CA');
  assert('T12: toHiragana', t12 === '\u304B\u305F\u304B\u306A');

  // T13: ひらがな → ヒラガナ
  var t13 = toKatakana('\u3072\u3089\u304C\u306A');
  assert('T13: toKatakana', t13 === '\u30D2\u30E9\u30AC\u30CA');

  // T14: detectScript おはよう → dominant: hiragana
  var t14 = detectScript('\u304A\u306F\u3088\u3046');
  assert('T14: detectScript hiragana', t14.hasHiragana === true && t14.dominant === 'hiragana');

  // T15: empty → no error
  var t15 = toRomaji('');
  assert('T15: empty', t15.output === '' && !t15.error);

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed));
  return { passed: passed, failed: failed };
}
