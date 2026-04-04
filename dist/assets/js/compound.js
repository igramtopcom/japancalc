/**
 * JapanCalc — Compound Interest & Savings Calculator
 * Supports: lump sum, regular monthly deposits, or both
 * Compounding: monthly (most common for Japanese savings products)
 */

/**
 * Calculate compound growth
 * @param {number} principal — initial lump sum (元本)
 * @param {number} monthlyDeposit — monthly addition (積立額)
 * @param {number} annualRate — annual interest rate %
 * @param {number} years — investment period
 * @returns {{ finalAmount, totalDeposited, totalInterest, schedule, error }}
 */
export function calcCompound(principal, monthlyDeposit, annualRate, years) {
  if (principal < 0 || monthlyDeposit < 0)
    return { error: '金額は0以上を入力してください' };
  if (principal === 0 && monthlyDeposit === 0)
    return { error: '元本または毎月の積立額を入力してください' };
  if (annualRate < 0 || annualRate > 30)
    return { error: '金利を正しく入力してください（0〜30%）' };
  if (!years || years < 1 || years > 50)
    return { error: '運用期間を入力してください（1〜50年）' };

  var r      = annualRate / 100 / 12;
  var schedule = [];
  var balance = principal;
  var totalDeposited = principal;

  for (var year = 1; year <= years; year++) {
    for (var m = 0; m < 12; m++) {
      balance += monthlyDeposit;
      totalDeposited += monthlyDeposit;
      balance *= (1 + r);
    }
    schedule.push({
      year:           year,
      balance:        Math.round(balance),
      totalDeposited: Math.round(totalDeposited),
      totalInterest:  Math.round(balance - totalDeposited),
    });
  }

  return {
    finalAmount:    Math.round(balance),
    totalDeposited: Math.round(totalDeposited),
    totalInterest:  Math.round(balance - totalDeposited),
    principal:      principal,
    monthlyDeposit: monthlyDeposit,
    annualRate:     annualRate,
    years:          years,
    schedule:       schedule,
  };
}

export var NISA_PRESETS = [
  { label: 'つみたてNISA 年間上限',     labelEN: 'NISA Annual Max',    monthlyDeposit: 100000, note: '年間120万円（新NISA積立投資枠）', noteEN: '¥1.2M/yr (new NISA tsumitate)' },
  { label: '毎月3万円積立',            labelEN: '¥30K/month',         monthlyDeposit: 30000,  note: 'ビギナー向け標準プラン',       noteEN: 'Beginner standard plan' },
  { label: '毎月5万円積立',            labelEN: '¥50K/month',         monthlyDeposit: 50000,  note: 'ミドルプラン',               noteEN: 'Mid-tier plan' },
  { label: '毎月1万円積立（少額開始）', labelEN: '¥10K/month',         monthlyDeposit: 10000,  note: '少額から始めるプラン',         noteEN: 'Start small' },
];
