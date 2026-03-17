/**
 * Japan Travel Budget Calculator — JS Logic Module
 * japancalc.com
 *
 * Estimates trip costs by travel style (budget/mid-range/luxury),
 * with currency conversion and optional one-time costs.
 *
 * Exports: calculateTripBudget, convertJPY, getOneTimeCosts,
 *          calculateWithOneTimeCosts, getBudgetStyles
 */

// Japan travel cost estimates (JPY per person per day) — approximate FY2025
const DAILY_COSTS = {
  budget: {
    label: 'Budget',
    labelJP: '節約旅行',
    description: 'Hostels, convenience store meals, local transport',
    accommodation: 3500,
    food:          2000,
    transport:     1500,
    activities:    1000,
    misc:           500,
    total:         8500
  },
  midrange: {
    label: 'Mid-range',
    labelJP: '標準旅行',
    description: 'Business hotels, sit-down restaurants, some tours',
    accommodation: 10000,
    food:           5000,
    transport:      2500,
    activities:     3000,
    misc:           1500,
    total:          22000
  },
  luxury: {
    label: 'Luxury',
    labelJP: '高級旅行',
    description: 'Ryokan / 4-star hotels, high-end dining, private tours',
    accommodation: 30000,
    food:          15000,
    transport:      5000,
    activities:     8000,
    misc:           3000,
    total:          61000
  }
};

// Approximate exchange rates (static — not live)
// Last updated: March 2025
const EXCHANGE_RATES = {
  USD: { rate: 0.0067, symbol: '$', label: 'US Dollar' },
  EUR: { rate: 0.0061, symbol: '€', label: 'Euro' },
  GBP: { rate: 0.0053, symbol: '£', label: 'British Pound' },
  AUD: { rate: 0.0102, symbol: 'A$', label: 'Australian Dollar' },
  CAD: { rate: 0.0091, symbol: 'CA$', label: 'Canadian Dollar' },
  KRW: { rate: 8.95,   symbol: '₩', label: 'Korean Won' },
  TWD: { rate: 0.213,  symbol: 'NT$', label: 'Taiwan Dollar' },
  SGD: { rate: 0.0089, symbol: 'S$', label: 'Singapore Dollar' },
  CNY: { rate: 0.0484, symbol: '¥', label: 'Chinese Yuan' },
  HKD: { rate: 0.0522, symbol: 'HK$', label: 'Hong Kong Dollar' }
};

// One-time costs (transport, not per day)
const ONE_TIME_COSTS = {
  icsuica: {
    label: 'IC Card (Suica/Pasmo)',
    cost: 1000,
    note: 'Recommended for all visitors'
  },
  tokyoSubway: {
    label: 'Tokyo Subway 72h pass',
    cost: 1500,
    note: 'Good for Tokyo-heavy trips'
  },
  jrPass7: {
    label: 'JR Pass 7-day',
    cost: 50000,
    note: 'Worth it if doing bullet train travel'
  },
  jrPass14: {
    label: 'JR Pass 14-day',
    cost: 80000,
    note: 'For longer multi-city trips'
  },
  nrtToTokyo: {
    label: 'Narita Express (NRT → Tokyo)',
    cost: 3070,
    note: 'One way'
  },
  hndToTokyo: {
    label: 'Monorail (HND → Hamamatsucho)',
    cost: 500,
    note: 'One way'
  }
};

const RATE_NOTE = 'Exchange rates are approximate (March 2025). Check current rates before travel.';

/**
 * Estimate total trip cost for a Japan trip.
 * @param {Object} params
 * @param {'budget'|'midrange'|'luxury'} params.style - Travel style
 * @param {number} params.days - Trip duration (1–90)
 * @param {number} params.travellers - Number of people (1–10)
 * @param {string} [params.currency='USD'] - Output currency code
 * @param {Object} [params.customCosts] - Override individual daily cost categories
 * @returns {Object} Budget breakdown or error object
 */
export function calculateTripBudget(params) {
  const { style, days, travellers, currency = 'USD', customCosts = {} } = params || {};

  if (!DAILY_COSTS[style]) {
    return { error: 'Invalid travel style' };
  }
  if (!Number.isFinite(days) || days < 1 || days > 90) {
    return { error: 'Trip duration must be 1–90 days' };
  }
  if (!Number.isFinite(travellers) || travellers < 1 || travellers > 10) {
    return { error: 'Number of travellers must be 1–10' };
  }

  const base = DAILY_COSTS[style];
  const categories = ['accommodation', 'food', 'transport', 'activities', 'misc'];

  const dailyCosts = {};
  categories.forEach(cat => {
    dailyCosts[cat] = (customCosts[cat] != null && Number.isFinite(customCosts[cat]))
      ? customCosts[cat]
      : base[cat];
  });
  dailyCosts.total = categories.reduce((sum, cat) => sum + dailyCosts[cat], 0);

  const totalJPY = dailyCosts.total * days * travellers;
  const perPersonTotal = dailyCosts.total * days;

  // Currency conversion
  let currencyCode = currency;
  let warning;
  if (!EXCHANGE_RATES[currencyCode]) {
    currencyCode = 'USD';
    warning = 'Unknown currency "' + currency + '", defaulting to USD';
  }
  const ex = EXCHANGE_RATES[currencyCode];
  const totalForeign = Math.round(totalJPY * ex.rate * 100) / 100;

  const result = {
    dailyCosts,
    totalJPY,
    totalForeign,
    currency: currencyCode,
    currencySymbol: ex.symbol,
    exchangeRate: ex.rate,
    style,
    styleLabel: base.label,
    days,
    travellers,
    perPersonTotal,
    dailyPerPerson: dailyCosts.total,
    rateNote: RATE_NOTE
  };

  if (warning) result.warning = warning;
  return result;
}

/**
 * Convert a JPY amount to a foreign currency.
 * @param {number} amountJPY - Amount in Japanese yen
 * @param {string} currency - Target currency code
 * @returns {Object} { amount, symbol, formatted }
 */
export function convertJPY(amountJPY, currency) {
  const ex = EXCHANGE_RATES[currency];
  if (!ex) return { amount: amountJPY, symbol: '¥', formatted: '¥' + amountJPY.toLocaleString() };

  const amount = Math.round(amountJPY * ex.rate * 100) / 100;
  const formatted = ex.symbol + Math.round(amount).toLocaleString();
  return { amount, symbol: ex.symbol, formatted };
}

/**
 * Get the one-time costs data object.
 * @returns {Object} One-time cost items (IC card, JR Pass, airport transfers)
 */
export function getOneTimeCosts() {
  return ONE_TIME_COSTS;
}

/**
 * Add selected one-time costs to a base budget result.
 * @param {Object} baseResult - Result from calculateTripBudget()
 * @param {string[]} selectedOneTimeCosts - Array of one-time cost IDs
 * @returns {Object} Updated result with one-time costs added
 */
export function calculateWithOneTimeCosts(baseResult, selectedOneTimeCosts) {
  if (baseResult.error) return baseResult;
  if (!Array.isArray(selectedOneTimeCosts) || selectedOneTimeCosts.length === 0) {
    return { ...baseResult, oneTimeCostsJPY: 0, selectedOneTimeCosts: [] };
  }

  let oneTimeTotal = 0;
  const selected = [];

  selectedOneTimeCosts.forEach(id => {
    if (ONE_TIME_COSTS[id]) {
      const item = ONE_TIME_COSTS[id];
      // Per-person items: IC cards multiply by travellers
      const perPerson = (id === 'icsuica');
      const cost = perPerson ? item.cost * baseResult.travellers : item.cost;
      oneTimeTotal += cost;
      selected.push({ id, label: item.label, cost, perPerson });
    }
  });

  const totalJPY = baseResult.totalJPY + oneTimeTotal;
  const ex = EXCHANGE_RATES[baseResult.currency] || EXCHANGE_RATES.USD;
  const totalForeign = Math.round(totalJPY * ex.rate * 100) / 100;

  return {
    ...baseResult,
    totalJPY,
    totalForeign,
    perPersonTotal: baseResult.perPersonTotal + oneTimeTotal,
    oneTimeCostsJPY: oneTimeTotal,
    selectedOneTimeCosts: selected
  };
}

/**
 * Get available budget styles for the UI selector.
 * @returns {Array<Object>} Array of style objects with id, label, labelJP, daily, description
 */
export function getBudgetStyles() {
  return Object.entries(DAILY_COSTS).map(([id, data]) => ({
    id,
    label: data.label,
    labelJP: data.labelJP,
    daily: data.total,
    description: data.description
  }));
}


// ============ UNIT TESTS ============

export function runTests() {
  const results = [];
  let pass = 0;
  let fail = 0;

  function assert(name, condition, actual) {
    if (condition) {
      pass++;
      results.push({ name, status: 'PASS' });
      console.log('  PASS: ' + name);
    } else {
      fail++;
      results.push({ name, status: 'FAIL', actual });
      console.error('  FAIL: ' + name + ' | actual: ' + JSON.stringify(actual));
    }
  }

  console.log('=== Travel Budget Module Tests ===');

  // T1: midrange 7d 1p
  const r1 = calculateTripBudget({ style: 'midrange', days: 7, travellers: 1, currency: 'USD' });
  assert('T1: midrange 7d 1p totalJPY=154000', r1.totalJPY === 154000, r1.totalJPY);

  // T2: midrange 7d 2p
  const r2 = calculateTripBudget({ style: 'midrange', days: 7, travellers: 2, currency: 'USD' });
  assert('T2: midrange 7d 2p totalJPY=308000', r2.totalJPY === 308000, r2.totalJPY);

  // T3: budget 1d daily
  const r3 = calculateTripBudget({ style: 'budget', days: 1, travellers: 1, currency: 'USD' });
  assert('T3: budget daily=8500', r3.dailyCosts.total === 8500, r3.dailyCosts.total);

  // T4: luxury 1d daily
  const r4 = calculateTripBudget({ style: 'luxury', days: 1, travellers: 1, currency: 'USD' });
  assert('T4: luxury daily=61000', r4.dailyCosts.total === 61000, r4.dailyCosts.total);

  // T5: days=0 → error
  const r5 = calculateTripBudget({ style: 'midrange', days: 0, travellers: 1, currency: 'USD' });
  assert('T5: days=0 → error', !!r5.error, r5);

  // T6: days=91 → error
  const r6 = calculateTripBudget({ style: 'midrange', days: 91, travellers: 1, currency: 'USD' });
  assert('T6: days=91 → error', !!r6.error, r6);

  // T7: JPY→USD
  const r7 = convertJPY(22000, 'USD');
  assert('T7: JPY→USD ~147', Math.abs(r7.amount - 147.4) < 1, r7.amount);

  // T8: JPY→EUR
  const r8 = convertJPY(22000, 'EUR');
  assert('T8: JPY→EUR ~134', Math.abs(r8.amount - 134.2) < 1, r8.amount);

  // T9: +jrPass7
  const base = calculateTripBudget({ style: 'midrange', days: 7, travellers: 1, currency: 'USD' });
  const r9 = calculateWithOneTimeCosts(base, ['jrPass7']);
  assert('T9: +jrPass7 adds 50000', r9.totalJPY === base.totalJPY + 50000, r9.totalJPY);

  // T10: getBudgetStyles length
  const r10 = getBudgetStyles();
  assert('T10: getBudgetStyles() length=3', r10.length === 3, r10.length);

  console.log('\n=== Results: ' + pass + '/' + (pass + fail) + ' PASS ===');
  return { pass, fail, total: pass + fail, results };
}
