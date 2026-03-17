/**
 * japancalc.com — Withholding Tax Calculator Logic Module
 * Spec: PRD v1.0 Section 2.2 (Tool 10 — Withholding Tax Calculator)
 *
 * Withholding tax (源泉徴収税) rates for professional fees per NTA FY2025:
 *   ≤ ¥1,000,000:  10.21% (inc. reconstruction surtax 2.1%)
 *   > ¥1,000,000:  20.42% on excess + ¥102,100 flat
 *
 * Exports: calculateWithholdingFee, calculateWithholdingInterest,
 *          calculateWithholdingDividend, getPrecomputedFeeTable,
 *          formatInvoiceLine, runTests
 */

// ============ FY2025 WITHHOLDING TAX RATES ============

var WITHHOLDING_RATES = {
  // Professional fees (報酬・料金等) — Article 204 of Income Tax Act
  professionalFee: {
    threshold:          1000000,
    rateBelowThreshold: 0.1021,
    rateAboveThreshold: 0.2042,
    flatBelowThreshold: 0,
    flatAboveThreshold: 102100
  },
  // Interest (利子) — national tax only
  interest: {
    rate: 0.1521
  },
  // Dividend (配当)
  dividend: {
    rateListedStock: 0.1021,
    rateUnlisted:    0.2042
  },
  note: 'Rates as of FY2025. Reconstruction surtax (2.1%) included. Verify annually with NTA.'
};

var FEE_AMOUNTS = [50000, 100000, 200000, 300000, 500000,
                   800000, 1000000, 1500000, 2000000, 3000000];

// ============ HELPERS ============

function fmtJPY(n) {
  return '\u00A5' + Math.round(n).toLocaleString('en-US');
}

// ============ EXPORTED FUNCTIONS ============

/**
 * Calculate withholding tax on a payment (professional fee by default).
 * @param {number} amount — gross payment amount in JPY
 * @param {Object} [options] — calculation options
 * @param {string} [options.type='professional'] — 'professional'|'interest'|'dividend_listed'|'dividend_unlisted'
 * @returns {Object} Withholding tax breakdown or error
 */
export function calculateWithholdingFee(amount, options) {
  if (typeof amount !== 'number' || amount <= 0) {
    return { error: 'Amount must be positive' };
  }

  var opts = options || {};
  var type = opts.type || 'professional';

  if (type === 'interest') {
    return calculateWithholdingInterest(amount);
  }
  if (type === 'dividend_listed') {
    return calculateWithholdingDividend(amount, true);
  }
  if (type === 'dividend_unlisted') {
    return calculateWithholdingDividend(amount, false);
  }

  // Professional fee calculation
  var r = WITHHOLDING_RATES.professionalFee;
  var withholding;
  var splitApplied;
  var effectiveRate;
  var formula;

  if (amount <= r.threshold) {
    withholding = Math.floor(amount * r.rateBelowThreshold);
    splitApplied = false;
    effectiveRate = r.rateBelowThreshold;
    formula = fmtJPY(amount) + ' \u00D7 10.21% = ' + fmtJPY(withholding) + ' withheld';
  } else {
    var belowPart = r.flatAboveThreshold;
    var abovePart = Math.floor((amount - r.threshold) * r.rateAboveThreshold);
    withholding = belowPart + abovePart;
    splitApplied = true;
    effectiveRate = r.rateAboveThreshold;
    formula = fmtJPY(r.threshold) + ' \u00D7 10.21% = ' + fmtJPY(belowPart) +
              ' + ' + fmtJPY(amount - r.threshold) + ' \u00D7 20.42% = ' + fmtJPY(abovePart) +
              ' | Total: ' + fmtJPY(withholding) + ' withheld';
  }

  var netPayment = amount - withholding;

  return {
    grossAmount:    amount,
    withholdingTax: withholding,
    netPayment:     netPayment,
    rate:           effectiveRate,
    ratePercent:    splitApplied ? '10.21% + 20.42%' : '10.21%',
    rateLabel:      (splitApplied ? '10.21% + 20.42%' : '10.21%') + ' (Professional Fee \u2014 \u5831\u916C)',
    type:           'professional',
    formula:        formula,
    splitApplied:   splitApplied,
    invoiceNote:    'Invoice gross: ' + fmtJPY(amount) + ' | Withholding (\u6E90\u6CC9\u5FB4\u53CE): ' +
                    fmtJPY(withholding) + ' | Net payable: ' + fmtJPY(netPayment)
  };
}

/**
 * Calculate withholding tax on interest income.
 * @param {number} amount — interest income in JPY
 * @returns {Object} Withholding tax breakdown or error
 */
export function calculateWithholdingInterest(amount) {
  if (typeof amount !== 'number' || amount <= 0) {
    return { error: 'Amount must be positive' };
  }

  var rate = WITHHOLDING_RATES.interest.rate;
  var withholding = Math.floor(amount * rate);
  var netPayment = amount - withholding;

  return {
    grossAmount:    amount,
    withholdingTax: withholding,
    netPayment:     netPayment,
    rate:           rate,
    ratePercent:    '15.21%',
    rateLabel:      '15.21% (Interest Income \u2014 \u5229\u5B50\u6240\u5F97)',
    type:           'interest',
    formula:        fmtJPY(amount) + ' \u00D7 15.21% = ' + fmtJPY(withholding) + ' withheld',
    splitApplied:   false,
    invoiceNote:    'Interest: ' + fmtJPY(amount) + ' | Withholding (\u6E90\u6CC9\u5FB4\u53CE): ' +
                    fmtJPY(withholding) + ' | Net: ' + fmtJPY(netPayment)
  };
}

/**
 * Calculate withholding tax on dividend income.
 * @param {number} amount — dividend amount in JPY
 * @param {boolean} isListed — true for listed stocks, false for unlisted
 * @returns {Object} Withholding tax breakdown or error
 */
export function calculateWithholdingDividend(amount, isListed) {
  if (typeof amount !== 'number' || amount <= 0) {
    return { error: 'Amount must be positive' };
  }

  var rate = isListed
    ? WITHHOLDING_RATES.dividend.rateListedStock
    : WITHHOLDING_RATES.dividend.rateUnlisted;
  var pct = isListed ? '10.21%' : '20.42%';
  var label = isListed ? 'Listed Stock' : 'Unlisted';
  var withholding = Math.floor(amount * rate);
  var netPayment = amount - withholding;

  return {
    grossAmount:    amount,
    withholdingTax: withholding,
    netPayment:     netPayment,
    rate:           rate,
    ratePercent:    pct,
    rateLabel:      pct + ' (Dividend \u2014 ' + label + ' \u914D\u5F53)',
    type:           isListed ? 'dividend_listed' : 'dividend_unlisted',
    formula:        fmtJPY(amount) + ' \u00D7 ' + pct + ' = ' + fmtJPY(withholding) + ' withheld',
    splitApplied:   false,
    invoiceNote:    'Dividend: ' + fmtJPY(amount) + ' | Withholding (\u6E90\u6CC9\u5FB4\u53CE): ' +
                    fmtJPY(withholding) + ' | Net: ' + fmtJPY(netPayment)
  };
}

/**
 * Get pre-computed withholding amounts for common invoice values.
 * @returns {Array<Object>} Array of 10 fee breakdowns
 */
export function getPrecomputedFeeTable() {
  return FEE_AMOUNTS.map(function(amt) {
    var r = calculateWithholdingFee(amt);
    return {
      grossAmount:    r.grossAmount,
      withholdingTax: r.withholdingTax,
      netPayment:     r.netPayment,
      ratePercent:    r.ratePercent
    };
  });
}

/**
 * Format a withholding result as a human-readable invoice line (for Copy button).
 * @param {Object} result — result from calculateWithholdingFee()
 * @returns {string} formatted invoice summary
 */
export function formatInvoiceLine(result) {
  if (!result || result.error) return '';

  return 'Invoice Amount: ' + fmtJPY(result.grossAmount) + '\n' +
    ' Withholding Tax (\u6E90\u6CC9\u5FB4\u53CE): -' + fmtJPY(result.withholdingTax) +
    ' (' + result.ratePercent + ')\n' +
    ' Net Payable Amount: ' + fmtJPY(result.netPayment);
}

// ============ UNIT TESTS ============

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

  console.log('Withholding Tax module \u2014 running 12 tests...');

  // T1: fee(500K) = 51050
  var t1 = calculateWithholdingFee(500000);
  assert('T1: fee(500K) = 51050', t1.withholdingTax === 51050, t1.withholdingTax);

  // T2: fee(100K) = 10210
  var t2 = calculateWithholdingFee(100000);
  assert('T2: fee(100K) = 10210', t2.withholdingTax === 10210, t2.withholdingTax);

  // T3: fee(1M) = 102100
  var t3 = calculateWithholdingFee(1000000);
  assert('T3: fee(1M) = 102100', t3.withholdingTax === 102100, t3.withholdingTax);

  // T4: fee(1.5M) = 204200
  var t4 = calculateWithholdingFee(1500000);
  assert('T4: fee(1.5M) = 204200', t4.withholdingTax === 204200, t4.withholdingTax);

  // T5: splitApplied(1.5M) = true
  assert('T5: splitApplied(1.5M) = true', t4.splitApplied === true, t4.splitApplied);

  // T6: splitApplied(500K) = false
  assert('T6: splitApplied(500K) = false', t1.splitApplied === false, t1.splitApplied);

  // T7: net(500K) = 448950
  assert('T7: net(500K) = 448950', t1.netPayment === 448950, t1.netPayment);

  // T8: fee(0) = error
  var t8 = calculateWithholdingFee(0);
  assert('T8: fee(0) = error', !!t8.error, t8);

  // T9: fee(-1) = error
  var t9 = calculateWithholdingFee(-1);
  assert('T9: fee(-1) = error', !!t9.error, t9);

  // T10: interest(100K) = 15210
  var t10 = calculateWithholdingInterest(100000);
  assert('T10: interest(100K) = 15210', t10.withholdingTax === 15210, t10.withholdingTax);

  // T11: dividend listed(100K) = 10210
  var t11 = calculateWithholdingDividend(100000, true);
  assert('T11: dividend listed(100K) = 10210', t11.withholdingTax === 10210, t11.withholdingTax);

  // T12: table length = 10
  var t12 = getPrecomputedFeeTable();
  assert('T12: table length = 10', t12.length === 10, t12.length);

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed));
  return { passed: passed, failed: failed };
}
