/**
 * generate-shichigosan-pages.js — Creates JP and EN Shichi-Go-San calculator pages
 * Run: node scripts/generate-shichigosan-pages.js
 */
const fs = require('fs');
const path = require('path');
const DIST = path.join(__dirname, '..', 'dist');

const HEAD_ICONS = `<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="shortcut icon" href="/favicon.ico">`;

const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-P9TH5C7P9H"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-P9TH5C7P9H');
</script>`;

const ADSENSE = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>`;

const AD_ATF = `<div class="ad-zone ad-atf" style="min-height:90px; margin:0 auto 1rem;">
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_ATF_753" data-ad-format="auto" data-full-width-responsive="true"></ins>
</div>`;

const AD_BTF = `<div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
  <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_BTF_753" data-ad-format="auto" data-full-width-responsive="true"></ins>
</div>`;

const SCRIPTS_FOOTER = (closeLbl, openLbl) => `<script>document.getElementById('footer-year').textContent = new Date().getFullYear();</script>
<script>
(function() {
  var btn = document.querySelector('.nav-hamburger');
  var nav = document.querySelector('.site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', function() {
    var isOpen = nav.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? '${closeLbl}' : '${openLbl}');
  });
})();
</script>
<script defer>
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
</script>
<script>
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

const PAGE_CSS = `
.form-row { display: flex; gap: 1rem; flex-wrap: wrap; }
.form-row .form-group { flex: 1; min-width: 100px; }
.result-box {
  background: var(--color-bg-alt); border-radius: 12px; padding: 1.25rem;
  margin-top: 1rem; border: 1px solid var(--color-border);
}
.ceremony-cards { display: grid; grid-template-columns: 1fr; gap: 0.75rem; margin-top: 0.75rem; }
.ceremony-card {
  background: white; border-radius: 10px; padding: 0.75rem 1rem;
  border: 1px solid var(--color-border); position: relative;
}
.ceremony-card--past { opacity: 0.55; }
.ceremony-card--this-year { border-color: var(--color-accent); border-width: 2px; }
.ceremony-card--this-year::after {
  content: '今年'; position: absolute; top: -8px; right: 12px;
  background: var(--color-accent); color: white; font-size: 0.65rem; font-weight: 600;
  padding: 0.1rem 0.5rem; border-radius: 99px;
}
.ceremony-name { font-weight: 700; font-size: 1rem; color: var(--color-primary); }
.ceremony-gender { font-size: 0.72rem; color: var(--color-text-muted); margin-left: 0.5rem; }
.ceremony-detail { display: flex; gap: 1.5rem; margin-top: 0.35rem; font-size: 0.85rem; }
.ceremony-detail dt { color: var(--color-text-muted); font-size: 0.72rem; }
.ceremony-detail dd { font-weight: 600; font-family: var(--font-mono); margin: 0; }
.badge-past { font-size: 0.65rem; background: var(--color-bg-alt); color: var(--color-text-muted); padding: 0.1rem 0.4rem; border-radius: 4px; margin-left: 0.5rem; }
.btn-copy-result {
  background: var(--color-accent); color: white; border: none; border-radius: 8px;
  padding: 0.5rem 1.2rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
}
.btn-copy-result:hover { opacity: 0.85; }
.ref-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin: 1rem 0; }
.ref-table th, .ref-table td { padding: 0.5rem 0.6rem; border: 1px solid var(--color-border); text-align: center; }
.ref-table th { background: var(--color-bg-alt); font-weight: 600; font-size: 0.78rem; }
.faq-item { border-bottom: 1px solid var(--color-border); }
.faq-item summary { padding: 0.75rem 0; font-weight: 600; cursor: pointer; font-size: 0.95rem; list-style: none; display: flex; justify-content: space-between; align-items: center; }
.faq-item summary::after { content: '+'; font-size: 1.2rem; color: var(--color-accent); }
.faq-item[open] summary::after { content: '−'; }
.faq-item .faq-answer { padding: 0 0 0.75rem; font-size: 0.88rem; line-height: 1.7; color: var(--color-text-muted); }
@media (max-width: 600px) { .form-row { flex-direction: column; gap: 0.5rem; } }`;

// Nov 15 day-of-week reference table 2024-2035
function buildNov15Table(isEN) {
  const DAYS_JP = ['日','月','火','水','木','金','土'];
  const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  let rows = '';
  for (let y = 2024; y <= 2035; y++) {
    const d = new Date(y, 10, 15);
    const dow = isEN ? DAYS_EN[d.getDay()] : DAYS_JP[d.getDay()] + '曜日';
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const style = isWeekend ? ' style="background:#f0fdf4;"' : '';
    rows += `        <tr${style}><td>${y}${isEN ? '' : '年'}</td><td>11${isEN ? '/15' : '月15日'}</td><td>${dow}</td></tr>\n`;
  }
  return rows;
}

function buildJP() {
  const faqItems = [
    { q: '七五三はいつ行うのですか？', a: '七五三は毎年11月15日が正式な日とされています。ただし現在では11月15日前後の土日祝日にお参りする家庭が多く、10月〜12月初旬にかけて行われることも一般的です。神社によっては9月から受付を始めるところもあります。このツールでは11月15日の曜日を表示しているので、お参りの計画にお役立てください。' },
    { q: '数え年と満年齢どちらで七五三を祝う？', a: '伝統的には数え年（生まれた年を1歳とし、元旦に1歳加算）で祝うのが正式です。しかし現代では満年齢で祝う家庭も多く、どちらでも問題ありません。兄弟姉妹の年齢が近い場合、一方を数え年、もう一方を満年齢で合わせて同時にお祝いするケースもよくあります。このツールでは両方の年を表示しています。' },
    { q: '3歳の七五三は男の子もしますか？', a: 'はい、3歳の七五三（髪置きの儀）は本来男女ともに行う行事です。5歳の袴着は男の子のみ、7歳の帯解きは女の子のみの行事です。ただし地域によっては3歳は女の子のみとする慣習もあります。最近では男の子の3歳も積極的にお祝いする家庭が増えています。' },
    { q: '七五三の由来は？', a: '七五三は平安時代から続く日本の伝統行事です。3歳の「髪置き」は、それまで剃っていた髪を伸ばし始める儀式。5歳の「袴着」は初めて袴を着ける儀式。7歳の「帯解き」は大人と同じ帯を締め始める儀式に由来します。11月15日に行われるようになったのは、江戸時代に徳川綱吉が息子の健康祈願をこの日に行ったことがきっかけとされています。' },
    { q: '七五三の準備はいつから始めればよいですか？', a: '一般的に6ヶ月前（5月頃）から準備を始めるのがおすすめです。写真撮影の前撮りは4月〜9月が空いていてお得なプランが多く、衣装のレンタル予約も早いほど選択肢が広がります。神社への祈祷予約は1〜2ヶ月前が目安です。11月の土日は特に混雑するため、平日や時期をずらすのも一つの方法です。' },
  ];

  const faqHTML = faqItems.map(f => `    <details class="faq-item">
      <summary>${f.q}</summary>
      <div class="faq-answer">${f.a}</div>
    </details>`).join('\n');

  const faqJsonLd = faqItems.map(f => `      {
        "@type": "Question",
        "name": ${JSON.stringify(f.q)},
        "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(f.a)} }
      }`).join(',\n');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>七五三計算ツール: お子様の七五三はいつ？ | JapanCalc</title>
  <meta name="description" content="生年月日を入力するだけでお子様の七五三（3歳・5歳・7歳）の年を計算。数え年・満年齢両方で確認。11月15日の曜日も表示。無料、ログイン不要。">
  <link rel="canonical" href="https://japancalc.com/date-calendar/shichigosan/">
  <link rel="alternate" hreflang="en" href="https://japancalc.com/en/date-calendar/shichigosan/">
  <link rel="alternate" hreflang="ja" href="https://japancalc.com/date-calendar/shichigosan/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/date-calendar/shichigosan/">
  <meta property="og:title" content="七五三計算ツール: お子様の七五三はいつ？ | JapanCalc">
  <meta property="og:url" content="https://japancalc.com/date-calendar/shichigosan/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
  ${HEAD_ICONS}
  ${GA}
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebApplication",
    "name": "七五三計算ツール", "description": "お子様の七五三（3歳・5歳・7歳）の年を自動計算",
    "url": "https://japancalc.com/date-calendar/shichigosan/",
    "applicationCategory": "UtilityApplication", "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "inLanguage": ["ja", "en"] }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "ホーム", "item": "https://japancalc.com/" },
      { "@type": "ListItem", "position": 2, "name": "日付・カレンダー", "item": "https://japancalc.com/date-calendar/" },
      { "@type": "ListItem", "position": 3, "name": "七五三計算ツール", "item": "https://japancalc.com/date-calendar/shichigosan/" }
    ] }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [
${faqJsonLd}
    ] }
  </script>
  <link rel="stylesheet" href="/assets/css/main.css">
  ${ADSENSE}
  <style>${PAGE_CSS}</style>
</head>
<body>
<style>nav.site-nav.nav-open .nav-links { display: flex; flex-direction: column; position: absolute; top: 56px; left: 0; right: 0; background: var(--color-primary); padding: 1rem; gap: 0.5rem; z-index: 100; }</style>
<a href="#main-content" class="skip-link">メインコンテンツへスキップ</a>
<nav class="site-nav" aria-label="メインナビゲーション">
  <a href="/" class="nav-logo" aria-label="JapanCalc ホーム"><img src="/assets/icons/logo-white.svg" alt="JapanCalc" width="160" height="40" loading="eager" fetchpriority="high"></a>
  <ul class="nav-links" id="nav-links-menu">
    <li><a href="/date-calendar/">日付・カレンダー</a></li>
    <li><a href="/tax-finance/">税金・財務</a></li>
    <li><a href="/language-tools/">言語ツール</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:0.5rem;">
    <div class="lang-switcher" role="navigation" aria-label="言語切替">
      <span class="lang-option lang-active" aria-current="true">JP</span>
      <span class="lang-sep">&middot;</span>
      <a class="lang-option lang-inactive" id="lang-toggle" href="/en/date-calendar/shichigosan/" lang="en" title="View in English" aria-label="Switch to English">EN</a>
    </div>
    <button class="nav-hamburger" aria-label="メニューを開く" aria-expanded="false" aria-controls="nav-links-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  </div>
</nav>
<nav class="breadcrumb" aria-label="パンくずリスト">
  <ol><li><a href="/">ホーム</a></li><li><span class="breadcrumb-sep">&#x203A;</span></li><li><a href="/date-calendar/">日付・カレンダー</a></li><li><span class="breadcrumb-sep">&#x203A;</span></li><li aria-current="page">七五三計算</li></ol>
</nav>
${AD_ATF}
<main class="content page-wrapper" id="main-content">
  <h1>七五三計算ツール</h1>
  <p class="tool-desc">お子様の生年月日を入力するだけで、七五三（3歳・5歳・7歳）のお祝い年を自動計算。数え年と満年齢の両方を表示し、11月15日の曜日も確認できます。</p>

  <div class="tool-box" id="tool-main">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="birth-year">生まれ年（西暦）</label>
        <input type="tel" class="form-input" id="birth-year" placeholder="例: 2022" maxlength="4" aria-label="生まれ年">
      </div>
      <div class="form-group">
        <label class="form-label" for="birth-month">月</label>
        <select class="form-input" id="birth-month" aria-label="生まれ月">
          <option value="">—</option>
          <option value="1">1月</option><option value="2">2月</option><option value="3">3月</option>
          <option value="4">4月</option><option value="5">5月</option><option value="6">6月</option>
          <option value="7">7月</option><option value="8">8月</option><option value="9">9月</option>
          <option value="10">10月</option><option value="11">11月</option><option value="12">12月</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="birth-day">日</label>
        <input type="tel" class="form-input" id="birth-day" placeholder="15" maxlength="2" aria-label="生まれ日">
      </div>
    </div>

    <div class="result-box" id="result-box" style="display:none;" aria-live="polite">
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0.5rem;" id="r-birth-info"></div>
      <div class="ceremony-cards" id="ceremony-cards"></div>
      <div class="result-actions" style="margin-top:0.75rem;">
        <button class="btn-copy-result" id="btn-copy">結果をコピー</button>
      </div>
    </div>
    <p class="error-msg" id="error-msg" style="display:none; color:#dc2626; font-size:0.85rem; margin-top:0.5rem;"></p>
  </div>

  ${AD_BTF}

  <section class="ref-section">
    <h2>11月15日 曜日一覧（2024〜2035年）</h2>
    <table class="ref-table">
      <thead><tr><th>年</th><th>日付</th><th>曜日</th></tr></thead>
      <tbody>
${buildNov15Table(false)}      </tbody>
    </table>
  </section>

  <article class="seo-content">
    <h2>七五三とは — 由来と現代の祝い方</h2>
    <p>七五三は、3歳・5歳・7歳の子どもの成長を祝う日本の伝統行事です。平安時代に始まった「髪置き」（3歳）、「袴着」（5歳・男の子）、「帯解き」（7歳・女の子）の儀式が起源とされ、毎年11月15日に神社やお寺で祈祷を受けるのが一般的です。現代では11月15日に限らず、前後の土日祝日にお参りする家庭が増えています。写真スタジオでの前撮りや、祖父母を招いてのお食事会を合わせて行うことも多く、家族の大切なイベントとして定着しています。数え年と満年齢のどちらで祝うかは地域や家庭によって異なりますが、このツールでは両方の年を表示しているので、ご家族の都合に合わせてお選びいただけます。</p>

    <h2>七五三の準備スケジュールと費用の目安</h2>
    <p>七五三の準備は6ヶ月前から始めるのが理想的です。衣装は購入の場合3万〜10万円程度、レンタルなら1万〜5万円が相場です。写真撮影は前撮りプランを利用すると3万〜5万円程度で、繁忙期の11月を避けることで割引が適用されることも。神社での祈祷料（初穂料）は5,000円〜10,000円が一般的です。お参りの際は<a href="/date-calendar/holiday-checker/">祝日カレンダー</a>で連休を確認し、混雑を避ける計画を立てましょう。<a href="/date-calendar/age-calculator/">年齢計算ツール</a>や<a href="/date-calendar/kazoe-doshi/">数え年計算ツール</a>も合わせてご活用ください。</p>
  </article>

  <section>
    <h2>よくある質問</h2>
${faqHTML}
  </section>

  <section class="related-tools">
    <h2>関連ツール</h2>
    <div class="cards-grid">
      <a href="/date-calendar/age-calculator/" class="tool-card"><div class="tool-card-icon">🎂</div><div class="tool-card-name">年齢計算</div></a>
      <a href="/date-calendar/kazoe-doshi/" class="tool-card"><div class="tool-card-icon">🎎</div><div class="tool-card-name">数え年計算</div></a>
      <a href="/date-calendar/yakudoshi/" class="tool-card"><div class="tool-card-icon">⛩️</div><div class="tool-card-name">厄年計算</div></a>
    </div>
  </section>
</main>

<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <ul class="footer-links">
      <li><a href="/about/">JapanCalcについて</a></li><li><a href="/privacy/">プライバシーポリシー</a></li>
      <li><a href="/terms/">利用規約</a></li><li><a href="mailto:hello@japancalc.com">お問い合わせ</a></li>
    </ul>
    <p class="footer-copy">&copy; <span id="footer-year"></span> JapanCalc. All rights reserved.</p>
  </div>
</footer>
${SCRIPTS_FOOTER('メニューを閉じる', 'メニューを開く')}

<script type="module">
import { calcShichigosan } from '/assets/js/shichigosan.js';

var resultEl = document.getElementById('result-box');
var errorEl  = document.getElementById('error-msg');
var cardsEl  = document.getElementById('ceremony-cards');

function compute() {
  var y = parseInt(document.getElementById('birth-year').value);
  var m = parseInt(document.getElementById('birth-month').value);
  var d = parseInt(document.getElementById('birth-day').value);
  if (!y || !m || !d) { resultEl.style.display='none'; errorEl.style.display='none'; return; }

  var r = calcShichigosan(y, m, d);
  if (r.error) { resultEl.style.display='none'; errorEl.textContent=r.error; errorEl.style.display='block'; return; }
  errorEl.style.display = 'none';

  document.getElementById('r-birth-info').textContent = y + '年' + m + '月' + d + '日生まれのお子様の七五三';

  var GENDER_MAP = { both: '👦👧 男女共通', male: '👦 男の子', female: '👧 女の子' };

  cardsEl.innerHTML = r.results.map(function(c) {
    var cls = 'ceremony-card';
    if (c.isPastKazoe && c.isPastMannen) cls += ' ceremony-card--past';
    else if (c.isThisYearKazoe || c.isThisYearMannen) cls += ' ceremony-card--this-year';
    var pastBadge = (c.isPastKazoe && c.isPastMannen) ? '<span class="badge-past">終了</span>' : '';

    return '<div class="' + cls + '">' +
      '<div><span class="ceremony-name">' + c.ceremony + '</span>' +
      '<span class="ceremony-gender">' + GENDER_MAP[c.gender] + '</span>' + pastBadge + '</div>' +
      '<div class="ceremony-detail">' +
        '<div><dt>数え年</dt><dd>' + c.kazoeYear + '年（11/15 ' + c.nov15DowJP + '）</dd></div>' +
        '<div><dt>満年齢</dt><dd>' + c.mannenYear + '年（11/15 ' + c.nov15MannenDowJP + '）</dd></div>' +
      '</div></div>';
  }).join('');

  resultEl.style.display = 'block';
  if (typeof gtag === 'function') gtag('event', 'tool_used', { tool_name: 'shichigosan', language: 'ja' });
}

['birth-year','birth-month','birth-day'].forEach(function(id) {
  document.getElementById(id).addEventListener('input', compute);
  document.getElementById(id).addEventListener('change', compute);
});

document.getElementById('btn-copy').addEventListener('click', function() {
  var text = document.getElementById('r-birth-info').textContent + '\\n';
  document.querySelectorAll('.ceremony-card').forEach(function(card) {
    text += card.textContent.trim().replace(/\\s+/g, ' ') + '\\n';
  });
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('btn-copy');
    btn.textContent = 'コピーしました ✓';
    setTimeout(function() { btn.textContent = '結果をコピー'; }, 2000);
  });
});
</script>
</body>
</html>`;
}

function buildEN() {
  const faqItems = [
    { q: 'When is Shichi-Go-San celebrated?', a: 'Shichi-Go-San (七五三) is officially celebrated on November 15 each year. However, most families visit shrines on the nearest weekend, and celebrations from October through early December are common. Some shrines begin accepting prayer reservations as early as September.' },
    { q: 'Should I use traditional age (kazoe-doshi) or modern age?', a: 'Traditionally, Shichi-Go-San uses kazoe-doshi (数え年), where a child is considered 1 year old at birth and gains a year on New Year\'s Day. However, many modern families use the Western age system (満年齢). Both are acceptable. This tool shows both options so you can choose what works best for your family.' },
    { q: 'Do boys also celebrate at age 3?', a: 'Yes! The age 3 ceremony (髪置き / kami-oki) is traditionally for both boys and girls. The age 5 ceremony (袴着 / hakama-gi) is for boys only, and the age 7 ceremony (帯解き / obi-toki) is for girls only. Some regional traditions celebrate age 3 for girls only, but celebrating for both genders is widely accepted.' },
    { q: 'What is the origin of Shichi-Go-San?', a: 'Shichi-Go-San dates back to the Heian period (794-1185). At age 3, children began growing their hair (髪置き). At age 5, boys wore hakama pants for the first time (袴着). At age 7, girls began wearing obi sashes like adults (帯解き). The November 15 date is attributed to shogun Tokugawa Tsunayoshi, who chose this day to pray for his son\'s health in the Edo period.' },
    { q: 'When should I start preparing for Shichi-Go-San?', a: 'Start preparations about 6 months in advance. Photography studios offer early-bird (前撮り) sessions from April to September with discounts and more outfit choices. Reserve kimono rental 3-4 months ahead, and book shrine prayers 1-2 months before. November weekends are extremely busy, so weekday visits can be more pleasant.' },
  ];

  const faqHTML = faqItems.map(f => `    <details class="faq-item">
      <summary>${f.q}</summary>
      <div class="faq-answer">${f.a}</div>
    </details>`).join('\n');

  const faqJsonLd = faqItems.map(f => `      {
        "@type": "Question",
        "name": ${JSON.stringify(f.q)},
        "acceptedAnswer": { "@type": "Answer", "text": ${JSON.stringify(f.a)} }
      }`).join(',\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shichi-Go-San Calculator: When Is Your Child's 七五三? | JapanCalc</title>
  <meta name="description" content="Enter your child's birthday to find Shichi-Go-San (七五三) ceremony years for ages 3, 5, and 7. Shows both traditional and modern age calculations. Free.">
  <link rel="canonical" href="https://japancalc.com/en/date-calendar/shichigosan/">
  <link rel="alternate" hreflang="en" href="https://japancalc.com/en/date-calendar/shichigosan/">
  <link rel="alternate" hreflang="ja" href="https://japancalc.com/date-calendar/shichigosan/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/date-calendar/shichigosan/">
  <meta property="og:title" content="Shichi-Go-San Calculator | JapanCalc">
  <meta property="og:url" content="https://japancalc.com/en/date-calendar/shichigosan/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
  ${HEAD_ICONS}
  ${GA}
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "WebApplication",
    "name": "Shichi-Go-San Calculator", "description": "Calculate Shichi-Go-San ceremony years for ages 3, 5, and 7.",
    "url": "https://japancalc.com/en/date-calendar/shichigosan/",
    "applicationCategory": "UtilityApplication", "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "inLanguage": ["en", "ja"] }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://japancalc.com/en/" },
      { "@type": "ListItem", "position": 2, "name": "Date & Calendar", "item": "https://japancalc.com/en/date-calendar/" },
      { "@type": "ListItem", "position": 3, "name": "Shichi-Go-San Calculator", "item": "https://japancalc.com/en/date-calendar/shichigosan/" }
    ] }
  </script>
  <script type="application/ld+json">
  { "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [
${faqJsonLd}
    ] }
  </script>
  <link rel="stylesheet" href="/assets/css/main.css">
  ${ADSENSE}
  <style>${PAGE_CSS}
  .ceremony-card--this-year::after { content: 'This Year'; }</style>
</head>
<body>
<style>nav.site-nav.nav-open .nav-links { display: flex; flex-direction: column; position: absolute; top: 56px; left: 0; right: 0; background: var(--color-primary); padding: 1rem; gap: 0.5rem; z-index: 100; }</style>
<a href="#main-content" class="skip-link">Skip to main content</a>
<nav class="site-nav" aria-label="Main navigation">
  <a href="/en/" class="nav-logo" aria-label="JapanCalc Home"><img src="/assets/icons/logo-white.svg" alt="JapanCalc" width="160" height="40" loading="eager" fetchpriority="high"></a>
  <ul class="nav-links" id="nav-links-menu">
    <li><a href="/en/date-calendar/">Date &amp; Calendar</a></li>
    <li><a href="/en/tax-finance/">Tax &amp; Finance</a></li>
    <li><a href="/en/language-tools/">Language Tools</a></li>
  </ul>
  <div style="display:flex;align-items:center;gap:0.5rem;">
    <div class="lang-switcher" role="navigation" aria-label="Language">
      <a class="lang-option lang-inactive" id="lang-toggle" href="/date-calendar/shichigosan/" lang="ja" title="日本語で表示" aria-label="日本語に切り替え">JP</a>
      <span class="lang-sep">&middot;</span>
      <span class="lang-option lang-active" aria-current="true">EN</span>
    </div>
    <button class="nav-hamburger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links-menu">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
    </button>
  </div>
</nav>
<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol><li><a href="/en/">Home</a></li><li><span class="breadcrumb-sep">&#x203A;</span></li><li><a href="/en/date-calendar/">Date &amp; Calendar</a></li><li><span class="breadcrumb-sep">&#x203A;</span></li><li aria-current="page">Shichi-Go-San</li></ol>
</nav>
${AD_ATF}
<main class="content page-wrapper" id="main-content">
  <h1>Shichi-Go-San Calculator — Japanese Children's Festival Ages</h1>
  <p class="tool-desc">Enter your child's birthday to find the exact years for their Shichi-Go-San (七五三) celebrations at ages 3, 5, and 7. Shows both traditional counting age (数え年) and modern age, plus the day of the week for November 15.</p>

  <div class="tool-box" id="tool-main">
    <div class="form-row">
      <div class="form-group">
        <label class="form-label" for="birth-year">Birth Year</label>
        <input type="tel" class="form-input" id="birth-year" placeholder="e.g. 2022" maxlength="4" aria-label="Birth year">
      </div>
      <div class="form-group">
        <label class="form-label" for="birth-month">Month</label>
        <select class="form-input" id="birth-month" aria-label="Birth month">
          <option value="">—</option>
          <option value="1">Jan</option><option value="2">Feb</option><option value="3">Mar</option>
          <option value="4">Apr</option><option value="5">May</option><option value="6">Jun</option>
          <option value="7">Jul</option><option value="8">Aug</option><option value="9">Sep</option>
          <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="birth-day">Day</label>
        <input type="tel" class="form-input" id="birth-day" placeholder="15" maxlength="2" aria-label="Birth day">
      </div>
    </div>

    <div class="result-box" id="result-box" style="display:none;" aria-live="polite">
      <div style="font-size:0.85rem; color:var(--color-text-muted); margin-bottom:0.5rem;" id="r-birth-info"></div>
      <div class="ceremony-cards" id="ceremony-cards"></div>
      <div class="result-actions" style="margin-top:0.75rem;">
        <button class="btn-copy-result" id="btn-copy">Copy result</button>
      </div>
    </div>
    <p class="error-msg" id="error-msg" style="display:none; color:#dc2626; font-size:0.85rem; margin-top:0.5rem;"></p>
  </div>

  ${AD_BTF}

  <section class="ref-section">
    <h2>November 15 Day of Week (2024–2035)</h2>
    <table class="ref-table">
      <thead><tr><th>Year</th><th>Date</th><th>Day</th></tr></thead>
      <tbody>
${buildNov15Table(true)}      </tbody>
    </table>
  </section>

  <article class="seo-content">
    <h2>What Is Shichi-Go-San? — History and Modern Practice</h2>
    <p>Shichi-Go-San (七五三, literally "7-5-3") is a traditional Japanese celebration for children at ages 3, 5, and 7. Dating back to the Heian period, each age marks a specific milestone: at 3, both boys and girls celebrate kami-oki (髪置き, "hair-growing"); at 5, boys wear hakama pants for the first time (袴着); and at 7, girls begin wearing adult-style obi sashes (帯解き). Families typically visit a Shinto shrine on or near November 15 to offer prayers for their children's health and growth. While the traditional date is November 15, most modern families visit on a convenient weekend between October and December. Children dress in traditional kimono — often rented from specialized studios that also offer professional photography packages. The holiday is one of Japan's most photographed family events, and understanding the age calculation (whether using traditional kazoe-doshi or modern Western age) is essential for planning. This tool calculates both, so expat families in Japan can participate with confidence.</p>

    <h2>Planning Shichi-Go-San — Costs, Timing, and Tips for Foreign Families</h2>
    <p>If you're living in Japan with young children, Shichi-Go-San is a wonderful cultural experience. Kimono rental packages typically cost ¥10,000–¥50,000 and include dressing service. Photography studios offer mae-dori (前撮り, pre-ceremony shoots) from April through September at lower prices. Shrine prayer fees (初穂料) range from ¥5,000–¥10,000. November weekends at popular shrines like Meiji Jingu can be extremely crowded — consider visiting on a weekday or in early November. Check the <a href="/en/date-calendar/holiday-checker/">Japan Holiday Calendar</a> for public holidays that might affect your plans. You can also use the <a href="/en/date-calendar/age-calculator/">Age Calculator</a> and <a href="/en/date-calendar/kazoe-doshi/">Kazoe-doshi Calculator</a> for related age calculations.</p>
  </article>

  <section>
    <h2>Frequently Asked Questions</h2>
${faqHTML}
  </section>

  <section class="related-tools">
    <h2>Related Tools</h2>
    <div class="cards-grid">
      <a href="/en/date-calendar/age-calculator/" class="tool-card"><div class="tool-card-icon">🎂</div><div class="tool-card-name">Age Calculator</div></a>
      <a href="/en/date-calendar/kazoe-doshi/" class="tool-card"><div class="tool-card-icon">🎎</div><div class="tool-card-name">Kazoe-doshi</div></a>
      <a href="/en/date-calendar/yakudoshi/" class="tool-card"><div class="tool-card-icon">⛩️</div><div class="tool-card-name">Yakudoshi</div></a>
    </div>
  </section>
</main>

<footer class="site-footer" role="contentinfo">
  <div class="footer-inner">
    <ul class="footer-links">
      <li><a href="/en/about/">About</a></li><li><a href="/en/privacy/">Privacy Policy</a></li>
      <li><a href="/en/terms/">Terms of Use</a></li><li><a href="mailto:hello@japancalc.com">Contact</a></li>
    </ul>
    <p class="footer-copy">&copy; <span id="footer-year"></span> JapanCalc. All rights reserved.</p>
  </div>
</footer>
${SCRIPTS_FOOTER('Close menu', 'Open menu')}

<script type="module">
import { calcShichigosan } from '/assets/js/shichigosan.js';

var resultEl = document.getElementById('result-box');
var errorEl  = document.getElementById('error-msg');
var cardsEl  = document.getElementById('ceremony-cards');

function compute() {
  var y = parseInt(document.getElementById('birth-year').value);
  var m = parseInt(document.getElementById('birth-month').value);
  var d = parseInt(document.getElementById('birth-day').value);
  if (!y || !m || !d) { resultEl.style.display='none'; errorEl.style.display='none'; return; }

  var r = calcShichigosan(y, m, d);
  if (r.error) { resultEl.style.display='none'; errorEl.textContent=r.error; errorEl.style.display='block'; return; }
  errorEl.style.display = 'none';

  document.getElementById('r-birth-info').textContent = 'Shichi-Go-San for child born ' + y + '/' + m + '/' + d;

  var GENDER_MAP = { both: '👦👧 Boys & Girls', male: '👦 Boys', female: '👧 Girls' };

  cardsEl.innerHTML = r.results.map(function(c) {
    var cls = 'ceremony-card';
    if (c.isPastKazoe && c.isPastMannen) cls += ' ceremony-card--past';
    else if (c.isThisYearKazoe || c.isThisYearMannen) cls += ' ceremony-card--this-year';
    var pastBadge = (c.isPastKazoe && c.isPastMannen) ? '<span class="badge-past">Past</span>' : '';

    return '<div class="' + cls + '">' +
      '<div><span class="ceremony-name">' + c.ceremonyEN + '</span>' +
      '<span class="ceremony-gender">' + GENDER_MAP[c.gender] + '</span>' + pastBadge + '</div>' +
      '<div class="ceremony-detail">' +
        '<div><dt>Traditional (数え年)</dt><dd>' + c.kazoeYear + ' (Nov 15 = ' + c.nov15DowEN + ')</dd></div>' +
        '<div><dt>Modern age (満年齢)</dt><dd>' + c.mannenYear + ' (Nov 15 = ' + c.nov15MannenDowEN + ')</dd></div>' +
      '</div></div>';
  }).join('');

  resultEl.style.display = 'block';
  if (typeof gtag === 'function') gtag('event', 'tool_used', { tool_name: 'shichigosan', language: 'en' });
}

['birth-year','birth-month','birth-day'].forEach(function(id) {
  document.getElementById(id).addEventListener('input', compute);
  document.getElementById(id).addEventListener('change', compute);
});

document.getElementById('btn-copy').addEventListener('click', function() {
  var text = document.getElementById('r-birth-info').textContent + '\\n';
  document.querySelectorAll('.ceremony-card').forEach(function(card) {
    text += card.textContent.trim().replace(/\\s+/g, ' ') + '\\n';
  });
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('btn-copy');
    btn.textContent = 'Copied! ✓';
    setTimeout(function() { btn.textContent = 'Copy result'; }, 2000);
  });
});
</script>
</body>
</html>`;
}

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

const jpDir = path.join(DIST, 'date-calendar', 'shichigosan');
const enDir = path.join(DIST, 'en', 'date-calendar', 'shichigosan');
ensureDir(jpDir);
ensureDir(enDir);

fs.writeFileSync(path.join(jpDir, 'index.html'), buildJP(), 'utf8');
console.log('  JP: /date-calendar/shichigosan/');
fs.writeFileSync(path.join(enDir, 'index.html'), buildEN(), 'utf8');
console.log('  EN: /en/date-calendar/shichigosan/');
console.log('Done! Created 2 Shichi-Go-San pages.');
