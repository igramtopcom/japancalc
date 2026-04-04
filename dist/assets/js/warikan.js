/**
 * JapanCalc — Warikan (Bill Splitting) Calculator
 */

/**
 * Simple split: total ÷ people
 * @param {number} total — total bill amount
 * @param {number} people — number of people
 * @param {'floor'|'ceil'|'round'} rounding
 * @returns {{ perPerson, total, remainder, error }}
 */
export function calcSimpleSplit(total, people, rounding) {
  if (!rounding) rounding = 'ceil';
  if (!total || total <= 0)   return { error: '合計金額を入力してください' };
  if (!people || people <= 1) return { error: '人数を2人以上入力してください' };

  var perPerson;
  if (rounding === 'floor')   perPerson = Math.floor(total / people);
  else if (rounding === 'ceil') perPerson = Math.ceil(total / people);
  else                          perPerson = Math.round(total / people);

  var remainder = total - perPerson * people;

  return { perPerson: perPerson, total: total, people: people, remainder: remainder, rounding: rounding };
}

/**
 * Advanced split: each person paid different amounts, settle debts
 * @param {Array<{ name: string, paid: number }>} payments
 * @returns {{ perPerson, settlements, error }}
 */
export function calcAdvancedSplit(payments) {
  if (!payments || payments.length < 2)
    return { error: '2人以上の情報を入力してください' };

  var total     = payments.reduce(function(s, p) { return s + (p.paid || 0); }, 0);
  var people    = payments.length;
  var perPerson = Math.ceil(total / people);

  var balances = payments.map(function(p) {
    return {
      name:    p.name || '名前なし',
      paid:    p.paid || 0,
      balance: (p.paid || 0) - perPerson,
    };
  });

  var settlements = [];
  var debtors  = balances.filter(function(b) { return b.balance < 0; }).map(function(b) { return { name: b.name, paid: b.paid, balance: b.balance }; });
  var creditors = balances.filter(function(b) { return b.balance > 0; }).map(function(b) { return { name: b.name, paid: b.paid, balance: b.balance }; });

  var d = 0, c = 0;
  while (d < debtors.length && c < creditors.length) {
    var amount = Math.min(-debtors[d].balance, creditors[c].balance);
    if (amount > 0) {
      settlements.push({
        from:   debtors[d].name,
        to:     creditors[c].name,
        amount: Math.round(amount),
      });
    }
    debtors[d].balance  += amount;
    creditors[c].balance -= amount;
    if (Math.abs(debtors[d].balance) < 1)  d++;
    if (Math.abs(creditors[c].balance) < 1) c++;
  }

  return { perPerson: perPerson, total: total, people: people, balances: balances, settlements: settlements };
}

/**
 * Generate LINE share text
 */
export function generateShareText(perPerson, total, people) {
  return '\uD83C\uDF71 割り勘の結果\n合計: \u00A5' + total.toLocaleString('ja-JP') + '\n' + people + '人で割ると\n一人あたり \u00A5' + perPerson.toLocaleString('ja-JP') + '\n\n計算はJapanCalcで\u2192 https://japancalc.com/tax-finance/warikan-calculator/';
}
