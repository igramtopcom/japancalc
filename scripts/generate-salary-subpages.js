/**
 * T-66: Generate 10 JP + 10 EN salary sub-pages
 * Run: node scripts/generate-salary-subpages.js
 */

const fs = require('fs');
const path = require('path');

// ===== SALARY.JS LOGIC (duplicated for Node.js — no ESM import) =====
const RATES = {
  socialInsurance: { healthInsuranceRate: 0.0500, pensionRate: 0.0915, employmentRate: 0.0060, pensionBaseCap: 650000 },
  incomeTax: {
    basicDeduction: 480000, reconstructionSurtax: 0.021,
    brackets: [
      { min: 0, max: 1950000, rate: 0.05, deduction: 0 },
      { min: 1950000, max: 3300000, rate: 0.10, deduction: 97500 },
      { min: 3300000, max: 6950000, rate: 0.20, deduction: 427500 },
      { min: 6950000, max: 9000000, rate: 0.23, deduction: 636000 },
      { min: 9000000, max: 18000000, rate: 0.33, deduction: 1536000 },
      { min: 18000000, max: 40000000, rate: 0.40, deduction: 2796000 },
      { min: 40000000, max: null, rate: 0.45, deduction: 4796000 }
    ]
  },
  residentTax: { rate: 0.10, perCapita: 5000 },
  employmentIncomeDeduction: [
    { incomeMax: 1625000, deduction: 550000, formula: null },
    { incomeMax: 1800000, deduction: null, formula: 'income * 0.4 - 100000' },
    { incomeMax: 3600000, deduction: null, formula: 'income * 0.3 + 80000' },
    { incomeMax: 6600000, deduction: null, formula: 'income * 0.2 + 440000' },
    { incomeMax: 8500000, deduction: null, formula: 'income * 0.1 + 1100000' },
    { incomeMax: null, deduction: 1950000, formula: null }
  ]
};

function calcEID(annualIncome) {
  for (const tier of RATES.employmentIncomeDeduction) {
    if (tier.incomeMax === null || annualIncome <= tier.incomeMax) {
      if (tier.deduction !== null) return tier.deduction;
      const income = annualIncome;
      if (tier.formula === 'income * 0.4 - 100000') return Math.round(income * 0.4 - 100000);
      if (tier.formula === 'income * 0.3 + 80000') return Math.round(income * 0.3 + 80000);
      if (tier.formula === 'income * 0.2 + 440000') return Math.round(income * 0.2 + 440000);
      if (tier.formula === 'income * 0.1 + 1100000') return Math.round(income * 0.1 + 1100000);
    }
  }
  return 1950000;
}

function findBracket(taxableIncome) {
  for (const b of RATES.incomeTax.brackets) {
    if (b.max === null || taxableIncome <= b.max) return { rate: b.rate, deduction: b.deduction };
  }
  const last = RATES.incomeTax.brackets[RATES.incomeTax.brackets.length - 1];
  return { rate: last.rate, deduction: last.deduction };
}

function calculateTakeHome(grossMonthly) {
  if (grossMonthly === 0) return { gross: 0, pension: 0, health: 0, employment: 0, socialInsurance: 0, incomeTax: 0, residentTax: 0, totalDeductions: 0, takeHome: 0, effectiveRate: '0.0%' };
  const annualGross = grossMonthly * 12;
  const eid = calcEID(annualGross);
  const si = RATES.socialInsurance;
  const pension = Math.round(Math.min(grossMonthly, si.pensionBaseCap) * si.pensionRate);
  const health = Math.round(grossMonthly * si.healthInsuranceRate);
  const employment = Math.round(grossMonthly * si.employmentRate);
  const totalSIMonthly = pension + health + employment;
  const annualSI = totalSIMonthly * 12;
  const taxableIncome = Math.max(0, annualGross - eid - annualSI - RATES.incomeTax.basicDeduction);
  const bracket = findBracket(taxableIncome);
  let baseTax = Math.floor(taxableIncome * bracket.rate - bracket.deduction);
  baseTax = Math.max(0, baseTax);
  const reconstruction = Math.floor(baseTax * RATES.incomeTax.reconstructionSurtax);
  const annualIncomeTax = baseTax + reconstruction;
  const monthlyIncomeTax = Math.round(annualIncomeTax / 12);
  const annualResidentTax = Math.round(taxableIncome * RATES.residentTax.rate) + RATES.residentTax.perCapita;
  const monthlyResidentTax = Math.round(annualResidentTax / 12);
  const totalDeductions = totalSIMonthly + monthlyIncomeTax + monthlyResidentTax;
  const takeHome = grossMonthly - totalDeductions;
  const effectiveRate = ((totalDeductions / grossMonthly) * 100).toFixed(1) + '%';
  return { gross: grossMonthly, pension, health, employment, socialInsurance: totalSIMonthly, incomeTax: monthlyIncomeTax, residentTax: monthlyResidentTax, totalDeductions, takeHome, effectiveRate, taxBracketRate: bracket.rate };
}

// ===== PAGE DATA =====
const AMOUNTS = [2000000, 3000000, 4000000, 5000000, 6000000, 7000000, 8000000, 10000000, 15000000, 20000000];

function manLabel(amt) { return (amt / 10000).toLocaleString('en-US'); }
function mLabel(amt) { return (amt >= 10000000 ? (amt / 1000000) + 'M' : (amt / 1000000) + 'M'); }
function fmtJPY(n) { return '\u00A5' + Math.round(n).toLocaleString('en-US'); }
function fmtMan(n) { return '約' + (Math.round(n / 10000)).toLocaleString('ja-JP') + '万'; }
function fmtManEn(n) { return '~\u00A5' + (Math.round(n / 10000) / 100).toFixed(2).replace(/\.?0+$/, '') + 'M'; }
function fmtYen(n) { return '約' + Math.round(n).toLocaleString('ja-JP') + '円'; }
function fmtMonthly(n) { return '約' + (Math.round(n / 10000 * 10) / 10).toFixed(1) + '万'; }

// Unique editorial content per income level
const EDITORIAL_JP = {
  2000000: {
    h2_1: '年収200万円の生活とは',
    p1: '年収200万円は、フリーター・パートタイム・非正規雇用の方に多い収入帯です。月々の手取りは約13万円前後となり、一人暮らしの場合は家賃・光熱費・食費を差し引くと余裕が少ない水準です。地方都市では家賃が安い分、生活は成り立ちますが、都市部では厳しいのが現実です。',
    h2_2: '年収200万円からの節約・収入アップ',
    p2: '社会保険料や税金の負担率は約21%と比較的低めですが、手取り額自体が少ないため、固定費の見直しが重要です。格安スマホへの乗り換え、自炊の徹底、家賃の安い物件への引っ越しなどで月1〜2万円の節約が可能です。副業やスキルアップによる収入増も検討しましょう。国民健康保険の方は、社会保険完備の会社への転職で手取りが改善する場合もあります。',
    faq: [
      { q: '年収200万円の手取りはいくらですか？', a: '年収200万円（月収約16.7万円）の場合、社会保険料・所得税・住民税を差し引いた手取りは月約13.2万円、年間約158万円です。控除率は約21%です。' },
      { q: '年収200万円で一人暮らしはできますか？', a: '地方都市では家賃3〜4万円の物件を選べば可能ですが、東京や大阪の都心部では厳しい水準です。月の手取り約13万円から家賃・食費・光熱費を引くと、貯蓄に回す余裕はほとんどありません。' },
      { q: '年収200万円の所得税はいくらですか？', a: '年収200万円の場合、所得税率は5%が適用され、月額の所得税は約2,000〜3,000円程度です。住民税は月約5,000円前後となります。' }
    ]
  },
  3000000: {
    h2_1: '年収300万円は新卒・若手の平均水準',
    p1: '年収300万円は、日本の20代前半〜中盤の正社員の平均的な収入です。月々の手取りは約19.6万円で、一人暮らしでも堅実な生活が可能な水準です。ただし、都心の家賃を考えると貯蓄ペースはゆっくりになりがちです。新卒1〜3年目の方が将来の資産形成を見据えるには、まずこの収入帯での支出管理が鍵となります。',
    h2_2: '生活費と貯蓄のバランス',
    p2: '手取り約20万円のうち、家賃は手取りの30%（約6万円）以内に抑えるのが理想です。食費3〜4万円、通信費5,000円、日用品・交通費で2万円を見込むと、月2〜3万円の貯蓄が目標ラインです。つみたてNISAやiDeCoを活用すれば、節税しながら長期的な資産形成が可能です。ボーナスがある場合は年間手取りが大きく改善するため、ボーナス込みの計算もお試しください。',
    faq: [
      { q: '年収300万円の手取りはいくらですか？', a: '年収300万円（月収25万円）の場合、手取りは月約19.6万円、年間約235万円です。社会保険料が月約3.7万円、所得税が約3,000円、住民税が約9,000円ほど控除されます。' },
      { q: '年収300万円の新卒は平均的ですか？', a: 'はい、日本の大卒初任給の平均は月約22〜23万円（年収約265〜280万円）で、年収300万円は新卒1〜2年目の標準的な水準です。' },
      { q: '年収300万円でふるさと納税はいくらできますか？', a: '年収300万円・独身の場合、ふるさと納税の控除上限額は約28,000円です。詳しくは<a href="/tax-finance/furusato-nozei/">ふるさと納税計算ツール</a>でご確認ください。' }
    ]
  },
  4000000: {
    h2_1: '年収400万円は日本の平均年収付近',
    p1: '国税庁の民間給与実態統計調査によると、日本の給与所得者の平均年収は約460万円です。年収400万円はその平均にやや届かない水準ですが、正社員として安定したキャリアを築いている方が多い収入帯です。月々の手取りは約25.9万円で、一人暮らしなら十分余裕のある生活が可能です。',
    h2_2: '子育て・住宅との兼ね合い',
    p2: '年収400万円で家族を養う場合、配偶者控除や扶養控除の活用が重要です。扶養家族がいると所得税が軽減され、手取りが改善します。住宅ローンの借入可能額は一般的に年収の5〜7倍（2,000〜2,800万円）が目安です。住宅ローン控除（最大13年間）を活用すれば、実質的な住居費負担を抑えられます。児童手当や医療費控除なども忘れずに申請しましょう。',
    faq: [
      { q: '年収400万円の手取りはいくらですか？', a: '年収400万円（月収約33.3万円）の場合、手取りは月約25.9万円、年間約311万円です。控除率は約22%です。' },
      { q: '年収400万円は日本の平均ですか？', a: '日本の給与所得者の平均年収は約460万円（国税庁調べ）なので、400万円はやや平均を下回りますが、20代後半〜30代前半では一般的な水準です。' },
      { q: '年収400万円で住宅ローンはいくら借りられますか？', a: '一般的に年収の5〜7倍が目安で、年収400万円なら2,000万〜2,800万円程度の借入が可能です。ただし、返済比率（年収に占める年間返済額）は25%以内が理想です。' }
    ]
  },
  5000000: {
    h2_1: '年収500万円は中堅サラリーマンの水準',
    p1: '年収500万円は、30代〜40代の中堅サラリーマンに多い収入帯です。月々の手取りは約32万円で、一人暮らしや夫婦共働きであれば比較的余裕のある生活が可能です。ただし、子育て世帯の場合は教育費や住宅費との兼ね合いで家計管理が重要になります。日本の給与所得者の中央値に近い水準であり、多くの経済指標の基準として使われます。',
    h2_2: '住宅ローン審査と年収500万円',
    p2: '住宅ローンの審査において、年収500万円は大きな節目です。多くの金融機関が年収400万円以上を優遇金利の条件としており、500万円あれば3,000〜3,500万円程度の借入が可能です。フラット35の場合、返済比率35%以内（年間返済額175万円以内）が目安です。また、iDeCoで月23,000円を拠出すると、年間約55,000円の節税効果が得られます。ふるさと納税の控除上限は約61,000円で、返礼品の恩恵を十分に活用できます。',
    faq: [
      { q: '年収500万円の手取りはいくらですか？', a: '年収500万円（月収約41.7万円）の場合、手取りは月約32万円、年間約384万円です。社会保険料・所得税・住民税で約23%が控除されます。' },
      { q: '年収500万円の所得税率は？', a: '年収500万円の場合、所得税の税率は10%（課税所得330万円以下の部分は5%）が適用されます。復興特別所得税2.1%を含めた実効税率で計算されます。' },
      { q: '年収500万円でふるさと納税はいくらできますか？', a: '年収500万円・独身の場合、ふるさと納税の控除上限額は約61,000円です。<a href="/tax-finance/furusato-nozei/">ふるさと納税計算ツール</a>で正確な上限額を計算できます。' }
    ]
  },
  6000000: {
    h2_1: '年収600万円で税負担が増え始める',
    p1: '年収600万円は、課長クラスや専門職に就いている方に多い収入帯です。月々の手取りは約38.1万円ですが、税負担が目に見えて増え始める水準でもあります。所得税率が20%帯に入り、住民税と合わせると30%近い税率になるため、節税対策の重要性が高まります。',
    h2_2: '節税の必要性と具体策',
    p2: '年収600万円では、iDeCo（個人型確定拠出年金）の活用が特に効果的です。会社員の場合、月12,000〜23,000円の掛金が全額所得控除となり、年間で3〜7万円の節税になります。ふるさと納税の控除上限は約77,000円で、実質2,000円の負担で地域の特産品を受け取れます。医療費控除（年間10万円超の部分）や生命保険料控除なども忘れずに活用しましょう。年末調整で控除しきれない場合は確定申告で還付を受けられます。',
    faq: [
      { q: '年収600万円の手取りはいくらですか？', a: '年収600万円（月収50万円）の場合、手取りは月約38.1万円、年間約457万円です。控除率は約24%です。' },
      { q: '年収600万円の所得税率は何%ですか？', a: '年収600万円の課税所得は約300万円前後となり、所得税率は10%〜20%が適用されます。住民税10%と合わせると、限界税率は約30%です。' },
      { q: '年収600万円で効果的な節税方法は？', a: 'iDeCo（年間最大27.6万円の所得控除）、ふるさと納税（上限約77,000円）、医療費控除、生命保険料控除が効果的です。すべて活用すれば年間10万円以上の節税が可能です。' }
    ]
  },
  7000000: {
    h2_1: '年収700万円は管理職・専門職クラス',
    p1: '年収700万円は、大企業の課長職や中堅企業の部長職、ITエンジニア・コンサルタントなどの専門職に多い収入帯です。月々の手取りは約44.1万円で、経済的にはかなり安定した水準です。ただし、収入が上がるにつれて税率も上がるため、額面ほどの手取り増加を感じにくい「税負担の壁」を実感し始める段階でもあります。',
    h2_2: '扶養控除の活用と家族構成の影響',
    p2: '配偶者の年収が103万円以下であれば配偶者控除（38万円）が適用され、手取りが改善します。16歳以上の扶養家族1人につき38万円の控除が受けられるため、子育て世帯では控除を最大限活用しましょう。年収700万円で配偶者控除＋扶養1人の場合、手取りは月1〜2万円程度改善します。ふるさと納税の控除上限は約108,000円で、様々な返礼品を選べます。',
    faq: [
      { q: '年収700万円の手取りはいくらですか？', a: '年収700万円（月収約58.3万円）の場合、手取りは月約44.1万円、年間約529万円です。控除率は約24%です。' },
      { q: '年収700万円は上位何%ですか？', a: '国税庁の調査によると、年収700万円以上の給与所得者は全体の約15%です。上位15%に位置する高収入層といえます。' },
      { q: '年収700万円で扶養控除を使うとどうなりますか？', a: '配偶者控除と扶養控除（子供1人）を適用すると、所得税・住民税が軽減され、手取りは月1.5〜2万円程度改善します。上の計算ツールで確認できます。' }
    ]
  },
  8000000: {
    h2_1: '年収800万円は高収入層の入口',
    p1: '年収800万円は、日本の給与所得者の上位10%に入る高収入層です。月々の手取りは約49.8万円で、経済的にはかなり余裕のある生活が可能です。大企業の部長職、外資系企業のマネージャー、医師・弁護士などの専門職に多い収入帯です。ただし、所得税率20%帯の上限に近づくため、税負担を意識した家計管理が重要です。',
    h2_2: 'ふるさと納税の恩恵が大きい年収帯',
    p2: '年収800万円のふるさと納税控除上限は約129,000円です。実質2,000円の負担で、高級食材や家電製品など幅広い返礼品を受け取ることができます。また、住宅ローン控除は最大年間35万円（新築の場合）で、年収800万円では控除枠をフルに活用できます。iDeCoとつみたてNISAの併用で、老後資金を効率的に積み立てながら節税効果も得られます。',
    faq: [
      { q: '年収800万円の手取りはいくらですか？', a: '年収800万円（月収約66.7万円）の場合、手取りは月約49.8万円、年間約598万円です。控除率は約25%です。' },
      { q: '年収800万円のふるさと納税上限はいくらですか？', a: '独身・扶養なしの場合、ふるさと納税の控除上限は約129,000円です。<a href="/tax-finance/furusato-nozei/">ふるさと納税計算ツール</a>で家族構成に応じた正確な上限を計算できます。' },
      { q: '年収800万円は上位何%ですか？', a: '国税庁の民間給与実態統計調査によると、年収800万円以上の給与所得者は全体の約9.7%です。上位10%の高収入層に該当します。' }
    ]
  },
  10000000: {
    h2_1: '年収1000万円の壁 — 税率が大きくジャンプ',
    p1: '「年収1000万円」は多くの人が目標とする大台ですが、実は税負担が急激に増える水準でもあります。月々の手取りは約61万円で、額面の約73%しか手元に残りません。所得税率23%帯に突入し、住民税10%と合わせた限界税率は約33%です。さらに、児童手当の所得制限（年収約960万円）にかかるため、子育て世帯は手当が減額されるデメリットもあります。',
    h2_2: '年収1000万円の節税戦略',
    p2: '年収1000万円では、節税対策の効果が大きくなります。iDeCo（年間27.6万円の所得控除で約8万円の節税）、ふるさと納税（上限約176,000円）、住宅ローン控除（最大35万円/年）の3つを組み合わせると、年間50万円以上の節税・還付が可能です。また、配偶者の収入が150万円以下であれば配偶者特別控除も適用されます。特定支出控除（通勤費・転居費・研修費など）が給与所得控除の半額を超える場合は確定申告で追加控除を受けられます。',
    faq: [
      { q: '年収1000万円の手取りはいくらですか？', a: '年収1000万円（月収約83.3万円）の場合、手取りは月約61万円、年間約732万円です。控除率は約27%で、額面の約4分の3が手取りとなります。' },
      { q: '年収1000万円の所得税率は何%ですか？', a: '年収1000万円の課税所得は約550〜600万円となり、所得税率23%が適用されます（課税所得695万円超の部分）。住民税10%と合わせた限界税率は約33%です。' },
      { q: '年収1000万円で児童手当はもらえますか？', a: '年収1000万円は児童手当の所得制限（扶養親族数により異なるが目安は年収約960万円）を超える可能性が高く、手当が減額または不支給になる場合があります。世帯の状況により異なるため、お住まいの自治体にご確認ください。' }
    ]
  },
  15000000: {
    h2_1: '年収1500万円は経営層・外資系の水準',
    p1: '年収1500万円は、大企業の役員、外資系企業のディレクター・VP、開業医、弁護士パートナーなどに多い収入帯です。月々の手取りは約87.3万円ですが、控除率は約30%に達します。所得税率33%帯に入るため、100万円の昇給に対して手取り増加は約60万円にとどまります。高収入ほど「稼いでも手元に残らない」感覚が強まる水準です。',
    h2_2: '住民税の影響と確定申告',
    p2: '年収1500万円の住民税は年間約100万円以上になります。給与所得以外の収入（副業・株式配当・不動産所得など）がある場合は確定申告が必要です。年収2000万円以下でも、医療費控除やふるさと納税の寄附金控除を受けるには確定申告が有効です。ふるさと納税の控除上限は約379,000円で、高級食材や旅行券など豊富な返礼品を選択できます。法人設立やマイクロ法人の活用で、所得分散による節税を検討する方も増えています。',
    faq: [
      { q: '年収1500万円の手取りはいくらですか？', a: '年収1500万円（月収125万円）の場合、手取りは月約87.3万円、年間約1,047万円です。控除率は約30%で、額面の約7割が手取りです。' },
      { q: '年収1500万円で確定申告は必要ですか？', a: '給与所得のみで年末調整済みの場合、原則不要です。ただし、副業収入が20万円超ある場合、医療費控除を受けたい場合、ふるさと納税で6自治体以上に寄付した場合は確定申告が必要です。' },
      { q: '年収1500万円の住民税はいくらですか？', a: '年収1500万円の住民税は年間約100〜110万円（月額約8.5〜9万円）です。住民税は前年所得に基づくため、転職や退職時は注意が必要です。' }
    ]
  },
  20000000: {
    h2_1: '年収2000万円 — 最高税率に近い水準',
    p1: '年収2000万円は、給与所得者の上位1%に位置する超高収入層です。月々の手取りは約109.3万円ですが、控除率は約34%に達し、年間約680万円が税金・社会保険料として差し引かれます。所得税率33%〜40%帯に該当し、住民税10%と合わせた限界税率は43〜50%です。この収入帯では、年末調整ではなく確定申告が義務付けられています（給与収入2000万円超）。',
    h2_2: '資産運用・節税対策の重要性',
    p2: '年収2000万円の方は、給与所得控除の上限（195万円）に達しているため、それ以上の収入増加分はフルに課税されます。節税対策として、不動産投資による減価償却費の活用、法人設立による所得分散、海外資産の活用などを検討する方もいます。ふるさと納税の控除上限は約564,000円と大きく、戦略的な寄付で大きなリターンが得られます。ただし、総合課税の所得が増えると各種控除の制限を受けるため、税理士との相談を強くお勧めします。',
    faq: [
      { q: '年収2000万円の手取りはいくらですか？', a: '年収2000万円（月収約166.7万円）の場合、手取りは月約109.3万円、年間約1,312万円です。控除率は約34%で、約3分の1が税金・社会保険料です。' },
      { q: '年収2000万円は確定申告が必須ですか？', a: 'はい。給与収入が2,000万円を超える場合、年末調整の対象外となり、確定申告が義務付けられています。申告期限は翌年3月15日です。' },
      { q: '年収2000万円の所得税率は何%ですか？', a: '年収2000万円の課税所得は約1,300万円前後で、所得税率33%が適用されます。住民税10%と合わせた限界税率は約43%です。復興特別所得税を含めると実効税率はさらに上がります。' }
    ]
  }
};

const EDITORIAL_EN = {
  2000000: {
    h2_1: 'Living on a \u00A52 Million Salary in Japan',
    p1: 'An annual income of \u00A52,000,000 is common among part-time workers (freeter/arubaito), non-regular employees, and those in entry-level positions. Monthly take-home pay is approximately \u00A5132,000, which makes independent living challenging in major cities like Tokyo or Osaka. In rural areas with lower rent, this income level is more manageable, though savings opportunities remain limited.',
    h2_2: 'Tips for Maximizing Your Take-Home at \u00A52M',
    p2: 'While the effective deduction rate of about 21% is relatively low, the absolute take-home amount is modest. Key strategies include minimizing fixed costs: switching to budget mobile plans, cooking at home, and finding affordable housing. If you\'re currently on National Health Insurance (kokumin kenko hoken), transitioning to a company with shakai hoken coverage may improve your net income. Consider developing skills or exploring side income opportunities to increase your earning potential.',
    faq: [
      { q: 'What is the take-home pay for a \u00A52M salary in Japan?', a: 'On an annual salary of \u00A52,000,000 (monthly gross ~\u00A5166,667), your estimated take-home pay is approximately \u00A5132,000/month or \u00A51.58M/year after social insurance, income tax, and resident tax deductions.' },
      { q: 'Can you live alone on \u00A52 million a year in Japan?', a: 'It is possible in rural areas or smaller cities where rent is \u00A530,000-40,000/month. However, in Tokyo or Osaka, it would be very tight with little room for savings after covering rent, food, and utilities.' },
      { q: 'What tax rate applies to a \u00A52M annual income?', a: 'At \u00A52M annual income, the income tax rate is 5% (the lowest bracket). Combined with resident tax (~10%), the effective overall deduction rate is approximately 21%.' }
    ]
  },
  3000000: {
    h2_1: '\u00A53 Million — A Typical Starting Salary in Japan',
    p1: 'An annual salary of \u00A53,000,000 is typical for fresh graduates and early-career employees in Japan. Monthly take-home pay is approximately \u00A5196,000, which allows for a comfortable single lifestyle in most Japanese cities. University graduates in Japan typically start at \u00A5220,000-230,000/month (\u00A52.65-2.8M annually), making \u00A53M a standard income for those in their first 1-3 years of work.',
    h2_2: 'Budgeting and Saving at \u00A53M',
    p2: 'With monthly take-home of about \u00A5200,000, the general rule is to keep rent within 30% (~\u00A560,000). After food (\u00A530,000-40,000), phone (\u00A55,000), and transportation, you can realistically save \u00A520,000-30,000/month. Starting early with tsumitate NISA (tax-free investment savings) or iDeCo (individual defined contribution pension) is highly recommended for long-term wealth building. If your company offers bonuses, your effective annual take-home will be significantly higher.',
    faq: [
      { q: 'What is the take-home pay for a \u00A53M salary in Japan?', a: 'On an annual salary of \u00A53,000,000 (monthly gross \u00A5250,000), estimated take-home is approximately \u00A5196,000/month or \u00A52.35M/year. Social insurance is the largest deduction at ~\u00A537,000/month.' },
      { q: 'Is \u00A53 million a good salary for a new graduate in Japan?', a: 'Yes, it is around the average starting salary for university graduates in Japan. The national average starting salary is approximately \u00A5220,000-230,000/month, so \u00A53M is a solid starting point.' },
      { q: 'How much can I donate via furusato nozei on a \u00A53M salary?', a: 'With a \u00A53M annual salary (single, no dependents), your furusato nozei deduction limit is approximately \u00A528,000. Use our <a href="/en/tax-finance/furusato-nozei/">Furusato Nozei Calculator</a> for a precise estimate.' }
    ]
  },
  4000000: {
    h2_1: '\u00A54 Million — Near Japan\'s Average Income',
    p1: 'An annual income of \u00A54,000,000 is close to Japan\'s national average salary of approximately \u00A54.6 million (per the National Tax Agency survey). Monthly take-home is about \u00A5259,000, providing a comfortable standard of living for singles and dual-income couples. This income level is common among employees in their late 20s to early 30s at mid-to-large companies.',
    h2_2: 'Family Planning and Housing at \u00A54M',
    p2: 'For families at this income level, utilizing spousal deduction (haigusha koujo) and dependent deductions can meaningfully improve take-home pay. The typical mortgage borrowing capacity is 5-7x annual income (\u00A520-28M). Japan\'s housing loan tax credit (jutaku loan koujo) provides up to 13 years of tax credits on your mortgage balance. Don\'t forget to apply for child allowance (jido teate) and medical expense deductions when applicable.',
    faq: [
      { q: 'What is the take-home pay for a \u00A54M salary in Japan?', a: 'On an annual salary of \u00A54,000,000 (monthly gross ~\u00A5333,333), estimated take-home is approximately \u00A5259,000/month or \u00A53.11M/year, with an effective deduction rate of about 22%.' },
      { q: 'Is \u00A54 million close to Japan\'s average salary?', a: 'Japan\'s average annual salary is approximately \u00A54.6 million (National Tax Agency data). At \u00A54M, you are slightly below average but within the typical range for workers in their late 20s to early 30s.' },
      { q: 'How much mortgage can I get on a \u00A54M salary?', a: 'Generally 5-7x your annual income, meaning \u00A520-28 million. Lenders typically require that annual repayments stay within 25-30% of gross income.' }
    ]
  },
  5000000: {
    h2_1: '\u00A55 Million — Mid-Career Professional Level',
    p1: 'An annual salary of \u00A55,000,000 is typical for mid-career professionals in their 30s-40s in Japan. Monthly take-home is approximately \u00A5320,000, providing comfortable living for individuals and couples. This income level is close to Japan\'s median salary and serves as a benchmark for many financial planning decisions including housing loans and investment strategies.',
    h2_2: 'Mortgage Eligibility and Financial Planning',
    p2: 'At \u00A55M, most banks offer favorable mortgage rates, and you can typically borrow \u00A530-35M. This opens up property options in suburban Tokyo or central areas of other major cities. The housing loan tax credit can save you up to \u00A5350,000/year. Combined with iDeCo contributions (\u00A523,000/month = ~\u00A555,000 annual tax savings) and furusato nozei (limit ~\u00A561,000), you can optimize your tax position significantly. Consider consulting with a financial planner to maximize these benefits.',
    faq: [
      { q: 'What is the take-home pay for a \u00A55M salary in Japan?', a: 'On an annual salary of \u00A55,000,000 (monthly gross ~\u00A5416,667), estimated take-home is approximately \u00A5320,000/month or \u00A53.84M/year. About 23% of your gross salary goes to deductions.' },
      { q: 'What income tax rate applies to a \u00A55M salary?', a: 'At \u00A55M annual income, your taxable income falls in the 10% bracket (with the portion below \u00A51.95M taxed at 5%). Including the 2.1% reconstruction surtax and 10% resident tax, the marginal rate is about 20%.' },
      { q: 'How much furusato nozei can I do at \u00A55M?', a: 'With a \u00A55M annual salary (single, no dependents), your furusato nozei limit is approximately \u00A561,000. Check our <a href="/en/tax-finance/furusato-nozei/">Furusato Nozei Calculator</a> for your exact limit.' }
    ]
  },
  6000000: {
    h2_1: '\u00A56 Million — Where Tax Burden Starts to Bite',
    p1: 'At \u00A56,000,000 annual income, you enter the territory where tax optimization becomes noticeably important. Monthly take-home is approximately \u00A5381,000, but the effective deduction rate reaches about 24%. The income tax rate steps up to the 20% bracket for a significant portion of your taxable income, and combined with resident tax, the marginal rate approaches 30%.',
    h2_2: 'Tax Optimization Strategies',
    p2: 'Key strategies at this income level include: iDeCo contributions (up to \u00A523,000/month for company employees, fully tax-deductible), furusato nozei (limit ~\u00A577,000), and medical expense deductions (for annual medical costs exceeding \u00A5100,000). If you have a non-working spouse, the spousal deduction (\u00A5380,000) provides significant tax relief. Life insurance premium deductions (up to \u00A5120,000 combined) are another commonly overlooked benefit. Filing a tax return (kakutei shinkoku) even when not required can help claim deductions missed during year-end adjustment.',
    faq: [
      { q: 'What is the take-home pay for a \u00A56M salary in Japan?', a: 'On an annual salary of \u00A56,000,000 (monthly gross \u00A5500,000), estimated take-home is approximately \u00A5381,000/month or \u00A54.57M/year, with an effective deduction rate of about 24%.' },
      { q: 'What tax bracket does \u00A56M fall into?', a: 'At \u00A56M, your taxable income is approximately \u00A53M, placing you in the 10-20% income tax brackets. Combined with 10% resident tax, the marginal rate on additional income is about 30%.' },
      { q: 'What are the best tax-saving methods at \u00A56M?', a: 'iDeCo (up to \u00A5276,000/year in deductions), furusato nozei (limit ~\u00A577,000), medical expense deductions, and life insurance premium deductions. Combined savings can exceed \u00A5100,000/year.' }
    ]
  },
  7000000: {
    h2_1: '\u00A57 Million — Manager and Specialist Level',
    p1: 'An annual salary of \u00A57,000,000 is typical for section managers (kacho) at large companies, mid-level managers at SMEs, and specialists such as IT engineers and consultants. Monthly take-home is approximately \u00A5441,000. While this provides financial stability, you begin to feel the "tax wall" where salary increases are significantly diminished by progressive taxation.',
    h2_2: 'Dependent Deductions and Family Impact',
    p2: 'If your spouse earns less than \u00A51.03M/year, you qualify for the spousal deduction (\u00A5380,000). Each dependent aged 16+ provides an additional \u00A5380,000 deduction. For a \u00A57M earner with a spouse and one child, take-home improves by \u00A510,000-20,000/month. Furusato nozei limit is approximately \u00A5108,000, making it one of the most impactful tax-saving tools at this income level. Consider maximizing iDeCo and NISA contributions for long-term wealth building.',
    faq: [
      { q: 'What is the take-home pay for a \u00A57M salary in Japan?', a: 'On an annual salary of \u00A57,000,000 (monthly gross ~\u00A5583,333), estimated take-home is approximately \u00A5441,000/month or \u00A55.29M/year. The effective deduction rate is about 24%.' },
      { q: 'Is \u00A57M in the top percentile of Japanese earners?', a: 'Yes, earners above \u00A57M represent approximately the top 15% of salary workers in Japan, according to the National Tax Agency statistics.' },
      { q: 'How do dependent deductions affect a \u00A57M salary?', a: 'With spousal deduction and one dependent child (16+), your income tax and resident tax decrease, improving monthly take-home by approximately \u00A515,000-20,000.' }
    ]
  },
  8000000: {
    h2_1: '\u00A58 Million — Entering the High-Income Bracket',
    p1: 'An annual income of \u00A58,000,000 places you in the top 10% of Japanese salary earners. Monthly take-home is approximately \u00A5498,000, with about 25% going to deductions. This income level is common among department heads (bucho) at large companies, foreign company managers, and established professionals such as physicians and attorneys.',
    h2_2: 'Maximizing Furusato Nozei Benefits',
    p2: 'At \u00A58M, your furusato nozei deduction limit is approximately \u00A5129,000 — enough to receive substantial return gifts (premium food, electronics, travel vouchers) at a net cost of just \u00A52,000. The housing loan tax credit (up to \u00A5350,000/year for new homes) is fully utilizable at this income level. Combining iDeCo and tsumitate NISA allows you to build retirement savings tax-efficiently while reducing your current tax burden.',
    faq: [
      { q: 'What is the take-home pay for an \u00A58M salary in Japan?', a: 'On an annual salary of \u00A58,000,000 (monthly gross ~\u00A5666,667), estimated take-home is approximately \u00A5498,000/month or \u00A55.98M/year. The effective deduction rate is about 25%.' },
      { q: 'What is the furusato nozei limit at \u00A58M?', a: 'For a single person with no dependents earning \u00A58M, the furusato nozei deduction limit is approximately \u00A5129,000. Use our <a href="/en/tax-finance/furusato-nozei/">Furusato Nozei Calculator</a> for your exact limit.' },
      { q: 'Is \u00A58M in the top 10% in Japan?', a: 'Yes, according to the National Tax Agency\'s survey, earners above \u00A58M represent approximately 9.7% of all salary workers in Japan.' }
    ]
  },
  10000000: {
    h2_1: '\u00A510 Million — The Psychological Milestone and Tax Wall',
    p1: 'The \u00A510 million mark is an aspirational milestone for many Japanese workers, but it comes with a significant tax reality check. Monthly take-home is approximately \u00A5610,000 — just 73% of gross pay. The income tax rate jumps to the 23% bracket, and combined with 10% resident tax, the marginal rate on additional income reaches 33%. Furthermore, child allowance (jido teate) income limits kick in around \u00A59.6M, meaning families at \u00A510M may see reduced or eliminated benefits.',
    h2_2: 'Tax Strategy at the \u00A510M Level',
    p2: 'At \u00A510M, every tax optimization tool matters: iDeCo saves approximately \u00A580,000/year in taxes, furusato nozei limit is ~\u00A5176,000, and housing loan credit can provide up to \u00A5350,000/year. Combined, these three tools alone can save over \u00A5500,000 annually. Consider also the specified expenditure deduction (tokutei shishutsu koujo) for work-related expenses exceeding half the employment income deduction. If you have business income or investments, consulting a certified tax accountant (zeirishi) is strongly recommended.',
    faq: [
      { q: 'What is the take-home pay for a \u00A510M salary in Japan?', a: 'On an annual salary of \u00A510,000,000 (monthly gross ~\u00A5833,333), estimated take-home is approximately \u00A5610,000/month or \u00A57.32M/year. About 27% goes to deductions — you keep roughly three-quarters.' },
      { q: 'What is the income tax rate at \u00A510M?', a: 'Taxable income at \u00A510M is approximately \u00A55.5-6M, placing you in the 23% income tax bracket (for the portion above \u00A56.95M taxable). Combined with 10% resident tax, the marginal rate is about 33%.' },
      { q: 'Does earning \u00A510M affect child allowance in Japan?', a: 'Yes, the income limit for full child allowance is approximately \u00A59.6M (varies by number of dependents). At \u00A510M, your child allowance may be reduced or eliminated entirely depending on family circumstances.' }
    ]
  },
  15000000: {
    h2_1: '\u00A515 Million — Executive and Foreign-Company Level',
    p1: 'An annual salary of \u00A515,000,000 is typical for corporate executives, foreign company directors/VPs, established physicians, and senior law firm partners. Monthly take-home is approximately \u00A5873,000, but the deduction rate reaches about 30%. The income tax rate enters the 33% bracket, meaning for every additional \u00A51M earned, only about \u00A5600,000 reaches your bank account.',
    h2_2: 'Resident Tax Impact and Tax Filing',
    p2: 'Annual resident tax at \u00A515M exceeds \u00A51 million. If you have income beyond salary (side business, stock dividends, rental income), tax filing (kakutei shinkoku) becomes necessary. Even below \u00A520M salary, filing is worthwhile to claim medical deductions and furusato nozei credits (limit ~\u00A5379,000). Some high earners at this level explore micro-corporation structures for income splitting and tax optimization. Professional tax advice from a certified zeirishi is highly recommended.',
    faq: [
      { q: 'What is the take-home pay for a \u00A515M salary in Japan?', a: 'On an annual salary of \u00A515,000,000 (monthly gross \u00A51,250,000), estimated take-home is approximately \u00A5873,000/month or \u00A510.47M/year. About 30% goes to deductions.' },
      { q: 'Is tax filing required at \u00A515M salary?', a: 'Not required if it\'s salary-only and under \u00A520M with year-end adjustment completed. However, filing is recommended to claim furusato nozei (6+ municipalities), medical deductions, and other credits.' },
      { q: 'How much is resident tax at \u00A515M?', a: 'Resident tax at \u00A515M annual salary is approximately \u00A51-1.1M/year (~\u00A585,000-92,000/month). Remember that resident tax is based on prior year income and starts from June.' }
    ]
  },
  20000000: {
    h2_1: '\u00A520 Million — Near the Top of Japan\'s Tax Brackets',
    p1: 'An annual salary of \u00A520,000,000 puts you in the top 1% of Japanese earners. Monthly take-home is approximately \u00A51,093,000, but the effective deduction rate reaches about 34%, meaning roughly \u00A56.8M/year goes to taxes and social insurance. The income tax rate is in the 33-40% range, and importantly, salary earners above \u00A520M are required by law to file their own tax return (year-end adjustment does not apply).',
    h2_2: 'Wealth Management and Tax Planning',
    p2: 'At \u00A520M, the employment income deduction is capped at \u00A51.95M, so any income increase above this ceiling is fully taxed. Strategic approaches include: real estate investment for depreciation deductions, corporate establishment for income splitting, and systematic use of tax-advantaged accounts. Furusato nozei limit is approximately \u00A5564,000. Given the complexity of tax obligations at this level, working with a certified tax accountant (zeirishi) and financial planner is essential rather than optional.',
    faq: [
      { q: 'What is the take-home pay for a \u00A520M salary in Japan?', a: 'On an annual salary of \u00A520,000,000 (monthly gross ~\u00A51,666,667), estimated take-home is approximately \u00A51,093,000/month or \u00A513.12M/year. About 34% — roughly one-third — goes to deductions.' },
      { q: 'Is tax filing mandatory at \u00A520M salary?', a: 'Yes. Salary earners with gross pay exceeding \u00A520 million are excluded from year-end adjustment (nenmatsu chosei) and must file a tax return (kakutei shinkoku) by March 15 of the following year.' },
      { q: 'What is the income tax rate at \u00A520M?', a: 'Taxable income at \u00A520M is approximately \u00A513M, placing most of it in the 33% income tax bracket. Combined with 10% resident tax and 2.1% reconstruction surtax, the marginal rate is approximately 43%.' }
    ]
  }
};

// ===== TEMPLATE FUNCTIONS =====

function generateJPPage(amount) {
  const monthly = Math.round(amount / 12);
  const r = calculateTakeHome(monthly);
  const man = manLabel(amount);
  const monthlyMan = (monthly / 10000).toFixed(1);
  const ed = EDITORIAL_JP[amount];
  const jpUrl = `/tax-finance/salary-calculator/${amount}/`;
  const enUrl = `/en/tax-finance/salary-calculator/${amount}/`;
  const fullJpUrl = `https://japancalc.com${jpUrl}`;
  const fullEnUrl = `https://japancalc.com${enUrl}`;

  // Build comparison table rows
  const compRows = AMOUNTS.map(a => {
    const m = Math.round(a / 12);
    const cr = calculateTakeHome(m);
    const isHighlight = a === amount;
    const cls = isHighlight ? ' class="highlight-row"' : '';
    const b = isHighlight ? '<strong>' : '';
    const be = isHighlight ? '</strong>' : '';
    const arrow = isHighlight ? ' \u2190' : '';
    const aMan = (a / 10000).toLocaleString('ja-JP');
    const mMan = (m / 10000).toFixed(1);
    return `    <tr${cls}><td>${b}${aMan}\u4E07\u5186${arrow}${be}</td><td>${b}\u7D04${mMan}\u4E07${be}</td><td>${b}\u7D04${(Math.round(cr.takeHome / 10000 * 10) / 10).toFixed(1)}\u4E07${be}</td><td>${b}\u7D04${Math.round(cr.takeHome * 12 / 10000)}\u4E07${be}</td><td>${b}~${cr.effectiveRate}${be}</td></tr>`;
  }).join('\n');

  // Build FAQ details
  const faqHtml = ed.faq.map(f => `      <details class="faq-item">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`).join('\n\n');

  // FAQ JSON-LD
  const faqJsonLd = ed.faq.map(f => `      {
        "@type": "Question",
        "name": "${f.q.replace(/"/g, '&quot;')}",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "${f.a.replace(/"/g, '&quot;').replace(/<[^>]+>/g, '')}"
        }
      }`).join(',\n');

  const descText = `\u5E74\u53CE${man}\u4E07\u5186\uFF08\u6708\u53CE\u7D04${monthlyMan}\u4E07\u5186\uFF09\u306E\u624B\u53D6\u308A\u306F\u6708\u7D04${(Math.round(r.takeHome / 10000 * 10) / 10).toFixed(1)}\u4E07\u5186\u3001\u5E74\u9593\u7D04${Math.round(r.takeHome * 12 / 10000)}\u4E07\u5186\u3067\u3059\u3002\u6240\u5F97\u7A0E\u30FB\u4F4F\u6C11\u7A0E\u30FB\u793E\u4F1A\u4FDD\u967A\u6599\u306E\u5185\u8A33\u3092\u8A73\u3057\u304F\u89E3\u8AAC\u3002\u7121\u6599\u624B\u53D6\u308A\u8A08\u7B97\u30C4\u30FC\u30EB\u3002`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u5E74\u53CE${man}\u4E07\u306E\u624B\u53D6\u308A\u306F\u3044\u304F\u3089\uFF1F2026\u5E74\u7248 | JapanCalc</title>
  <meta name="description" content="${descText}">
  <link rel="canonical" href="${fullJpUrl}">
  <link rel="alternate" hreflang="ja"        href="${fullJpUrl}">
  <link rel="alternate" hreflang="en"        href="${fullEnUrl}">
  <link rel="alternate" hreflang="x-default" href="${fullJpUrl}">
  <meta property="og:title"       content="\u5E74\u53CE${man}\u4E07\u306E\u624B\u53D6\u308A\u306F\u3044\u304F\u3089\uFF1F2026\u5E74\u7248 | JapanCalc">
  <meta property="og:description" content="${descText}">
  <meta property="og:url"         content="${fullJpUrl}">
  <meta property="og:type"        content="website">
  <meta property="og:image" content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="shortcut icon" href="/favicon.ico">
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-P9TH5C7P9H"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-P9TH5C7P9H');
</script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "\u30DB\u30FC\u30E0", "item": "https://japancalc.com/" },
      { "@type": "ListItem", "position": 2, "name": "\u7A0E\u91D1\u30FB\u8CA1\u52D9", "item": "https://japancalc.com/tax-finance/" },
      { "@type": "ListItem", "position": 3, "name": "\u624B\u53D6\u308A\u8A08\u7B97", "item": "https://japancalc.com/tax-finance/salary-calculator/" },
      { "@type": "ListItem", "position": 4, "name": "\u5E74\u53CE${man}\u4E07\u306E\u624B\u53D6\u308A", "item": "${fullJpUrl}" }
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
${faqJsonLd}
    ]
  }
  </script>

  <link rel="stylesheet" href="/assets/css/main.css">
  <script async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
    crossorigin="anonymous"></script>

  <style>
  .subpage-result-static { background: var(--color-bg-alt); border-radius: var(--radius); padding: 1.5rem; margin: 1.5rem 0; border: 1px solid var(--color-border); }
  .subpage-result-primary { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  @media (max-width: 600px) { .subpage-result-primary { grid-template-columns: 1fr; } }
  .subpage-result-item { padding: 0.75rem; background: var(--color-bg); border-radius: var(--radius); border: 1px solid var(--color-border); }
  .subpage-result-item.main { border-color: var(--color-accent); border-width: 2px; }
  .subpage-result-label { display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .subpage-result-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-mono); }
  .subpage-result-item.main .subpage-result-value { font-size: 1.6rem; color: var(--color-accent); }
  .deduction-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
  .deduction-table td { padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--color-border); }
  .deduction-table td:last-child { text-align: right; font-family: var(--font-mono); white-space: nowrap; }
  .deduction-table tr:last-child td { border-bottom: 2px solid var(--color-border); font-weight: 700; }
  .subpage-disclaimer { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius); border-left: 3px solid var(--color-warning); }
  .highlight-row { background: rgba(11, 110, 95, 0.08); }
  .highlight-row td { font-weight: 600; }
  .deduction-bar-wrap { background: var(--color-bg-alt); border-radius: var(--radius); padding: 1rem; margin: 1rem 0; border: 1px solid var(--color-border); }
  .deduction-bar { height: 20px; background: var(--color-border); border-radius: 99px; overflow: hidden; margin: 0.5rem 0; }
  .deduction-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-primary)); border-radius: 99px; transition: width 0.4s ease; }
  .deduction-bar-labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--color-text-muted); }
  .deduction-grid { display: grid; grid-template-columns: 1fr auto; gap: 0.4rem 1rem; margin: 1rem 0; font-size: 0.9rem; }
  .deduction-row-label { color: var(--color-text); }
  .deduction-row-value { font-family: var(--font-mono); font-weight: 500; text-align: right; white-space: nowrap; }
  .deduction-total { border-top: 2px solid var(--color-border); padding-top: 0.5rem; font-weight: 700; }
  .salary-disclaimer { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius); border-left: 3px solid var(--color-warning); }
  .annual-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.875rem; }
  .annual-section h3 { font-size: 0.875rem; color: var(--color-text-muted); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .btn-copy-result { padding: 0.5rem 1rem; border: none; border-radius: var(--radius); background: var(--color-accent); color: white; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: opacity 0.15s; }
  .btn-copy-result:hover { opacity: 0.85; }
  </style>
</head>
<body>

<style>
  nav.site-nav.nav-open .nav-links {
    display: flex; flex-direction: column; position: absolute;
    top: 56px; left: 0; right: 0; background: var(--color-primary);
    padding: 1rem; gap: 0.5rem; z-index: 100;
  }
</style>

<a href="#main-content" class="skip-link">\u30E1\u30A4\u30F3\u30B3\u30F3\u30C6\u30F3\u30C4\u3078\u30B9\u30AD\u30C3\u30D7</a>

<nav class="site-nav" aria-label="\u30E1\u30A4\u30F3\u30CA\u30D3\u30B2\u30FC\u30B7\u30E7\u30F3">
  <a href="/" class="nav-logo" aria-label="JapanCalc \u30DB\u30FC\u30E0">
  <img src="/assets/icons/logo-white.svg" alt="JapanCalc" width="160" height="40" loading="eager" fetchpriority="high">
</a>
  <ul class="nav-links" id="nav-links-menu">
    <li><a href="/date-calendar/">\u65E5\u4ED8\u30FB\u30AB\u30EC\u30F3\u30C0\u30FC</a></li>
    <li><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a></li>
    <li><a href="/language-tools/">\u8A00\u8A9E\u30C4\u30FC\u30EB</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:0.5rem;">
    <div class="lang-switcher" role="navigation" aria-label="\u8A00\u8A9E\u5207\u66FF">
      <span class="lang-option lang-active" aria-current="true">JP</span>
      <span class="lang-sep">&middot;</span>
      <a class="lang-option lang-inactive" id="lang-toggle"
         href="${enUrl}" lang="en" title="View in English"
         aria-label="Switch to English">EN</a>
    </div>
    <button class="nav-hamburger" aria-label="\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F" aria-expanded="false" aria-controls="nav-links-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>
</nav>

<nav class="breadcrumb" aria-label="\u30D1\u30F3\u304F\u305A\u30EA\u30B9\u30C8">
  <ol>
    <li><a href="/">\u30DB\u30FC\u30E0</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li><a href="/tax-finance/salary-calculator/">\u624B\u53D6\u308A\u8A08\u7B97</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li aria-current="page">\u5E74\u53CE${man}\u4E07\u306E\u624B\u53D6\u308A</li>
  </ol>
</nav>

<div class="ad-zone ad-atf" style="min-height:90px; margin:0 auto 1rem;">
  <ins class="adsbygoogle" style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="SLOT_ATF_SALARY_SUB"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>

<div class="page-layout">
  <main class="content" id="main-content">

    <h1>\u5E74\u53CE${man}\u4E07\u5186\u306E\u624B\u53D6\u308A\u306F\u3044\u304F\u3089\uFF1F</h1>
    <p class="tool-desc">
      \u5E74\u53CE${man}\u4E07\u5186\uFF08\u6708\u53CE\u7D04${monthlyMan}\u4E07\u5186\uFF09\u306E\u624B\u53D6\u308A\u3092\u8A08\u7B97\u3002\u6240\u5F97\u7A0E\u30FB\u4F4F\u6C11\u7A0E\u30FB\u793E\u4F1A\u4FDD\u967A\u6599\u306E\u63A7\u9664\u5185\u8A33\u3092\u8A73\u3057\u304F\u89E3\u8AAC\u3002
      2026\u5E74\u5EA6\u7A0E\u7387\u5BFE\u5FDC\u3002\u7121\u6599\u3001\u30ED\u30B0\u30A4\u30F3\u4E0D\u8981\u3002
    </p>

    <!-- STATIC PRE-COMPUTED RESULT \u2014 overwritten by JS on load -->
    <div class="subpage-result-static">
      <h2>\u5E74\u53CE${man}\u4E07\u5186\u306E\u624B\u53D6\u308A\uFF082026\u5E74\u5EA6\uFF09</h2>
      <div class="subpage-result-primary">
        <div class="subpage-result-item main">
          <span class="subpage-result-label">\u6708\u3005\u306E\u624B\u53D6\u308A\uFF08\u76EE\u5B89\uFF09</span>
          <span class="subpage-result-value" id="static-monthly">\u7D04${(Math.round(r.takeHome / 10000 * 10) / 10).toFixed(1)}\u4E07\u5186</span>
        </div>
        <div class="subpage-result-item">
          <span class="subpage-result-label">\u5E74\u9593\u624B\u53D6\u308A\uFF08\u76EE\u5B89\uFF09</span>
          <span class="subpage-result-value" id="static-annual">\u7D04${Math.round(r.takeHome * 12 / 10000)}\u4E07\u5186</span>
        </div>
        <div class="subpage-result-item">
          <span class="subpage-result-label">\u6708\u53CE\uFF08\u984D\u9762\uFF09</span>
          <span class="subpage-result-value">\u7D04${monthlyMan}\u4E07\u5186</span>
        </div>
        <div class="subpage-result-item">
          <span class="subpage-result-label">\u5B9F\u52B9\u63A7\u9664\u7387</span>
          <span class="subpage-result-value" id="static-rate">\u7D04${r.effectiveRate}</span>
        </div>
      </div>

      <h3>\u63A7\u9664\u5185\u8A33\uFF08\u6708\u984D\u30FB\u76EE\u5B89\uFF09</h3>
      <table class="deduction-table">
        <tbody>
          <tr><td>\u539A\u751F\u5E74\u91D1\u4FDD\u967A\u6599</td><td id="static-pension">\u7D04${r.pension.toLocaleString('ja-JP')}\u5186</td></tr>
          <tr><td>\u5065\u5EB7\u4FDD\u967A\u6599</td><td id="static-health">\u7D04${r.health.toLocaleString('ja-JP')}\u5186</td></tr>
          <tr><td>\u96C7\u7528\u4FDD\u967A\u6599</td><td id="static-employment">\u7D04${r.employment.toLocaleString('ja-JP')}\u5186</td></tr>
          <tr><td>\u6240\u5F97\u7A0E\uFF08\u6E90\u6CC9\u5FB4\u53CE\uFF09</td><td id="static-income-tax">\u7D04${r.incomeTax.toLocaleString('ja-JP')}\u5186</td></tr>
          <tr><td>\u4F4F\u6C11\u7A0E</td><td id="static-resident-tax">\u7D04${r.residentTax.toLocaleString('ja-JP')}\u5186</td></tr>
          <tr><td><strong>\u63A7\u9664\u5408\u8A08</strong></td><td id="static-total"><strong>\u7D04${r.totalDeductions.toLocaleString('ja-JP')}\u5186</strong></td></tr>
        </tbody>
      </table>

      <p class="subpage-disclaimer">
        \u203B \u72EC\u8EAB\u30FB\u6276\u990A\u306A\u3057\u30FB\u793E\u4F1A\u4FDD\u967A\u5B8C\u5099\u306E\u4F1A\u793E\u54E1\u306E\u76EE\u5B89\u3002\u30DC\u30FC\u30CA\u30B9\u9664\u304F\u30022026\u5E74\u5EA6\u7A0E\u7387\u3002
        \u8A73\u3057\u304F\u306F\u4E0B\u306E\u8A08\u7B97\u30C4\u30FC\u30EB\u3067\u3054\u78BA\u8A8D\u304F\u3060\u3055\u3044\u3002
      </p>
    </div>

    <!-- Embedded tool widget -->
    <div class="subpage-tool-section">
      <h2>\u624B\u53D6\u308A\u8A08\u7B97\u30C4\u30FC\u30EB \u2014 \u91D1\u984D\u3092\u5909\u3048\u3066\u8A08\u7B97\u3059\u308B</h2>
      <p style="font-size:0.85rem; color:var(--color-text-muted);">\u5165\u529B\u5024\u3092\u5909\u66F4\u3057\u3066\u7570\u306A\u308B\u5E74\u53CE\u306E\u624B\u53D6\u308A\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002</p>
      <div class="tool-box" id="tool-main">
        <div class="form-group">
          <label class="form-label" for="gross-input">\u6708\u53CE\uFF08\u984D\u9762\uFF09 \u2014 \u00A5</label>
          <input type="number" class="form-input" id="gross-input" min="0" max="10000000" step="1000" placeholder="\u4F8B: 300000">
          <div class="form-error" id="gross-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="bonus-input">\u5E74\u9593\u30DC\u30FC\u30CA\u30B9\uFF08\u4EFB\u610F\uFF09 \u2014 \u00A5</label>
          <input type="number" class="form-input" id="bonus-input" min="0" step="10000" placeholder="\u4F8B: 600000\uFF08\u4EFB\u610F\uFF09">
          <span class="text-muted" style="font-size:0.8rem;">\u30DC\u30FC\u30CA\u30B9\u306F\u5E74\u9593\u6240\u5F97\u3068\u3057\u3066\u7A0E\u91D1\u8A08\u7B97\u306B\u542B\u307E\u308C\u307E\u3059</span>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="calculate-btn">\u624B\u53D6\u308A\u3092\u8A08\u7B97\u3059\u308B</button>
        </div>

        <div class="result-box" id="salary-result" aria-live="polite">
          <div class="result-primary" id="r-takehome"></div>
          <div class="result-secondary">\u624B\u53D6\u308A\u984D</div>
          <div style="margin-top:0.5rem; font-size:0.875rem; color:var(--color-text-muted);">
            \u5B9F\u52B9\u63A7\u9664\u7387: <strong id="r-effrate"></strong>
          </div>

          <div class="deduction-bar-wrap">
            <div class="deduction-bar-labels">
              <span>\u984D\u9762 <span id="r-bar-gross"></span></span>
              <span>\u624B\u53D6\u308A <span id="r-bar-net"></span></span>
            </div>
            <div class="deduction-bar">
              <div class="deduction-bar-fill" id="r-bar-fill" style="width:0%"></div>
            </div>
          </div>

          <div class="deduction-grid">
            <span class="deduction-row-label">\u539A\u751F\u5E74\u91D1</span>
            <span class="deduction-row-value" id="r-pension"></span>
            <span class="deduction-row-label">\u5065\u5EB7\u4FDD\u967A</span>
            <span class="deduction-row-value" id="r-health"></span>
            <span class="deduction-row-label">\u96C7\u7528\u4FDD\u967A</span>
            <span class="deduction-row-value" id="r-employment"></span>
            <span class="deduction-row-label">\u6240\u5F97\u7A0E</span>
            <span class="deduction-row-value" id="r-incometax"></span>
            <span class="deduction-row-label">\u4F4F\u6C11\u7A0E *</span>
            <span class="deduction-row-value" id="r-residenttax"></span>
            <span class="deduction-row-label deduction-total">\u63A7\u9664\u5408\u8A08</span>
            <span class="deduction-row-value deduction-total" id="r-total-ded"></span>
          </div>

          <div class="annual-section">
            <h3>\u5E74\u9593\u6982\u7B97</h3>
            <div class="deduction-grid">
              <span class="deduction-row-label">\u5E74\u53CE\uFF08\u984D\u9762\uFF09</span>
              <span class="deduction-row-value" id="r-annual-gross"></span>
              <span class="deduction-row-label">\u5E74\u9593\u624B\u53D6\u308A\uFF08\u6982\u7B97\uFF09</span>
              <span class="deduction-row-value" id="r-annual-net"></span>
              <span class="deduction-row-label">\u8AB2\u7A0E\u6240\u5F97</span>
              <span class="deduction-row-value" id="r-annual-taxable"></span>
            </div>
          </div>

          <div class="salary-disclaimer">
            * \u4F4F\u6C11\u7A0E\u306F\u73FE\u5728\u306E\u53CE\u5165\u306B\u57FA\u3065\u304F\u6982\u7B97\u3067\u3059\u3002\u5B9F\u969B\u306E\u4F4F\u6C11\u7A0E\u306F\u524D\u5E74\u306E\u6240\u5F97\u306B\u57FA\u3065\u304D\u3001\u304A\u4F4F\u307E\u3044\u306E\u5E02\u533A\u753A\u6751\u304C\u8A08\u7B97\u3057\u307E\u3059\u3002
          </div>

          <div class="btn-row" style="margin-top:1rem;">
            <button class="btn-copy-result" id="copy-btn">\u5185\u8A33\u3092\u30B3\u30D4\u30FC</button>
          </div>
        </div>
      </div>
    </div>

    <div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
      <ins class="adsbygoogle" style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="SLOT_BTF_SALARY_SUB"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>

    <!-- Comparison table -->
    <section>
      <h2>\u5E74\u53CE\u5225 \u624B\u53D6\u308A\u6BD4\u8F03\u8868\uFF082026\u5E74\u5EA6\uFF09</h2>
      <div style="overflow-x:auto;">
      <table>
        <thead><tr><th>\u5E74\u53CE</th><th>\u6708\u53CE\uFF08\u984D\u9762\uFF09</th><th>\u624B\u53D6\u308A/\u6708\uFF08\u76EE\u5B89\uFF09</th><th>\u5E74\u9593\u624B\u53D6\u308A</th><th>\u63A7\u9664\u7387</th></tr></thead>
        <tbody>
${compRows}
        </tbody>
      </table>
      </div>
      <p class="text-muted"><small>\u203B \u6276\u990A\u5BB6\u65CF\u306A\u3057\u306E\u5358\u8EAB\u8005\u30012026\u5E74\u5EA6\u7A0E\u7387\u306B\u57FA\u3065\u304F\u6982\u7B97\u3067\u3059\u3002</small></p>
    </section>

    <!-- Editorial -->
    <article class="seo-content">
      <h2>${ed.h2_1}</h2>
      <p>${ed.p1}</p>
      <h2>${ed.h2_2}</h2>
      <p>${ed.p2}</p>
      <p><small>\u7A0E\u7387\u306F<a href="https://www.nta.go.jp" target="_blank" rel="noopener">\u56FD\u7A0E\u5E81\uFF08NTA\uFF09</a>\u306E\u30C7\u30FC\u30BF\u306B\u57FA\u3065\u3044\u3066\u3044\u307E\u3059\u30022026\u5E74\u5EA6\u7A0E\u7387\u3002</small></p>
    </article>

    <!-- FAQ -->
    <section class="faq-section">
      <h2>\u3088\u304F\u3042\u308B\u8CEA\u554F</h2>
${faqHtml}
    </section>

    <!-- Related tools -->
    <section class="related-tools">
      <h2>\u95A2\u9023\u30C4\u30FC\u30EB</h2>
      <div class="cards-grid">
        <a href="/tax-finance/salary-calculator/" class="tool-card">
          <div class="tool-card-icon">&#x1F4B0;</div>
          <div class="tool-card-name">\u624B\u53D6\u308A\u8A08\u7B97\u30C4\u30FC\u30EB</div>
          <div class="tool-card-jp">Salary Calculator</div>
        </a>
        <a href="/tax-finance/furusato-nozei/" class="tool-card">
          <div class="tool-card-icon">&#x1F3E0;</div>
          <div class="tool-card-name">\u3075\u308B\u3055\u3068\u7D0D\u7A0E\u8A08\u7B97</div>
          <div class="tool-card-jp">Furusato Nozei</div>
        </a>
        <a href="/tax-finance/withholding-tax/" class="tool-card">
          <div class="tool-card-icon">&#x1F4C4;</div>
          <div class="tool-card-name">\u6E90\u6CC9\u5FB4\u53CE\u8A08\u7B97</div>
          <div class="tool-card-jp">Withholding Tax</div>
        </a>
        <a href="/tax-finance/work-hours/" class="tool-card">
          <div class="tool-card-icon">&#x23F1;&#xFE0F;</div>
          <div class="tool-card-name">\u6B8B\u696D\u4EE3\u8A08\u7B97</div>
          <div class="tool-card-jp">Work Hours</div>
        </a>
      </div>
    </section>

  </main>

  <aside class="sidebar">
    <div class="ad-zone ad-sidebar" style="min-height:600px; position:sticky; top:1rem;">
      <ins class="adsbygoogle" style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="SLOT_SIDEBAR_SALARY_SUB"
           data-ad-format="auto"></ins>
    </div>
  </aside>
</div>

<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <ul class="footer-links">
      <li><a href="/about/">JapanCalc\u306B\u3064\u3044\u3066</a></li>
      <li><a href="/privacy/">\u30D7\u30E9\u30A4\u30D0\u30B7\u30FC\u30DD\u30EA\u30B7\u30FC</a></li>
      <li><a href="/terms/">\u5229\u7528\u898F\u7D04</a></li>
      <li><a href="mailto:hello@japancalc.com">\u304A\u554F\u3044\u5408\u308F\u305B</a></li>
    </ul>
    <p class="footer-copy">&copy; <span id="footer-year"></span> JapanCalc. All rights reserved.</p>
    <p class="footer-attribution">\u7A0E\u7387\u306F\u56FD\u7A0E\u5E81\uFF082026\u5E74\u5EA6\uFF09\u306E\u30C7\u30FC\u30BF\u306B\u57FA\u3065\u3044\u3066\u3044\u307E\u3059\u3002\u6700\u7D42\u66F4\u65B0: 2026\u5E744\u6708</p>
  </div>
</footer>

<script>document.getElementById('footer-year').textContent = new Date().getFullYear();</script>
<script>
(function() {
  var btn = document.querySelector('.nav-hamburger');
  var nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function() {
    var isOpen = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? '\u30E1\u30CB\u30E5\u30FC\u3092\u9589\u3058\u308B' : '\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F');
  });
})();
</script>

<script type="module">
import { calculateTakeHome, formatBreakdown } from '/assets/js/salary.js';

const ANNUAL = ${amount};
const prefilledMonthly = Math.round(ANNUAL / 12);

function formatJPY(n) {
  return '\\u00A5' + Math.round(n).toLocaleString('ja-JP');
}

// Overwrite static values with live calculation
(function updateStatic() {
  var r = calculateTakeHome(prefilledMonthly);
  if (!r || r.error) return;
  var el = function(id) { return document.getElementById(id); };
  el('static-monthly').textContent = '\\u7D04' + (Math.round(r.takeHome / 10000 * 10) / 10).toFixed(1) + '\\u4E07\\u5186';
  el('static-annual').textContent  = '\\u7D04' + Math.round(r.takeHome * 12 / 10000) + '\\u4E07\\u5186';
  el('static-rate').textContent    = '\\u7D04' + r.effectiveRate;
  el('static-pension').textContent    = '\\u7D04' + r.pension.toLocaleString('ja-JP') + '\\u5186';
  el('static-health').textContent     = '\\u7D04' + r.health.toLocaleString('ja-JP') + '\\u5186';
  el('static-employment').textContent = '\\u7D04' + r.employment.toLocaleString('ja-JP') + '\\u5186';
  el('static-income-tax').textContent = '\\u7D04' + r.incomeTax.toLocaleString('ja-JP') + '\\u5186';
  el('static-resident-tax').textContent = '\\u7D04' + r.residentTax.toLocaleString('ja-JP') + '\\u5186';
  el('static-total').innerHTML = '<strong>\\u7D04' + r.totalDeductions.toLocaleString('ja-JP') + '\\u5186</strong>';
})();

// Pre-fill tool input
document.getElementById('gross-input').value = prefilledMonthly;

function compute() {
  var grossStr = document.getElementById('gross-input').value;
  var bonusStr = document.getElementById('bonus-input').value;
  var errorEl  = document.getElementById('gross-error');
  var resultEl = document.getElementById('salary-result');

  if (!grossStr) { resultEl.classList.remove('visible'); return; }

  var gross = parseFloat(grossStr);
  var bonus = parseFloat(bonusStr) || 0;

  if (isNaN(gross) || gross < 0) {
    errorEl.textContent = '\\u6709\\u52B9\\u306A\\u6B63\\u306E\\u91D1\\u984D\\u3092\\u5165\\u529B\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044\\u3002';
    errorEl.classList.add('visible');
    resultEl.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  var r = calculateTakeHome(gross, { bonus: bonus });
  if (r.error) {
    errorEl.textContent = r.error;
    errorEl.classList.add('visible');
    resultEl.classList.remove('visible');
    return;
  }

  document.getElementById('r-takehome').textContent   = formatJPY(r.takeHome);
  document.getElementById('r-effrate').textContent    = r.effectiveRate;
  var pct = r.gross > 0 ? ((r.takeHome / r.gross) * 100).toFixed(1) : '0';
  document.getElementById('r-bar-fill').style.width   = pct + '%';
  document.getElementById('r-bar-gross').textContent  = formatJPY(r.gross);
  document.getElementById('r-bar-net').textContent    = formatJPY(r.takeHome);
  document.getElementById('r-pension').textContent    = formatJPY(r.pension);
  document.getElementById('r-health').textContent     = formatJPY(r.health);
  document.getElementById('r-employment').textContent = formatJPY(r.employment);
  document.getElementById('r-incometax').textContent  = formatJPY(r.incomeTax);
  document.getElementById('r-residenttax').textContent= formatJPY(r.residentTax);
  document.getElementById('r-total-ded').textContent  = formatJPY(r.totalDeductions);
  document.getElementById('r-annual-gross').textContent   = formatJPY(r.annual.gross);
  document.getElementById('r-annual-net').textContent     = formatJPY(r.takeHome * 12);
  document.getElementById('r-annual-taxable').textContent = formatJPY(r.annual.taxableIncome);
  resultEl.classList.add('visible');

  if (typeof gtag !== 'undefined')
    gtag('event', 'tool_used', { tool_name: 'salary_subpage_${amount}', language: 'ja' });
}

document.getElementById('gross-input').addEventListener('input', compute);
document.getElementById('bonus-input').addEventListener('input', compute);
document.getElementById('calculate-btn').addEventListener('click', compute);

document.getElementById('copy-btn').addEventListener('click', function() {
  var gross = parseFloat(document.getElementById('gross-input').value) || 0;
  var bonus = parseFloat(document.getElementById('bonus-input').value) || 0;
  var r = calculateTakeHome(gross, { bonus: bonus });
  if (r.error || !gross) return;
  navigator.clipboard.writeText(formatBreakdown(r)).then(function() {
    var btn = document.getElementById('copy-btn');
    btn.textContent = '\\u30B3\\u30D4\\u30FC\\u5B8C\\u4E86 \\u2713';
    setTimeout(function() { btn.textContent = '\\u5185\\u8A33\\u3092\\u30B3\\u30D4\\u30FC'; }, 2000);
  });
});

// Trigger initial computation
compute();
</script>
</body>
</html>`;
}

function generateENPage(amount) {
  const monthly = Math.round(amount / 12);
  const r = calculateTakeHome(monthly);
  const man = manLabel(amount);
  const mLbl = (amount / 1000000).toFixed(0) + 'M';
  const monthlyMan = (monthly / 10000).toFixed(1);
  const ed = EDITORIAL_EN[amount];
  const jpUrl = `/tax-finance/salary-calculator/${amount}/`;
  const enUrl = `/en/tax-finance/salary-calculator/${amount}/`;
  const fullJpUrl = `https://japancalc.com${jpUrl}`;
  const fullEnUrl = `https://japancalc.com${enUrl}`;

  const compRows = AMOUNTS.map(a => {
    const m = Math.round(a / 12);
    const cr = calculateTakeHome(m);
    const isHighlight = a === amount;
    const cls = isHighlight ? ' class="highlight-row"' : '';
    const b = isHighlight ? '<strong>' : '';
    const be = isHighlight ? '</strong>' : '';
    const arrow = isHighlight ? ' \u2190' : '';
    const aFmt = '\u00A5' + (a / 1000000).toFixed(0) + 'M';
    const mFmt = '~\u00A5' + Math.round(m / 1000).toLocaleString('en-US') + 'K';
    return `    <tr${cls}><td>${b}${aFmt}${arrow}${be}</td><td>${b}${mFmt}${be}</td><td>${b}~\u00A5${Math.round(cr.takeHome / 1000).toLocaleString('en-US')}K${be}</td><td>${b}~\u00A5${(Math.round(cr.takeHome * 12 / 10000) / 100).toFixed(2)}M${be}</td><td>${b}~${cr.effectiveRate}${be}</td></tr>`;
  }).join('\n');

  const faqHtml = ed.faq.map(f => `      <details class="faq-item">
        <summary>${f.q}</summary>
        <p>${f.a}</p>
      </details>`).join('\n\n');

  const faqJsonLd = ed.faq.map(f => `      {
        "@type": "Question",
        "name": "${f.q.replace(/"/g, '&quot;')}",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "${f.a.replace(/"/g, '&quot;').replace(/<[^>]+>/g, '')}"
        }
      }`).join(',\n');

  const descText = `Annual salary \u00A5${(amount / 1000000).toFixed(0)}M in Japan: estimated take-home pay is about \u00A5${Math.round(r.takeHome / 1000)}K/month or \u00A5${(Math.round(r.takeHome * 12 / 10000) / 100).toFixed(2)}M/year. See full tax and social insurance breakdown. Free calculator.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u00A5${mLbl} Salary Take-Home Pay Japan 2026 | JapanCalc</title>
  <meta name="description" content="${descText}">
  <link rel="canonical" href="${fullEnUrl}">
  <link rel="alternate" hreflang="en"        href="${fullEnUrl}">
  <link rel="alternate" hreflang="ja"        href="${fullJpUrl}">
  <link rel="alternate" hreflang="x-default" href="${fullJpUrl}">
  <meta property="og:title"       content="\u00A5${mLbl} Salary Take-Home Pay Japan 2026 | JapanCalc">
  <meta property="og:description" content="${descText}">
  <meta property="og:url"         content="${fullEnUrl}">
  <meta property="og:type"        content="website">
  <meta property="og:image" content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="shortcut icon" href="/favicon.ico">
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-P9TH5C7P9H"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-P9TH5C7P9H');
</script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://japancalc.com/en/" },
      { "@type": "ListItem", "position": 2, "name": "Tax & Finance", "item": "https://japancalc.com/en/tax-finance/" },
      { "@type": "ListItem", "position": 3, "name": "Salary Calculator", "item": "https://japancalc.com/en/tax-finance/salary-calculator/" },
      { "@type": "ListItem", "position": 4, "name": "\u00A5${mLbl} Take-Home Pay", "item": "${fullEnUrl}" }
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
${faqJsonLd}
    ]
  }
  </script>

  <link rel="stylesheet" href="/assets/css/main.css">
  <script async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
    crossorigin="anonymous"></script>

  <style>
  .subpage-result-static { background: var(--color-bg-alt); border-radius: var(--radius); padding: 1.5rem; margin: 1.5rem 0; border: 1px solid var(--color-border); }
  .subpage-result-primary { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
  @media (max-width: 600px) { .subpage-result-primary { grid-template-columns: 1fr; } }
  .subpage-result-item { padding: 0.75rem; background: var(--color-bg); border-radius: var(--radius); border: 1px solid var(--color-border); }
  .subpage-result-item.main { border-color: var(--color-accent); border-width: 2px; }
  .subpage-result-label { display: block; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .subpage-result-value { display: block; font-size: 1.3rem; font-weight: 700; color: var(--color-primary); font-family: var(--font-mono); }
  .subpage-result-item.main .subpage-result-value { font-size: 1.6rem; color: var(--color-accent); }
  .deduction-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
  .deduction-table td { padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--color-border); }
  .deduction-table td:last-child { text-align: right; font-family: var(--font-mono); white-space: nowrap; }
  .deduction-table tr:last-child td { border-bottom: 2px solid var(--color-border); font-weight: 700; }
  .subpage-disclaimer { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius); border-left: 3px solid var(--color-warning); }
  .highlight-row { background: rgba(11, 110, 95, 0.08); }
  .highlight-row td { font-weight: 600; }
  .deduction-bar-wrap { background: var(--color-bg-alt); border-radius: var(--radius); padding: 1rem; margin: 1rem 0; border: 1px solid var(--color-border); }
  .deduction-bar { height: 20px; background: var(--color-border); border-radius: 99px; overflow: hidden; margin: 0.5rem 0; }
  .deduction-bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-accent), var(--color-primary)); border-radius: 99px; transition: width 0.4s ease; }
  .deduction-bar-labels { display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--color-text-muted); }
  .deduction-grid { display: grid; grid-template-columns: 1fr auto; gap: 0.4rem 1rem; margin: 1rem 0; font-size: 0.9rem; }
  .deduction-row-label { color: var(--color-text); }
  .deduction-row-value { font-family: var(--font-mono); font-weight: 500; text-align: right; white-space: nowrap; }
  .deduction-total { border-top: 2px solid var(--color-border); padding-top: 0.5rem; font-weight: 700; }
  .salary-disclaimer { font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.75rem; padding: 0.5rem 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius); border-left: 3px solid var(--color-warning); }
  .annual-section { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); font-size: 0.875rem; }
  .annual-section h3 { font-size: 0.875rem; color: var(--color-text-muted); font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.04em; }
  .btn-copy-result { padding: 0.5rem 1rem; border: none; border-radius: var(--radius); background: var(--color-accent); color: white; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: opacity 0.15s; }
  .btn-copy-result:hover { opacity: 0.85; }
  </style>
</head>
<body>

<style>
  nav.site-nav.nav-open .nav-links {
    display: flex; flex-direction: column; position: absolute;
    top: 56px; left: 0; right: 0; background: var(--color-primary);
    padding: 1rem; gap: 0.5rem; z-index: 100;
  }
</style>

<a href="#main-content" class="skip-link">Skip to main content</a>

<nav class="site-nav" aria-label="Main navigation">
  <a href="/en/" class="nav-logo" aria-label="JapanCalc Home">
  <img src="/assets/icons/logo-white.svg" alt="JapanCalc" width="160" height="40" loading="eager" fetchpriority="high">
</a>
  <ul class="nav-links" id="nav-links-menu">
    <li><a href="/en/date-calendar/">Date &amp; Calendar</a></li>
    <li><a href="/en/tax-finance/">Tax &amp; Finance</a></li>
    <li><a href="/en/language-tools/">Language Tools</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:0.5rem;">
    <div class="lang-switcher" role="navigation" aria-label="Language">
      <a class="lang-option lang-inactive" id="lang-toggle"
         href="${jpUrl}" lang="ja" title="\u65E5\u672C\u8A9E\u3067\u8868\u793A"
         aria-label="\u65E5\u672C\u8A9E\u306B\u5207\u308A\u66FF\u3048">JP</a>
      <span class="lang-sep">&middot;</span>
      <span class="lang-option lang-active" aria-current="true">EN</span>
    </div>
    <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/en/">Home</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li><a href="/en/tax-finance/">Tax &amp; Finance</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li><a href="/en/tax-finance/salary-calculator/">Salary Calculator</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li aria-current="page">\u00A5${mLbl} Take-Home Pay</li>
  </ol>
</nav>

<div class="ad-zone ad-atf" style="min-height:90px; margin:0 auto 1rem;">
  <ins class="adsbygoogle" style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="SLOT_ATF_SALARY_SUB"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>

<div class="page-layout">
  <main class="content" id="main-content">

    <h1>\u00A5${(amount).toLocaleString('en-US')} Annual Salary \u2014 Take-Home Pay in Japan</h1>
    <p class="tool-desc">
      How much is the take-home pay on a \u00A5${(amount).toLocaleString('en-US')} annual salary in Japan?
      See the full breakdown of income tax, resident tax, and social insurance deductions. FY2026 rates. Free, no login required.
    </p>

    <!-- STATIC PRE-COMPUTED RESULT -->
    <div class="subpage-result-static">
      <h2>\u00A5${mLbl} Salary Take-Home Pay (FY2026)</h2>
      <div class="subpage-result-primary">
        <div class="subpage-result-item main">
          <span class="subpage-result-label">Monthly Take-Home (est.)</span>
          <span class="subpage-result-value" id="static-monthly">~\u00A5${Math.round(r.takeHome).toLocaleString('en-US')}</span>
        </div>
        <div class="subpage-result-item">
          <span class="subpage-result-label">Annual Take-Home (est.)</span>
          <span class="subpage-result-value" id="static-annual">~\u00A5${Math.round(r.takeHome * 12).toLocaleString('en-US')}</span>
        </div>
        <div class="subpage-result-item">
          <span class="subpage-result-label">Monthly Gross</span>
          <span class="subpage-result-value">~\u00A5${monthly.toLocaleString('en-US')}</span>
        </div>
        <div class="subpage-result-item">
          <span class="subpage-result-label">Effective Deduction Rate</span>
          <span class="subpage-result-value" id="static-rate">~${r.effectiveRate}</span>
        </div>
      </div>

      <h3>Deduction Breakdown (Monthly, Est.)</h3>
      <table class="deduction-table">
        <tbody>
          <tr><td>Pension (\u539A\u751F\u5E74\u91D1)</td><td id="static-pension">~\u00A5${r.pension.toLocaleString('en-US')}</td></tr>
          <tr><td>Health Insurance (\u5065\u5EB7\u4FDD\u967A)</td><td id="static-health">~\u00A5${r.health.toLocaleString('en-US')}</td></tr>
          <tr><td>Employment Insurance (\u96C7\u7528\u4FDD\u967A)</td><td id="static-employment">~\u00A5${r.employment.toLocaleString('en-US')}</td></tr>
          <tr><td>Income Tax (\u6240\u5F97\u7A0E)</td><td id="static-income-tax">~\u00A5${r.incomeTax.toLocaleString('en-US')}</td></tr>
          <tr><td>Resident Tax (\u4F4F\u6C11\u7A0E)</td><td id="static-resident-tax">~\u00A5${r.residentTax.toLocaleString('en-US')}</td></tr>
          <tr><td><strong>Total Deductions</strong></td><td id="static-total"><strong>~\u00A5${r.totalDeductions.toLocaleString('en-US')}</strong></td></tr>
        </tbody>
      </table>

      <p class="subpage-disclaimer">
        * Estimates for a single employee with no dependents, enrolled in shakai hoken. Excludes bonuses. FY2026 tax rates.
        Use the calculator below for customized results.
      </p>
    </div>

    <!-- Embedded tool widget -->
    <div class="subpage-tool-section">
      <h2>Salary Calculator \u2014 Try Different Amounts</h2>
      <p style="font-size:0.85rem; color:var(--color-text-muted);">Change the input to calculate take-home pay for any salary level.</p>
      <div class="tool-box" id="tool-main">
        <div class="form-group">
          <label class="form-label" for="gross-input">Monthly Gross Salary \u2014 \u00A5</label>
          <input type="number" class="form-input" id="gross-input" min="0" max="10000000" step="1000" placeholder="e.g. 300000">
          <div class="form-error" id="gross-error"></div>
        </div>
        <div class="form-group">
          <label class="form-label" for="bonus-input">Annual Bonus (optional) \u2014 \u00A5</label>
          <input type="number" class="form-input" id="bonus-input" min="0" step="10000" placeholder="e.g. 600000 (optional)">
          <span class="text-muted" style="font-size:0.8rem;">Bonus is included in annual income for tax calculation</span>
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" id="calculate-btn">Calculate Take-home Pay</button>
        </div>

        <div class="result-box" id="salary-result" aria-live="polite">
          <div class="result-primary" id="r-takehome"></div>
          <div class="result-secondary">Take-home Pay (\u624B\u53D6\u308A)</div>
          <div style="margin-top:0.5rem; font-size:0.875rem; color:var(--color-text-muted);">
            Effective deduction rate: <strong id="r-effrate"></strong>
          </div>

          <div class="deduction-bar-wrap">
            <div class="deduction-bar-labels">
              <span>Gross <span id="r-bar-gross"></span></span>
              <span>Take-home <span id="r-bar-net"></span></span>
            </div>
            <div class="deduction-bar">
              <div class="deduction-bar-fill" id="r-bar-fill" style="width:0%"></div>
            </div>
          </div>

          <div class="deduction-grid">
            <span class="deduction-row-label">Pension</span>
            <span class="deduction-row-value" id="r-pension"></span>
            <span class="deduction-row-label">Health Insurance</span>
            <span class="deduction-row-value" id="r-health"></span>
            <span class="deduction-row-label">Employment Insurance</span>
            <span class="deduction-row-value" id="r-employment"></span>
            <span class="deduction-row-label">Income Tax</span>
            <span class="deduction-row-value" id="r-incometax"></span>
            <span class="deduction-row-label">Resident Tax *</span>
            <span class="deduction-row-value" id="r-residenttax"></span>
            <span class="deduction-row-label deduction-total">Total Deductions</span>
            <span class="deduction-row-value deduction-total" id="r-total-ded"></span>
          </div>

          <div class="annual-section">
            <h3>Annual Summary</h3>
            <div class="deduction-grid">
              <span class="deduction-row-label">Annual Gross</span>
              <span class="deduction-row-value" id="r-annual-gross"></span>
              <span class="deduction-row-label">Annual Take-home (est.)</span>
              <span class="deduction-row-value" id="r-annual-net"></span>
              <span class="deduction-row-label">Taxable Income</span>
              <span class="deduction-row-value" id="r-annual-taxable"></span>
            </div>
          </div>

          <div class="salary-disclaimer">
            * Resident tax is estimated based on current income. Actual resident tax is based on prior year income and calculated by your municipality.
          </div>

          <div class="btn-row" style="margin-top:1rem;">
            <button class="btn-copy-result" id="copy-btn">Copy Breakdown</button>
          </div>
        </div>
      </div>
    </div>

    <div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
      <ins class="adsbygoogle" style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="SLOT_BTF_SALARY_SUB"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>

    <!-- Comparison table -->
    <section>
      <h2>Salary Take-Home Comparison (FY2026)</h2>
      <div style="overflow-x:auto;">
      <table>
        <thead><tr><th>Annual Salary</th><th>Monthly Gross</th><th>Take-home/mo (est.)</th><th>Annual Take-home</th><th>Ded. Rate</th></tr></thead>
        <tbody>
${compRows}
        </tbody>
      </table>
      </div>
      <p class="text-muted"><small>* Estimates for single, no dependents, FY2026 tax rates.</small></p>
    </section>

    <!-- Editorial -->
    <article class="seo-content">
      <h2>${ed.h2_1}</h2>
      <p>${ed.p1}</p>
      <h2>${ed.h2_2}</h2>
      <p>${ed.p2}</p>
      <p><small>Tax rates based on <a href="https://www.nta.go.jp" target="_blank" rel="noopener">National Tax Agency (NTA)</a> data. FY2026 rates.</small></p>
    </article>

    <!-- FAQ -->
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
${faqHtml}
    </section>

    <!-- Related tools -->
    <section class="related-tools">
      <h2>Related Tools</h2>
      <div class="cards-grid">
        <a href="/en/tax-finance/salary-calculator/" class="tool-card">
          <div class="tool-card-icon">&#x1F4B0;</div>
          <div class="tool-card-name">Salary Calculator</div>
          <div class="tool-card-jp">\u624B\u53D6\u308A\u8A08\u7B97</div>
        </a>
        <a href="/en/tax-finance/furusato-nozei/" class="tool-card">
          <div class="tool-card-icon">&#x1F3E0;</div>
          <div class="tool-card-name">Furusato Nozei</div>
          <div class="tool-card-jp">\u3075\u308B\u3055\u3068\u7D0D\u7A0E</div>
        </a>
        <a href="/en/tax-finance/withholding-tax/" class="tool-card">
          <div class="tool-card-icon">&#x1F4C4;</div>
          <div class="tool-card-name">Withholding Tax</div>
          <div class="tool-card-jp">\u6E90\u6CC9\u5FB4\u53CE</div>
        </a>
        <a href="/en/tax-finance/work-hours/" class="tool-card">
          <div class="tool-card-icon">&#x23F1;&#xFE0F;</div>
          <div class="tool-card-name">Work Hours</div>
          <div class="tool-card-jp">\u6B8B\u696D\u4EE3\u8A08\u7B97</div>
        </a>
      </div>
    </section>

  </main>

  <aside class="sidebar">
    <div class="ad-zone ad-sidebar" style="min-height:600px; position:sticky; top:1rem;">
      <ins class="adsbygoogle" style="display:block"
           data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
           data-ad-slot="SLOT_SIDEBAR_SALARY_SUB"
           data-ad-format="auto"></ins>
    </div>
  </aside>
</div>

<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <ul class="footer-links">
      <li><a href="/en/about/">About JapanCalc</a></li>
      <li><a href="/en/privacy/">Privacy Policy</a></li>
      <li><a href="/en/terms/">Terms of Use</a></li>
      <li><a href="mailto:hello@japancalc.com">Contact</a></li>
    </ul>
    <p class="footer-copy">&copy; <span id="footer-year"></span> JapanCalc. All rights reserved.</p>
    <p class="footer-attribution">Tax rates based on National Tax Agency (FY2026) data. Last updated: April 2026</p>
  </div>
</footer>

<script>document.getElementById('footer-year').textContent = new Date().getFullYear();</script>
<script>
(function() {
  var btn = document.querySelector('.nav-hamburger');
  var nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function() {
    var isOpen = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
})();
</script>

<script type="module">
import { calculateTakeHome, formatBreakdown } from '/assets/js/salary.js';

const ANNUAL = ${amount};
const prefilledMonthly = Math.round(ANNUAL / 12);

function formatJPY(n) {
  return '\\u00A5' + Math.round(n).toLocaleString('en-US');
}

// Overwrite static values with live calculation
(function updateStatic() {
  var r = calculateTakeHome(prefilledMonthly);
  if (!r || r.error) return;
  var el = function(id) { return document.getElementById(id); };
  el('static-monthly').textContent = '~' + formatJPY(r.takeHome);
  el('static-annual').textContent  = '~' + formatJPY(r.takeHome * 12);
  el('static-rate').textContent    = '~' + r.effectiveRate;
  el('static-pension').textContent    = '~' + formatJPY(r.pension);
  el('static-health').textContent     = '~' + formatJPY(r.health);
  el('static-employment').textContent = '~' + formatJPY(r.employment);
  el('static-income-tax').textContent = '~' + formatJPY(r.incomeTax);
  el('static-resident-tax').textContent = '~' + formatJPY(r.residentTax);
  el('static-total').innerHTML = '<strong>~' + formatJPY(r.totalDeductions) + '</strong>';
})();

// Pre-fill tool input
document.getElementById('gross-input').value = prefilledMonthly;

function compute() {
  var grossStr = document.getElementById('gross-input').value;
  var bonusStr = document.getElementById('bonus-input').value;
  var errorEl  = document.getElementById('gross-error');
  var resultEl = document.getElementById('salary-result');

  if (!grossStr) { resultEl.classList.remove('visible'); return; }

  var gross = parseFloat(grossStr);
  var bonus = parseFloat(bonusStr) || 0;

  if (isNaN(gross) || gross < 0) {
    errorEl.textContent = 'Please enter a valid positive amount.';
    errorEl.classList.add('visible');
    resultEl.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  var r = calculateTakeHome(gross, { bonus: bonus });
  if (r.error) {
    errorEl.textContent = r.error;
    errorEl.classList.add('visible');
    resultEl.classList.remove('visible');
    return;
  }

  document.getElementById('r-takehome').textContent   = formatJPY(r.takeHome);
  document.getElementById('r-effrate').textContent    = r.effectiveRate;
  var pct = r.gross > 0 ? ((r.takeHome / r.gross) * 100).toFixed(1) : '0';
  document.getElementById('r-bar-fill').style.width   = pct + '%';
  document.getElementById('r-bar-gross').textContent  = formatJPY(r.gross);
  document.getElementById('r-bar-net').textContent    = formatJPY(r.takeHome);
  document.getElementById('r-pension').textContent    = formatJPY(r.pension);
  document.getElementById('r-health').textContent     = formatJPY(r.health);
  document.getElementById('r-employment').textContent = formatJPY(r.employment);
  document.getElementById('r-incometax').textContent  = formatJPY(r.incomeTax);
  document.getElementById('r-residenttax').textContent= formatJPY(r.residentTax);
  document.getElementById('r-total-ded').textContent  = formatJPY(r.totalDeductions);
  document.getElementById('r-annual-gross').textContent   = formatJPY(r.annual.gross);
  document.getElementById('r-annual-net').textContent     = formatJPY(r.takeHome * 12);
  document.getElementById('r-annual-taxable').textContent = formatJPY(r.annual.taxableIncome);
  resultEl.classList.add('visible');

  if (typeof gtag !== 'undefined')
    gtag('event', 'tool_used', { tool_name: 'salary_subpage_${amount}', language: 'en' });
}

document.getElementById('gross-input').addEventListener('input', compute);
document.getElementById('bonus-input').addEventListener('input', compute);
document.getElementById('calculate-btn').addEventListener('click', compute);

document.getElementById('copy-btn').addEventListener('click', function() {
  var gross = parseFloat(document.getElementById('gross-input').value) || 0;
  var bonus = parseFloat(document.getElementById('bonus-input').value) || 0;
  var r = calculateTakeHome(gross, { bonus: bonus });
  if (r.error || !gross) return;
  navigator.clipboard.writeText(formatBreakdown(r)).then(function() {
    var btn = document.getElementById('copy-btn');
    btn.textContent = 'Copied \\u2713';
    setTimeout(function() { btn.textContent = 'Copy Breakdown'; }, 2000);
  });
});

// Trigger initial computation
compute();
</script>
</body>
</html>`;
}

// ===== MAIN =====
const distDir = path.join(__dirname, '..', 'dist');
let created = 0;

for (const amount of AMOUNTS) {
  // JP
  const jpDir = path.join(distDir, 'tax-finance', 'salary-calculator', String(amount));
  fs.mkdirSync(jpDir, { recursive: true });
  fs.writeFileSync(path.join(jpDir, 'index.html'), generateJPPage(amount), 'utf8');
  console.log(`  JP: /tax-finance/salary-calculator/${amount}/`);
  created++;

  // EN
  const enDir = path.join(distDir, 'en', 'tax-finance', 'salary-calculator', String(amount));
  fs.mkdirSync(enDir, { recursive: true });
  fs.writeFileSync(path.join(enDir, 'index.html'), generateENPage(amount), 'utf8');
  console.log(`  EN: /en/tax-finance/salary-calculator/${amount}/`);
  created++;
}

console.log(`\nDone! Created ${created} files.`);
