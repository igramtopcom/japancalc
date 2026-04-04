/**
 * generate-bmi-pages.js — Creates JP and EN BMI calculator pages
 * Run: node scripts/generate-bmi-pages.js
 */
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');

/* ─── Shared HTML fragments ─── */
const HEAD_ICONS = `<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="shortcut icon" href="/favicon.ico">`;

const GA = `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-P9TH5C7P9H"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-P9TH5C7P9H');
</script>`;

const ADSENSE = `<script async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
    crossorigin="anonymous"></script>`;

const AD_ATF = `<div class="ad-zone ad-atf" style="min-height:90px; margin:0 auto 1rem;">
  <ins class="adsbygoogle" style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="SLOT_ATF_BMI"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>`;

const AD_BTF = `<div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
  <ins class="adsbygoogle" style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="SLOT_BTF_BMI"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
</div>`;

const HAMBURGER_SCRIPT = `<script>
(function() {
  var btn = document.querySelector('.nav-hamburger');
  var nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function() {
    var isOpen = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? '%CLOSE%' : '%OPEN%');
  });
})();
</script>`;

const AD_LAZY_SCRIPT = `<script defer>
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.ad-zone:not([data-lazy-ad])').forEach(zone => {
    const ins = zone.querySelector('.adsbygoogle');
    if (ins && !ins.getAttribute('data-adsbygoogle-status'))
      (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const ins = entry.target.querySelector('.adsbygoogle');
          if (ins && !ins.getAttribute('data-adsbygoogle-status'))
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });
    document.querySelectorAll('[data-lazy-ad]').forEach(z => observer.observe(z));
  }
});
</script>`;

const LANG_TOGGLE_SCRIPT = `<script>
(function() {
  var toggle = document.getElementById('lang-toggle');
  if (!toggle) return;
  var path = window.location.pathname;
  if (path.indexOf('/en') === 0) {
    var jpPath = path.replace(/^\\/en/, '') || '/';
    toggle.href = jpPath;
    toggle.textContent = '日本語';
    toggle.setAttribute('lang', 'ja');
    toggle.setAttribute('title', 'このページを日本語で表示');
  } else {
    var enPath = '/en' + path;
    toggle.href = enPath;
    toggle.textContent = 'English';
    toggle.setAttribute('lang', 'en');
    toggle.setAttribute('title', 'View this page in English');
  }
})();
</script>`;

/* ─── Page-specific CSS ─── */
const PAGE_CSS = `
.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.form-row .form-group { flex: 1; min-width: 140px; }
.rate-toggle { display: flex; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
.rate-option { flex: 1; display: flex; }
.rate-option input { display: none; }
.rate-option span {
  display: flex; align-items: center; justify-content: center; width: 100%;
  padding: 0.5rem 0.8rem; font-size: 0.85rem; cursor: pointer; text-align: center;
  background: var(--color-bg-alt); transition: background 0.15s, color 0.15s;
}
.rate-option input:checked + span {
  background: var(--color-accent); color: white; font-weight: 600;
}
.input-suffix-wrap {
  position: relative; display: flex; align-items: center;
}
.input-with-suffix { padding-right: 2.5rem !important; }
.input-suffix {
  position: absolute; right: 0.75rem;
  font-size: 0.8rem; color: var(--color-text-muted); pointer-events: none;
}
.result-box {
  background: var(--color-bg-alt); border-radius: 12px; padding: 1.25rem;
  margin-top: 1rem; border: 1px solid var(--color-border);
}
.result-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem;
}
.result-item {
  background: white; border-radius: 8px; padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
}
.result-item-label { font-size: 0.72rem; color: var(--color-text-muted); display: block; }
.result-item-value { font-size: 1rem; font-weight: 600; font-family: var(--font-mono); }
.bmi-gauge-wrap { margin: 0.75rem 0 0.25rem; }
.bmi-gauge-bar {
  position: relative; display: flex; height: 20px; border-radius: 10px; overflow: visible;
}
.bmi-seg { height: 100%; }
.bmi-seg:first-child { border-radius: 10px 0 0 10px; }
.bmi-seg:last-child  { border-radius: 0 10px 10px 0; }
.bmi-gauge-marker {
  position: absolute; top: -4px; width: 4px; height: 28px;
  background: var(--color-primary); border-radius: 2px;
  transform: translateX(-50%); transition: left 0.3s; z-index: 2;
}
.bmi-gauge-labels {
  display: flex; justify-content: space-between;
  font-size: 0.65rem; color: var(--color-text-muted); margin-top: 4px;
}
.bmi-class-badge {
  display: inline-block; padding: 0.2rem 0.75rem; border-radius: 99px;
  font-size: 0.85rem; font-weight: 600; color: white;
}
.yaku-disclaimer {
  font-size: 0.78rem; color: var(--color-text-muted);
  background: #fffbeb; border-radius: 8px; padding: 0.6rem 0.75rem;
  border: 1px solid #fde68a;
}
.btn-copy-result {
  background: var(--color-accent); color: white; border: none; border-radius: 8px;
  padding: 0.5rem 1.2rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
  transition: opacity 0.15s;
}
.btn-copy-result:hover { opacity: 0.85; }
.error-msg { color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; }
.ref-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 1rem 0; }
.ref-table th, .ref-table td {
  padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); text-align: center;
}
.ref-table th { background: var(--color-bg-alt); font-weight: 600; font-size: 0.78rem; }
.ref-table tr:nth-child(even) { background: var(--color-bg-alt); }
.faq-item { border-bottom: 1px solid var(--color-border); }
.faq-item summary {
  padding: 0.75rem 0; font-weight: 600; cursor: pointer; font-size: 0.95rem;
  list-style: none; display: flex; justify-content: space-between; align-items: center;
}
.faq-item summary::after { content: '+'; font-size: 1.2rem; color: var(--color-accent); transition: transform 0.2s; }
.faq-item[open] summary::after { content: '−'; }
.faq-item .faq-answer { padding: 0 0 0.75rem; font-size: 0.88rem; line-height: 1.7; color: var(--color-text-muted); }
@media (max-width: 600px) {
  .result-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; gap: 0.5rem; }
}`;

/* ─── Build JP page ─── */
function buildJP() {
  const faqItems = [
    { q: 'BMIの計算式は？', a: 'BMIは「体重(kg) ÷ 身長(m)²」で計算します。例えば身長170cm、体重65kgの場合、65 ÷ (1.70 × 1.70) = 22.5となります。日本肥満学会の基準ではBMI 18.5未満が低体重、18.5〜25未満が普通体重、25以上が肥満とされています。このツールに身長と体重を入力すると自動計算します。' },
    { q: '標準体重の計算方法は？', a: '標準体重は「身長(m)² × 22」で計算します。BMI22が統計的に最も疾病リスクが低いとされているためです。例えば身長170cmの標準体重は1.70 × 1.70 × 22 = 63.6kgです。このほか美容体重（BMI20）は「身長(m)² × 20」、モデル体重（BMI18）は「身長(m)² × 18」で計算できます。' },
    { q: '日本の肥満判定基準はWHOと違いますか？', a: 'はい、異なります。WHO基準ではBMI 30以上を肥満としていますが、日本肥満学会はBMI 25以上を肥満（1〜4度）と定義しています。これはアジア人は欧米人に比べて同じBMIでも体脂肪率が高く、BMI 25前後から生活習慣病リスクが高まることが分かっているためです。このツールは日本肥満学会の基準で判定します。' },
    { q: 'BMIだけで健康状態を判断できますか？', a: 'BMIは体格指数の目安であり、健康状態のすべてを表すものではありません。筋肉量が多い場合（アスリートなど）はBMIが高くなりますが肥満ではない場合があります。また体脂肪の分布（内臓脂肪・皮下脂肪）や血液検査などの総合的な判断が重要です。このツールの結果はあくまで参考としてご利用いただき、健康に関する判断は医師にご相談ください。' },
    { q: '適正体重になるには体重をいくら減らせばよいですか？', a: 'このツールでは現在の体重と標準体重（BMI22）の差を表示します。ただし急激な減量は健康に悪影響を与えることがあります。一般的に月1〜2kgの減量ペースが安全とされています。食事・運動のバランスを考えた減量計画については、医師や栄養士にご相談されることをおすすめします。' },
  ];

  const faqHTML = faqItems.map(f => `    <details class="faq-item">
      <summary>${f.q}</summary>
      <div class="faq-answer">${f.a}</div>
    </details>`).join('\n');

  const faqJsonLd = faqItems.map(f => `      {
        "@type": "Question",
        "name": ${JSON.stringify(f.q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(f.a)}
        }
      }`).join(',\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BMI計算ツール: 肥満度・標準体重を計算 | JapanCalc</title>
  <meta name="description" content="身長・体重を入力するだけでBMIと肥満度を計算。日本肥満学会の基準で低体重〜肥満4度まで判定。標準体重・美容体重も表示。センチ・キログラム、フィート・ポンド対応。無料、ログイン不要。">
  <link rel="canonical" href="https://japancalc.com/date-calendar/bmi-calculator/">
  <link rel="alternate" hreflang="en" href="https://japancalc.com/en/date-calendar/bmi-calculator/">
  <link rel="alternate" hreflang="ja" href="https://japancalc.com/date-calendar/bmi-calculator/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/date-calendar/bmi-calculator/">
  <meta property="og:title" content="BMI計算ツール: 肥満度・標準体重を計算 | JapanCalc">
  <meta property="og:url" content="https://japancalc.com/date-calendar/bmi-calculator/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
  ${HEAD_ICONS}
  ${GA}

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "BMI計算ツール",
    "description": "身長と体重からBMIと肥満度を計算。日本肥満学会基準で判定。",
    "url": "https://japancalc.com/date-calendar/bmi-calculator/",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "inLanguage": ["ja", "en"]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://japancalc.com/" },
      { "@type": "ListItem", "position": 2, "name": "日付・カレンダー", "item": "https://japancalc.com/date-calendar/" },
      { "@type": "ListItem", "position": 3, "name": "BMI計算ツール", "item": "https://japancalc.com/date-calendar/bmi-calculator/" }
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
  ${ADSENSE}
  <style>${PAGE_CSS}</style>
</head>
<body>

<style>
  nav.site-nav.nav-open .nav-links {
    display: flex; flex-direction: column; position: absolute;
    top: 56px; left: 0; right: 0; background: var(--color-primary);
    padding: 1rem; gap: 0.5rem; z-index: 100;
  }
</style>

<a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>

<nav class="site-nav" aria-label="メインナビゲーション">
  <a href="/" class="nav-logo" aria-label="JapanCalc ホーム">
    <img src="/assets/icons/logo-white.svg" alt="JapanCalc" width="160" height="40" loading="eager" fetchpriority="high">
  </a>
  <ul class="nav-links" id="nav-links-menu">
    <li><a href="/date-calendar/">日付・カレンダー</a></li>
    <li><a href="/tax-finance/">税金・財務</a></li>
    <li><a href="/language-tools/">言語ツール</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:0.5rem;">
    <div class="lang-switcher" role="navigation" aria-label="言語切替">
      <span class="lang-option lang-active" aria-current="true">JP</span>
      <span class="lang-sep">&middot;</span>
      <a class="lang-option lang-inactive" id="lang-toggle" href="/en/date-calendar/bmi-calculator/" lang="en" title="View in English" aria-label="Switch to English">EN</a>
    </div>
    <button class="nav-hamburger" aria-label="メニューを開く" aria-expanded="false" aria-controls="nav-links-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>
</nav>

<nav class="breadcrumb" aria-label="パンくずリスト">
  <ol>
    <li><a href="/">ホーム</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li><a href="/date-calendar/">日付・カレンダー</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li aria-current="page">BMI計算ツール</li>
  </ol>
</nav>

${AD_ATF}

<main class="content page-wrapper" id="main-content">

  <h1>BMI計算ツール — 肥満度・標準体重計算</h1>
  <p class="tool-desc">
    身長と体重を入力するだけで、BMI（体格指数）と肥満度を自動計算。日本肥満学会の基準で判定し、標準体重・美容体重・モデル体重も表示します。センチ・キログラムとフィート・ポンドの両方に対応。
  </p>

  <div class="tool-box" id="tool-main">

    <div class="form-group">
      <label class="form-label">単位</label>
      <div class="rate-toggle" role="group" aria-label="単位の選択">
        <label class="rate-option">
          <input type="radio" name="unit" value="metric" checked>
          <span>cm / kg</span>
        </label>
        <label class="rate-option">
          <input type="radio" name="unit" value="imperial">
          <span>ft・in / lbs</span>
        </label>
      </div>
    </div>

    <div id="metric-inputs">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="height-cm">身長</label>
          <div class="input-suffix-wrap">
            <input type="tel" class="form-input input-with-suffix" id="height-cm" placeholder="例: 170" min="50" max="250" aria-label="身長（cm）">
            <span class="input-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="weight-kg">体重</label>
          <div class="input-suffix-wrap">
            <input type="tel" class="form-input input-with-suffix" id="weight-kg" placeholder="例: 65" min="10" max="300" aria-label="体重（kg）">
            <span class="input-suffix">kg</span>
          </div>
        </div>
      </div>
    </div>

    <div id="imperial-inputs" style="display:none;">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">身長</label>
          <div style="display:flex; gap:0.5rem;">
            <div class="input-suffix-wrap">
              <input type="tel" class="form-input input-with-suffix" id="height-ft" placeholder="5" style="width:70px;" aria-label="身長（フィート）">
              <span class="input-suffix">ft</span>
            </div>
            <div class="input-suffix-wrap">
              <input type="tel" class="form-input input-with-suffix" id="height-in" placeholder="7" style="width:70px;" aria-label="身長（インチ）">
              <span class="input-suffix">in</span>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="weight-lbs">体重</label>
          <div class="input-suffix-wrap">
            <input type="tel" class="form-input input-with-suffix" id="weight-lbs" placeholder="143" aria-label="体重（ポンド）">
            <span class="input-suffix">lbs</span>
          </div>
        </div>
      </div>
    </div>

    <div class="result-box" id="result-box" style="display:none;" aria-live="polite">
      <div class="bmi-gauge-wrap">
        <div class="bmi-gauge-bar" id="bmi-gauge-bar">
          <div class="bmi-gauge-marker" id="bmi-marker"></div>
          <div class="bmi-seg" style="background:#3b82f6; flex:2.5;"></div>
          <div class="bmi-seg" style="background:#10b981; flex:6.5;"></div>
          <div class="bmi-seg" style="background:#f59e0b; flex:5;"></div>
          <div class="bmi-seg" style="background:#f97316; flex:5;"></div>
          <div class="bmi-seg" style="background:#ef4444; flex:5;"></div>
          <div class="bmi-seg" style="background:#991b1b; flex:5;"></div>
        </div>
        <div class="bmi-gauge-labels">
          <span>10</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span>
        </div>
      </div>

      <div style="text-align:center; margin:0.75rem 0;">
        <span style="font-size:3rem; font-weight:700; font-family:var(--font-mono); color:var(--color-primary);" id="r-bmi">0</span>
        <span style="font-size:1rem; color:var(--color-text-muted); margin-left:0.25rem;">BMI</span>
        <div style="margin-top:0.25rem;">
          <span class="bmi-class-badge" id="r-class-badge">—</span>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-item">
          <span class="result-item-label">標準体重 (BMI 22)</span>
          <span class="result-item-value" id="r-standard">—</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">現在との差</span>
          <span class="result-item-value" id="r-diff">—</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">美容体重 (BMI 20)</span>
          <span class="result-item-value" id="r-beauty">—</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">モデル体重 (BMI 18)</span>
          <span class="result-item-value" id="r-model">—</span>
        </div>
      </div>

      <div id="r-imperial-note" style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.5rem;"></div>

      <div class="yaku-disclaimer" style="margin-top:0.75rem;">
        ⚠️ BMIは参考指標です。健康状態の判断には医師にご相談ください。
        出典: <a href="https://www.jasso.or.jp/" target="_blank" rel="noopener">日本肥満学会</a>
      </div>

      <div class="result-actions" style="margin-top:0.75rem;">
        <button class="btn-copy-result" id="btn-copy">結果をコピー</button>
      </div>
    </div>

    <p class="error-msg" id="error-msg" style="display:none;"></p>
  </div>

  ${AD_BTF}

  <section class="ref-section">
    <h2>BMI判定基準表（日本肥満学会）</h2>
    <table class="ref-table">
      <thead>
        <tr><th>BMI</th><th>判定</th><th>身長170cmの体重目安</th><th>備考</th></tr>
      </thead>
      <tbody>
        <tr style="background:#eff6ff;"><td>18.5未満</td><td>低体重</td><td>53.5kg未満</td><td>栄養不足の可能性</td></tr>
        <tr style="background:#f0fdf4;"><td>18.5〜25未満</td><td>普通体重</td><td>53.5〜72.3kg</td><td>疾病リスク最小</td></tr>
        <tr style="background:#fffbeb;"><td>25〜30未満</td><td>肥満1度</td><td>72.3〜86.7kg</td><td>生活習慣病に注意</td></tr>
        <tr style="background:#fff7ed;"><td>30〜35未満</td><td>肥満2度</td><td>86.7〜101.2kg</td><td>医療的介入を検討</td></tr>
        <tr style="background:#fef2f2;"><td>35〜40未満</td><td>肥満3度</td><td>101.2〜115.6kg</td><td>高度肥満</td></tr>
        <tr style="background:#fef2f2;"><td>40以上</td><td>肥満4度</td><td>115.6kg以上</td><td>重度肥満</td></tr>
      </tbody>
    </table>

    <h2 style="margin-top:1.5rem;">身長別 標準体重一覧</h2>
    <table class="ref-table">
      <thead>
        <tr><th>身長</th><th>標準体重 (BMI 22)</th><th>美容体重 (BMI 20)</th><th>モデル体重 (BMI 18)</th></tr>
      </thead>
      <tbody>
        <tr><td>150cm</td><td>49.5kg</td><td>45.0kg</td><td>40.5kg</td></tr>
        <tr><td>155cm</td><td>52.8kg</td><td>48.1kg</td><td>43.3kg</td></tr>
        <tr><td>160cm</td><td>56.3kg</td><td>51.2kg</td><td>46.1kg</td></tr>
        <tr><td>165cm</td><td>59.9kg</td><td>54.5kg</td><td>49.0kg</td></tr>
        <tr><td>170cm</td><td>63.6kg</td><td>57.8kg</td><td>52.0kg</td></tr>
        <tr><td>175cm</td><td>67.4kg</td><td>61.3kg</td><td>55.1kg</td></tr>
        <tr><td>180cm</td><td>71.3kg</td><td>64.8kg</td><td>58.3kg</td></tr>
        <tr><td>185cm</td><td>75.3kg</td><td>68.5kg</td><td>61.6kg</td></tr>
      </tbody>
    </table>
  </section>

  <article class="seo-content">
    <h2>BMIとは何か — 計算方法と日本の判定基準</h2>
    <p>
      BMI（Body Mass Index、体格指数）は、身長と体重から算出される肥満度の国際的な指標です。計算式は「体重(kg) ÷ 身長(m)²」で、例えば身長170cm・体重65kgの人のBMIは22.5となります。世界保健機関（WHO）はBMI 30以上を肥満と定義していますが、日本肥満学会はより厳格な基準を採用しており、BMI 25以上を肥満と判定します。これはアジア人が欧米人と比較して、同じBMIでも体脂肪率が高い傾向があり、BMI 25前後から<a href="/tax-finance/">生活習慣病</a>のリスクが増加することが研究で示されているためです。BMI 22は統計的に最も疾病リスクが低い値とされ、この値から算出される体重が「標準体重」です。
    </p>

    <h2>BMIの限界と健康管理への活用方法</h2>
    <p>
      BMIは簡便な指標ですが、いくつかの限界があります。筋肉量が多いアスリートはBMIが高くても肥満ではない場合がありますし、逆に体脂肪率が高くてもBMIが正常範囲に収まる「隠れ肥満」も存在します。また、内臓脂肪と皮下脂肪の分布はBMIでは判断できません。このツールでは標準体重（BMI 22）に加え、美容体重（BMI 20）やモデル体重（BMI 18）も参考として表示していますが、過度な減量は健康を害する可能性があるため注意が必要です。健康管理にはBMIだけでなく、腹囲測定や血液検査など総合的な評価が重要です。体重に関する不安がある方は、<a href="/date-calendar/">医療機関</a>での定期検診をお勧めします。日本の<a href="/tax-finance/salary-calculator/">健康保険</a>は年1回の特定健診を40歳以上に義務付けており、BMIもその検査項目に含まれています。
    </p>
  </article>

  <section>
    <h2>よくある質問</h2>
${faqHTML}
  </section>

  <section class="related-tools">
    <h2>関連ツール</h2>
    <div class="cards-grid">
      <a href="/date-calendar/age-calculator/" class="tool-card">
        <div class="tool-card-icon">🎂</div>
        <div class="tool-card-name">年齢計算</div>
      </a>
      <a href="/language-tools/measurement-converter/" class="tool-card">
        <div class="tool-card-icon">📏</div>
        <div class="tool-card-name">単位変換</div>
      </a>
      <a href="/tax-finance/salary-calculator/" class="tool-card">
        <div class="tool-card-icon">💴</div>
        <div class="tool-card-name">手取り計算</div>
      </a>
    </div>
  </section>

</main>

<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <ul class="footer-links">
      <li><a href="/about/">JapanCalcについて</a></li>
      <li><a href="/privacy/">プライバシーポリシー</a></li>
      <li><a href="/terms/">利用規約</a></li>
      <li><a href="mailto:hello@japancalc.com">お問い合わせ</a></li>
    </ul>
    <p class="footer-copy">&copy; <span id="footer-year"></span> JapanCalc. All rights reserved.</p>
  </div>
</footer>

<script>document.getElementById('footer-year').textContent = new Date().getFullYear();</script>
${HAMBURGER_SCRIPT.replace('%CLOSE%', 'メニューを閉じる').replace('%OPEN%', 'メニューを開く')}

<script type="module">
import { calcBMI, cmToFeetInches, kgToLbs, lbsToKg, feetInchesToCm } from '/assets/js/bmi.js';

const resultEl = document.getElementById('result-box');
const errorEl  = document.getElementById('error-msg');

function getInputs() {
  var unit = document.querySelector('input[name="unit"]:checked').value;
  if (unit === 'metric') {
    return {
      heightCm: parseFloat(document.getElementById('height-cm').value),
      weightKg: parseFloat(document.getElementById('weight-kg').value),
    };
  } else {
    var ft  = parseFloat(document.getElementById('height-ft').value) || 0;
    var ins = parseFloat(document.getElementById('height-in').value) || 0;
    var lbs = parseFloat(document.getElementById('weight-lbs').value);
    return {
      heightCm: feetInchesToCm(ft, ins),
      weightKg: lbsToKg(lbs),
    };
  }
}

function compute() {
  var inp = getInputs();
  if (!inp.heightCm || !inp.weightKg) { resultEl.style.display='none'; errorEl.style.display='none'; return; }

  var r = calcBMI(inp.heightCm, inp.weightKg);
  if (r.error) {
    resultEl.style.display='none';
    errorEl.textContent = r.error;
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';

  document.getElementById('r-bmi').textContent = r.bmi;

  var badge = document.getElementById('r-class-badge');
  badge.textContent = r.classification.label;
  badge.style.background = r.classification.color;

  var pct = Math.min(100, Math.max(0, ((r.bmiExact - 10) / 35) * 100));
  document.getElementById('bmi-marker').style.left = pct + '%';

  document.getElementById('r-standard').textContent = r.standardWeight + 'kg';
  document.getElementById('r-beauty').textContent   = r.beautyWeight   + 'kg';
  document.getElementById('r-model').textContent    = r.modelWeight    + 'kg';

  var diffText = r.weightToStandard > 0
    ? '標準より +' + r.weightToStandard + 'kg'
    : r.weightToStandard < 0
    ? '標準より ' + r.weightToStandard + 'kg'
    : '標準体重です';
  document.getElementById('r-diff').textContent = diffText;

  var fi  = cmToFeetInches(inp.heightCm);
  var lbs = kgToLbs(inp.weightKg);
  document.getElementById('r-imperial-note').textContent =
    '換算: ' + fi.feet + 'ft ' + fi.inches + 'in / ' + lbs + 'lbs';

  resultEl.style.display = 'block';
  if (typeof gtag === 'function') gtag('event', 'tool_used', { tool_name: 'bmi_calculator', language: 'ja' });
}

document.querySelectorAll('input[name="unit"]').forEach(function(r) {
  r.addEventListener('change', function() {
    var isMetric = r.value === 'metric';
    document.getElementById('metric-inputs').style.display   = isMetric ? '' : 'none';
    document.getElementById('imperial-inputs').style.display = isMetric ? 'none' : '';
    resultEl.style.display = 'none';
  });
});

['height-cm','weight-kg','height-ft','height-in','weight-lbs'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', compute);
});

document.getElementById('btn-copy').addEventListener('click', function() {
  var bmi  = document.getElementById('r-bmi').textContent;
  var cls  = document.getElementById('r-class-badge').textContent;
  var std  = document.getElementById('r-standard').textContent;
  var diff = document.getElementById('r-diff').textContent;
  var inp  = getInputs();
  var text = 'BMI: ' + bmi + '（' + cls + '）\\n身長: ' + inp.heightCm + 'cm / 体重: ' + inp.weightKg + 'kg\\n標準体重: ' + std + ' / ' + diff;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('btn-copy');
    btn.textContent = 'コピーしました ✓';
    setTimeout(function() { btn.textContent = '結果をコピー'; }, 2000);
  });
});
</script>

${AD_LAZY_SCRIPT}
${LANG_TOGGLE_SCRIPT}
</body>
</html>`;
}

/* ─── Build EN page ─── */
function buildEN() {
  const faqItems = [
    { q: 'How is BMI calculated?', a: 'BMI is calculated as weight (kg) divided by height (m) squared. For example, if you are 170cm tall and weigh 65kg: 65 ÷ (1.70 × 1.70) = 22.5. Under Japan\'s obesity standards, BMI below 18.5 is underweight, 18.5-25 is normal weight, and 25 or above is classified as obese. Simply enter your height and weight in this tool to get your BMI automatically.' },
    { q: 'How is standard weight calculated?', a: 'Standard weight (標準体重) is calculated as height (m) squared × 22. BMI 22 is statistically associated with the lowest disease risk. For example, standard weight for 170cm is 1.70 × 1.70 × 22 = 63.6kg. This tool also shows beauty weight (BMI 20, calculated as height² × 20) and model weight (BMI 18, calculated as height² × 18) for reference.' },
    { q: 'Are Japan\'s obesity standards different from WHO?', a: 'Yes, significantly. WHO classifies BMI 30+ as obese, but Japan\'s Society for the Study of Obesity (JASSO) classifies BMI 25+ as obese (Classes 1-4). Research shows that Asian populations tend to have higher body fat percentages at the same BMI compared to Western populations, and lifestyle disease risks increase around BMI 25. This tool uses the Japanese standard.' },
    { q: 'Can BMI alone determine health status?', a: 'No. BMI is a rough indicator of body composition and does not account for muscle mass, bone density, or fat distribution. Athletes with high muscle mass may have elevated BMI without being overweight. Visceral fat (内臓脂肪), which is particularly relevant in Japanese health checks, cannot be measured by BMI alone. Use this tool as a reference and consult a healthcare professional for comprehensive health assessment.' },
    { q: 'How much weight should I lose to reach standard weight?', a: 'This tool shows the difference between your current weight and standard weight (BMI 22). However, rapid weight loss can be harmful. A safe pace is generally 1-2kg per month. For a personalized plan, consult a doctor or registered dietitian. Japanese health insurance covers an annual metabolic checkup (特定健診) for those 40 and older, which includes BMI evaluation.' },
  ];

  const faqHTML = faqItems.map(f => `    <details class="faq-item">
      <summary>${f.q}</summary>
      <div class="faq-answer">${f.a}</div>
    </details>`).join('\n');

  const faqJsonLd = faqItems.map(f => `      {
        "@type": "Question",
        "name": ${JSON.stringify(f.q)},
        "acceptedAnswer": {
          "@type": "Answer",
          "text": ${JSON.stringify(f.a)}
        }
      }`).join(',\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BMI Calculator Japan Standard: Ideal Weight | JapanCalc</title>
  <meta name="description" content="Calculate BMI using Japan obesity standards. Find ideal weight, beauty weight and model weight. Supports metric and imperial. Free, no login.">
  <link rel="canonical" href="https://japancalc.com/en/date-calendar/bmi-calculator/">
  <link rel="alternate" hreflang="en" href="https://japancalc.com/en/date-calendar/bmi-calculator/">
  <link rel="alternate" hreflang="ja" href="https://japancalc.com/date-calendar/bmi-calculator/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/date-calendar/bmi-calculator/">
  <meta property="og:title" content="BMI Calculator Japan Standard: Ideal Weight | JapanCalc">
  <meta property="og:url" content="https://japancalc.com/en/date-calendar/bmi-calculator/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
  ${HEAD_ICONS}
  ${GA}

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "BMI Calculator — Japan Standard",
    "description": "Calculate BMI using Japan's obesity society standards with ideal weight display.",
    "url": "https://japancalc.com/en/date-calendar/bmi-calculator/",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "inLanguage": ["en", "ja"]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://japancalc.com/en/" },
      { "@type": "ListItem", "position": 2, "name": "Date & Calendar", "item": "https://japancalc.com/en/date-calendar/" },
      { "@type": "ListItem", "position": 3, "name": "BMI Calculator", "item": "https://japancalc.com/en/date-calendar/bmi-calculator/" }
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
  ${ADSENSE}
  <style>${PAGE_CSS}</style>
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
      <a class="lang-option lang-inactive" id="lang-toggle" href="/date-calendar/bmi-calculator/" lang="ja" title="日本語で表示" aria-label="日本語に切り替え">JP</a>
      <span class="lang-sep">&middot;</span>
      <span class="lang-option lang-active" aria-current="true">EN</span>
    </div>
    <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol>
    <li><a href="/en/">Home</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li><a href="/en/date-calendar/">Date &amp; Calendar</a></li>
    <li><span class="breadcrumb-sep">&#x203A;</span></li>
    <li aria-current="page">BMI Calculator</li>
  </ol>
</nav>

${AD_ATF}

<main class="content page-wrapper" id="main-content">

  <h1>BMI Calculator — Japan Standard</h1>
  <p class="tool-desc">
    Enter your height and weight to calculate your BMI and obesity classification using Japan's official standards from the Japan Society for the Study of Obesity (JASSO). Also shows standard weight, beauty weight, and model weight. Supports both metric (cm/kg) and imperial (ft/lbs).
  </p>

  <div class="tool-box" id="tool-main">

    <div class="form-group">
      <label class="form-label">Units</label>
      <div class="rate-toggle" role="group" aria-label="Select units">
        <label class="rate-option">
          <input type="radio" name="unit" value="metric" checked>
          <span>cm / kg</span>
        </label>
        <label class="rate-option">
          <input type="radio" name="unit" value="imperial">
          <span>ft・in / lbs</span>
        </label>
      </div>
    </div>

    <div id="metric-inputs">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="height-cm">Height</label>
          <div class="input-suffix-wrap">
            <input type="tel" class="form-input input-with-suffix" id="height-cm" placeholder="e.g. 170" min="50" max="250" aria-label="Height in cm">
            <span class="input-suffix">cm</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="weight-kg">Weight</label>
          <div class="input-suffix-wrap">
            <input type="tel" class="form-input input-with-suffix" id="weight-kg" placeholder="e.g. 65" min="10" max="300" aria-label="Weight in kg">
            <span class="input-suffix">kg</span>
          </div>
        </div>
      </div>
    </div>

    <div id="imperial-inputs" style="display:none;">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Height</label>
          <div style="display:flex; gap:0.5rem;">
            <div class="input-suffix-wrap">
              <input type="tel" class="form-input input-with-suffix" id="height-ft" placeholder="5" style="width:70px;" aria-label="Height in feet">
              <span class="input-suffix">ft</span>
            </div>
            <div class="input-suffix-wrap">
              <input type="tel" class="form-input input-with-suffix" id="height-in" placeholder="7" style="width:70px;" aria-label="Height in inches">
              <span class="input-suffix">in</span>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="weight-lbs">Weight</label>
          <div class="input-suffix-wrap">
            <input type="tel" class="form-input input-with-suffix" id="weight-lbs" placeholder="143" aria-label="Weight in pounds">
            <span class="input-suffix">lbs</span>
          </div>
        </div>
      </div>
    </div>

    <div class="result-box" id="result-box" style="display:none;" aria-live="polite">
      <div class="bmi-gauge-wrap">
        <div class="bmi-gauge-bar" id="bmi-gauge-bar">
          <div class="bmi-gauge-marker" id="bmi-marker"></div>
          <div class="bmi-seg" style="background:#3b82f6; flex:2.5;"></div>
          <div class="bmi-seg" style="background:#10b981; flex:6.5;"></div>
          <div class="bmi-seg" style="background:#f59e0b; flex:5;"></div>
          <div class="bmi-seg" style="background:#f97316; flex:5;"></div>
          <div class="bmi-seg" style="background:#ef4444; flex:5;"></div>
          <div class="bmi-seg" style="background:#991b1b; flex:5;"></div>
        </div>
        <div class="bmi-gauge-labels">
          <span>10</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span>
        </div>
      </div>

      <div style="text-align:center; margin:0.75rem 0;">
        <span style="font-size:3rem; font-weight:700; font-family:var(--font-mono); color:var(--color-primary);" id="r-bmi">0</span>
        <span style="font-size:1rem; color:var(--color-text-muted); margin-left:0.25rem;">BMI</span>
        <div style="margin-top:0.25rem;">
          <span class="bmi-class-badge" id="r-class-badge">—</span>
        </div>
      </div>

      <div class="result-grid">
        <div class="result-item">
          <span class="result-item-label">Standard weight (BMI 22)</span>
          <span class="result-item-value" id="r-standard">—</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">Difference</span>
          <span class="result-item-value" id="r-diff">—</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">Beauty weight (BMI 20)</span>
          <span class="result-item-value" id="r-beauty">—</span>
        </div>
        <div class="result-item">
          <span class="result-item-label">Model weight (BMI 18)</span>
          <span class="result-item-value" id="r-model">—</span>
        </div>
      </div>

      <div id="r-imperial-note" style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.5rem;"></div>

      <div class="yaku-disclaimer" style="margin-top:0.75rem;">
        ⚠️ BMI is a reference indicator only. Consult a doctor for health assessment.
        Source: <a href="https://www.jasso.or.jp/" target="_blank" rel="noopener">Japan Society for the Study of Obesity (JASSO)</a>
      </div>

      <div class="result-actions" style="margin-top:0.75rem;">
        <button class="btn-copy-result" id="btn-copy">Copy result</button>
      </div>
    </div>

    <p class="error-msg" id="error-msg" style="display:none;"></p>
  </div>

  ${AD_BTF}

  <section class="ref-section">
    <h2>BMI Classification Table (Japan Standard)</h2>
    <table class="ref-table">
      <thead>
        <tr><th>BMI</th><th>Classification</th><th>Weight for 170cm</th><th>Note</th></tr>
      </thead>
      <tbody>
        <tr style="background:#eff6ff;"><td>&lt; 18.5</td><td>Underweight</td><td>&lt; 53.5kg</td><td>Possible malnutrition</td></tr>
        <tr style="background:#f0fdf4;"><td>18.5 – 25</td><td>Normal weight</td><td>53.5 – 72.3kg</td><td>Lowest disease risk</td></tr>
        <tr style="background:#fffbeb;"><td>25 – 30</td><td>Obese Class 1</td><td>72.3 – 86.7kg</td><td>Lifestyle disease risk</td></tr>
        <tr style="background:#fff7ed;"><td>30 – 35</td><td>Obese Class 2</td><td>86.7 – 101.2kg</td><td>Medical intervention advised</td></tr>
        <tr style="background:#fef2f2;"><td>35 – 40</td><td>Obese Class 3</td><td>101.2 – 115.6kg</td><td>Severe obesity</td></tr>
        <tr style="background:#fef2f2;"><td>40+</td><td>Obese Class 4</td><td>115.6kg+</td><td>Morbid obesity</td></tr>
      </tbody>
    </table>

    <h2 style="margin-top:1.5rem;">Ideal Weight by Height</h2>
    <table class="ref-table">
      <thead>
        <tr><th>Height</th><th>Standard (BMI 22)</th><th>Beauty (BMI 20)</th><th>Model (BMI 18)</th></tr>
      </thead>
      <tbody>
        <tr><td>150cm / 4'11"</td><td>49.5kg</td><td>45.0kg</td><td>40.5kg</td></tr>
        <tr><td>155cm / 5'1"</td><td>52.8kg</td><td>48.1kg</td><td>43.3kg</td></tr>
        <tr><td>160cm / 5'3"</td><td>56.3kg</td><td>51.2kg</td><td>46.1kg</td></tr>
        <tr><td>165cm / 5'5"</td><td>59.9kg</td><td>54.5kg</td><td>49.0kg</td></tr>
        <tr><td>170cm / 5'7"</td><td>63.6kg</td><td>57.8kg</td><td>52.0kg</td></tr>
        <tr><td>175cm / 5'9"</td><td>67.4kg</td><td>61.3kg</td><td>55.1kg</td></tr>
        <tr><td>180cm / 5'11"</td><td>71.3kg</td><td>64.8kg</td><td>58.3kg</td></tr>
        <tr><td>185cm / 6'1"</td><td>75.3kg</td><td>68.5kg</td><td>61.6kg</td></tr>
      </tbody>
    </table>
  </section>

  <article class="seo-content">
    <h2>Understanding BMI in Japan — Why Standards Differ</h2>
    <p>
      If you have ever received health check results in Japan, you may have noticed that the obesity threshold is lower than what you are used to. While the World Health Organization (WHO) classifies BMI 30 and above as obese, Japan's Society for the Study of Obesity (JASSO) sets the threshold at BMI 25. This is not arbitrary — research consistently shows that Asian populations develop metabolic complications such as type 2 diabetes and cardiovascular disease at lower BMI levels compared to Western populations. On Japanese medical forms, you will often see the term 肥満度 (degree of obesity), which corresponds directly to these JASSO classifications. For expats in Japan, understanding this difference is important when interpreting annual health check (健康診断) results from your company or local municipality.
    </p>

    <h2>Beyond BMI — A Practical Health Perspective</h2>
    <p>
      While BMI is a useful screening tool, it has well-known limitations. Athletes and people with higher muscle mass may register as "obese" by BMI while being perfectly healthy. Conversely, "normal weight obesity" — where BMI is within range but body fat percentage is high — is increasingly recognized as a health concern. In Japan, the annual metabolic checkup (特定健診) for those aged 40 and above measures not just BMI but also waist circumference, blood pressure, and blood lipid levels. This tool shows three reference weights: standard weight (BMI 22, the statistical sweet spot for lowest disease risk), beauty weight (BMI 20, a common cosmetic goal in Japan), and model weight (BMI 18). While these are useful benchmarks, healthy weight varies significantly between individuals. If you have concerns about your weight, consult a doctor or visit a <a href="/en/tax-finance/">registered healthcare provider</a> for personalized advice.
    </p>
  </article>

  <section>
    <h2>Frequently Asked Questions</h2>
${faqHTML}
  </section>

  <section class="related-tools">
    <h2>Related Tools</h2>
    <div class="cards-grid">
      <a href="/en/date-calendar/age-calculator/" class="tool-card">
        <div class="tool-card-icon">🎂</div>
        <div class="tool-card-name">Age Calculator</div>
      </a>
      <a href="/en/language-tools/measurement-converter/" class="tool-card">
        <div class="tool-card-icon">📏</div>
        <div class="tool-card-name">Measurement Converter</div>
      </a>
      <a href="/en/tax-finance/salary-calculator/" class="tool-card">
        <div class="tool-card-icon">💴</div>
        <div class="tool-card-name">Salary Calculator</div>
      </a>
    </div>
  </section>

</main>

<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <ul class="footer-links">
      <li><a href="/en/about/">About</a></li>
      <li><a href="/en/privacy/">Privacy Policy</a></li>
      <li><a href="/en/terms/">Terms of Use</a></li>
      <li><a href="mailto:hello@japancalc.com">Contact</a></li>
    </ul>
    <p class="footer-copy">&copy; <span id="footer-year"></span> JapanCalc. All rights reserved.</p>
  </div>
</footer>

<script>document.getElementById('footer-year').textContent = new Date().getFullYear();</script>
${HAMBURGER_SCRIPT.replace('%CLOSE%', 'Close menu').replace('%OPEN%', 'Open menu')}

<script type="module">
import { calcBMI, cmToFeetInches, kgToLbs, lbsToKg, feetInchesToCm } from '/assets/js/bmi.js';

const resultEl = document.getElementById('result-box');
const errorEl  = document.getElementById('error-msg');

function getInputs() {
  var unit = document.querySelector('input[name="unit"]:checked').value;
  if (unit === 'metric') {
    return {
      heightCm: parseFloat(document.getElementById('height-cm').value),
      weightKg: parseFloat(document.getElementById('weight-kg').value),
    };
  } else {
    var ft  = parseFloat(document.getElementById('height-ft').value) || 0;
    var ins = parseFloat(document.getElementById('height-in').value) || 0;
    var lbs = parseFloat(document.getElementById('weight-lbs').value);
    return {
      heightCm: feetInchesToCm(ft, ins),
      weightKg: lbsToKg(lbs),
    };
  }
}

function compute() {
  var inp = getInputs();
  if (!inp.heightCm || !inp.weightKg) { resultEl.style.display='none'; errorEl.style.display='none'; return; }

  var r = calcBMI(inp.heightCm, inp.weightKg);
  if (r.error) {
    resultEl.style.display='none';
    errorEl.textContent = r.error;
    errorEl.style.display = 'block';
    return;
  }
  errorEl.style.display = 'none';

  document.getElementById('r-bmi').textContent = r.bmi;

  var badge = document.getElementById('r-class-badge');
  badge.textContent = r.classification.labelEN;
  badge.style.background = r.classification.color;

  var pct = Math.min(100, Math.max(0, ((r.bmiExact - 10) / 35) * 100));
  document.getElementById('bmi-marker').style.left = pct + '%';

  document.getElementById('r-standard').textContent = r.standardWeight + 'kg';
  document.getElementById('r-beauty').textContent   = r.beautyWeight   + 'kg';
  document.getElementById('r-model').textContent    = r.modelWeight    + 'kg';

  var diffText = r.weightToStandard > 0
    ? '+' + r.weightToStandard + 'kg above standard'
    : r.weightToStandard < 0
    ? r.weightToStandard + 'kg below standard'
    : 'At standard weight';
  document.getElementById('r-diff').textContent = diffText;

  var fi  = cmToFeetInches(inp.heightCm);
  var lbs = kgToLbs(inp.weightKg);
  document.getElementById('r-imperial-note').textContent =
    'Equivalent: ' + fi.feet + 'ft ' + fi.inches + 'in / ' + lbs + 'lbs';

  resultEl.style.display = 'block';
  if (typeof gtag === 'function') gtag('event', 'tool_used', { tool_name: 'bmi_calculator', language: 'en' });
}

document.querySelectorAll('input[name="unit"]').forEach(function(r) {
  r.addEventListener('change', function() {
    var isMetric = r.value === 'metric';
    document.getElementById('metric-inputs').style.display   = isMetric ? '' : 'none';
    document.getElementById('imperial-inputs').style.display = isMetric ? 'none' : '';
    resultEl.style.display = 'none';
  });
});

['height-cm','weight-kg','height-ft','height-in','weight-lbs'].forEach(function(id) {
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', compute);
});

document.getElementById('btn-copy').addEventListener('click', function() {
  var bmi  = document.getElementById('r-bmi').textContent;
  var cls  = document.getElementById('r-class-badge').textContent;
  var std  = document.getElementById('r-standard').textContent;
  var diff = document.getElementById('r-diff').textContent;
  var inp  = getInputs();
  var text = 'BMI: ' + bmi + ' (' + cls + ')\\nHeight: ' + inp.heightCm + 'cm / Weight: ' + inp.weightKg + 'kg\\nStandard weight: ' + std + ' / ' + diff;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('btn-copy');
    btn.textContent = 'Copied! ✓';
    setTimeout(function() { btn.textContent = 'Copy result'; }, 2000);
  });
});
</script>

${AD_LAZY_SCRIPT}
${LANG_TOGGLE_SCRIPT}
</body>
</html>`;
}

/* ─── Write files ─── */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const jpDir = path.join(DIST, 'date-calendar', 'bmi-calculator');
const enDir = path.join(DIST, 'en', 'date-calendar', 'bmi-calculator');

ensureDir(jpDir);
ensureDir(enDir);

fs.writeFileSync(path.join(jpDir, 'index.html'), buildJP(), 'utf8');
console.log('  JP: /date-calendar/bmi-calculator/');

fs.writeFileSync(path.join(enDir, 'index.html'), buildEN(), 'utf8');
console.log('  EN: /en/date-calendar/bmi-calculator/');

console.log('Done! Created 2 BMI calculator pages.');
