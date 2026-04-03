/**
 * JapanCalc — Furusato Nozei (ふるさと納税) Deduction Calculator
 *
 * Formula source: 総務省 (Ministry of Internal Affairs and Communications)
 * https://www.soumu.go.jp/main_sosiki/jichi_zeisei/czaisei/czaisei_seido/furusato/mechanism/deduction.html
 *
 * Key concept:
 * - Donor contributes to municipality → receives local specialty goods
 * - Contribution deducted from income tax + residence tax
 * - Donor bears only 2,000 JPY net cost (regardless of donation amount)
 * - Deduction limit = max donation that still keeps net cost at 2,000 JPY
 *
 * Formula (simplified for general case):
 *   1. Employment income deduction (給与所得控除) from gross income
 *   2. Social insurance deduction (~15% of gross, simplified)
 *   3. Taxable income = gross - EID - social insurance - basic deduction (480,000)
 *   4. Income tax rate from bracket
 *   5. Deduction limit =
 *      (residence tax income quota × 20%) / (1 - income tax rate × 1.021 - 0.10) + 2,000
 *
 * Note: This is a simplified estimate. Actual limit varies based on
 * other deductions (medical expenses, mortgage, etc.)
 *
 * Data: FY2025 tax tables. Verify annually.
 */

// Employment income deduction table (給与所得控除) — FY2025
const EID_TABLE = [
  { max: 1_625_000,  formula: () => 550_000 },
  { max: 1_800_000,  formula: (i) => i * 0.4 - 100_000 },
  { max: 3_600_000,  formula: (i) => i * 0.3 + 80_000 },
  { max: 6_600_000,  formula: (i) => i * 0.2 + 440_000 },
  { max: 8_500_000,  formula: (i) => i * 0.1 + 1_100_000 },
  { max: Infinity,   formula: () => 1_950_000 },
];

// Income tax brackets (所得税率) — FY2025
const TAX_BRACKETS = [
  { max: 1_950_000,  rate: 0.05,  deduct: 0 },
  { max: 3_300_000,  rate: 0.10,  deduct: 97_500 },
  { max: 6_950_000,  rate: 0.20,  deduct: 427_500 },
  { max: 9_000_000,  rate: 0.23,  deduct: 636_000 },
  { max: 18_000_000, rate: 0.33,  deduct: 1_536_000 },
  { max: 40_000_000, rate: 0.40,  deduct: 2_796_000 },
  { max: Infinity,   rate: 0.45,  deduct: 4_796_000 },
];

const BASIC_DEDUCTION    = 480_000;  // 基礎控除 FY2025
const RECONSTRUCTION_TAX = 1.021;   // 復興特別所得税

function calcEID(grossIncome) {
  for (const row of EID_TABLE) {
    if (grossIncome <= row.max) return Math.round(row.formula(grossIncome));
  }
  return 1_950_000;
}

function calcIncomeTaxRate(taxableIncome) {
  for (const row of TAX_BRACKETS) {
    if (taxableIncome <= row.max) return row.rate;
  }
  return 0.45;
}

function calcSocialInsurance(grossIncome) {
  // Simplified: ~14.8% of gross (avg employee share — health + pension + employment)
  // Actual varies by municipality and salary structure
  return Math.round(grossIncome * 0.148);
}

/**
 * Calculate furusato nozei deduction limit
 *
 * @param {number} grossIncome — 年収 (annual gross salary, JPY)
 * @param {boolean} hasSpouseDeduction — 配偶者控除あり
 * @param {number} dependents — 扶養家族数 (16歳以上)
 * @returns {{ limit, incomeTaxRefund, residenceTaxDeduction, netCost, taxableIncome, effectiveRate, error }}
 */
export function calcFurusatoLimit(
  grossIncome,
  hasSpouseDeduction = false,
  dependents         = 0,
) {
  if (!grossIncome || grossIncome <= 0)
    return { error: '年収を入力してください' };
  if (grossIncome < 1_000_000)
    return { error: '年収が低すぎます。ふるさと納税の控除を受けるには一定の所得が必要です。', limit: 0 };

  // 1. Employment income deduction
  const eid = calcEID(grossIncome);
  const employmentIncome = grossIncome - eid;

  // 2. Social insurance (simplified)
  const socialInsurance = calcSocialInsurance(grossIncome);

  // 3. Other deductions
  const spouseDeduction    = hasSpouseDeduction ? 380_000 : 0;
  const dependentDeduction = dependents * 380_000;

  // 4. Taxable income
  const taxableIncome = Math.max(0,
    employmentIncome - socialInsurance - BASIC_DEDUCTION - spouseDeduction - dependentDeduction
  );

  // 5. Income tax rate
  const incomeTaxRate = calcIncomeTaxRate(taxableIncome);

  // 6. Residence tax income quota (住民税所得割額) — flat 10% of taxable income
  const residenceTaxBase = taxableIncome * 0.10;

  // 7. Furusato nozei deduction limit formula
  // Source: 総務省
  const denominator = 1 - incomeTaxRate * RECONSTRUCTION_TAX - 0.10;
  if (denominator <= 0) return { error: '計算できません（税率が高すぎます）', limit: 0 };

  const limit = Math.floor(
    (residenceTaxBase * 0.20) / denominator + 2_000
  );

  // 8. Breakdown
  const incomeTaxRefund = Math.floor((limit - 2_000) * incomeTaxRate * RECONSTRUCTION_TAX);
  const residenceTaxDeduction = (limit - 2_000) - incomeTaxRefund;

  return {
    limit:                  Math.max(0, limit),
    incomeTaxRefund:        Math.max(0, incomeTaxRefund),
    residenceTaxDeduction:  Math.max(0, residenceTaxDeduction),
    netCost:                2_000,
    taxableIncome:          Math.round(taxableIncome),
    incomeTaxRate:          Math.round(incomeTaxRate * 100),
    grossIncome,
    eid:                    Math.round(eid),
    socialInsurance:        Math.round(socialInsurance),
  };
}

/**
 * Format JPY
 */
export function formatJPY(amount, suffix = '円') {
  return Math.round(amount).toLocaleString('ja-JP') + suffix;
}
