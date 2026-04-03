/**
 * JapanCalc — Kazoe-doshi (数え年) Calculator
 *
 * 数え年 rule:
 *   - Born = age 1 (not 0)
 *   - Age increases every January 1 (not on birthday)
 *   - Formula: 数え年 = current year - birth year + 1
 *
 * 満年齢 rule:
 *   - Born = age 0
 *   - Age increases on birthday
 *   - Formula: current year - birth year (subtract 1 if before birthday)
 *
 * Source: Japanese Civil Code (民法) — 年齢計算ニ関スル法律 (明治35年)
 */

/**
 * Calculate both 数え年 and 満年齢 from date of birth
 * @param {number} birthYear
 * @param {number} birthMonth — 1-12
 * @param {number} birthDay — 1-31
 * @param {Date} [referenceDate] — defaults to today
 * @returns {{ kazoe, mannen, birthYear, currentYear, birthdayPassed, error }}
 */
export function calcKazoe(birthYear, birthMonth, birthDay, referenceDate = new Date()) {
  if (!birthYear || !birthMonth || !birthDay)
    return { error: '生年月日を入力してください' };

  const today     = referenceDate;
  const birthDate = new Date(birthYear, birthMonth - 1, birthDay);

  if (isNaN(birthDate.getTime()))
    return { error: '無効な日付です' };

  if (birthDate > today)
    return { error: '生年月日は今日以前の日付を入力してください' };

  const currentYear = today.getFullYear();

  // 数え年: birth year = 1, +1 each Jan 1
  const kazoe = currentYear - birthYear + 1;

  // 満年齢: age 0 at birth, +1 on each birthday
  const birthdayThisYear = new Date(currentYear, birthMonth - 1, birthDay);
  const birthdayPassed   = today >= birthdayThisYear;
  const mannen           = birthdayPassed
    ? currentYear - birthYear
    : currentYear - birthYear - 1;

  // Difference explanation
  const diff = kazoe - mannen; // always 1 or 2

  return {
    kazoe,
    mannen,
    birthYear,
    birthMonth,
    birthDay,
    currentYear,
    birthdayPassed,
    diff,
  };
}

/**
 * Get the era name for a given birth year
 * @param {number} year
 * @returns {{ eraName, eraYear, eraKanji }}
 */
export function getEraForYear(year) {
  if (year >= 2019) return { eraKanji: '令和', eraName: 'Reiwa', eraYear: year - 2018 };
  if (year >= 1989) return { eraKanji: '平成', eraName: 'Heisei', eraYear: year - 1988 };
  if (year >= 1926) return { eraKanji: '昭和', eraName: 'Showa', eraYear: year - 1925 };
  if (year >= 1912) return { eraKanji: '大正', eraName: 'Taisho', eraYear: year - 1911 };
  if (year >= 1868) return { eraKanji: '明治', eraName: 'Meiji', eraYear: year - 1867 };
  return { eraKanji: '', eraName: '', eraYear: 0 };
}

/**
 * Build a quick reference table: birth years → kazoe/mannen for current year
 * @param {number} currentYear
 * @param {number} rows — number of rows to generate
 * @returns {Array<{ birthYear, kazoe, mannen, era }>}
 */
export function buildReferenceTable(currentYear, rows = 20) {
  const result = [];
  for (let i = 0; i < rows; i++) {
    const birthYear = currentYear - i;
    const kazoe     = currentYear - birthYear + 1;
    const era       = getEraForYear(birthYear);
    result.push({
      birthYear,
      eraLabel: era.eraKanji ? `${era.eraKanji}${era.eraYear}年` : `${birthYear}年`,
      kazoe,
      mannen: i,
    });
  }
  return result;
}
