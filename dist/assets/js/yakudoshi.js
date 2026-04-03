/**
 * JapanCalc — Yakudoshi Calculator
 *
 * 厄年 data based on traditional Shinto practice (神社本庁 standard).
 * Ages are in 数え年 (traditional Japanese counting age).
 *
 * Male yakudoshi (男性の厄年):
 *   前厄: 24, 41, 60
 *   本厄: 25, 42, 61  (大厄 at 42)
 *   後厄: 26, 43, 62
 *
 * Female yakudoshi (女性の厄年):
 *   前厄: 18, 32, 36, 60
 *   本厄: 19, 33, 37, 61  (大厄 at 33 and 37)
 *   後厄: 20, 34, 38, 62
 *
 * Source: 神社本庁 (Association of Shinto Shrines)
 * DISCLAIMER: Ages may vary by region/shrine. Verify locally.
 */

export const YAKUDOSHI = {
  male: [
    { maeyaku: 24, honyaku: 25, atoyaku: 26, isDaikaku: false },
    { maeyaku: 41, honyaku: 42, atoyaku: 43, isDaikaku: true  },
    { maeyaku: 60, honyaku: 61, atoyaku: 62, isDaikaku: false },
  ],
  female: [
    { maeyaku: 18, honyaku: 19, atoyaku: 20, isDaikaku: false },
    { maeyaku: 32, honyaku: 33, atoyaku: 34, isDaikaku: true  },
    { maeyaku: 36, honyaku: 37, atoyaku: 38, isDaikaku: true  },
    { maeyaku: 60, honyaku: 61, atoyaku: 62, isDaikaku: false },
  ],
};

function kazoe(birthYear, currentYear) {
  return currentYear - birthYear + 1;
}

function yearOfKazoe(birthYear, kazoeAge) {
  return birthYear + kazoeAge - 1;
}

/**
 * Calculate all yakudoshi years for a given birth year and gender
 */
export function calcYakudoshi(birthYear, gender, currentYear = new Date().getFullYear()) {
  if (!birthYear || birthYear < 1900 || birthYear > currentYear)
    return { error: '生年（西暦）を正しく入力してください' };

  if (!['male', 'female'].includes(gender))
    return { error: '性別を選択してください' };

  const yakuList = YAKUDOSHI[gender];
  const currentKazoe = kazoe(birthYear, currentYear);

  const results = yakuList.map(yaku => {
    const maeyakuYear = yearOfKazoe(birthYear, yaku.maeyaku);
    const honyakuYear = yearOfKazoe(birthYear, yaku.honyaku);
    const atoyakuYear = yearOfKazoe(birthYear, yaku.atoyaku);

    return {
      maeyakuAge:  yaku.maeyaku,
      honyakuAge:  yaku.honyaku,
      atoyakuAge:  yaku.atoyaku,
      maeyakuYear,
      honyakuYear,
      atoyakuYear,
      isDaikaku: yaku.isDaikaku,
      isPast:    atoyakuYear < currentYear,
      isCurrent: currentKazoe >= yaku.maeyaku && currentKazoe <= yaku.atoyaku,
      isFuture:  maeyakuYear > currentYear,
    };
  });

  let currentStatus = null;
  for (const r of results) {
    if (currentKazoe === r.maeyakuAge) currentStatus = { type: '前厄', typeEN: 'Mae-yaku (pre)', year: currentYear, isDaikaku: false };
    if (currentKazoe === r.honyakuAge) currentStatus = { type: '本厄', typeEN: 'Hon-yaku (main)', year: currentYear, isDaikaku: r.isDaikaku };
    if (currentKazoe === r.atoyakuAge) currentStatus = { type: '後厄', typeEN: 'Ato-yaku (post)', year: currentYear, isDaikaku: false };
  }

  return {
    results,
    birthYear,
    gender,
    currentKazoe,
    currentYear,
    isCurrentlyYakudoshi: currentStatus !== null,
    currentStatus,
  };
}

export function getEraLabel(year) {
  if (year >= 2019) return `令和${year - 2018}年（${year}年）`;
  if (year >= 1989) return `平成${year - 1988}年（${year}年）`;
  if (year >= 1926) return `昭和${year - 1925}年（${year}年）`;
  return `${year}年`;
}

export function getEraLabelEN(year) {
  if (year >= 2019) return `Reiwa ${year - 2018} (${year})`;
  if (year >= 1989) return `Heisei ${year - 1988} (${year})`;
  if (year >= 1926) return `Showa ${year - 1925} (${year})`;
  return String(year);
}
