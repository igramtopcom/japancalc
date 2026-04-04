/**
 * JapanCalc — Shichi-Go-San Calculator
 * 七五三 (7-5-3): Traditional ceremony for children aged 3, 5, 7
 *   - 3歳: Both boys and girls (髪置き)
 *   - 5歳: Boys only (袴着)
 *   - 7歳: Girls only (帯解き)
 * Ages calculated in 数え年 (traditional) — modern practice often uses 満年齢
 * Ceremony date: November 15 each year
 */

const DAYS_OF_WEEK_JP = ['日','月','火','水','木','金','土'];
const DAYS_OF_WEEK_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function calcShichigosan(birthYear, birthMonth, birthDay) {
  if (!birthYear || birthYear < 2000 || birthYear > new Date().getFullYear())
    return { error: '生年（西暦）を正しく入力してください' };

  var today       = new Date();
  var currentYear = today.getFullYear();

  var ceremonies = [
    { kazoeAge: 3, gender: 'both',   nameJP: '3歳（髪置き）', nameEN: 'Age 3 (Kami-oki)' },
    { kazoeAge: 5, gender: 'male',   nameJP: '5歳（袴着）',   nameEN: 'Age 5 (Hakama-gi) — Boys' },
    { kazoeAge: 7, gender: 'female', nameJP: '7歳（帯解き）', nameEN: 'Age 7 (Obi-toki) — Girls' },
  ];

  var results = [];

  for (var i = 0; i < ceremonies.length; i++) {
    var cer = ceremonies[i];
    // 数え年 ceremony year
    var kazoeYear = birthYear + cer.kazoeAge - 1;

    // 満年齢 ceremony year
    var nov15Kazoe = new Date(kazoeYear, 10, 15);
    var birthdayInKazoeYear = new Date(kazoeYear, birthMonth - 1, birthDay);
    var mannenAgeOnNov15 = birthdayInKazoeYear <= nov15Kazoe
      ? kazoeYear - birthYear
      : kazoeYear - birthYear - 1;

    // For 満年齢, we want the year when the child turns the target age (kazoeAge)
    // If child has already turned kazoeAge by Nov 15 of kazoeYear, that's the mannen year
    // Otherwise it's kazoeYear + 1
    var mannenYear;
    if (mannenAgeOnNov15 >= cer.kazoeAge) {
      mannenYear = kazoeYear;
    } else {
      mannenYear = kazoeYear + 1;
    }

    var nov15KazoeDate  = new Date(kazoeYear, 10, 15);
    var nov15MannenDate = new Date(mannenYear, 10, 15);

    results.push({
      ceremony:      cer.nameJP,
      ceremonyEN:    cer.nameEN,
      gender:        cer.gender,
      kazoeAge:      cer.kazoeAge,
      kazoeYear:     kazoeYear,
      mannenYear:    mannenYear,
      nov15DowJP:    DAYS_OF_WEEK_JP[nov15KazoeDate.getDay()],
      nov15DowEN:    DAYS_OF_WEEK_EN[nov15KazoeDate.getDay()],
      nov15MannenDowJP: DAYS_OF_WEEK_JP[nov15MannenDate.getDay()],
      nov15MannenDowEN: DAYS_OF_WEEK_EN[nov15MannenDate.getDay()],
      isPastKazoe:       kazoeYear < currentYear,
      isPastMannen:      mannenYear < currentYear,
      isThisYearKazoe:   kazoeYear === currentYear,
      isThisYearMannen:  mannenYear === currentYear,
    });
  }

  return { results: results, birthYear: birthYear, birthMonth: birthMonth, birthDay: birthDay };
}
