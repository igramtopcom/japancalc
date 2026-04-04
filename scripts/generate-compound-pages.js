/**
 * Generate JP + EN compound interest / savings calculator pages
 * Run: node scripts/generate-compound-pages.js
 */
const fs = require('fs');
const path = require('path');

const COMMON_HEAD = `<link rel="icon" type="image/svg+xml" href="/assets/icons/favicon.svg">
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
</script>`;

const COMMON_CSS = `
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; font-weight: 600; margin-bottom: 0.3rem; font-size: 0.9rem; }
  .form-input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--color-border); border-radius: var(--radius); font-size: 1rem; background: white; }
  .input-suffix-wrap { position: relative; display: inline-flex; align-items: center; width: 100%; }
  .input-with-suffix { padding-right: 2.5rem; }
  .input-suffix { position: absolute; right: 0.75rem; color: var(--color-text-muted); font-size: 0.85rem; pointer-events: none; }
  .result-box { background: var(--color-bg-alt); border: 2px solid var(--color-accent); border-radius: var(--radius); padding: 1.25rem; margin-top: 1rem; display: none; }
  .result-box.visible { display: block; }
  .result-main { text-align: center; margin-bottom: 0.75rem; }
  .result-main .result-label { font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .result-main .result-value { font-size: 1.8rem; font-weight: 800; color: var(--color-accent); }
  .result-detail { font-size: 0.85rem; color: var(--color-text-muted); text-align: center; margin: 0.5rem 0; }
  .btn-copy-result { padding: 0.5rem 1rem; border: none; border-radius: var(--radius); background: var(--color-accent); color: white; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: opacity 0.15s; display: inline-block; margin: 0.5rem 0.25rem 0; }
  .btn-copy-result:hover { opacity: 0.85; }
  .btn-calc { width: 100%; padding: 0.75rem; border: none; border-radius: var(--radius); background: var(--color-accent); color: white; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .btn-calc:hover { opacity: 0.85; }
  .action-btns { text-align: center; margin-top: 0.5rem; }
  .preset-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.35rem; }
  .preset-btn { padding: 0.35rem 0.7rem; border: 1px solid var(--color-border); border-radius: var(--radius); background: white; cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: background 0.15s, border-color 0.15s; }
  .preset-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .preset-btn.active { background: var(--color-accent); color: white; border-color: var(--color-accent); }
  .ratio-bar-wrap { margin: 1rem 0 0.5rem; }
  .ratio-bar-label { display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .ratio-bar { display: flex; height: 22px; border-radius: 11px; overflow: hidden; }
  .ratio-bar-deposited { background: #1A3A5C; height: 100%; transition: width 0.3s; }
  .ratio-bar-interest { background: #0B6E5F; height: 100%; transition: width 0.3s; }
  .schedule-toggle { margin-top: 1.25rem; }
  .schedule-toggle summary { cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--color-accent); padding: 0.5rem 0; }
  .schedule-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.5rem; }
  .schedule-table th, .schedule-table td { padding: 0.4rem 0.5rem; border: 1px solid var(--color-border); text-align: right; }
  .schedule-table th { background: var(--color-bg-alt); font-weight: 600; font-size: 0.78rem; text-align: center; }
  .schedule-table td:first-child { text-align: center; }
  .nisa-preset-btns { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .nisa-preset-btn { padding: 0.4rem 0.8rem; border: 1px solid var(--color-accent); border-radius: var(--radius); background: white; cursor: pointer; font-size: 0.82rem; font-weight: 600; color: var(--color-accent); transition: background 0.15s, color 0.15s; }
  .nisa-preset-btn:hover, .nisa-preset-btn.active { background: var(--color-accent); color: white; }
  .nisa-note-inline { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 0.3rem; min-height: 1.2em; }
  .disclaimer { font-size: 0.78rem; color: var(--color-text-muted); margin-top: 1rem; padding: 0.75rem; background: var(--color-bg-alt); border-radius: var(--radius); line-height: 1.6; }`;

const FAQ_CSS = `
  .faq-item { border: 1px solid var(--color-border); border-radius: var(--radius); margin-bottom: 0.5rem; }
  .faq-item summary { padding: 0.75rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.9rem; }
  .faq-item p { padding: 0 1rem 0.75rem; font-size: 0.85rem; line-height: 1.65; color: var(--color-text-muted); }`;

const NAV_OPEN_CSS = `<style>
  nav.site-nav.nav-open .nav-links {
    display: flex; flex-direction: column; position: absolute;
    top: 56px; left: 0; right: 0; background: var(--color-primary);
    padding: 1rem; gap: 0.5rem; z-index: 100;
  }
</style>`;

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

function generateJP() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u7A4D\u7ACB\u30FB\u8907\u5229\u8A08\u7B97\u30C4\u30FC\u30EB: NISA\u306E\u904B\u7528\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3 | JapanCalc</title>
  <meta name="description" content="\u5143\u672C\u30FB\u6BCE\u6708\u306E\u7A4D\u7ACB\u984D\u30FB\u91D1\u5229\u30FB\u671F\u9593\u3092\u5165\u529B\u3057\u3066\u5C06\u6765\u306E\u8CC7\u7523\u3092\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3002NISA\u904B\u7528\u306E\u53C2\u8003\u306B\u3002\u8907\u5229\u306E\u52B9\u679C\u3092\u30B0\u30E9\u30D5\u3067\u78BA\u8A8D\u3002\u7121\u6599\u3001\u30ED\u30B0\u30A4\u30F3\u4E0D\u8981\u3002">
  <link rel="canonical" href="https://japancalc.com/tax-finance/compound-interest/">
  <link rel="alternate" hreflang="ja"        href="https://japancalc.com/tax-finance/compound-interest/">
  <link rel="alternate" hreflang="en"        href="https://japancalc.com/en/tax-finance/compound-interest/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/tax-finance/compound-interest/">
  <meta property="og:title"       content="\u7A4D\u7ACB\u30FB\u8907\u5229\u8A08\u7B97\u30C4\u30FC\u30EB | JapanCalc">
  <meta property="og:description" content="\u5143\u672C\u30FB\u6BCE\u6708\u306E\u7A4D\u7ACB\u984D\u30FB\u91D1\u5229\u30FB\u671F\u9593\u3092\u5165\u529B\u3057\u3066\u5C06\u6765\u306E\u8CC7\u7523\u3092\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3002">
  <meta property="og:url"         content="https://japancalc.com/tax-finance/compound-interest/">
  <meta property="og:type"        content="website">
  <meta property="og:image"       content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
${COMMON_HEAD}

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "\u7A4D\u7ACB\u30FB\u8907\u5229\u8A08\u7B97\u30C4\u30FC\u30EB | JapanCalc",
    "url": "https://japancalc.com/tax-finance/compound-interest/",
    "description": "\u5143\u672C\u30FB\u6BCE\u6708\u306E\u7A4D\u7ACB\u984D\u30FB\u91D1\u5229\u30FB\u671F\u9593\u3092\u5165\u529B\u3057\u3066\u5C06\u6765\u306E\u8CC7\u7523\u3092\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3002NISA\u904B\u7528\u306E\u53C2\u8003\u306B\u3002",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "All",
    "inLanguage": ["ja", "en"],
    "isAccessibleForFree": true,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "publisher": { "@type": "Organization", "name": "JapanCalc", "url": "https://japancalc.com" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "\\u30DB\\u30FC\\u30E0", "item": "https://japancalc.com/" },
      { "@type": "ListItem", "position": 2, "name": "\\u7A0E\\u91D1\\u30FB\\u8CA1\\u52D9", "item": "https://japancalc.com/tax-finance/" },
      { "@type": "ListItem", "position": 3, "name": "\\u7A4D\\u7ACB\\u30FB\\u8907\\u5229\\u8A08\\u7B97", "item": "https://japancalc.com/tax-finance/compound-interest/" }
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "\\u8907\\u5229\\u3068\\u306F\\u4F55\\u3067\\u3059\\u304B\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u5229\\u606F\\u306B\\u5BFE\\u3057\\u3066\\u3055\\u3089\\u306B\\u5229\\u606F\\u304C\\u3064\\u304F\\u4ED5\\u7D44\\u307F\\u3002\\u9577\\u671F\\u6295\\u8CC7\\u3067\\u5927\\u304D\\u306A\\u5DEE\\u304C\\u51FA\\u307E\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "NISA\\u3067\\u7A4D\\u7ACB\\u6295\\u8CC7\\u3059\\u308B\\u3068\\u3069\\u306E\\u304F\\u3089\\u3044\\u5897\\u3048\\u307E\\u3059\\u304B\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u67083\\u4E07\\u5186\\u3092\\u5E74\\u73875%\\u306720\\u5E74\\u904B\\u7528\\u3059\\u308B\\u3068\\u7D041,233\\u4E07\\u5186\\uFF08\\u5143\\u672C720\\u4E07\\u5186\\u3001\\u5229\\u76CA\\u7D04513\\u4E07\\u5186\\uFF09\\u306B\\u306A\\u308A\\u307E\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "\\u5E74\\u73875%\\u306F\\u73FE\\u5B9F\\u7684\\u3067\\u3059\\u304B\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "S&P500\\u306E\\u904E\\u53BB30\\u5E74\\u306E\\u5E73\\u5747\\u30EA\\u30BF\\u30FC\\u30F3\\u306F\\u7D0410%\\u3002\\u30A4\\u30F3\\u30C7\\u30C3\\u30AF\\u30B9\\u6295\\u8CC7\\u3067\\u5E745%\\u306F\\u5341\\u5206\\u73FE\\u5B9F\\u7684\\u306A\\u76EE\\u6A19\\u3067\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "\\u3064\\u307F\\u305F\\u3066NISA\\u306E\\u4E0A\\u9650\\u984D\\u306F\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u65B0NISA\\uFF082024\\u5E74\\uFF5E\\uFF09\\u306E\\u7A4D\\u7ACB\\u6295\\u8CC7\\u679A\\u306F\\u5E74\\u9593120\\u4E07\\u5186\\uFF08\\u670810\\u4E07\\u5186\\uFF09\\u3001\\u6210\\u9577\\u6295\\u8CC7\\u679A\\u306F\\u5E74\\u9593240\\u4E07\\u5186\\u3002\\u751F\\u6DAF\\u4E0A\\u96501,800\\u4E07\\u5186\\u3002" }
      },
      {
        "@type": "Question",
        "name": "\\u5358\\u5229\\u3068\\u8907\\u5229\\u306E\\u9055\\u3044\\u306F\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u5358\\u5229\\u306F\\u5143\\u672C\\u306E\\u307F\\u306B\\u5229\\u606F\\u3001\\u8907\\u5229\\u306F\\u5143\\u672C\\uFF0B\\u5229\\u606F\\u306B\\u5229\\u606F\\u304C\\u3064\\u304D\\u307E\\u3059\\u3002\\u9577\\u671F\\u306B\\u306A\\u308B\\u307B\\u3069\\u5DEE\\u304C\\u5927\\u304D\\u304F\\u306A\\u308A\\u307E\\u3059\\u3002" }
      }
    ]
  }
  </script>

  <link rel="stylesheet" href="/assets/css/main.css">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
  <style>${COMMON_CSS}${FAQ_CSS}</style>
</head>
<body>

${NAV_OPEN_CSS}
<a href="#main-content" class="skip-link">\u30E1\u30A4\u30F3\u30B3\u30F3\u30C6\u30F3\u30C4\u3078\u30B9\u30AD\u30C3\u30D7</a>
<nav class="site-nav" aria-label="\u30E1\u30A4\u30F3\u30CA\u30D3\u30B2\u30FC\u30B7\u30E7\u30F3">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="JapanCalc \u30DB\u30FC\u30E0"><img src="/assets/icons/favicon.svg" alt="JapanCalc" width="28" height="28"></a>
    <div class="nav-right">
      <nav class="lang-switcher" aria-label="\u8A00\u8A9E\u5207\u66FF"><span aria-current="true">JP</span><span aria-hidden="true">&middot;</span><a href="/en/tax-finance/compound-interest/" aria-label="Switch to English">English</a></nav>
      <button class="nav-toggle" aria-expanded="false" aria-label="\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>
    </div>
  </div>
  <div class="nav-links"><a href="/">\u30DB\u30FC\u30E0</a><a href="/date-calendar/">\u65E5\u4ED8\u30FB\u30AB\u30EC\u30F3\u30C0\u30FC</a><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a><a href="/language-tools/">\u8A00\u8A9E\u30FB\u5909\u63DB</a></div>
</nav>

<nav class="breadcrumb" aria-label="\u30D1\u30F3\u304F\u305A\u30EA\u30B9\u30C8">
  <ol><li><a href="/">\u30DB\u30FC\u30E0</a></li><li aria-hidden="true">&rsaquo;</li><li><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a></li><li aria-hidden="true">&rsaquo;</li><li>\u7A4D\u7ACB\u30FB\u8907\u5229\u8A08\u7B97</li></ol>
</nav>

<main id="main-content">
  <div class="container tool-container">
    <h1>\u7A4D\u7ACB\u30FB\u8907\u5229\u8A08\u7B97\u30C4\u30FC\u30EB</h1>
    <p class="tool-intro">\u5143\u672C\u30FB\u6BCE\u6708\u306E\u7A4D\u7ACB\u984D\u30FB\u91D1\u5229\u30FB\u671F\u9593\u3092\u5165\u529B\u3057\u3066\u5C06\u6765\u306E\u8CC7\u7523\u3092\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3002NISA\u904B\u7528\u306E\u53C2\u8003\u306B\u3002</p>

    <div class="ad-zone" style="min-height:100px; margin:1rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_ATF_COMPOUND" data-ad-format="horizontal" data-full-width-responsive="true"></ins>
    </div>

    <div class="form-group">
      <label class="form-label" for="principal">\u5143\u672C\uFF08\u4EFB\u610F\uFF09</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="principal" min="0" placeholder="0" step="10000" value="0">
        <span class="input-suffix">\u5186</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="monthly">\u6BCE\u6708\u306E\u7A4D\u7ACB\u984D</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="monthly" min="0" placeholder="30000" step="1000">
        <span class="input-suffix">\u5186</span>
      </div>
      <div class="nisa-preset-btns" id="nisa-presets"></div>
      <div class="nisa-note-inline" id="nisa-note"></div>
    </div>

    <div class="form-group">
      <label class="form-label" for="rate">\u5E74\u7387</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="rate" min="0.01" max="30" step="0.1" placeholder="5">
        <span class="input-suffix">%</span>
      </div>
      <div class="preset-btns" id="rate-presets">
        <button class="preset-btn" data-val="1">1%</button>
        <button class="preset-btn" data-val="3">3%</button>
        <button class="preset-btn" data-val="5">5%</button>
        <button class="preset-btn" data-val="7">7%</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="years">\u904B\u7528\u671F\u9593</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="years" min="1" max="50" step="1" placeholder="20">
        <span class="input-suffix">\u5E74</span>
      </div>
      <div class="preset-btns" id="year-presets">
        <button class="preset-btn" data-val="10">10\u5E74</button>
        <button class="preset-btn" data-val="20">20\u5E74</button>
        <button class="preset-btn" data-val="30">30\u5E74</button>
      </div>
    </div>

    <button class="btn-calc" id="btn-calc">\u8A08\u7B97\u3059\u308B</button>

    <div id="result-box" class="result-box">
      <div class="result-main">
        <div class="result-label">\u6700\u7D42\u8CC7\u7523\u984D</div>
        <div class="result-value" id="result-final">--</div>
      </div>
      <div class="result-detail" id="result-deposited"></div>
      <div class="result-detail" id="result-interest"></div>
      <div class="result-detail" id="result-rate"></div>

      <div class="ratio-bar-wrap" id="ratio-bar-wrap">
        <div class="ratio-bar-label">
          <span id="ratio-label-deposited">\u5143\u672C\u5408\u8A08: --</span>
          <span id="ratio-label-interest">\u904B\u7528\u5229\u76CA: --</span>
        </div>
        <div class="ratio-bar">
          <div class="ratio-bar-deposited" id="ratio-bar-deposited" style="width:0%"></div>
          <div class="ratio-bar-interest" id="ratio-bar-interest" style="width:0%"></div>
        </div>
      </div>

      <div class="action-btns">
        <button class="btn-copy-result" id="btn-copy">\u7D50\u679C\u3092\u30B3\u30D4\u30FC</button>
      </div>

      <details class="schedule-toggle" id="schedule-toggle">
        <summary>\u5E74\u6B21\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u8868\u793A</summary>
        <div id="schedule-body"></div>
      </details>

      <div class="nisa-note" style="background:rgba(11,110,95,0.06); border-left:3px solid var(--color-accent); padding:0.75rem 1rem; border-radius:var(--radius); margin:1rem 0; font-size:0.85rem;">
        \uD83D\uDCCC \u65B0NISA\uFF082024\u5E74\uFF5E\uFF09: \u5E74\u9593360\u4E07\u5186\u307E\u3067\u975E\u8AB2\u7A0E\u6295\u8CC7\u679A\u3002\u7A4D\u7ACB\u6295\u8CC7\u679A120\u4E07\u5186 + \u6210\u9577\u6295\u8CC7\u679A240\u4E07\u5186\u3002\u751F\u6DAF\u6295\u8CC7\u4E0A\u96501,800\u4E07\u5186\u3002
      </div>
    </div>

    <div class="disclaimer">\u203B \u5B9F\u969B\u306E\u904B\u7528\u7D50\u679C\u306F\u5E02\u5834\u74B0\u5883\u306B\u3088\u308A\u7570\u306A\u308A\u307E\u3059\u3002\u672C\u30C4\u30FC\u30EB\u306F\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3067\u3042\u308A\u3001\u5229\u76CA\u3092\u4FDD\u8A3C\u3059\u308B\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002</div>

    <div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_BTF_COMPOUND" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </div>

    <section class="faq-section" aria-label="\u3088\u304F\u3042\u308B\u8CEA\u554F">
      <h2>\u3088\u304F\u3042\u308B\u8CEA\u554F\uFF08FAQ\uFF09</h2>
      <details class="faq-item"><summary>\u8907\u5229\u3068\u306F\u4F55\u3067\u3059\u304B\uFF1F</summary><p>\u5229\u606F\u306B\u5BFE\u3057\u3066\u3055\u3089\u306B\u5229\u606F\u304C\u3064\u304F\u4ED5\u7D44\u307F\u3067\u3059\u3002\u9577\u671F\u6295\u8CC7\u3067\u5927\u304D\u306A\u5DEE\u304C\u51FA\u307E\u3059\u3002</p></details>
      <details class="faq-item"><summary>NISA\u3067\u7A4D\u7ACB\u6295\u8CC7\u3059\u308B\u3068\u3069\u306E\u304F\u3089\u3044\u5897\u3048\u307E\u3059\u304B\uFF1F</summary><p>\u67083\u4E07\u5186\u3092\u5E74\u73875%\u306720\u5E74\u904B\u7528\u3059\u308B\u3068\u7D041,233\u4E07\u5186\uFF08\u5143\u672C720\u4E07\u5186\u3001\u5229\u76CA\u7D04513\u4E07\u5186\uFF09\u306B\u306A\u308A\u307E\u3059\u3002</p></details>
      <details class="faq-item"><summary>\u5E74\u73875%\u306F\u73FE\u5B9F\u7684\u3067\u3059\u304B\uFF1F</summary><p>S&amp;P500\u306E\u904E\u53BB30\u5E74\u306E\u5E73\u5747\u30EA\u30BF\u30FC\u30F3\u306F\u7D0410%\u3002\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u6295\u8CC7\u3067\u5E745%\u306F\u5341\u5206\u73FE\u5B9F\u7684\u306A\u76EE\u6A19\u3067\u3059\u3002</p></details>
      <details class="faq-item"><summary>\u3064\u307F\u305F\u3066NISA\u306E\u4E0A\u9650\u984D\u306F\uFF1F</summary><p>\u65B0NISA\uFF082024\u5E74\uFF5E\uFF09\u306E\u7A4D\u7ACB\u6295\u8CC7\u679A\u306F\u5E74\u9593120\u4E07\u5186\uFF08\u670810\u4E07\u5186\uFF09\u3001\u6210\u9577\u6295\u8CC7\u679A\u306F\u5E74\u9593240\u4E07\u5186\u3002\u751F\u6DAF\u4E0A\u96501,800\u4E07\u5186\u3002</p></details>
      <details class="faq-item"><summary>\u5358\u5229\u3068\u8907\u5229\u306E\u9055\u3044\u306F\uFF1F</summary><p>\u5358\u5229\u306F\u5143\u672C\u306E\u307F\u306B\u5229\u606F\u3001\u8907\u5229\u306F\u5143\u672C\uFF0B\u5229\u606F\u306B\u5229\u606F\u304C\u3064\u304D\u307E\u3059\u3002\u9577\u671F\u306B\u306A\u308B\u307B\u3069\u5DEE\u304C\u5927\u304D\u304F\u306A\u308A\u307E\u3059\u3002</p></details>
    </section>

    <article class="seo-content">
      <h2>\u7A4D\u7ACB\u30FB\u8907\u5229\u8A08\u7B97\u30C4\u30FC\u30EB\u306E\u4F7F\u3044\u65B9</h2>
      <p>\u5143\u672C\uFF08\u4EFB\u610F\uFF09\u3001\u6BCE\u6708\u306E\u7A4D\u7ACB\u984D\u3001\u5E74\u7387\u3001\u904B\u7528\u671F\u9593\u3092\u5165\u529B\u3057\u3066\u300C\u8A08\u7B97\u3059\u308B\u300D\u3092\u30AF\u30EA\u30C3\u30AF\u3002NISA\u30D7\u30EA\u30BB\u30C3\u30C8\u30DC\u30BF\u30F3\u3067\u4EE3\u8868\u7684\u306A\u7A4D\u7ACB\u984D\u3092\u7D20\u65E9\u304F\u5165\u529B\u3067\u304D\u307E\u3059\u3002\u8907\u5229\u306E\u52B9\u679C\u3092\u30B0\u30E9\u30D5\u3067\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046\u3002</p>
      <h2>\u5E74\u6B21\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u306E\u898B\u65B9</h2>
      <p>\u8A08\u7B97\u7D50\u679C\u306E\u4E0B\u306B\u3042\u308B\u300C\u5E74\u6B21\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u8868\u793A\u300D\u3092\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u3068\u3001\u5E74\u6BCE\u306E\u5143\u672C\u5408\u8A08\u30FB\u904B\u7528\u5229\u76CA\u30FB\u5408\u8A08\u6B8B\u9AD8\u306E\u63A8\u79FB\u304C\u8868\u3067\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002</p>
    </article>
  </div>
</main>

<footer class="site-footer">
  <div class="container">
    <nav class="footer-links" aria-label="\u30D5\u30C3\u30BF\u30FC\u30CA\u30D3\u30B2\u30FC\u30B7\u30E7\u30F3"><a href="/">\u30DB\u30FC\u30E0</a><a href="/date-calendar/">\u65E5\u4ED8\u30FB\u30AB\u30EC\u30F3\u30C0\u30FC</a><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a><a href="/language-tools/">\u8A00\u8A9E\u30FB\u5909\u63DB</a></nav>
    <p class="footer-copy">&copy; 2025 JapanCalc. All rights reserved.</p>
  </div>
</footer>

<script>
document.querySelector('.nav-toggle').addEventListener('click', function() {
  var nav = document.querySelector('.site-nav');
  var expanded = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', !expanded);
  nav.classList.toggle('nav-open');
});
</script>

<script type="module">
import { calcCompound, NISA_PRESETS } from '/assets/js/compound.js';

var principalInput = document.getElementById('principal');
var monthlyInput   = document.getElementById('monthly');
var rateInput      = document.getElementById('rate');
var yearsInput     = document.getElementById('years');
var btnCalc        = document.getElementById('btn-calc');
var resultBox      = document.getElementById('result-box');
var resultFinal    = document.getElementById('result-final');
var resultDeposited = document.getElementById('result-deposited');
var resultInterest = document.getElementById('result-interest');
var resultRate     = document.getElementById('result-rate');
var ratioBarDeposited = document.getElementById('ratio-bar-deposited');
var ratioBarInterest  = document.getElementById('ratio-bar-interest');
var ratioLabelDeposited = document.getElementById('ratio-label-deposited');
var ratioLabelInterest  = document.getElementById('ratio-label-interest');
var scheduleBody   = document.getElementById('schedule-body');
var btnCopy        = document.getElementById('btn-copy');
var nisaNote       = document.getElementById('nisa-note');
var nisaPresetsWrap = document.getElementById('nisa-presets');

// Render NISA preset buttons
if (NISA_PRESETS && NISA_PRESETS.length) {
  NISA_PRESETS.forEach(function(preset) {
    var btn = document.createElement('button');
    btn.className = 'nisa-preset-btn';
    btn.textContent = preset.label;
    btn.setAttribute('data-monthly', preset.monthly);
    btn.setAttribute('data-note', preset.note || '');
    btn.addEventListener('click', function() {
      monthlyInput.value = preset.monthly;
      nisaNote.textContent = preset.note || '';
      document.querySelectorAll('.nisa-preset-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    nisaPresetsWrap.appendChild(btn);
  });
}

// Preset rate buttons
document.querySelectorAll('#rate-presets .preset-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    rateInput.value = btn.getAttribute('data-val');
    document.querySelectorAll('#rate-presets .preset-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

// Preset year buttons
document.querySelectorAll('#year-presets .preset-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    yearsInput.value = btn.getAttribute('data-val');
    document.querySelectorAll('#year-presets .preset-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

function calculate() {
  var principal     = parseFloat(principalInput.value) || 0;
  var monthlyDeposit = parseFloat(monthlyInput.value) || 0;
  var annualRate    = parseFloat(rateInput.value);
  var years         = parseInt(yearsInput.value);

  if (monthlyDeposit <= 0 && principal <= 0) {
    resultFinal.textContent = '\\u5143\\u672C\\u307E\\u305F\\u306F\\u7A4D\\u7ACB\\u984D\\u3092\\u5165\\u529B\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044';
    resultDeposited.textContent = '';
    resultInterest.textContent = '';
    resultRate.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }
  if (isNaN(annualRate) || annualRate < 0 || !years || years <= 0) {
    resultFinal.textContent = '\\u5165\\u529B\\u5024\\u3092\\u78BA\\u8A8D\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044';
    resultDeposited.textContent = '';
    resultInterest.textContent = '';
    resultRate.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }

  var result = calcCompound(principal, monthlyDeposit, annualRate, years);
  if (result.error) {
    resultFinal.textContent = result.error;
    resultDeposited.textContent = '';
    resultInterest.textContent = '';
    resultRate.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }

  resultFinal.textContent = '\\u00A5' + result.finalAmount.toLocaleString('ja-JP');
  resultDeposited.textContent = '\\u5143\\u672C\\u5408\\u8A08: \\u00A5' + result.totalDeposited.toLocaleString('ja-JP');
  resultInterest.textContent = '\\u904B\\u7528\\u5229\\u76CA: \\u00A5' + result.totalInterest.toLocaleString('ja-JP');
  var profitRate = result.totalDeposited > 0 ? (result.totalInterest / result.totalDeposited * 100).toFixed(1) : '0.0';
  resultRate.textContent = '\\u5229\\u76CA\\u7387: ' + profitRate + '%';

  // Ratio bar
  var depositedPct = (result.totalDeposited / result.finalAmount * 100).toFixed(1);
  var interestPct  = (100 - parseFloat(depositedPct)).toFixed(1);
  ratioBarDeposited.style.width = depositedPct + '%';
  ratioBarInterest.style.width  = interestPct + '%';
  ratioLabelDeposited.textContent = '\\u5143\\u672C\\u5408\\u8A08: ' + depositedPct + '%';
  ratioLabelInterest.textContent  = '\\u904B\\u7528\\u5229\\u76CA: ' + interestPct + '%';

  // Schedule table
  var html = '<table class="schedule-table"><thead><tr><th>\\u5E74\\u6B21</th><th>\\u5143\\u672C\\u5408\\u8A08</th><th>\\u904B\\u7528\\u5229\\u76CA</th><th>\\u5408\\u8A08\\u6B8B\\u9AD8</th></tr></thead><tbody>';
  if (result.schedule && result.schedule.length) {
    result.schedule.forEach(function(row) {
      html += '<tr><td>' + row.year + '\\u5E74\\u76EE</td><td>\\u00A5' + row.totalDeposited.toLocaleString('ja-JP') + '</td><td>\\u00A5' + row.totalInterest.toLocaleString('ja-JP') + '</td><td>\\u00A5' + row.balance.toLocaleString('ja-JP') + '</td></tr>';
    });
  }
  html += '</tbody></table>';
  scheduleBody.innerHTML = html;

  resultBox.classList.add('visible');
  if (typeof gtag !== 'undefined') gtag('event', 'tool_used', { tool_name: 'compound_interest', language: 'ja' });
}

btnCalc.addEventListener('click', calculate);

btnCopy.addEventListener('click', function() {
  var text = '\\u6700\\u7D42\\u8CC7\\u7523\\u984D: ' + resultFinal.textContent + '\\n' + resultDeposited.textContent + '\\n' + resultInterest.textContent + '\\n' + resultRate.textContent;
  navigator.clipboard.writeText(text).then(function() {
    btnCopy.textContent = '\\u30B3\\u30D4\\u30FC\\u3057\\u307E\\u3057\\u305F\\uFF01';
    setTimeout(function() { btnCopy.textContent = '\\u7D50\\u679C\\u3092\\u30B3\\u30D4\\u30FC'; }, 1500);
  });
});
</script>

${AD_LAZY_SCRIPT}
</body>
</html>`;
}

function generateEN() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compound Interest &amp; Savings Calculator &mdash; NISA Simulator | JapanCalc</title>
  <meta name="description" content="Calculate future savings with compound interest. Enter principal, monthly deposit, interest rate, and term. Simulate NISA investment growth. Free, no login required.">
  <link rel="canonical" href="https://japancalc.com/en/tax-finance/compound-interest/">
  <link rel="alternate" hreflang="en"        href="https://japancalc.com/en/tax-finance/compound-interest/">
  <link rel="alternate" hreflang="ja"        href="https://japancalc.com/tax-finance/compound-interest/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/tax-finance/compound-interest/">
  <meta property="og:title"       content="Compound Interest &amp; Savings Calculator | JapanCalc">
  <meta property="og:description" content="Calculate future savings with compound interest. Simulate NISA investment growth.">
  <meta property="og:url"         content="https://japancalc.com/en/tax-finance/compound-interest/">
  <meta property="og:type"        content="website">
  <meta property="og:image"       content="https://japancalc.com/assets/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="robots" content="index, follow">
${COMMON_HEAD}

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Compound Interest & Savings Calculator | JapanCalc",
    "url": "https://japancalc.com/en/tax-finance/compound-interest/",
    "description": "Calculate future savings with compound interest. Enter principal, monthly deposit, interest rate, and term. Simulate NISA investment growth.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "All",
    "inLanguage": ["ja", "en"],
    "isAccessibleForFree": true,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "publisher": { "@type": "Organization", "name": "JapanCalc", "url": "https://japancalc.com" }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://japancalc.com/en/" },
      { "@type": "ListItem", "position": 2, "name": "Tax & Finance", "item": "https://japancalc.com/en/tax-finance/" },
      { "@type": "ListItem", "position": 3, "name": "Compound Interest Calculator", "item": "https://japancalc.com/en/tax-finance/compound-interest/" }
    ]
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is compound interest?",
        "acceptedAnswer": { "@type": "Answer", "text": "Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. Over long investment horizons, it creates a significant difference in total returns." }
      },
      {
        "@type": "Question",
        "name": "How much can I grow my money with NISA?",
        "acceptedAnswer": { "@type": "Answer", "text": "Investing 30,000 yen per month at an annual rate of 5% for 20 years would grow to approximately 12.33 million yen (7.2 million yen in deposits, about 5.13 million yen in profit)." }
      },
      {
        "@type": "Question",
        "name": "Is a 5% annual return realistic?",
        "acceptedAnswer": { "@type": "Answer", "text": "The S&P 500 has averaged roughly 10% annual returns over the past 30 years. A 5% target through index fund investing is considered a realistic and achievable goal." }
      },
      {
        "@type": "Question",
        "name": "What are the NISA contribution limits?",
        "acceptedAnswer": { "@type": "Answer", "text": "Under the new NISA (from 2024), the Tsumitate (savings) allowance is 1.2 million yen per year (100,000 yen/month) and the Growth allowance is 2.4 million yen per year. The lifetime investment cap is 18 million yen." }
      },
      {
        "@type": "Question",
        "name": "What is the difference between simple and compound interest?",
        "acceptedAnswer": { "@type": "Answer", "text": "Simple interest is calculated only on the original principal, while compound interest is calculated on the principal plus any accumulated interest. The longer the investment period, the larger the difference between the two." }
      }
    ]
  }
  </script>

  <link rel="stylesheet" href="/assets/css/main.css">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
  <style>${COMMON_CSS}${FAQ_CSS}</style>
</head>
<body>

${NAV_OPEN_CSS}
<a href="#main-content" class="skip-link">Skip to main content</a>
<nav class="site-nav" aria-label="Main navigation">
  <div class="nav-inner">
    <a href="/en/" class="nav-logo" aria-label="JapanCalc Home"><img src="/assets/icons/favicon.svg" alt="JapanCalc" width="28" height="28"></a>
    <div class="nav-right">
      <nav class="lang-switcher" aria-label="Language"><a href="/tax-finance/compound-interest/" aria-label="\u65E5\u672C\u8A9E\u306B\u5207\u66FF">JP</a><span aria-hidden="true">&middot;</span><span aria-current="true">English</span></nav>
      <button class="nav-toggle" aria-expanded="false" aria-label="Open menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>
    </div>
  </div>
  <div class="nav-links"><a href="/en/">Home</a><a href="/en/date-calendar/">Date &amp; Calendar</a><a href="/en/tax-finance/">Tax &amp; Finance</a><a href="/en/language-tools/">Language Tools</a></div>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol><li><a href="/en/">Home</a></li><li aria-hidden="true">&rsaquo;</li><li><a href="/en/tax-finance/">Tax &amp; Finance</a></li><li aria-hidden="true">&rsaquo;</li><li>Compound Interest Calculator</li></ol>
</nav>

<main id="main-content">
  <div class="container tool-container">
    <h1>Compound Interest &amp; Savings Calculator &mdash; NISA Simulator</h1>
    <p class="tool-intro">Enter your principal, monthly deposit, expected annual return, and investment period to simulate future savings growth. Useful for NISA investment planning.</p>

    <div class="ad-zone" style="min-height:100px; margin:1rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_ATF_COMPOUND_EN" data-ad-format="horizontal" data-full-width-responsive="true"></ins>
    </div>

    <div class="form-group">
      <label class="form-label" for="principal">Initial Principal (optional)</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="principal" min="0" placeholder="0" step="10000" value="0">
        <span class="input-suffix">\u5186</span>
      </div>
      <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.2rem;">Enter amount in yen. Leave as 0 if starting from scratch.</div>
    </div>

    <div class="form-group">
      <label class="form-label" for="monthly">Monthly Deposit</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="monthly" min="0" placeholder="30000" step="1000">
        <span class="input-suffix">\u5186</span>
      </div>
      <div class="nisa-preset-btns" id="nisa-presets"></div>
      <div class="nisa-note-inline" id="nisa-note"></div>
    </div>

    <div class="form-group">
      <label class="form-label" for="rate">Annual Return Rate</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="rate" min="0.01" max="30" step="0.1" placeholder="5">
        <span class="input-suffix">%</span>
      </div>
      <div class="preset-btns" id="rate-presets">
        <button class="preset-btn" data-val="1">1%</button>
        <button class="preset-btn" data-val="3">3%</button>
        <button class="preset-btn" data-val="5">5%</button>
        <button class="preset-btn" data-val="7">7%</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="years">Investment Period</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="years" min="1" max="50" step="1" placeholder="20">
        <span class="input-suffix">yrs</span>
      </div>
      <div class="preset-btns" id="year-presets">
        <button class="preset-btn" data-val="10">10 yrs</button>
        <button class="preset-btn" data-val="20">20 yrs</button>
        <button class="preset-btn" data-val="30">30 yrs</button>
      </div>
    </div>

    <button class="btn-calc" id="btn-calc">Calculate</button>

    <div id="result-box" class="result-box">
      <div class="result-main">
        <div class="result-label">Final Amount</div>
        <div class="result-value" id="result-final">--</div>
      </div>
      <div class="result-detail" id="result-deposited"></div>
      <div class="result-detail" id="result-interest"></div>
      <div class="result-detail" id="result-rate"></div>

      <div class="ratio-bar-wrap" id="ratio-bar-wrap">
        <div class="ratio-bar-label">
          <span id="ratio-label-deposited">Total Deposited: --</span>
          <span id="ratio-label-interest">Investment Profit: --</span>
        </div>
        <div class="ratio-bar">
          <div class="ratio-bar-deposited" id="ratio-bar-deposited" style="width:0%"></div>
          <div class="ratio-bar-interest" id="ratio-bar-interest" style="width:0%"></div>
        </div>
      </div>

      <div class="action-btns">
        <button class="btn-copy-result" id="btn-copy">Copy Result</button>
      </div>

      <details class="schedule-toggle" id="schedule-toggle">
        <summary>Show Yearly Schedule</summary>
        <div id="schedule-body"></div>
      </details>

      <div class="nisa-note" style="background:rgba(11,110,95,0.06); border-left:3px solid var(--color-accent); padding:0.75rem 1rem; border-radius:var(--radius); margin:1rem 0; font-size:0.85rem;">
        \uD83D\uDCCC New NISA (from 2024): Up to 3.6M yen/year tax-free investment. Tsumitate (savings) allowance: 1.2M yen + Growth allowance: 2.4M yen. Lifetime cap: 18M yen.
      </div>
    </div>

    <div class="disclaimer">\u203B Actual investment results vary depending on market conditions. This tool is a simulation and does not guarantee returns.</div>

    <div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_BTF_COMPOUND_EN" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </div>

    <section class="faq-section" aria-label="FAQ">
      <h2>Frequently Asked Questions</h2>
      <details class="faq-item"><summary>What is compound interest?</summary><p>Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods. Over long investment horizons, it creates a significant difference in total returns.</p></details>
      <details class="faq-item"><summary>How much can I grow my money with NISA?</summary><p>Investing 30,000 yen per month at an annual rate of 5% for 20 years would grow to approximately 12.33 million yen (7.2 million yen in deposits, about 5.13 million yen in profit).</p></details>
      <details class="faq-item"><summary>Is a 5% annual return realistic?</summary><p>The S&amp;P 500 has averaged roughly 10% annual returns over the past 30 years. A 5% target through index fund investing is considered a realistic and achievable goal.</p></details>
      <details class="faq-item"><summary>What are the NISA contribution limits?</summary><p>Under the new NISA (from 2024), the Tsumitate (savings) allowance is 1.2 million yen per year (100,000 yen/month) and the Growth allowance is 2.4 million yen per year. The lifetime investment cap is 18 million yen.</p></details>
      <details class="faq-item"><summary>What is the difference between simple and compound interest?</summary><p>Simple interest is calculated only on the original principal, while compound interest is calculated on the principal plus any accumulated interest. The longer the investment period, the larger the difference between the two.</p></details>
    </section>

    <article class="seo-content">
      <h2>How to Use the Compound Interest Calculator</h2>
      <p>Enter your initial principal (optional), monthly deposit amount, expected annual return rate, and investment period. Click "Calculate" to see your projected final amount. Use NISA preset buttons for common savings amounts in Japan.</p>
      <h2>Understanding the Yearly Schedule</h2>
      <p>Click "Show Yearly Schedule" below the results to see a year-by-year breakdown of total deposits, investment profit, and balance. This helps visualize how compound interest accelerates growth over time.</p>
    </article>
  </div>
</main>

<footer class="site-footer">
  <div class="container">
    <nav class="footer-links" aria-label="Footer navigation"><a href="/en/">Home</a><a href="/en/date-calendar/">Date &amp; Calendar</a><a href="/en/tax-finance/">Tax &amp; Finance</a><a href="/en/language-tools/">Language Tools</a></nav>
    <p class="footer-copy">&copy; 2025 JapanCalc. All rights reserved.</p>
  </div>
</footer>

<script>
document.querySelector('.nav-toggle').addEventListener('click', function() {
  var nav = document.querySelector('.site-nav');
  var expanded = this.getAttribute('aria-expanded') === 'true';
  this.setAttribute('aria-expanded', !expanded);
  nav.classList.toggle('nav-open');
});
</script>

<script type="module">
import { calcCompound, NISA_PRESETS } from '/assets/js/compound.js';

var principalInput = document.getElementById('principal');
var monthlyInput   = document.getElementById('monthly');
var rateInput      = document.getElementById('rate');
var yearsInput     = document.getElementById('years');
var btnCalc        = document.getElementById('btn-calc');
var resultBox      = document.getElementById('result-box');
var resultFinal    = document.getElementById('result-final');
var resultDeposited = document.getElementById('result-deposited');
var resultInterest = document.getElementById('result-interest');
var resultRate     = document.getElementById('result-rate');
var ratioBarDeposited = document.getElementById('ratio-bar-deposited');
var ratioBarInterest  = document.getElementById('ratio-bar-interest');
var ratioLabelDeposited = document.getElementById('ratio-label-deposited');
var ratioLabelInterest  = document.getElementById('ratio-label-interest');
var scheduleBody   = document.getElementById('schedule-body');
var btnCopy        = document.getElementById('btn-copy');
var nisaNote       = document.getElementById('nisa-note');
var nisaPresetsWrap = document.getElementById('nisa-presets');

// Render NISA preset buttons
if (NISA_PRESETS && NISA_PRESETS.length) {
  NISA_PRESETS.forEach(function(preset) {
    var btn = document.createElement('button');
    btn.className = 'nisa-preset-btn';
    btn.textContent = preset.label;
    btn.setAttribute('data-monthly', preset.monthly);
    btn.setAttribute('data-note', preset.note || '');
    btn.addEventListener('click', function() {
      monthlyInput.value = preset.monthly;
      nisaNote.textContent = preset.note || '';
      document.querySelectorAll('.nisa-preset-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
    nisaPresetsWrap.appendChild(btn);
  });
}

// Preset rate buttons
document.querySelectorAll('#rate-presets .preset-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    rateInput.value = btn.getAttribute('data-val');
    document.querySelectorAll('#rate-presets .preset-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

// Preset year buttons
document.querySelectorAll('#year-presets .preset-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    yearsInput.value = btn.getAttribute('data-val');
    document.querySelectorAll('#year-presets .preset-btn').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

function calculate() {
  var principal     = parseFloat(principalInput.value) || 0;
  var monthlyDeposit = parseFloat(monthlyInput.value) || 0;
  var annualRate    = parseFloat(rateInput.value);
  var years         = parseInt(yearsInput.value);

  if (monthlyDeposit <= 0 && principal <= 0) {
    resultFinal.textContent = 'Please enter a principal or monthly deposit';
    resultDeposited.textContent = '';
    resultInterest.textContent = '';
    resultRate.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }
  if (isNaN(annualRate) || annualRate < 0 || !years || years <= 0) {
    resultFinal.textContent = 'Please check your input values';
    resultDeposited.textContent = '';
    resultInterest.textContent = '';
    resultRate.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }

  var result = calcCompound(principal, monthlyDeposit, annualRate, years);
  if (result.error) {
    resultFinal.textContent = result.error;
    resultDeposited.textContent = '';
    resultInterest.textContent = '';
    resultRate.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }

  resultFinal.textContent = '\\u00A5' + result.finalAmount.toLocaleString('ja-JP');
  resultDeposited.textContent = 'Total Deposited: \\u00A5' + result.totalDeposited.toLocaleString('ja-JP');
  resultInterest.textContent = 'Investment Profit: \\u00A5' + result.totalInterest.toLocaleString('ja-JP');
  var profitRate = result.totalDeposited > 0 ? (result.totalInterest / result.totalDeposited * 100).toFixed(1) : '0.0';
  resultRate.textContent = 'Profit Rate: ' + profitRate + '%';

  // Ratio bar
  var depositedPct = (result.totalDeposited / result.finalAmount * 100).toFixed(1);
  var interestPct  = (100 - parseFloat(depositedPct)).toFixed(1);
  ratioBarDeposited.style.width = depositedPct + '%';
  ratioBarInterest.style.width  = interestPct + '%';
  ratioLabelDeposited.textContent = 'Total Deposited: ' + depositedPct + '%';
  ratioLabelInterest.textContent  = 'Investment Profit: ' + interestPct + '%';

  // Schedule table
  var html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Total Deposited</th><th>Investment Profit</th><th>Balance</th></tr></thead><tbody>';
  if (result.schedule && result.schedule.length) {
    result.schedule.forEach(function(row) {
      html += '<tr><td>Year ' + row.year + '</td><td>\\u00A5' + row.totalDeposited.toLocaleString('ja-JP') + '</td><td>\\u00A5' + row.totalInterest.toLocaleString('ja-JP') + '</td><td>\\u00A5' + row.balance.toLocaleString('ja-JP') + '</td></tr>';
    });
  }
  html += '</tbody></table>';
  scheduleBody.innerHTML = html;

  resultBox.classList.add('visible');
  if (typeof gtag !== 'undefined') gtag('event', 'tool_used', { tool_name: 'compound_interest', language: 'en' });
}

btnCalc.addEventListener('click', calculate);

btnCopy.addEventListener('click', function() {
  var text = 'Final Amount: ' + resultFinal.textContent + '\\n' + resultDeposited.textContent + '\\n' + resultInterest.textContent + '\\n' + resultRate.textContent;
  navigator.clipboard.writeText(text).then(function() {
    btnCopy.textContent = 'Copied!';
    setTimeout(function() { btnCopy.textContent = 'Copy Result'; }, 1500);
  });
});
</script>

${AD_LAZY_SCRIPT}
</body>
</html>`;
}

// ===== WRITE FILES =====
const distRoot = path.join(__dirname, '..', 'dist');
const jpDir = path.join(distRoot, 'tax-finance', 'compound-interest');
const enDir = path.join(distRoot, 'en', 'tax-finance', 'compound-interest');

fs.mkdirSync(jpDir, { recursive: true });
fs.mkdirSync(enDir, { recursive: true });

fs.writeFileSync(path.join(jpDir, 'index.html'), generateJP(), 'utf8');
console.log('  JP: /tax-finance/compound-interest/');

fs.writeFileSync(path.join(enDir, 'index.html'), generateEN(), 'utf8');
console.log('  EN: /en/tax-finance/compound-interest/');

console.log('Done! Created 2 compound interest calculator pages.');
