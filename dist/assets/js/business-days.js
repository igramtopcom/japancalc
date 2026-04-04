/**
 * JapanCalc — Business Days Calculator
 * Reuses holiday data from holiday.js
 * Reuses calcBusinessDays from days-calc.js
 */

import { calcBusinessDays, toDateStr } from '/assets/js/days-calc.js';
import { getHolidaysForYear }          from '/assets/js/holiday.js';

export { calcBusinessDays, toDateStr, getHolidaysForYear };

/**
 * Calculate N business days after/before a date
 * @param {string} fromStr — YYYY-MM-DD
 * @param {number} businessDays — positive = future, negative = past
 * @param {Object} holidayData
 * @returns {{ resultDate, resultStr, totalCalendarDays, error }}
 */
export function calcNBusinessDaysLater(fromStr, businessDays, holidayData = {}) {
  if (!fromStr) return { error: '基準日を入力してください' };
  if (!businessDays || businessDays === 0) return { error: '営業日数を入力してください' };

  var from      = new Date(fromStr + 'T00:00:00');
  var direction = businessDays > 0 ? 1 : -1;
  var target    = Math.abs(businessDays);
  var count     = 0;
  var current   = new Date(from);
  var calendar  = 0;

  while (count < target) {
    current.setDate(current.getDate() + direction);
    calendar++;
    var dow = current.getDay();
    var str = toDateStr(current);
    if (dow !== 0 && dow !== 6 && !holidayData[str]) {
      count++;
    }
    if (calendar > 1000) return { error: '計算範囲が広すぎます' };
  }

  return {
    resultDate:        formatDateJP(current),
    resultStr:         toDateStr(current),
    totalCalendarDays: calendar,
    businessDays:      Math.abs(businessDays),
  };
}

function formatDateJP(d) {
  var DAYS = ['日','月','火','水','木','金','土'];
  return d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日（' + DAYS[d.getDay()] + '）';
}

export function formatDateEN(d) {
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
