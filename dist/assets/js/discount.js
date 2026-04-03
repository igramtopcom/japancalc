/**
 * JapanCalc — Discount Calculator Logic
 * Japan Consumption Tax rates: Standard 10%, Reduced 8%
 */

const TAX_RATES = { standard: 0.10, reduced: 0.08, none: 0 };

/**
 * Mode 1: Original price + discount rate → discounted price
 * @param {number} originalPrice
 * @param {number} discountRate — percentage (e.g. 20 for 20%)
 * @param {string} taxMode — 'standard' | 'reduced' | 'none'
 * @returns {{ discountAmount, discountedPrice, taxAmount, finalPrice, ratePercent }}
 */
export function calcDiscountedPrice(originalPrice, discountRate, taxMode = 'none') {
  if (originalPrice < 0 || discountRate < 0 || discountRate > 100)
    return { error: '入力値が正しくありません' };

  const discountAmount  = Math.round(originalPrice * (discountRate / 100));
  const discountedPrice = originalPrice - discountAmount;
  const taxRate         = TAX_RATES[taxMode] || 0;
  const taxAmount       = Math.round(discountedPrice * taxRate);
  const finalPrice      = discountedPrice + taxAmount;

  return {
    originalPrice,
    discountRate,
    discountAmount,
    discountedPrice,
    taxAmount,
    finalPrice,
    taxRate: taxRate * 100,
    taxMode,
  };
}

/**
 * Mode 2: Original price + discount amount → discount rate
 * @param {number} originalPrice
 * @param {number} discountAmount
 * @returns {{ discountRate, discountedPrice }}
 */
export function calcDiscountRate(originalPrice, discountAmount) {
  if (originalPrice <= 0 || discountAmount < 0 || discountAmount > originalPrice)
    return { error: '入力値が正しくありません' };

  const discountRate    = Math.round((discountAmount / originalPrice) * 10000) / 100;
  const discountedPrice = originalPrice - discountAmount;

  return { originalPrice, discountAmount, discountRate, discountedPrice };
}

/**
 * Mode 3: Discounted price + discount rate → original price (reverse)
 * @param {number} discountedPrice
 * @param {number} discountRate — percentage
 * @returns {{ originalPrice, discountAmount }}
 */
export function calcOriginalPrice(discountedPrice, discountRate) {
  if (discountedPrice <= 0 || discountRate < 0 || discountRate >= 100)
    return { error: '入力値が正しくありません' };

  const originalPrice  = Math.round(discountedPrice / (1 - discountRate / 100));
  const discountAmount = originalPrice - discountedPrice;

  return { discountedPrice, discountRate, originalPrice, discountAmount };
}

/**
 * Format JPY with ¥ prefix and thousand separators
 * @param {number} amount
 * @returns {string}
 */
export function formatJPY(amount) {
  return '\u00A5' + Math.round(amount).toLocaleString('ja-JP');
}
