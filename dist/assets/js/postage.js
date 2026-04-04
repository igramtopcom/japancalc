/**
 * JapanCalc — Japan Post Postage Calculator
 * Rates effective October 1, 2024 (Japan Post price revision)
 * Source: https://www.post.japanpost.jp/fee/
 *
 * IMPORTANT: Update this file if Japan Post changes rates again.
 * Last verified: April 2026
 */

// 定形郵便 (Standard letter) — max 23.5×12×1cm, ≤50g
export var TEIKEI = [
  { maxWeight: 25,  price: 110 },
  { maxWeight: 50,  price: 110 },
];

// 定形外郵便 規格内 (Non-standard, within size) — max 34×25×3cm, ≤1kg
export var TEIKEI_GAWA_NAI = [
  { maxWeight: 50,   price: 140 },
  { maxWeight: 100,  price: 180 },
  { maxWeight: 150,  price: 270 },
  { maxWeight: 250,  price: 320 },
  { maxWeight: 500,  price: 510 },
  { maxWeight: 1000, price: 750 },
];

// 定形外郵便 規格外 (Non-standard, outside size) — up to 4kg
export var TEIKEI_GAWA_GAI = [
  { maxWeight: 50,   price: 260 },
  { maxWeight: 100,  price: 290 },
  { maxWeight: 150,  price: 390 },
  { maxWeight: 250,  price: 450 },
  { maxWeight: 500,  price: 660 },
  { maxWeight: 1000, price: 920 },
  { maxWeight: 2000, price: 1350 },
  { maxWeight: 4000, price: 1750 },
];

// Fixed-price products
export var FIXED_PRODUCTS = [
  { id: 'letterpack_light', nameJP: 'レターパックライト', nameEN: 'Letterpack Light', price: 430, maxWeightG: 4000, note: 'ポスト投函可', noteEN: 'Mailbox delivery' },
  { id: 'letterpack_plus',  nameJP: 'レターパックプラス', nameEN: 'Letterpack Plus',  price: 600, maxWeightG: 4000, note: '対面受取・追跡あり', noteEN: 'In-person delivery + tracking' },
  { id: 'smart_letter',     nameJP: 'スマートレター',     nameEN: 'Smart Letter',     price: 180, maxWeightG: 1000, note: 'A5サイズ、1kg以内', noteEN: 'A5 size, up to 1kg' },
  { id: 'click_post',       nameJP: 'クリックポスト',     nameEN: 'Click Post',       price: 185, maxWeightG: 1000, note: '自宅でラベル印刷', noteEN: 'Print label at home' },
];

// Express (速達) surcharge
export var SOKUTATSU_SURCHARGE = { under250g: 290, over250g: 390 };

/**
 * Calculate postage for a mail item
 * @param {number} weightG — weight in grams
 * @param {'teikei'|'nai'|'gai'} type — mail type
 * @param {boolean} sokutatsu — express delivery
 * @returns {{ price, typeName, surcharge, total, weightG, sokutatsu, error }}
 */
export function calcPostage(weightG, type, sokutatsu) {
  if (!weightG || weightG <= 0)
    return { error: '重量を入力してください' };

  var table, typeName;
  if (type === 'teikei') {
    table = TEIKEI;
    typeName = '定形郵便';
    if (weightG > 50) return { error: '定形郵便は50g以内です' };
  } else if (type === 'nai') {
    table = TEIKEI_GAWA_NAI;
    typeName = '定形外郵便（規格内）';
    if (weightG > 1000) return { error: '規格内は1kg以内です' };
  } else if (type === 'gai') {
    table = TEIKEI_GAWA_GAI;
    typeName = '定形外郵便（規格外）';
    if (weightG > 4000) return { error: '規格外は4kg以内です' };
  } else {
    return { error: '郵便種別を選択してください' };
  }

  var row = null;
  for (var i = 0; i < table.length; i++) {
    if (weightG <= table[i].maxWeight) { row = table[i]; break; }
  }
  if (!row) return { error: '重量が超過しています' };

  var surcharge = sokutatsu
    ? (weightG <= 250 ? SOKUTATSU_SURCHARGE.under250g : SOKUTATSU_SURCHARGE.over250g)
    : 0;

  return {
    price:     row.price,
    typeName:  typeName,
    surcharge: surcharge,
    total:     row.price + surcharge,
    weightG:   weightG,
    sokutatsu: !!sokutatsu,
  };
}
