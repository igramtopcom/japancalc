/**
 * Generate JP + EN mortgage calculator pages
 * Run: node scripts/generate-mortgage-pages.js
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
  .ratio-bar-principal { background: var(--color-accent); height: 100%; transition: width 0.3s; }
  .ratio-bar-interest { background: #e67e22; height: 100%; transition: width 0.3s; }
  .schedule-toggle { margin-top: 1.25rem; }
  .schedule-toggle summary { cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--color-accent); padding: 0.5rem 0; }
  .schedule-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; margin-top: 0.5rem; }
  .schedule-table th, .schedule-table td { padding: 0.4rem 0.5rem; border: 1px solid var(--color-border); text-align: right; }
  .schedule-table th { background: var(--color-bg-alt); font-weight: 600; font-size: 0.78rem; text-align: center; }
  .schedule-table td:first-child { text-align: center; }
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
  <title>\u4F4F\u5B85\u30ED\u30FC\u30F3\u8A08\u7B97\u30C4\u30FC\u30EB: \u6708\u3005\u8FD4\u6E08\u984D\u30FB\u7DCF\u8FD4\u6E08\u984D\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3 | JapanCalc</title>
  <meta name="description" content="\u501F\u5165\u91D1\u984D\u30FB\u91D1\u5229\u30FB\u8FD4\u6E08\u671F\u9593\u3092\u5165\u529B\u3059\u308B\u3060\u3051\u3067\u6708\u3005\u306E\u8FD4\u6E08\u984D\u3068\u7DCF\u8FD4\u6E08\u984D\u3092\u8A08\u7B97\u3002\u91D1\u5229\u30BF\u30A4\u30D7\u6BD4\u8F03\u30FB\u8FD4\u6E08\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3082\u30022026\u5E74\u6700\u65B0\u91D1\u5229\u5BFE\u5FDC\u3002\u7121\u6599\u3002">
  <link rel="canonical" href="https://japancalc.com/tax-finance/mortgage-calculator/">
  <link rel="alternate" hreflang="ja"        href="https://japancalc.com/tax-finance/mortgage-calculator/">
  <link rel="alternate" hreflang="en"        href="https://japancalc.com/en/tax-finance/mortgage-calculator/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/tax-finance/mortgage-calculator/">
  <meta property="og:title"       content="\u4F4F\u5B85\u30ED\u30FC\u30F3\u8A08\u7B97\u30C4\u30FC\u30EB | JapanCalc">
  <meta property="og:description" content="\u501F\u5165\u91D1\u984D\u30FB\u91D1\u5229\u30FB\u8FD4\u6E08\u671F\u9593\u3092\u5165\u529B\u3059\u308B\u3060\u3051\u3067\u6708\u3005\u306E\u8FD4\u6E08\u984D\u3068\u7DCF\u8FD4\u6E08\u984D\u3092\u8A08\u7B97\u3002">
  <meta property="og:url"         content="https://japancalc.com/tax-finance/mortgage-calculator/">
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
    "name": "\u4F4F\u5B85\u30ED\u30FC\u30F3\u8A08\u7B97\u30C4\u30FC\u30EB | JapanCalc",
    "url": "https://japancalc.com/tax-finance/mortgage-calculator/",
    "description": "\u501F\u5165\u91D1\u984D\u30FB\u91D1\u5229\u30FB\u8FD4\u6E08\u671F\u9593\u3092\u5165\u529B\u3059\u308B\u3060\u3051\u3067\u6708\u3005\u306E\u8FD4\u6E08\u984D\u3068\u7DCF\u8FD4\u6E08\u984D\u3092\u8A08\u7B97\u3002",
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
      { "@type": "ListItem", "position": 3, "name": "\\u4F4F\\u5B85\\u30ED\\u30FC\\u30F3\\u8A08\\u7B97", "item": "https://japancalc.com/tax-finance/mortgage-calculator/" }
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
        "name": "\\u5143\\u5229\\u5747\\u7B49\\u8FD4\\u6E08\\u3068\\u5143\\u91D1\\u5747\\u7B49\\u8FD4\\u6E08\\u306E\\u9055\\u3044\\u306F\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u5143\\u5229\\u5747\\u7B49\\u8FD4\\u6E08\\u306F\\u6BCE\\u6708\\u306E\\u8FD4\\u6E08\\u984D\\uFF08\\u5143\\u91D1\\uFF0B\\u5229\\u606F\\uFF09\\u304C\\u4E00\\u5B9A\\u3067\\u3059\\u3002\\u5143\\u91D1\\u5747\\u7B49\\u8FD4\\u6E08\\u306F\\u6BCE\\u6708\\u306E\\u5143\\u91D1\\u8FD4\\u6E08\\u984D\\u304C\\u4E00\\u5B9A\\u3067\\u3001\\u5229\\u606F\\u304C\\u6E1B\\u3063\\u3066\\u3044\\u304F\\u305F\\u3081\\u6708\\u3005\\u306E\\u8FD4\\u6E08\\u984D\\u304C\\u5F90\\u3005\\u306B\\u4E0B\\u304C\\u308A\\u307E\\u3059\\u3002\\u3053\\u306E\\u30C4\\u30FC\\u30EB\\u3067\\u306F\\u5143\\u5229\\u5747\\u7B49\\u8FD4\\u6E08\\u3092\\u8A08\\u7B97\\u3057\\u307E\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "3000\\u4E07\\u5186\\u309235\\u5E74\\u3067\\u501F\\u308A\\u305F\\u5834\\u5408\\u306E\\u6708\\u3005\\u306E\\u8FD4\\u6E08\\u984D\\u306F\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u91D1\\u52291.5%\\u306E\\u5834\\u5408\\u3001\\u5143\\u5229\\u5747\\u7B49\\u8FD4\\u6E08\\u3067\\u6708\\u3005\\u7D0491,855\\u5186\\u3067\\u3059\\u3002\\u7DCF\\u8FD4\\u6E08\\u984D\\u306F\\u7D0438,579,007\\u5186\\u3068\\u306A\\u308A\\u3001\\u7D048,579,007\\u5186\\u304C\\u5229\\u606F\\u3067\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "\\u5909\\u52D5\\u91D1\\u5229\\u3068\\u56FA\\u5B9A\\u91D1\\u5229\\u3069\\u3061\\u3089\\u304C\\u5F97\\u3067\\u3059\\u304B\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u5909\\u52D5\\u91D1\\u5229\\u306F\\u5F53\\u521D\\u306E\\u91D1\\u5229\\u304C\\u4F4E\\u3044\\u3067\\u3059\\u304C\\u3001\\u5C06\\u6765\\u306E\\u91D1\\u5229\\u4E0A\\u6607\\u30EA\\u30B9\\u30AF\\u304C\\u3042\\u308A\\u307E\\u3059\\u3002\\u56FA\\u5B9A\\u91D1\\u5229\\u306F\\u5F53\\u521D\\u91D1\\u5229\\u304C\\u9AD8\\u3081\\u3067\\u3059\\u304C\\u3001\\u8FD4\\u6E08\\u984D\\u304C\\u5B89\\u5B9A\\u3057\\u307E\\u3059\\u3002\\u4E00\\u6982\\u306B\\u3069\\u3061\\u3089\\u304C\\u5F97\\u3068\\u306F\\u8A00\\u3048\\u305A\\u3001\\u30E9\\u30A4\\u30D5\\u30D7\\u30E9\\u30F3\\u3084\\u30EA\\u30B9\\u30AF\\u8A31\\u5BB9\\u5EA6\\u306B\\u3088\\u308A\\u307E\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "\\u4F4F\\u5B85\\u30ED\\u30FC\\u30F3\\u63A7\\u9664\\u3068\\u306F\\u4F55\\u3067\\u3059\\u304B\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u4F4F\\u5B85\\u30ED\\u30FC\\u30F3\\u63A7\\u9664\\uFF08\\u4F4F\\u5B85\\u501F\\u5165\\u91D1\\u7B49\\u7279\\u5225\\u63A7\\u9664\\uFF09\\u306F\\u3001\\u5E74\\u672B\\u306E\\u30ED\\u30FC\\u30F3\\u6B8B\\u9AD8\\u306E0.7%\\u304C\\u6240\\u5F97\\u7A0E\\u304B\\u3089\\u63A7\\u9664\\u3055\\u308C\\u308B\\u5236\\u5EA6\\u3067\\u3059\\u3002\\u63A7\\u9664\\u671F\\u9593\\u306F\\u6700\\u957713\\u5E74\\u9593\\u3067\\u3059\\u3002" }
      },
      {
        "@type": "Question",
        "name": "\\u7E70\\u308A\\u4E0A\\u3052\\u8FD4\\u6E08\\u306E\\u52B9\\u679C\\u306F\\uFF1F",
        "acceptedAnswer": { "@type": "Answer", "text": "\\u7E70\\u308A\\u4E0A\\u3052\\u8FD4\\u6E08\\u3092\\u3059\\u308B\\u3068\\u5143\\u91D1\\u304C\\u6E1B\\u5C11\\u3057\\u3001\\u305D\\u306E\\u5F8C\\u306E\\u5229\\u606F\\u7DCF\\u984D\\u304C\\u5927\\u5E45\\u306B\\u6E1B\\u308A\\u307E\\u3059\\u3002\\u7279\\u306B\\u8FD4\\u6E08\\u521D\\u671F\\u306B\\u884C\\u3046\\u307B\\u3069\\u52B9\\u679C\\u304C\\u5927\\u304D\\u3044\\u3067\\u3059\\u3002\\u671F\\u9593\\u77ED\\u7E2E\\u578B\\u3068\\u8FD4\\u6E08\\u984D\\u8EFD\\u6E1B\\u578B\\u306E2\\u7A2E\\u985E\\u304C\\u3042\\u308A\\u307E\\u3059\\u3002" }
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
      <nav class="lang-switcher" aria-label="\u8A00\u8A9E\u5207\u66FF"><span aria-current="true">JP</span><span aria-hidden="true">&middot;</span><a href="/en/tax-finance/mortgage-calculator/" aria-label="Switch to English">English</a></nav>
      <button class="nav-toggle" aria-expanded="false" aria-label="\u30E1\u30CB\u30E5\u30FC\u3092\u958B\u304F"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>
    </div>
  </div>
  <div class="nav-links"><a href="/">\u30DB\u30FC\u30E0</a><a href="/date-calendar/">\u65E5\u4ED8\u30FB\u30AB\u30EC\u30F3\u30C0\u30FC</a><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a><a href="/language-tools/">\u8A00\u8A9E\u30FB\u5909\u63DB</a></div>
</nav>

<nav class="breadcrumb" aria-label="\u30D1\u30F3\u304F\u305A\u30EA\u30B9\u30C8">
  <ol><li><a href="/">\u30DB\u30FC\u30E0</a></li><li aria-hidden="true">&rsaquo;</li><li><a href="/tax-finance/">\u7A0E\u91D1\u30FB\u8CA1\u52D9</a></li><li aria-hidden="true">&rsaquo;</li><li>\u4F4F\u5B85\u30ED\u30FC\u30F3\u8A08\u7B97</li></ol>
</nav>

<main id="main-content">
  <div class="container tool-container">
    <h1>\u4F4F\u5B85\u30ED\u30FC\u30F3\u8A08\u7B97\u30C4\u30FC\u30EB</h1>
    <p class="tool-intro">\u501F\u5165\u91D1\u984D\u30FB\u91D1\u5229\u30FB\u8FD4\u6E08\u671F\u9593\u3092\u5165\u529B\u3059\u308B\u3060\u3051\u3067\u3001\u6708\u3005\u306E\u8FD4\u6E08\u984D\u3068\u7DCF\u8FD4\u6E08\u984D\u3092\u30B7\u30DF\u30E5\u30EC\u30FC\u30B7\u30E7\u30F3\u3002\u5143\u5229\u5747\u7B49\u8FD4\u6E08\u65B9\u5F0F\u3067\u8A08\u7B97\u3057\u307E\u3059\u3002</p>

    <div class="ad-zone" style="min-height:100px; margin:1rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_ATF_MORTGAGE" data-ad-format="horizontal" data-full-width-responsive="true"></ins>
    </div>

    <div class="form-group">
      <label class="form-label" for="principal">\u501F\u5165\u91D1\u984D</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="principal" min="1" placeholder="3000" step="100">
        <span class="input-suffix">\u4E07\u5186</span>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="rate">\u91D1\u5229\uFF08\u5E74\u7387\uFF09</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="rate" min="0.01" max="20" step="0.01" placeholder="1.5">
        <span class="input-suffix">%</span>
      </div>
      <div class="preset-btns" id="rate-presets">
        <button class="preset-btn" data-val="0.3">0.3%</button>
        <button class="preset-btn" data-val="0.5">0.5%</button>
        <button class="preset-btn" data-val="1.5">1.5%</button>
        <button class="preset-btn" data-val="1.96">1.96%</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="years">\u8FD4\u6E08\u671F\u9593</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="years" min="1" max="50" step="1" placeholder="35">
        <span class="input-suffix">\u5E74</span>
      </div>
      <div class="preset-btns" id="year-presets">
        <button class="preset-btn" data-val="20">20\u5E74</button>
        <button class="preset-btn" data-val="25">25\u5E74</button>
        <button class="preset-btn" data-val="30">30\u5E74</button>
        <button class="preset-btn" data-val="35">35\u5E74</button>
      </div>
    </div>

    <button class="btn-calc" id="btn-calc">\u8A08\u7B97\u3059\u308B</button>

    <div id="result-box" class="result-box">
      <div class="result-main">
        <div class="result-label">\u6708\u3005\u306E\u8FD4\u6E08\u984D</div>
        <div class="result-value" id="result-monthly">--</div>
      </div>
      <div class="result-detail" id="result-total"></div>
      <div class="result-detail" id="result-interest"></div>

      <div class="ratio-bar-wrap" id="ratio-bar-wrap">
        <div class="ratio-bar-label">
          <span id="ratio-label-principal">\u5143\u91D1: --</span>
          <span id="ratio-label-interest">\u5229\u606F: --</span>
        </div>
        <div class="ratio-bar">
          <div class="ratio-bar-principal" id="ratio-bar-principal" style="width:0%"></div>
          <div class="ratio-bar-interest" id="ratio-bar-interest" style="width:0%"></div>
        </div>
      </div>

      <div class="action-btns">
        <button class="btn-copy-result" id="btn-copy">\u7D50\u679C\u3092\u30B3\u30D4\u30FC</button>
      </div>

      <details class="schedule-toggle" id="schedule-toggle">
        <summary>\u8FD4\u6E08\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u8868\u793A</summary>
        <div id="schedule-body"></div>
      </details>
    </div>

    <div class="disclaimer">\u203B \u5B9F\u969B\u306E\u8FD4\u6E08\u984D\u306F\u91D1\u878D\u6A5F\u95A2\u306B\u3088\u3063\u3066\u7570\u306A\u308A\u307E\u3059\u3002\u8A73\u7D30\u306F\u5404\u91D1\u878D\u6A5F\u95A2\u306B\u3054\u76F8\u8AC7\u304F\u3060\u3055\u3044\u3002</div>

    <div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_BTF_MORTGAGE" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </div>

    <section class="faq-section" aria-label="\u3088\u304F\u3042\u308B\u8CEA\u554F">
      <h2>\u3088\u304F\u3042\u308B\u8CEA\u554F\uFF08FAQ\uFF09</h2>
      <details class="faq-item"><summary>\u5143\u5229\u5747\u7B49\u8FD4\u6E08\u3068\u5143\u91D1\u5747\u7B49\u8FD4\u6E08\u306E\u9055\u3044\u306F\uFF1F</summary><p>\u5143\u5229\u5747\u7B49\u8FD4\u6E08\u306F\u6BCE\u6708\u306E\u8FD4\u6E08\u984D\uFF08\u5143\u91D1\uFF0B\u5229\u606F\uFF09\u304C\u4E00\u5B9A\u3067\u3059\u3002\u5143\u91D1\u5747\u7B49\u8FD4\u6E08\u306F\u6BCE\u6708\u306E\u5143\u91D1\u8FD4\u6E08\u984D\u304C\u4E00\u5B9A\u3067\u3001\u5229\u606F\u304C\u6E1B\u3063\u3066\u3044\u304F\u305F\u3081\u6708\u3005\u306E\u8FD4\u6E08\u984D\u304C\u5F90\u3005\u306B\u4E0B\u304C\u308A\u307E\u3059\u3002\u3053\u306E\u30C4\u30FC\u30EB\u3067\u306F\u5143\u5229\u5747\u7B49\u8FD4\u6E08\u3092\u8A08\u7B97\u3057\u307E\u3059\u3002</p></details>
      <details class="faq-item"><summary>3000\u4E07\u5186\u309235\u5E74\u3067\u501F\u308A\u305F\u5834\u5408\u306E\u6708\u3005\u306E\u8FD4\u6E08\u984D\u306F\uFF1F</summary><p>\u91D1\u52291.5%\u306E\u5834\u5408\u3001\u5143\u5229\u5747\u7B49\u8FD4\u6E08\u3067\u6708\u3005\u7D0491,855\u5186\u3067\u3059\u3002\u7DCF\u8FD4\u6E08\u984D\u306F\u7D0438,579,007\u5186\u3068\u306A\u308A\u3001\u7D048,579,007\u5186\u304C\u5229\u606F\u3067\u3059\u3002</p></details>
      <details class="faq-item"><summary>\u5909\u52D5\u91D1\u5229\u3068\u56FA\u5B9A\u91D1\u5229\u3069\u3061\u3089\u304C\u5F97\u3067\u3059\u304B\uFF1F</summary><p>\u5909\u52D5\u91D1\u5229\u306F\u5F53\u521D\u306E\u91D1\u5229\u304C\u4F4E\u3044\u3067\u3059\u304C\u3001\u5C06\u6765\u306E\u91D1\u5229\u4E0A\u6607\u30EA\u30B9\u30AF\u304C\u3042\u308A\u307E\u3059\u3002\u56FA\u5B9A\u91D1\u5229\u306F\u5F53\u521D\u91D1\u5229\u304C\u9AD8\u3081\u3067\u3059\u304C\u3001\u8FD4\u6E08\u984D\u304C\u5B89\u5B9A\u3057\u307E\u3059\u3002\u4E00\u6982\u306B\u3069\u3061\u3089\u304C\u5F97\u3068\u306F\u8A00\u3048\u305A\u3001\u30E9\u30A4\u30D5\u30D7\u30E9\u30F3\u3084\u30EA\u30B9\u30AF\u8A31\u5BB9\u5EA6\u306B\u3088\u308A\u307E\u3059\u3002</p></details>
      <details class="faq-item"><summary>\u4F4F\u5B85\u30ED\u30FC\u30F3\u63A7\u9664\u3068\u306F\u4F55\u3067\u3059\u304B\uFF1F</summary><p>\u4F4F\u5B85\u30ED\u30FC\u30F3\u63A7\u9664\uFF08\u4F4F\u5B85\u501F\u5165\u91D1\u7B49\u7279\u5225\u63A7\u9664\uFF09\u306F\u3001\u5E74\u672B\u306E\u30ED\u30FC\u30F3\u6B8B\u9AD8\u306E0.7%\u304C\u6240\u5F97\u7A0E\u304B\u3089\u63A7\u9664\u3055\u308C\u308B\u5236\u5EA6\u3067\u3059\u3002\u63A7\u9664\u671F\u9593\u306F\u6700\u957713\u5E74\u9593\u3067\u3059\u3002</p></details>
      <details class="faq-item"><summary>\u7E70\u308A\u4E0A\u3052\u8FD4\u6E08\u306E\u52B9\u679C\u306F\uFF1F</summary><p>\u7E70\u308A\u4E0A\u3052\u8FD4\u6E08\u3092\u3059\u308B\u3068\u5143\u91D1\u304C\u6E1B\u5C11\u3057\u3001\u305D\u306E\u5F8C\u306E\u5229\u606F\u7DCF\u984D\u304C\u5927\u5E45\u306B\u6E1B\u308A\u307E\u3059\u3002\u7279\u306B\u8FD4\u6E08\u521D\u671F\u306B\u884C\u3046\u307B\u3069\u52B9\u679C\u304C\u5927\u304D\u3044\u3067\u3059\u3002\u671F\u9593\u77ED\u7E2E\u578B\u3068\u8FD4\u6E08\u984D\u8EFD\u6E1B\u578B\u306E2\u7A2E\u985E\u304C\u3042\u308A\u307E\u3059\u3002</p></details>
    </section>

    <article class="seo-content">
      <h2>\u4F4F\u5B85\u30ED\u30FC\u30F3\u8A08\u7B97\u30C4\u30FC\u30EB\u306E\u4F7F\u3044\u65B9</h2>
      <p>\u501F\u5165\u91D1\u984D\uFF08\u4E07\u5186\u5358\u4F4D\uFF09\u3001\u91D1\u5229\uFF08\u5E74\u7387\uFF09\u3001\u8FD4\u6E08\u671F\u9593\uFF08\u5E74\uFF09\u3092\u5165\u529B\u3057\u3066\u300C\u8A08\u7B97\u3059\u308B\u300D\u3092\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u3060\u3051\u3002\u5143\u5229\u5747\u7B49\u8FD4\u6E08\u65B9\u5F0F\u3067\u6708\u3005\u306E\u8FD4\u6E08\u984D\u3001\u7DCF\u8FD4\u6E08\u984D\u3001\u7DCF\u5229\u606F\u984D\u3092\u8A08\u7B97\u3057\u307E\u3059\u3002\u30D7\u30EA\u30BB\u30C3\u30C8\u30DC\u30BF\u30F3\u3067\u4EE3\u8868\u7684\u306A\u91D1\u5229\u3084\u8FD4\u6E08\u671F\u9593\u3092\u7D20\u65E9\u304F\u5165\u529B\u3067\u304D\u307E\u3059\u3002</p>
      <h2>\u8FD4\u6E08\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u306E\u898B\u65B9</h2>
      <p>\u8A08\u7B97\u7D50\u679C\u306E\u4E0B\u306B\u3042\u308B\u300C\u8FD4\u6E08\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u3092\u8868\u793A\u300D\u3092\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u3068\u3001\u5E74\u6BCE\u306E\u5143\u91D1\u30FB\u5229\u606F\u30FB\u6B8B\u9AD8\u306E\u63A8\u79FB\u304C\u8868\u3067\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002\u4F55\u5E74\u76EE\u306B\u3069\u308C\u3060\u3051\u5143\u91D1\u304C\u6E1B\u308B\u304B\u304C\u4E00\u76EE\u3067\u308F\u304B\u308A\u307E\u3059\u3002</p>
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
import { calcMortgageEqual, PRESET_RATES } from '/assets/js/mortgage.js';

var principalInput = document.getElementById('principal');
var rateInput      = document.getElementById('rate');
var yearsInput     = document.getElementById('years');
var btnCalc        = document.getElementById('btn-calc');
var resultBox      = document.getElementById('result-box');
var resultMonthly  = document.getElementById('result-monthly');
var resultTotal    = document.getElementById('result-total');
var resultInterest = document.getElementById('result-interest');
var ratioBarPrincipal = document.getElementById('ratio-bar-principal');
var ratioBarInterest  = document.getElementById('ratio-bar-interest');
var ratioLabelPrincipal = document.getElementById('ratio-label-principal');
var ratioLabelInterest  = document.getElementById('ratio-label-interest');
var scheduleBody   = document.getElementById('schedule-body');
var btnCopy        = document.getElementById('btn-copy');

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
  var principalMan = parseFloat(principalInput.value);
  var annualRate   = parseFloat(rateInput.value);
  var years        = parseInt(yearsInput.value);

  if (!principalMan || principalMan <= 0 || isNaN(annualRate) || annualRate < 0 || !years || years <= 0) {
    resultMonthly.textContent = '\\u5165\\u529B\\u5024\\u3092\\u78BA\\u8A8D\\u3057\\u3066\\u304F\\u3060\\u3055\\u3044';
    resultTotal.textContent = '';
    resultInterest.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }

  var principal = principalMan * 10000;
  var result = calcMortgageEqual(principal, annualRate, years);

  resultMonthly.textContent = '\\u00A5' + result.monthlyPayment.toLocaleString('ja-JP');
  resultTotal.textContent = '\\u7DCF\\u8FD4\\u6E08\\u984D: \\u00A5' + result.totalPayment.toLocaleString('ja-JP');
  resultInterest.textContent = '\\u7DCF\\u5229\\u606F\\u984D: \\u00A5' + result.totalInterest.toLocaleString('ja-JP');

  // Ratio bar
  var principalPct = (principal / result.totalPayment * 100).toFixed(1);
  var interestPct  = (100 - principalPct).toFixed(1);
  ratioBarPrincipal.style.width = principalPct + '%';
  ratioBarInterest.style.width  = interestPct + '%';
  ratioLabelPrincipal.textContent = '\\u5143\\u91D1: ' + principalPct + '%';
  ratioLabelInterest.textContent  = '\\u5229\\u606F: ' + interestPct + '%';

  // Schedule table (yearly)
  var monthlyRate = annualRate / 100 / 12;
  var totalMonths = years * 12;
  var monthly = result.monthlyPayment;
  var balance = principal;
  var html = '<table class="schedule-table"><thead><tr><th>\\u5E74\\u6B21</th><th>\\u5E74\\u9593\\u5143\\u91D1</th><th>\\u5E74\\u9593\\u5229\\u606F</th><th>\\u6B8B\\u9AD8</th></tr></thead><tbody>';

  for (var y = 1; y <= years; y++) {
    var yearPrincipal = 0;
    var yearInterest = 0;
    for (var m = 0; m < 12; m++) {
      if (balance <= 0) break;
      var interestPayment = balance * monthlyRate;
      var principalPayment = monthly - interestPayment;
      if (principalPayment > balance) principalPayment = balance;
      yearPrincipal += principalPayment;
      yearInterest += interestPayment;
      balance -= principalPayment;
    }
    if (balance < 0) balance = 0;
    html += '<tr><td>' + y + '\\u5E74\\u76EE</td><td>\\u00A5' + Math.round(yearPrincipal).toLocaleString('ja-JP') + '</td><td>\\u00A5' + Math.round(yearInterest).toLocaleString('ja-JP') + '</td><td>\\u00A5' + Math.round(balance).toLocaleString('ja-JP') + '</td></tr>';
  }
  html += '</tbody></table>';
  scheduleBody.innerHTML = html;

  resultBox.classList.add('visible');
  if (typeof gtag !== 'undefined') gtag('event', 'tool_used', { tool_name: 'mortgage_calculator', language: 'ja' });
}

btnCalc.addEventListener('click', calculate);

btnCopy.addEventListener('click', function() {
  var text = '\\u6708\\u3005\\u306E\\u8FD4\\u6E08\\u984D: ' + resultMonthly.textContent + '\\n' + resultTotal.textContent + '\\n' + resultInterest.textContent;
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
  <title>Japan Mortgage Calculator: Monthly Payment &amp; Total Cost | JapanCalc</title>
  <meta name="description" content="Calculate monthly mortgage payments and total cost for Japan home loans. Enter loan amount, interest rate, and term. Compare preset rates. Free, 2026 rates.">
  <link rel="canonical" href="https://japancalc.com/en/tax-finance/mortgage-calculator/">
  <link rel="alternate" hreflang="en"        href="https://japancalc.com/en/tax-finance/mortgage-calculator/">
  <link rel="alternate" hreflang="ja"        href="https://japancalc.com/tax-finance/mortgage-calculator/">
  <link rel="alternate" hreflang="x-default" href="https://japancalc.com/tax-finance/mortgage-calculator/">
  <meta property="og:title"       content="Japan Mortgage Calculator | JapanCalc">
  <meta property="og:description" content="Calculate monthly payments and total cost for Japan home loans.">
  <meta property="og:url"         content="https://japancalc.com/en/tax-finance/mortgage-calculator/">
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
    "name": "Japan Mortgage Calculator | JapanCalc",
    "url": "https://japancalc.com/en/tax-finance/mortgage-calculator/",
    "description": "Calculate monthly mortgage payments and total cost for Japan home loans. Compare preset interest rates.",
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
      { "@type": "ListItem", "position": 3, "name": "Mortgage Calculator", "item": "https://japancalc.com/en/tax-finance/mortgage-calculator/" }
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
        "name": "What is the difference between equal principal+interest and equal principal repayment?",
        "acceptedAnswer": { "@type": "Answer", "text": "Equal principal+interest (ganri kinto) keeps your monthly payment constant throughout the loan. Equal principal (gankin kinto) keeps the principal portion constant, so total monthly payments decrease over time as interest shrinks. This tool calculates using the equal principal+interest method." }
      },
      {
        "@type": "Question",
        "name": "What is the monthly payment for a 30 million yen loan over 35 years?",
        "acceptedAnswer": { "@type": "Answer", "text": "At 1.5% interest with equal principal+interest repayment, the monthly payment is approximately 91,855 yen. The total repayment is about 38,579,007 yen, with roughly 8,579,007 yen in interest." }
      },
      {
        "@type": "Question",
        "name": "Which is better: variable or fixed interest rate?",
        "acceptedAnswer": { "@type": "Answer", "text": "Variable rates start lower but carry the risk of future rate increases. Fixed rates are higher initially but provide payment stability. Neither is universally better \\u2014 it depends on your financial plan and risk tolerance." }
      },
      {
        "@type": "Question",
        "name": "What is the Japan housing loan tax deduction (jutaku loan koujo)?",
        "acceptedAnswer": { "@type": "Answer", "text": "The housing loan tax deduction allows you to deduct 0.7% of your year-end loan balance from your income tax for up to 13 years. This can significantly reduce your tax burden during the early years of your mortgage." }
      },
      {
        "@type": "Question",
        "name": "What is the benefit of making extra repayments (kuriage hensai)?",
        "acceptedAnswer": { "@type": "Answer", "text": "Extra repayments reduce your principal, which significantly lowers total interest paid. The earlier you make them, the greater the savings. There are two types: term-shortening and payment-reduction." }
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
      <nav class="lang-switcher" aria-label="Language"><a href="/tax-finance/mortgage-calculator/" aria-label="\u65E5\u672C\u8A9E\u306B\u5207\u66FF">JP</a><span aria-hidden="true">&middot;</span><span aria-current="true">English</span></nav>
      <button class="nav-toggle" aria-expanded="false" aria-label="Open menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg></button>
    </div>
  </div>
  <div class="nav-links"><a href="/en/">Home</a><a href="/en/date-calendar/">Date &amp; Calendar</a><a href="/en/tax-finance/">Tax &amp; Finance</a><a href="/en/language-tools/">Language Tools</a></div>
</nav>

<nav class="breadcrumb" aria-label="Breadcrumb">
  <ol><li><a href="/en/">Home</a></li><li aria-hidden="true">&rsaquo;</li><li><a href="/en/tax-finance/">Tax &amp; Finance</a></li><li aria-hidden="true">&rsaquo;</li><li>Mortgage Calculator</li></ol>
</nav>

<main id="main-content">
  <div class="container tool-container">
    <h1>Japan Mortgage Calculator &mdash; Monthly Payment &amp; Total Cost</h1>
    <p class="tool-intro">Enter loan amount, interest rate, and term to calculate your monthly payment and total cost. Uses the equal principal+interest (ganri kinto) repayment method.</p>

    <div class="ad-zone" style="min-height:100px; margin:1rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_ATF_MORTGAGE_EN" data-ad-format="horizontal" data-full-width-responsive="true"></ins>
    </div>

    <div class="form-group">
      <label class="form-label" for="principal">Loan Amount</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="principal" min="1" placeholder="3000" step="100">
        <span class="input-suffix">\u4E07\u5186</span>
      </div>
      <div style="font-size:0.78rem; color:var(--color-text-muted); margin-top:0.2rem;">1\u4E07 = 10,000 yen. Enter 3000 for 30 million yen.</div>
    </div>

    <div class="form-group">
      <label class="form-label" for="rate">Interest Rate (annual)</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="rate" min="0.01" max="20" step="0.01" placeholder="1.5">
        <span class="input-suffix">%</span>
      </div>
      <div class="preset-btns" id="rate-presets">
        <button class="preset-btn" data-val="0.3">0.3%</button>
        <button class="preset-btn" data-val="0.5">0.5%</button>
        <button class="preset-btn" data-val="1.5">1.5%</button>
        <button class="preset-btn" data-val="1.96">1.96%</button>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label" for="years">Loan Term</label>
      <div class="input-suffix-wrap">
        <input class="form-input input-with-suffix" type="number" id="years" min="1" max="50" step="1" placeholder="35">
        <span class="input-suffix">yrs</span>
      </div>
      <div class="preset-btns" id="year-presets">
        <button class="preset-btn" data-val="20">20 yrs</button>
        <button class="preset-btn" data-val="25">25 yrs</button>
        <button class="preset-btn" data-val="30">30 yrs</button>
        <button class="preset-btn" data-val="35">35 yrs</button>
      </div>
    </div>

    <button class="btn-calc" id="btn-calc">Calculate</button>

    <div id="result-box" class="result-box">
      <div class="result-main">
        <div class="result-label">Monthly Payment</div>
        <div class="result-value" id="result-monthly">--</div>
      </div>
      <div class="result-detail" id="result-total"></div>
      <div class="result-detail" id="result-interest"></div>

      <div class="ratio-bar-wrap" id="ratio-bar-wrap">
        <div class="ratio-bar-label">
          <span id="ratio-label-principal">Principal: --</span>
          <span id="ratio-label-interest">Interest: --</span>
        </div>
        <div class="ratio-bar">
          <div class="ratio-bar-principal" id="ratio-bar-principal" style="width:0%"></div>
          <div class="ratio-bar-interest" id="ratio-bar-interest" style="width:0%"></div>
        </div>
      </div>

      <div class="action-btns">
        <button class="btn-copy-result" id="btn-copy">Copy Result</button>
      </div>

      <details class="schedule-toggle" id="schedule-toggle">
        <summary>Show Repayment Schedule</summary>
        <div id="schedule-body"></div>
      </details>
    </div>

    <div class="disclaimer">\u203B Actual repayment amounts may vary by financial institution. Please consult your bank or lender for exact figures.</div>

    <div class="ad-zone ad-btf" data-lazy-ad="true" style="min-height:250px; margin:2rem 0;">
      <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="SLOT_BTF_MORTGAGE_EN" data-ad-format="auto" data-full-width-responsive="true"></ins>
    </div>

    <section class="faq-section" aria-label="FAQ">
      <h2>Frequently Asked Questions</h2>
      <details class="faq-item"><summary>What is the difference between equal principal+interest and equal principal repayment?</summary><p>Equal principal+interest (ganri kinto) keeps your monthly payment constant throughout the loan. Equal principal (gankin kinto) keeps the principal portion constant, so total monthly payments decrease over time as interest shrinks. This tool calculates using the equal principal+interest method.</p></details>
      <details class="faq-item"><summary>What is the monthly payment for a 30 million yen loan over 35 years?</summary><p>At 1.5% interest with equal principal+interest repayment, the monthly payment is approximately 91,855 yen. The total repayment is about 38,579,007 yen, with roughly 8,579,007 yen in interest.</p></details>
      <details class="faq-item"><summary>Which is better: variable or fixed interest rate?</summary><p>Variable rates start lower but carry the risk of future rate increases. Fixed rates are higher initially but provide payment stability. Neither is universally better \u2014 it depends on your financial plan and risk tolerance.</p></details>
      <details class="faq-item"><summary>What is the Japan housing loan tax deduction?</summary><p>The housing loan tax deduction (jutaku loan koujo) allows you to deduct 0.7% of your year-end loan balance from your income tax for up to 13 years. This can significantly reduce your tax burden during the early years of your mortgage.</p></details>
      <details class="faq-item"><summary>What is the benefit of making extra repayments?</summary><p>Extra repayments (kuriage hensai) reduce your principal, which significantly lowers total interest paid. The earlier you make them, the greater the savings. There are two types: term-shortening and payment-reduction.</p></details>
    </section>

    <article class="seo-content">
      <h2>How to Use the Japan Mortgage Calculator</h2>
      <p>Enter your loan amount in units of 10,000 yen (man-en), the annual interest rate, and the repayment period in years. Click "Calculate" to see your monthly payment, total repayment, and total interest. Use the preset buttons for common interest rates and loan terms in Japan.</p>
      <h2>Understanding the Repayment Schedule</h2>
      <p>Click "Show Repayment Schedule" below the results to see a year-by-year breakdown of principal, interest, and remaining balance. This helps you understand how much of each payment goes toward the principal versus interest over the life of your loan.</p>
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
import { calcMortgageEqual, PRESET_RATES } from '/assets/js/mortgage.js';

var principalInput = document.getElementById('principal');
var rateInput      = document.getElementById('rate');
var yearsInput     = document.getElementById('years');
var btnCalc        = document.getElementById('btn-calc');
var resultBox      = document.getElementById('result-box');
var resultMonthly  = document.getElementById('result-monthly');
var resultTotal    = document.getElementById('result-total');
var resultInterest = document.getElementById('result-interest');
var ratioBarPrincipal = document.getElementById('ratio-bar-principal');
var ratioBarInterest  = document.getElementById('ratio-bar-interest');
var ratioLabelPrincipal = document.getElementById('ratio-label-principal');
var ratioLabelInterest  = document.getElementById('ratio-label-interest');
var scheduleBody   = document.getElementById('schedule-body');
var btnCopy        = document.getElementById('btn-copy');

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
  var principalMan = parseFloat(principalInput.value);
  var annualRate   = parseFloat(rateInput.value);
  var years        = parseInt(yearsInput.value);

  if (!principalMan || principalMan <= 0 || isNaN(annualRate) || annualRate < 0 || !years || years <= 0) {
    resultMonthly.textContent = 'Please check your input values';
    resultTotal.textContent = '';
    resultInterest.textContent = '';
    scheduleBody.innerHTML = '';
    resultBox.classList.add('visible');
    return;
  }

  var principal = principalMan * 10000;
  var result = calcMortgageEqual(principal, annualRate, years);

  resultMonthly.textContent = '\\u00A5' + result.monthlyPayment.toLocaleString('ja-JP');
  resultTotal.textContent = 'Total Repayment: \\u00A5' + result.totalPayment.toLocaleString('ja-JP');
  resultInterest.textContent = 'Total Interest: \\u00A5' + result.totalInterest.toLocaleString('ja-JP');

  // Ratio bar
  var principalPct = (principal / result.totalPayment * 100).toFixed(1);
  var interestPct  = (100 - principalPct).toFixed(1);
  ratioBarPrincipal.style.width = principalPct + '%';
  ratioBarInterest.style.width  = interestPct + '%';
  ratioLabelPrincipal.textContent = 'Principal: ' + principalPct + '%';
  ratioLabelInterest.textContent  = 'Interest: ' + interestPct + '%';

  // Schedule table (yearly)
  var monthlyRate = annualRate / 100 / 12;
  var totalMonths = years * 12;
  var monthly = result.monthlyPayment;
  var balance = principal;
  var html = '<table class="schedule-table"><thead><tr><th>Year</th><th>Yearly Principal</th><th>Yearly Interest</th><th>Remaining Balance</th></tr></thead><tbody>';

  for (var y = 1; y <= years; y++) {
    var yearPrincipal = 0;
    var yearInterest = 0;
    for (var m = 0; m < 12; m++) {
      if (balance <= 0) break;
      var interestPayment = balance * monthlyRate;
      var principalPayment = monthly - interestPayment;
      if (principalPayment > balance) principalPayment = balance;
      yearPrincipal += principalPayment;
      yearInterest += interestPayment;
      balance -= principalPayment;
    }
    if (balance < 0) balance = 0;
    html += '<tr><td>Year ' + y + '</td><td>\\u00A5' + Math.round(yearPrincipal).toLocaleString('ja-JP') + '</td><td>\\u00A5' + Math.round(yearInterest).toLocaleString('ja-JP') + '</td><td>\\u00A5' + Math.round(balance).toLocaleString('ja-JP') + '</td></tr>';
  }
  html += '</tbody></table>';
  scheduleBody.innerHTML = html;

  resultBox.classList.add('visible');
  if (typeof gtag !== 'undefined') gtag('event', 'tool_used', { tool_name: 'mortgage_calculator', language: 'en' });
}

btnCalc.addEventListener('click', calculate);

btnCopy.addEventListener('click', function() {
  var text = 'Monthly Payment: ' + resultMonthly.textContent + '\\n' + resultTotal.textContent + '\\n' + resultInterest.textContent;
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
const jpDir = path.join(distRoot, 'tax-finance', 'mortgage-calculator');
const enDir = path.join(distRoot, 'en', 'tax-finance', 'mortgage-calculator');

fs.mkdirSync(jpDir, { recursive: true });
fs.mkdirSync(enDir, { recursive: true });

fs.writeFileSync(path.join(jpDir, 'index.html'), generateJP(), 'utf8');
console.log('  JP: /tax-finance/mortgage-calculator/');

fs.writeFileSync(path.join(enDir, 'index.html'), generateEN(), 'utf8');
console.log('  EN: /en/tax-finance/mortgage-calculator/');

console.log('Done! Created 2 mortgage calculator pages.');
