/**
 * japancalc.com — Work Hours / OT Calculator Logic Module
 * Spec: PRD v1.0 Section 2.2 (Tool 9 — Japan Work Hours / OT Calculator)
 *
 * Overtime rates per Japan Labor Standards Act (労働基準法):
 *   standard OT (>8h/day or >40h/week): 1.25×
 *   late night (22:00–05:00):            1.25× additional
 *   overtime + late night:               1.50×
 *   holiday work (法定休日):              1.35×
 *   holiday + late night:                1.60×
 *   over 60h/month OT (large co):        1.50×
 *
 * Exports: calculateHourlyRate, calculateOvertimePay, calculateMonthlyOT,
 *          calculateDailyOT, formatOTSummary
 */

// ============ OT MULTIPLIERS ============

var MULTIPLIERS = {
  standard:           1.25,
  latenight:          1.25,
  overtime_latenight: 1.50,
  holiday:            1.35,
  holiday_latenight:  1.60,
  over60:             1.50
};

var LABELS = {
  standard:           'Overtime (1.25\u00D7)',
  latenight:          'Late Night (1.25\u00D7)',
  overtime_latenight: 'Overtime + Late Night (1.50\u00D7)',
  holiday:            'Holiday Work (1.35\u00D7)',
  holiday_latenight:  'Holiday + Late Night (1.60\u00D7)',
  over60:             'Over 60h/month (1.50\u00D7)'
};

// ============ EXPORTED FUNCTIONS ============

/**
 * Calculate the base hourly rate from monthly salary.
 * @param {number} monthlyGross — gross monthly salary in JPY
 * @param {number} [monthlyHours=160] — scheduled working hours per month
 * @returns {Object} hourly and daily rate, or error
 */
export function calculateHourlyRate(monthlyGross, monthlyHours) {
  if (typeof monthlyGross !== 'number' || monthlyGross <= 0) {
    return { error: 'Salary must be positive' };
  }
  var hours = monthlyHours || 160;
  if (hours <= 0) {
    return { error: 'Working hours must be positive' };
  }
  var hourlyRate = Math.round(monthlyGross / hours);
  return {
    monthlyGross: monthlyGross,
    monthlyHours: hours,
    hourlyRate:   hourlyRate,
    dailyRate:    hourlyRate * 8
  };
}

/**
 * Calculate overtime pay for a given number of hours and OT type.
 * @param {number} hourlyRate — base hourly rate in JPY
 * @param {number} hours — number of overtime hours
 * @param {string} type — OT type: 'standard'|'latenight'|'overtime_latenight'|'holiday'|'holiday_latenight'|'over60'
 * @returns {Object} OT pay breakdown
 */
export function calculateOvertimePay(hourlyRate, hours, type) {
  var multiplier = MULTIPLIERS[type] || 1.25;
  var label = LABELS[type] || 'Overtime';
  var baseAmount = Math.floor(hourlyRate * hours);
  var otPay = Math.floor(hourlyRate * multiplier * hours);
  return {
    hours:      hours,
    type:       type,
    multiplier: multiplier,
    baseAmount: baseAmount,
    otPay:      otPay,
    extraPay:   otPay - baseAmount,
    label:      label
  };
}

/**
 * Full monthly overtime calculation.
 * @param {Object} params — calculation parameters
 * @param {number} params.monthlyGross — gross monthly salary
 * @param {number} [params.monthlyHours=160] — scheduled hours/month
 * @param {number} params.overtimeHours — regular OT hours this month
 * @param {number} [params.lateNightHours=0] — late night hours (22:00–05:00)
 * @param {number} [params.holidayHours=0] — statutory holiday hours
 * @param {boolean} [params.isLargeCompany=false] — true if 1.5× applies over 60h
 * @returns {Object} Full monthly OT breakdown or error
 */
export function calculateMonthlyOT(params) {
  var p = params || {};
  var monthlyGross   = p.monthlyGross;
  var monthlyHours   = p.monthlyHours || 160;
  var overtimeHours  = p.overtimeHours || 0;
  var lateNightHours = p.lateNightHours || 0;
  var holidayHours   = p.holidayHours || 0;
  var isLargeCompany = !!p.isLargeCompany;

  // Validation
  if (typeof monthlyGross !== 'number' || monthlyGross <= 0) {
    return { error: 'Salary must be positive' };
  }
  if (overtimeHours < 0 || lateNightHours < 0 || holidayHours < 0) {
    return { error: 'Hours cannot be negative' };
  }
  if (monthlyHours <= 0) {
    return { error: 'Working hours must be positive' };
  }

  var hourlyRate = Math.round(monthlyGross / monthlyHours);

  // OT pay calculation
  var overtimePay = 0;
  var over60Applied = false;

  if (overtimeHours > 60 && isLargeCompany) {
    // First 60h at 1.25×, remaining at 1.50×
    over60Applied = true;
    var first60 = calculateOvertimePay(hourlyRate, 60, 'standard');
    var remaining = calculateOvertimePay(hourlyRate, overtimeHours - 60, 'over60');
    overtimePay = first60.otPay + remaining.otPay;
  } else {
    var otResult = calculateOvertimePay(hourlyRate, overtimeHours, 'standard');
    overtimePay = otResult.otPay;
  }

  // Late night premium (additional 0.25× on top)
  var lateNightPay = Math.floor(hourlyRate * 0.25 * lateNightHours);

  // Holiday pay
  var holidayPay = 0;
  if (holidayHours > 0) {
    var holResult = calculateOvertimePay(hourlyRate, holidayHours, 'holiday');
    holidayPay = holResult.otPay;
  }

  var totalOTPay = overtimePay + lateNightPay + holidayPay;
  var totalPay = monthlyGross + totalOTPay;
  var totalHours = monthlyHours + overtimeHours + lateNightHours + holidayHours;

  return {
    monthlyGross:   monthlyGross,
    hourlyRate:     hourlyRate,
    scheduledHours: monthlyHours,
    overtimeHours:  overtimeHours,
    overtimePay:    overtimePay,
    lateNightHours: lateNightHours,
    lateNightPay:   lateNightPay,
    holidayHours:   holidayHours,
    holidayPay:     holidayPay,
    totalOTPay:     totalOTPay,
    totalPay:       totalPay,
    totalHours:     totalHours,
    over60Applied:  over60Applied,
    note: 'Overtime rates per Japan Labor Standards Act (\u52B4\u50CD\u57FA\u6E96\u6CD5). Rates: standard 1.25\u00D7, late night 1.25\u00D7, holiday 1.35\u00D7, over 60h/month 1.50\u00D7.'
  };
}

/**
 * Daily overtime calculation for users who know their daily hours.
 * @param {Object} params — daily calculation parameters
 * @param {number} params.hourlyRate — base hourly rate in JPY
 * @param {number} params.regularHours — hours worked today
 * @param {number} [params.lateNightHours=0] — hours during 22:00–05:00
 * @param {boolean} [params.isHoliday=false] — statutory holiday?
 * @returns {Object} Daily pay breakdown
 */
export function calculateDailyOT(params) {
  var p = params || {};
  var hourlyRate     = p.hourlyRate;
  var regularHours   = p.regularHours || 0;
  var lateNightHours = p.lateNightHours || 0;
  var isHoliday      = !!p.isHoliday;

  if (isHoliday) {
    // All hours at holiday rate 1.35×
    var holidayPay = Math.floor(hourlyRate * 1.35 * regularHours);
    var lnPay = Math.floor(hourlyRate * 0.25 * lateNightHours);
    var total = holidayPay + lnPay;
    return {
      totalHours:   regularHours,
      regularPay:   0,
      overtimePay:  0,
      lateNightPay: lnPay,
      holidayPay:   holidayPay,
      totalPay:     total,
      breakdown:    'Holiday: ' + regularHours + 'h \u00D7 1.35 = \u00A5' + holidayPay.toLocaleString('en-US') +
                    (lnPay > 0 ? ' + Late night: \u00A5' + lnPay.toLocaleString('en-US') : '') +
                    ' | Total: \u00A5' + total.toLocaleString('en-US')
    };
  }

  var regHours = Math.min(regularHours, 8);
  var otHours  = Math.max(0, regularHours - 8);

  var regularPay  = Math.floor(hourlyRate * regHours);
  var overtimePay = Math.floor(hourlyRate * 1.25 * otHours);
  var lateNightPayAmt = Math.floor(hourlyRate * 0.25 * lateNightHours);
  var totalPay = regularPay + overtimePay + lateNightPayAmt;

  return {
    totalHours:   regularHours,
    regularPay:   regularPay,
    overtimePay:  overtimePay,
    lateNightPay: lateNightPayAmt,
    totalPay:     totalPay,
    breakdown:    'Regular: ' + regHours + 'h = \u00A5' + regularPay.toLocaleString('en-US') +
                  (otHours > 0 ? ' | OT: ' + otHours + 'h \u00D7 1.25 = \u00A5' + overtimePay.toLocaleString('en-US') : '') +
                  (lateNightPayAmt > 0 ? ' | Late night: \u00A5' + lateNightPayAmt.toLocaleString('en-US') : '') +
                  ' | Total: \u00A5' + totalPay.toLocaleString('en-US')
  };
}

/**
 * Format a monthly OT result as a human-readable summary (for Copy button).
 * @param {Object} result — result from calculateMonthlyOT()
 * @returns {string} formatted summary
 */
export function formatOTSummary(result) {
  if (!result || result.error) return '';

  function fmt(n) {
    return '\u00A5' + Math.round(n).toLocaleString('en-US');
  }

  var lines = [
    'Monthly OT Summary:',
    ' Base salary: ' + fmt(result.monthlyGross) + ' | Hourly rate: ' + fmt(result.hourlyRate)
  ];
  if (result.overtimeHours > 0) {
    lines.push(' Overtime (' + result.overtimeHours + 'h): ' + fmt(result.overtimePay));
  }
  if (result.lateNightHours > 0) {
    lines.push(' Late night (' + result.lateNightHours + 'h): ' + fmt(result.lateNightPay));
  }
  if (result.holidayHours > 0) {
    lines.push(' Holiday (' + result.holidayHours + 'h): ' + fmt(result.holidayPay));
  }
  if (result.over60Applied) {
    lines.push(' * Over 60h/month rule applied (1.50\u00D7 for hours over 60)');
  }
  lines.push(' \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  lines.push(' Total pay: ' + fmt(result.totalPay));

  return lines.join('\n');
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

  console.log('Work Hours module \u2014 running 12 tests...');

  // T1: hourlyRate(300K/160) = 1875
  var t1 = calculateHourlyRate(300000, 160);
  assert('T1: hourlyRate = 1875', t1.hourlyRate === 1875, t1.hourlyRate);

  // T2: hourlyRate(300K/168) = 1786
  var t2 = calculateHourlyRate(300000, 168);
  assert('T2: hourlyRate ~1786', t2.hourlyRate === 1786, t2.hourlyRate);

  // T3: OT pay 10h standard = 23437
  var t3 = calculateOvertimePay(1875, 10, 'standard');
  assert('T3: otPay = 23437', t3.otPay === 23437, t3.otPay);

  // T4: holiday multiplier = 1.35
  var t4 = calculateOvertimePay(1875, 5, 'holiday');
  assert('T4: holiday multiplier = 1.35', t4.multiplier === 1.35, t4.multiplier);

  // T5: overtime_latenight multiplier = 1.50
  var t5 = calculateOvertimePay(1875, 5, 'overtime_latenight');
  assert('T5: OT+latenight = 1.50', t5.multiplier === 1.50, t5.multiplier);

  // T6: monthlyOT totalPay > base
  var t6 = calculateMonthlyOT({
    monthlyGross: 300000, monthlyHours: 160,
    overtimeHours: 20, lateNightHours: 0, holidayHours: 0,
    isLargeCompany: false
  });
  assert('T6: totalPay > 300000', t6.totalPay > 300000, t6.totalPay);

  // T7: over60 large company = true
  var t7 = calculateMonthlyOT({
    monthlyGross: 300000, monthlyHours: 160,
    overtimeHours: 65, lateNightHours: 0, holidayHours: 0,
    isLargeCompany: true
  });
  assert('T7: over60Applied = true', t7.over60Applied === true, t7.over60Applied);

  // T8: over60 small company = false
  var t8 = calculateMonthlyOT({
    monthlyGross: 300000, monthlyHours: 160,
    overtimeHours: 65, lateNightHours: 0, holidayHours: 0,
    isLargeCompany: false
  });
  assert('T8: over60Applied = false', t8.over60Applied === false, t8.over60Applied);

  // T9: negative salary = error
  var t9 = calculateMonthlyOT({
    monthlyGross: -1, monthlyHours: 160,
    overtimeHours: 10, lateNightHours: 0, holidayHours: 0,
    isLargeCompany: false
  });
  assert('T9: negative salary = error', !!t9.error, t9);

  // T10: negative hours = error
  var t10 = calculateMonthlyOT({
    monthlyGross: 300000, monthlyHours: 160,
    overtimeHours: 10, lateNightHours: -1, holidayHours: 0,
    isLargeCompany: false
  });
  assert('T10: negative hours = error', !!t10.error, t10);

  // T11: daily 10h OT pay = 4687
  var t11 = calculateDailyOT({
    hourlyRate: 1875, regularHours: 10,
    lateNightHours: 0, isHoliday: false
  });
  assert('T11: daily OT pay = 4687', t11.overtimePay === 4687, t11.overtimePay);

  // T12: formatOTSummary non-empty
  var t12 = formatOTSummary(t6);
  assert('T12: formatOTSummary non-empty', t12.length > 0, t12.length);

  console.log('\nResults: ' + passed + ' passed, ' + failed + ' failed out of ' + (passed + failed));
  return { passed: passed, failed: failed };
}
