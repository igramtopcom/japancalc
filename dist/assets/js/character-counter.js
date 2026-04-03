/**
 * JapanCalc — Character Counter Logic
 * Source: Standard Japanese text counting conventions
 */

/**
 * Count characters including spaces
 * @param {string} text
 * @returns {number}
 */
export function countWithSpaces(text) {
  return text.length;
}

/**
 * Count characters excluding leading/trailing spaces per line
 * @param {string} text
 * @returns {number}
 */
export function countWithoutEdgeSpaces(text) {
  return text.split('\n').map(line => line.trim()).join('\n').length;
}

/**
 * Count characters excluding ALL whitespace and newlines
 * @param {string} text
 * @returns {number}
 */
export function countWithoutAllSpaces(text) {
  return text.replace(/\s/g, '').length;
}

/**
 * Count lines (including empty lines)
 * @param {string} text
 * @returns {number}
 */
export function countLines(text) {
  if (text === '') return 0;
  return text.split('\n').length;
}

/**
 * Count paragraphs (separated by blank lines)
 * @param {string} text
 * @returns {number}
 */
export function countParagraphs(text) {
  if (text.trim() === '') return 0;
  return text.trim().split(/\n\s*\n/).filter(p => p.trim() !== '').length;
}

/**
 * Count bytes in UTF-8 encoding
 * @param {string} text
 * @returns {number}
 */
export function countBytes(text) {
  return new TextEncoder().encode(text).length;
}

/**
 * Calculate 原稿用紙 (400-char manuscript paper) equivalent
 * Uses characters excluding all whitespace
 * @param {string} text
 * @returns {number} number of sheets (ceiling)
 */
export function calcManuscriptPages(text) {
  const chars = countWithoutAllSpaces(text);
  return chars === 0 ? 0 : Math.ceil(chars / 400);
}

/**
 * Estimate reading time in minutes (Japanese standard: 500 chars/min)
 * @param {string} text
 * @returns {{ minutes: number, seconds: number }}
 */
export function calcReadingTime(text) {
  const chars = countWithoutAllSpaces(text);
  const totalSeconds = Math.ceil((chars / 500) * 60);
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60
  };
}

/**
 * Analyze character types
 * @param {string} text
 * @returns {{ kanji, hiragana, katakana, latin, numbers, symbols, spaces }}
 */
export function analyzeCharTypes(text) {
  const noNewlines = text.replace(/\n/g, '');
  return {
    kanji:    (noNewlines.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) || []).length,
    hiragana: (noNewlines.match(/[\u3041-\u3096]/g) || []).length,
    katakana: (noNewlines.match(/[\u30A1-\u30F6]/g) || []).length,
    latin:    (noNewlines.match(/[a-zA-Z]/g) || []).length,
    numbers:  (noNewlines.match(/[0-9\uFF10-\uFF19]/g) || []).length,
    symbols:  (noNewlines.match(/[^\u4E00-\u9FFF\u3400-\u4DBF\u3041-\u3096\u30A1-\u30F6a-zA-Z0-9\uFF10-\uFF19\s]/g) || []).length,
    spaces:   (noNewlines.match(/\s/g) || []).length,
  };
}

/**
 * Calculate all stats at once
 * @param {string} text
 * @param {number} targetCount — 0 means no target
 * @returns {object} all stats
 */
export function calcAllStats(text, targetCount = 0) {
  const withSpaces    = countWithSpaces(text);
  const withoutEdge   = countWithoutEdgeSpaces(text);
  const withoutAll    = countWithoutAllSpaces(text);
  const lines         = countLines(text);
  const paragraphs    = countParagraphs(text);
  const bytes         = countBytes(text);
  const manuscript    = calcManuscriptPages(text);
  const readingTime   = calcReadingTime(text);
  const charTypes     = analyzeCharTypes(text);

  const remaining = targetCount > 0 ? targetCount - withSpaces : null;

  return {
    withSpaces,
    withoutEdge,
    withoutAll,
    lines,
    paragraphs,
    bytes,
    manuscript,
    readingTime,
    charTypes,
    remaining,
    overLimit: targetCount > 0 && withSpaces > targetCount,
  };
}
