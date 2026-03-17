/**
 * Furigana Generator — JS Logic Module
 * japancalc.com
 *
 * Uses kuromoji.js (client-side tokenizer) to add furigana readings
 * to Japanese kanji text. Dictionary loaded from CDN (~3MB, cached).
 *
 * Exports: initKuromoji, generateFurigana, isReady, getLoadingStatus
 */

const KUROMOJI_CDN = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2';
const DICT_PATH = KUROMOJI_CDN + '/dict';
const SCRIPT_SRC = KUROMOJI_CDN + '/build/kuromoji.js';

let _tokenizer = null;
let _status = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'

// ============ HELPERS ============

/**
 * Convert katakana string to hiragana.
 * Katakana U+30A1–U+30F6 → Hiragana U+3041–U+3096 (offset 0x60).
 * @param {string} str - Katakana string
 * @returns {string} Hiragana string
 */
function katakanaToHiragana(str) {
  return str.replace(/[\u30A1-\u30F6]/g, ch =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * Determine if a token needs furigana annotation.
 * @param {Object} token - kuromoji token
 * @returns {boolean}
 */
function needsFurigana(token) {
  const hasKanji = /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(token.surface_form);
  return hasKanji && token.reading && token.reading !== token.surface_form;
}

/**
 * Load kuromoji script from CDN if not already loaded.
 * @returns {Promise<void>}
 */
function loadKuromojiScript() {
  return new Promise((resolve, reject) => {
    if (window.kuromoji) { resolve(); return; }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load kuromoji from CDN'));
    document.head.appendChild(script);
  });
}

// ============ EXPORTS ============

/**
 * Initialize kuromoji tokenizer.
 * Loads dictionary from CDN (~3MB, cached after first load).
 * Safe to call multiple times — resolves immediately if already initialized.
 * @returns {Promise<void>} Resolves when tokenizer is ready.
 */
export async function initKuromoji() {
  if (_tokenizer) return;
  if (_status === 'loading') {
    // Wait for in-progress init
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (_status === 'ready') { clearInterval(check); resolve(); }
        if (_status === 'error') { clearInterval(check); reject(new Error('Tokenizer init failed')); }
      }, 100);
    });
  }
  _status = 'loading';
  try {
    await loadKuromojiScript();
    await new Promise((resolve, reject) => {
      window.kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
        if (err) { reject(err); return; }
        _tokenizer = tokenizer;
        resolve();
      });
    });
    _status = 'ready';
  } catch (err) {
    _status = 'error';
    throw err;
  }
}

/**
 * Check if the tokenizer is initialized and ready.
 * @returns {boolean}
 */
export function isReady() {
  return _tokenizer !== null;
}

/**
 * Get current loading status string.
 * @returns {'idle'|'loading'|'ready'|'error'}
 */
export function getLoadingStatus() {
  return _status;
}

/**
 * Tokenize Japanese text and generate furigana output.
 * @param {string} text - Japanese text input
 * @param {Object} [options]
 * @param {'html'|'plain'|'json'} [options.format='html'] - Output format
 * @param {'ruby'|'bracket'} [options.style='ruby'] - Furigana style (html format only)
 * @param {boolean} [options.onlyKanji=true] - Only add furigana to kanji tokens
 * @param {string} [options.separator=' '] - Token separator (plain format only)
 * @returns {Object} Result object with input, output, tokens, hasKanji, kanjiCount, tokenCount
 */
export function generateFurigana(text, options = {}) {
  if (typeof text !== 'string') {
    return { error: 'Input must be a string' };
  }
  if (!_tokenizer) {
    return { error: 'Tokenizer not initialized. Call initKuromoji() first.' };
  }
  if (text === '') {
    return { input: '', output: '', tokens: [], hasKanji: false, kanjiCount: 0, tokenCount: 0 };
  }

  const format = options.format || 'html';
  const style = options.style || 'ruby';
  const onlyKanji = options.onlyKanji !== undefined ? options.onlyKanji : true;
  const separator = options.separator !== undefined ? options.separator : ' ';

  const tokens = _tokenizer.tokenize(text);
  const kanjiRegex = /[\u4E00-\u9FFF\u3400-\u4DBF]/g;
  const kanjiMatches = text.match(kanjiRegex);
  const kanjiCount = kanjiMatches ? kanjiMatches.length : 0;
  const hasKanji = kanjiCount > 0;

  const base = { input: text, tokens, hasKanji, kanjiCount, tokenCount: tokens.length };

  if (format === 'json') {
    base.output = tokens.map(t => {
      const hasFurigana = needsFurigana(t);
      return {
        surface: t.surface_form,
        reading: t.reading ? katakanaToHiragana(t.reading) : t.surface_form,
        hasFurigana,
        pos: t.pos || ''
      };
    });
    return base;
  }

  if (format === 'plain') {
    base.output = tokens.map(t => t.surface_form).join(separator);
    return base;
  }

  // Default: html
  const parts = tokens.map(t => {
    if (onlyKanji && needsFurigana(t)) {
      const reading = katakanaToHiragana(t.reading);
      if (style === 'bracket') {
        return t.surface_form + '[' + reading + ']';
      }
      return '<ruby>' + t.surface_form + '<rt>' + reading + '</rt></ruby>';
    }
    return t.surface_form;
  });

  base.output = parts.join('');
  return base;
}


// ============ UNIT TESTS ============
// IMPORTANT: These tests require browser context (CDN access for kuromoji dict)
// Run in browser console: import('...furigana.js').then(m => m.runTests())

export async function runTests() {
  const results = [];
  let pass = 0;
  let fail = 0;

  function assert(name, condition, actual) {
    if (condition) {
      pass++;
      results.push({ name, status: 'PASS' });
      console.log(`  PASS: ${name}`);
    } else {
      fail++;
      results.push({ name, status: 'FAIL', actual });
      console.error(`  FAIL: ${name} | actual: ${JSON.stringify(actual)}`);
    }
  }

  console.log('=== Furigana Module Tests ===');

  // T1: initKuromoji resolves, isReady = true
  try {
    await initKuromoji();
    assert('T1: initKuromoji resolves, isReady=true', isReady() === true, isReady());
  } catch (e) {
    assert('T1: initKuromoji resolves', false, e.message);
  }

  // T2: 東京 → ruby + とうきょう
  const r2 = generateFurigana('東京');
  assert('T2: 東京 → ruby + とうきょう',
    r2.output && r2.output.includes('<ruby>') && r2.output.includes('とうきょう'),
    r2.output);

  // T3: 日本語 → ruby tags
  const r3 = generateFurigana('日本語');
  assert('T3: 日本語 → ruby tags',
    r3.output && r3.output.includes('<ruby>') && r3.output.includes('<rt>'),
    r3.output);

  // T4: ひらがな → no ruby tags
  const r4 = generateFurigana('ひらがな');
  assert('T4: ひらがな → no ruby tags',
    r4.output && !r4.output.includes('<ruby>'),
    r4.output);

  // T5: bracket style
  const r5 = generateFurigana('東京', { style: 'bracket' });
  assert('T5: bracket style 東京[とうきょう]',
    r5.output && r5.output.includes('東京[とうきょう]'),
    r5.output);

  // T6: json format
  const r6 = generateFurigana('東京', { format: 'json' });
  assert('T6: json format has hasFurigana',
    Array.isArray(r6.output) && r6.output.some(t => t.hasFurigana === true),
    r6.output);

  // T7: empty input
  const r7 = generateFurigana('');
  assert('T7: empty input → no error',
    r7.output === '' && r7.hasKanji === false,
    r7);

  // T8: mixed English + kanji
  const r8 = generateFurigana('Hello 東京');
  assert('T8: Hello 東京 → Hello passed through, 東京 gets furigana',
    r8.output && r8.output.includes('Hello') && r8.output.includes('<ruby>'),
    r8.output);

  // T9: katakanaToHiragana
  const r9 = katakanaToHiragana('トウキョウ');
  assert('T9: katakanaToHiragana(トウキョウ) → とうきょう',
    r9 === 'とうきょう',
    r9);

  // T10: second initKuromoji call resolves immediately (cached)
  const start = performance.now();
  await initKuromoji();
  const elapsed = performance.now() - start;
  assert('T10: second initKuromoji resolves immediately (<50ms)',
    elapsed < 50,
    elapsed + 'ms');

  console.log(`\n=== Results: ${pass}/${pass + fail} PASS ===`);
  return { pass, fail, total: pass + fail, results };
}
