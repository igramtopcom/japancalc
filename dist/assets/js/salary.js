/**
 * japancalc.com — Salary Calculator Logic Module
 * Spec: PRD v1.0 Section 2.2 (Tool 6 — Japan Salary Calculator)
 *       Tech Spec v1.0 Section 3.3 (salary.js, FY2025 Rate Tables)
 *
 * Exports: calculateTakeHome, formatBreakdown, getCommonSalaryExamples
 */

// ============ FY2025 RATES — sourced from src/_data/tax-rates.json ============

const RATES = {
  socialInsurance: {
    healthInsuranceRate: 0.0500,
    pensionRate:         0.0915,
    employmentRate:      0.0060,
    pensionBaseCap:      650000
  },
  incomeTax: {
    basicDeduction:      480000,
    reconstructionSurtax: 0.021,
    brackets: [
      { min: 0,        max: 1950000,  rate: 0.05, deduction: 0       },
      { min: 1950000,  max: 3300000,  rate: 0.10, deduction: 97500   },
      { min: 3300000,  max: 6950000,  rate: 0.20, deduction: 427500  },
      { min: 6950000,  max: 9000000,  rate: 0.23, deduction: 636000  },
      { min: 9000000,  max: 18000000, rate: 0.33, deduction: 1536000 },
      { min: 18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
      { min: 40000000, max: null,     rate: 0.45, deduction: 4796000 }
    ]
  },
  residentTax: {
    rate:      0.10,
    perCapita: 5000
  },
  employmentIncomeDeduction: [
    { incomeMax: 1625000,  deduction: 550000,   formula: null },
    { incomeMax: 1800000,  deduction: null, formula: 'income * 0.4 - 100000' },
    { incomeMax: 3600000,  deduction: null, formula: 'income * 0.3 + 80000'  },
    { incomeMax: 6600000,  deduction: null, formula: 'income * 0.2 + 440000' },
    { incomeMax: 8500000,  deduction: null, formula: 'income * 0.1 + 1100000'},
    { incomeMax: null,     deduction: 1950000,  formula: null }
  ]
};

const EXAMPLE_SALARIES = [200000, 250000, 300000, 350000, 400000, 500000, 600000, 800000];

// ============ HELPERS ============

/**
 * Calculate the employment income deduction (給与所得控除) based on annual income.
 * @param {number} annualIncome — annual gross income in JPY
 * @returns {number} deduction amount
 */
function calcEmploymentIncomeDeduction(annualIncome) {
  var tiers = RATES.employmentIncomeDeduction;
  for (var i = 0; i < tiers.length; i++) {
    var tier = tiers[i];
    if (tier.incomeMax === null || annualIncome <= tier.incomeMax) {
      if (tier.deduction !== null) {
        return tier.deduction;
      }
      // Evaluate formula
      var income = annualIncome;
      if (tier.formula === 'income * 0.4 - 100000') return Math.round(income * 0.4 - 100000);
      if (tier.formula === 'income * 0.3 + 80000')  return Math.round(income * 0.3 + 80000);
      if (tier.formula === 'income * 0.2 + 440000') return Math.round(income * 0.2 + 440000);
      if (tier.formula === 'income * 0.1 + 1100000') return Math.round(income * 0.1 + 1100000);
    }
  }
  return 1950000; // cap
}

/**
 * Find the correct income tax bracket for a given taxable income.
 * @param {number} taxableIncome — taxable income in JPY
 * @returns {{ rate: number, deduction: number }}
 */
function findBracket(taxableIncome) {
  var brackets = RATES.incomeTax.brackets;
  for (var i = 0; i < brackets.length; i++) {
    var b = brackets[i];
    if (b.max === null || taxableIncome <= b.max) {
      return { rate: b.rate, deduction: b.deduction };
    }
  }
  // Fallback to highest bracket
  var last = brackets[brackets.length - 1];
  return { rate: last.rate, deduction: last.deduction };
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Core salary calculation — compute monthly take-home pay from gross monthly salary.
 * @param {number} grossMonthly — gross monthly salary in JPY
 * @param {Object} [options] — calculation options
 * @param {number} [options.dependents=0] — number of dependents (扶養家族)
 * @param {number} [options.bonus=0] — annual bonus amount in JPY
 * @param {string} [options.prefecture='tokyo'] — prefecture (reserved for future use)
 * @returns {Object} Detailed salary breakdown or error object
 */
export function calculateTakeHome(grossMonthly, options) {
  // Validation
  if (typeof grossMonthly !== 'number' || isNaN(grossMonthly)) {
    return { error: 'Salary must be a number' };
  }
  if (grossMonthly < 0) {
    return { error: 'Salary must be positive' };
  }
  if (grossMonthly > 10000000) {
    return { error: 'Monthly salary exceeds maximum supported value (\u00A510,000,000)' };
  }
  if (grossMonthly === 0) {
    return {
      gross: 0, pension: 0, health: 0, employment: 0, socialInsurance: 0,
      incomeTax: 0, residentTax: 0, totalDeductions: 0, takeHome: 0,
      effectiveRate: '0.0%',
      annual: { gross: 0, taxableIncome: 0, incomeTax: 0, residentTax: 0, socialInsurance: 0 },
      note: 'Resident tax is estimated based on current year income. Actual resident tax is based on prior year income and calculated by your municipality.'
    };
  }

  var opts = options || {};
  var bonus = opts.bonus || 0;

  // 1. Annual gross
  var annualGross = grossMonthly * 12 + bonus;

  // 2. Employment income deduction
  var eid = calcEmploymentIncomeDeduction(annualGross);

  // 3. Social insurance deductions (monthly)
  var si = RATES.socialInsurance;
  var pension    = Math.round(Math.min(grossMonthly, si.pensionBaseCap) * si.pensionRate);
  var health     = Math.round(grossMonthly * si.healthInsuranceRate);
  var employment = Math.round(grossMonthly * si.employmentRate);
  var totalSIMonthly = pension + health + employment;

  // 4. Taxable income
  var annualAfterEID = annualGross - eid;
  var annualSI = totalSIMonthly * 12;
  var taxableIncome = Math.max(0, annualAfterEID - annualSI - RATES.incomeTax.basicDeduction);

  // 5. Income tax (annual)
  var bracket = findBracket(taxableIncome);
  var baseTax = Math.floor(taxableIncome * bracket.rate - bracket.deduction);
  baseTax = Math.max(0, baseTax);
  var reconstruction = Math.floor(baseTax * RATES.incomeTax.reconstructionSurtax);
  var annualIncomeTax = baseTax + reconstruction;
  var monthlyIncomeTax = Math.round(annualIncomeTax / 12);

  // 6. Resident tax (approximate)
  var annualResidentTax = Math.round(taxableIncome * RATES.residentTax.rate) + RATES.residentTax.perCapita;
  var monthlyResidentTax = Math.round(annualResidentTax / 12);

  // 7. Net take-home
  var totalDeductions = totalSIMonthly + monthlyIncomeTax + monthlyResidentTax;
  var takeHome = grossMonthly - totalDeductions;

  var effectiveRate = grossMonthly > 0
    ? ((totalDeductions / grossMonthly) * 100).toFixed(1) + '%'
    : '0.0%';

  return {
    gross:           grossMonthly,
    pension:         pension,
    health:          health,
    employment:      employment,
    socialInsurance: totalSIMonthly,
    incomeTax:       monthlyIncomeTax,
    residentTax:     monthlyResidentTax,
    totalDeductions: totalDeductions,
    takeHome:        takeHome,
    effectiveRate:   effectiveRate,
    annual: {
      gross:          annualGross,
      taxableIncome:  taxableIncome,
      incomeTax:      annualIncomeTax,
      residentTax:    annualResidentTax,
      socialInsurance: annualSI
    },
    note: 'Resident tax is estimated based on current year income. Actual resident tax is based on prior year income and calculated by your municipality.'
  };
}

/**
 * Format a salary breakdown result as a human-readable string (for Copy button).
 * @param {Object} result — result from calculateTakeHome()
 * @returns {string} formatted multi-line breakdown
 */
export function formatBreakdown(result) {
  if (!result || result.error) return '';

  function fmt(n) {
    return '\u00A5' + n.toLocaleString('en-US');
  }

  return 'Gross: ' + fmt(result.gross) + '\n' +
    ' \u2014 Pension: ' + fmt(result.pension) + '\n' +
    ' \u2014 Health Insurance: ' + fmt(result.health) + '\n' +
    ' \u2014 Employment Insurance: ' + fmt(result.employment) + '\n' +
    ' \u2014 Income Tax: ' + fmt(result.incomeTax) + '\n' +
    ' \u2014 Resident Tax: ' + fmt(result.residentTax) + '\n' +
    ' \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n' +
    ' Take-home: ' + fmt(result.takeHome) + ' (effective rate: ' + result.effectiveRate + ')';
}

/**
 * Get pre-computed salary breakdowns for common salary levels (for quick reference table).
 * @returns {Array<Object>} Array of 8 salary breakdowns with gross, takeHome, effectiveRate, etc.
 */
export function getCommonSalaryExamples() {
  return EXAMPLE_SALARIES.map(function(salary) {
    var r = calculateTakeHome(salary);
    return {
      gross:           r.gross,
      takeHome:        r.takeHome,
      effectiveRate:   r.effectiveRate,
      socialInsurance: r.socialInsurance,
      incomeTax:       r.incomeTax,
      residentTax:     r.residentTax
    };
  });
}

// ============ UNIT TESTS ============
// Run: import in browser console, call runTests()

export function runTests() {
  var passed = 0;
  var failed = 0;

  function assert(name, condition, actual) {
    if (condition) {
      console.log('  PASS:', name);
      passed++;
    } else {
      console.error('  FAIL:', name, '| actual:', actual);
      failed++;
    }
  }

  console.log('Salary module \u2014 running 12 tests...');

  // T1: takeHome(300K) in range 220K–240K
  var t1 = calculateTakeHome(300000);
  assert('T1: takeHome(300K) in range', t1.takeHome >= 220000 && t1.takeHome <= 240000, t1.takeHome);

  // T2: socialInsurance(300K) ~43950
  assert('T2: socialInsurance(300K)', t1.socialInsurance === 44250, t1.socialInsurance);

  // T3: pension(300K) = 27450
  assert('T3: pension(300K) = 27450', t1.pension === 27450, t1.pension);

  // T4: health(300K) = 15000
  assert('T4: health(300K) = 15000', t1.health === 15000, t1.health);

  // T5: employment(300K) = 1800
  assert('T5: employment(300K) = 1800', t1.employment === 1800, t1.employment);

  // T6: effectiveRate(500K) ends with %
  var t6 = calculateTakeHome(500000);
  assert('T6: effectiveRate(500K) has %', t6.effectiveRate.endsWith('%'), t6.effectiveRate);

  // T7: takeHome(0) = 0, no error
  var t7 = calculateTakeHome(0);
  assert('T7: takeHome(0) = 0', t7.takeHome === 0 && !t7.error, t7);

  // T8: takeHome(-1) = error
  var t8 = calculateTakeHome(-1);
  assert('T8: takeHome(-1) = error', !!t8.error, t8);

  // T9: takeHome(10000001) = error
  var t9 = calculateTakeHome(10000001);
  assert('T9: takeHome(10M+1) = error', !!t9.error, t9);

  // T10: EID(4.8M) = 1400000
  var t10 = calcEmploymentIncomeDeduction(4800000);
  assert('T10: EID(4.8M) = 1400000', t10 === 1400000, t10);

  // T11: EID(1.5M) = 550000
  var t11 = calcEmploymentIncomeDeduction(1500000);
  assert('T11: EID(1.5M) = 550000', t11 === 550000, t11);

  // T12: getCommonSalaryExamples().length = 8
  var t12 = getCommonSalaryExamples();
  assert('T12: examples.length = 8', t12.length === 8, t12.length);

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed));
  return { passed: passed, failed: failed };
}
