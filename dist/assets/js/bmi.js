/**
 * JapanCalc — BMI Calculator
 *
 * BMI Classification: 日本肥満学会 (Japan Society for the Study of Obesity)
 * Source: https://www.jasso.or.jp/
 *
 * Japan classification differs from WHO:
 *   < 18.5  → 低体重 (Underweight)
 *   18.5-25 → 普通体重 (Normal) ← Japan upper limit is 25, not 24.9
 *   25-30   → 肥満1度 (Obese Class 1)
 *   30-35   → 肥満2度 (Obese Class 2)
 *   35-40   → 肥満3度 (Obese Class 3)
 *   ≥ 40    → 肥満4度 (Obese Class 4)
 *
 * Ideal weights:
 *   標準体重 (Standard): height² × 22
 *   美容体重 (Beauty):   height² × 20
 *   モデル体重 (Model):  height² × 18
 *
 * Note: height in meters for calculation
 */

export const BMI_CLASSES_JP = [
  { min: 0,    max: 18.5, label: '低体重',  labelEN: 'Underweight',   color: '#3b82f6', level: 0 },
  { min: 18.5, max: 25,   label: '普通体重', labelEN: 'Normal weight', color: '#10b981', level: 1 },
  { min: 25,   max: 30,   label: '肥満1度', labelEN: 'Obese Class 1', color: '#f59e0b', level: 2 },
  { min: 30,   max: 35,   label: '肥満2度', labelEN: 'Obese Class 2', color: '#f97316', level: 3 },
  { min: 35,   max: 40,   label: '肥満3度', labelEN: 'Obese Class 3', color: '#ef4444', level: 4 },
  { min: 40,   max: Infinity, label: '肥満4度', labelEN: 'Obese Class 4', color: '#991b1b', level: 5 },
];

/**
 * Calculate BMI and related values
 * @param {number} heightCm — height in centimeters
 * @param {number} weightKg — weight in kilograms
 * @returns {{ bmi, classification, standardWeight, beautyWeight, modelWeight,
 *             weightToStandard, heightM, error }}
 */
export function calcBMI(heightCm, weightKg) {
  if (!heightCm || heightCm < 50 || heightCm > 250)
    return { error: '身長を正しく入力してください（50〜250cm）' };
  if (!weightKg || weightKg < 10 || weightKg > 300)
    return { error: '体重を正しく入力してください（10〜300kg）' };

  const heightM = heightCm / 100;
  const bmi     = weightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;

  const classification = BMI_CLASSES_JP.find(c => bmi >= c.min && bmi < c.max)
    || BMI_CLASSES_JP[BMI_CLASSES_JP.length - 1];

  const standardWeight = Math.round(heightM * heightM * 22 * 10) / 10;
  const beautyWeight   = Math.round(heightM * heightM * 20 * 10) / 10;
  const modelWeight    = Math.round(heightM * heightM * 18 * 10) / 10;

  const weightToStandard = Math.round((weightKg - standardWeight) * 10) / 10;

  return {
    bmi:              bmiRounded,
    bmiExact:         bmi,
    classification,
    standardWeight,
    beautyWeight,
    modelWeight,
    weightToStandard,
    heightM:          Math.round(heightM * 100) / 100,
    heightCm,
    weightKg,
  };
}

export function cmToFeetInches(cm) {
  const totalInches = cm / 2.54;
  const feet  = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12 * 10) / 10;
  return { feet, inches };
}

export function kgToLbs(kg) {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs) {
  return Math.round(lbs / 2.20462 * 10) / 10;
}

export function feetInchesToCm(feet, inches) {
  return Math.round((feet * 30.48 + inches * 2.54) * 10) / 10;
}
