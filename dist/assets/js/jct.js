/**
 * japancalc.com — JCT (Japanese Consumption Tax) Logic Module
 * Spec: Tech Spec v1.0 Section 3.2
 *
 * Exports: addTax, removeTax, formatJPY, getPrecomputedTable, validateAmount
 */

// ============ INLINED TAX RATES (from src/_data/tax-rates.json) ============

const TAX_RATES = {
  standard: 0.10,
  reduced:  0.08
};

const RATE_LABELS = {
  standard: '10% (Standard Rate)',
  reduced:  '8% (Reduced Rate — food & newspapers)'
};

const BASE_AMOUNTS = [100, 500, 1000, 3000, 5000, 10000, 30000, 50000, 100000];

// ============ EXPORTED FUNCTIONS ============

/**
 * Format a number as Japanese Yen with thousand separators.
 * @param {number} amount - The amount to format
 * @returns {string} Formatted string e.g. "¥1,000"
 */
export function formatJPY(amount) {
  return '\u00A5' + Math.round(amount).toLocaleString('ja-JP');
}

/**
 * Calculate tax-inclusive price from a pre-tax amount.
 * NTA rounding rule: Math.round(preTaxAmount * rate) for the tax amount.
 * @param {number} preTaxAmount - Price before tax (integer or decimal)
 * @param {string} [rateKey="standard"] - "standard" | "reduced"
 * @returns {{ preTax: number, taxAmount: number, inclusive: number, rate: number, ratePercent: number, rateLabel: string, formula: string }}
 */
export function addTax(preTaxAmount, rateKey) {
  if (!rateKey) rateKey = 'standard';
  var rate = TAX_RATES[rateKey];
  var taxAmount = Math.round(preTaxAmount * rate);
  var inclusive = preTaxAmount + taxAmount;
  var multiplier = (1 + rate).toFixed(2);

  return {
    preTax:      preTaxAmount,
    taxAmount:   taxAmount,
    inclusive:   inclusive,
    rate:        rate,
    ratePercent: rate * 100,
    rateLabel:   RATE_LABELS[rateKey],
    formula:     formatJPY(preTaxAmount) + ' \u00D7 ' + multiplier + ' = ' + formatJPY(inclusive)
  };
}

/**
 * Extract pre-tax price from a tax-inclusive amount.
 * NTA rounding rule: Math.floor(inclusiveAmount / (1 + rate)) for pre-tax amount.
 * @param {number} inclusiveAmount - Price including tax
 * @param {string} [rateKey="standard"] - "standard" | "reduced"
 * @returns {{ inclusive: number, preTax: number, taxAmount: number, rate: number, ratePercent: number, rateLabel: string, formula: string }}
 */
export function removeTax(inclusiveAmount, rateKey) {
  if (!rateKey) rateKey = 'standard';
  var rate = TAX_RATES[rateKey];
  var ratePercent = Math.round(rate * 100);
  var preTax = Math.floor(inclusiveAmount * 100 / (100 + ratePercent));
  var taxAmount = inclusiveAmount - preTax;
  var divisor = (1 + rate).toFixed(2);

  return {
    inclusive:   inclusiveAmount,
    preTax:      preTax,
    taxAmount:   taxAmount,
    rate:        rate,
    ratePercent: rate * 100,
    rateLabel:   RATE_LABELS[rateKey],
    formula:     formatJPY(inclusiveAmount) + ' \u00F7 ' + divisor + ' = ' + formatJPY(preTax)
  };
}

/**
 * Returns pre-computed results for the quick reference table.
 * @returns {Array<{ preTax: number, standard: { taxAmount: number, inclusive: number }, reduced: { taxAmount: number, inclusive: number } }>}
 */
export function getPrecomputedTable() {
  return BASE_AMOUNTS.map(function(amt) {
    var std = addTax(amt, 'standard');
    var red = addTax(amt, 'reduced');
    return {
      preTax: amt,
      standard: { taxAmount: std.taxAmount, inclusive: std.inclusive },
      reduced:  { taxAmount: red.taxAmount, inclusive: red.inclusive }
    };
  });
}

/**
 * Input validation helper for the tool UI.
 * @param {string} input - Raw user input string
 * @returns {{ valid: boolean, value: number|null, error: string|null }}
 */
export function validateAmount(input) {
  if (input === '' || input === null || input === undefined) {
    return { valid: false, value: null, error: null };
  }

  var num = Number(input);

  if (isNaN(num)) {
    return { valid: false, value: null, error: 'Please enter a valid number' };
  }

  if (num < 0) {
    return { valid: false, value: null, error: 'Please enter a positive amount' };
  }

  if (num === 0) {
    return { valid: false, value: null, error: 'Please enter an amount greater than 0' };
  }

  if (num > 9999999999) {
    return { valid: false, value: null, error: 'Amount too large (max \u00A59,999,999,999)' };
  }

  // Check decimal places (up to 2 allowed)
  var str = String(input);
  var dotIndex = str.indexOf('.');
  if (dotIndex !== -1 && str.length - dotIndex - 1 > 2) {
    return { valid: false, value: null, error: 'Maximum 2 decimal places allowed' };
  }

  return { valid: true, value: num, error: null };
}

// ============ UNIT TESTS ============
// Run in browser console: copy-paste the runTests() call

export function runTests() {
  var pass = 0;
  var fail = 0;
  var total = 10;

  function assert(label, condition, actual) {
    if (condition) {
      pass++;
      console.log('PASS: ' + label);
    } else {
      fail++;
      console.log('FAIL: ' + label + ' | actual: ' + JSON.stringify(actual));
    }
  }

  // T1: addTax(1000, 'standard') → inclusive: 1100, taxAmount: 100
  var t1 = addTax(1000, 'standard');
  assert('T1 addTax(1000, std)', t1.inclusive === 1100 && t1.taxAmount === 100, t1);

  // T2: addTax(1000, 'reduced') → inclusive: 1080, taxAmount: 80
  var t2 = addTax(1000, 'reduced');
  assert('T2 addTax(1000, red)', t2.inclusive === 1080 && t2.taxAmount === 80, t2);

  // T3: removeTax(1100, 'standard') → preTax: 1000, taxAmount: 100
  var t3 = removeTax(1100, 'standard');
  assert('T3 removeTax(1100, std)', t3.preTax === 1000 && t3.taxAmount === 100, t3);

  // T4: removeTax(1080, 'reduced') → preTax: 1000, taxAmount: 80
  var t4 = removeTax(1080, 'reduced');
  assert('T4 removeTax(1080, red)', t4.preTax === 1000 && t4.taxAmount === 80, t4);

  // T5: removeTax(100, 'standard') → preTax: 90, taxAmount: 10 (floor rounding)
  var t5 = removeTax(100, 'standard');
  assert('T5 removeTax(100, std) floor', t5.preTax === 90 && t5.taxAmount === 10, t5);

  // T6: addTax(0, 'standard') → inclusive: 0
  var t6 = addTax(0, 'standard');
  assert('T6 addTax(0)', t6.inclusive === 0, t6);

  // T7: addTax(9999999, 'standard') → inclusive: 10999999
  var t7 = addTax(9999999, 'standard');
  assert('T7 addTax(9999999)', t7.inclusive === 10999999, t7);

  // T8: addTax(333, 'standard') → taxAmount: 33 (Math.round(33.3) = 33)
  var t8 = addTax(333, 'standard');
  assert('T8 addTax(333) tax=33', t8.taxAmount === 33, t8);

  // T9: addTax(335, 'standard') → taxAmount: 34 (Math.round(33.5) = 34)
  var t9 = addTax(335, 'standard');
  assert('T9 addTax(335) tax=34', t9.taxAmount === 34, t9);

  // T10: getPrecomputedTable() → 9 items, first preTax=100
  var t10 = getPrecomputedTable();
  assert('T10 precomputed table', t10.length === 9 && t10[0].preTax === 100, t10);

  console.log('---');
  console.log('Results: ' + pass + '/' + total + ' PASS, ' + fail + ' FAIL');
  return { pass: pass, fail: fail, total: total };
}
