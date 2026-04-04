/**
 * JapanCalc — Mortgage (住宅ローン) Calculator
 *
 * Formula: Equal monthly payment (元利均等返済) — most common in Japan
 * P = principal, r = monthly rate, n = total months
 * Monthly payment = P × r × (1+r)^n / ((1+r)^n - 1)
 *
 * Last updated: April 2026
 */

/**
 * Calculate mortgage with equal monthly payments (元利均等返済)
 * @param {number} principal — loan amount in JPY
 * @param {number} annualRate — annual interest rate in % (e.g. 1.5)
 * @param {number} years — loan term in years
 * @returns {{ monthlyPayment, totalPayment, totalInterest, schedule, error }}
 */
export function calcMortgageEqual(principal, annualRate, years) {
  if (!principal || principal <= 0)      return { error: '借入金額を入力してください' };
  if (annualRate < 0 || annualRate > 20) return { error: '金利を正しく入力してください（0〜20%）' };
  if (!years || years < 1 || years > 50) return { error: '返済期間を入力してください（1〜50年）' };

  var months = years * 12;

  // Zero interest edge case
  if (annualRate === 0) {
    var monthly0 = Math.ceil(principal / months);
    return {
      monthlyPayment: monthly0,
      totalPayment:   monthly0 * months,
      totalInterest:  0,
      principal:      principal,
      annualRate:     annualRate,
      years:          years,
      months:         months,
      type:           'equal',
      schedule:       [],
    };
  }

  var r       = annualRate / 100 / 12;
  var factor  = Math.pow(1 + r, months);
  var monthly = Math.ceil(principal * r * factor / (factor - 1));
  var total   = monthly * months;
  var interest = total - principal;

  // Build repayment schedule (yearly summary)
  var schedule = [];
  var balance = principal;
  for (var year = 1; year <= years; year++) {
    var yearlyPrincipal = 0;
    var yearlyInterest  = 0;
    for (var m = 0; m < 12; m++) {
      var intPayment  = Math.floor(balance * r);
      var prinPayment = monthly - intPayment;
      yearlyInterest  += intPayment;
      yearlyPrincipal += prinPayment;
      balance         = Math.max(0, balance - prinPayment);
    }
    schedule.push({
      year:             year,
      monthlyPayment:   monthly,
      yearlyPrincipal:  Math.round(yearlyPrincipal),
      yearlyInterest:   Math.round(yearlyInterest),
      remainingBalance: Math.round(balance),
    });
  }

  return {
    monthlyPayment:  monthly,
    totalPayment:    total,
    totalInterest:   interest,
    principal:       principal,
    annualRate:      annualRate,
    years:           years,
    months:          months,
    type:            'equal',
    schedule:        schedule,
  };
}

/**
 * Pre-set interest rates for common Japan banks (update quarterly)
 * Last updated: April 2026
 */
export var PRESET_RATES = [
  { label: '変動金利（市場最低水準）', labelEN: 'Variable (lowest)',  rate: 0.3 },
  { label: '変動金利（一般的）',       labelEN: 'Variable (typical)', rate: 0.5 },
  { label: '固定10年',                labelEN: 'Fixed 10yr',         rate: 1.5 },
  { label: '固定20年',                labelEN: 'Fixed 20yr',         rate: 1.8 },
  { label: '固定35年（フラット35）',   labelEN: 'Flat 35 (35yr)',     rate: 1.96 },
];
