/**
 * JapanCalc — Japan Area Unit Converter
 *
 * Conversion constants (authoritative):
 *   1 坪 (tsubo) = 400/121 m² ≈ 3.305785... m²
 *   畳 (tatami) size varies by regional type:
 *     江戸間 (Edo/Kanto):  0.88m × 1.76m = 1.548 m²
 *     京間 (Kyo/Kansai):  0.955m × 1.91m = 1.8240 m²
 *     中京間 (Chukyo):    0.91m × 1.82m  = 1.6562 m²
 *     団地間 (Danchi):    0.85m × 1.70m  = 1.4450 m²
 *   1 坪 = 2 畳 (江戸間 standard)
 *   1 ft² = 0.09290304 m²
 *
 * Source: 国土交通省, 不動産公正取引協議会
 */

export const TATAMI_TYPES = {
  edo:    { label: '江戸間（関東）', sqm: 1.5480 },
  kyo:    { label: '京間（関西）',   sqm: 1.8240 },
  chukyo: { label: '中京間',         sqm: 1.6562 },
  danchi: { label: '団地間',         sqm: 1.4450 },
};

const TSUBO_TO_SQM = 400 / 121; // ≈ 3.305785
const SQM_TO_TSUBO = 121 / 400;
const SQFT_TO_SQM  = 0.09290304;
const SQM_TO_SQFT  = 1 / 0.09290304;

/**
 * Convert any area value to all units simultaneously
 * @param {number} value — input value
 * @param {'sqm'|'tsubo'|'tatami'|'sqft'} fromUnit
 * @param {string} tatamisType — key of TATAMI_TYPES
 * @returns {{ sqm, tsubo, tatami, sqft, tatamisLabel, error }}
 */
export function convertArea(value, fromUnit, tatamisType = 'edo') {
  if (isNaN(value) || value < 0)
    return { error: '正の数値を入力してください' };

  const tatami = TATAMI_TYPES[tatamisType] || TATAMI_TYPES.edo;
  let sqm;

  switch (fromUnit) {
    case 'sqm':    sqm = value; break;
    case 'tsubo':  sqm = value * TSUBO_TO_SQM; break;
    case 'tatami': sqm = value * tatami.sqm; break;
    case 'sqft':   sqm = value * SQFT_TO_SQM; break;
    default: return { error: '無効な単位です' };
  }

  return {
    sqm:          round(sqm, 2),
    tsubo:        round(sqm * SQM_TO_TSUBO, 2),
    tatami:       round(sqm / tatami.sqm, 2),
    sqft:         round(sqm * SQM_TO_SQFT, 2),
    tatamisLabel: tatami.label,
  };
}

function round(val, decimals) {
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}
