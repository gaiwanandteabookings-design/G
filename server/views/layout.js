const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='10' fill='%230c1b2e'/%3E%3Cpath d='M24 8v32M24 8l-5.5 4M24 8l5.5 4M24 40l-5.5-4M24 40l5.5-4M8 24h32M8 24l4-5.5M8 24l4 5.5M40 24l-4-5.5M40 24l-4 5.5M13 13l22 22M13 13l1 7M13 13l7 1M35 35l-1-7M35 35l-7 1M13 35l22-22M13 35l7 1M13 35l-1-7M35 13l1 7M35 13l-7-1' stroke='%2335d0e0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const SITE_NAME = 'ProFix305';
const SITE_URL = 'https://www.profix305.com';
const PHONE_DISPLAY = '(786) 919-7675';
const PHONE_TEL = '+17869197675';
const EMAIL = 'profix305@gmail.com';
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || '';

function analytics() {
  if (!GA_MEASUREMENT_ID) return '';
  return `
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}');
</script>`;
}

function header() {
  return `
<div class="topbar">
  <p><strong>24/7 Emergency Dispatch</strong> — Equipment down right now? <a href="tel:${PHONE_TEL}">Call ${PHONE_DISPLAY}</a></p>
</div>

<header class="site-header" id="top">
  <div class="container header-inner">
    <a href="/" class="brand">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 4v40M24 4l-7 5M24 4l7 5M24 44l-7-5M24 44l7-5M4 24h40M4 24l5-7M4 24l5 7M44 24l-5-7M44 24l-5 7M9.5 9.5l29 29M9.5 9.5l1 9M9.5 9.5l9 1M38.5 38.5l-1-9M38.5 38.5l-9 1M9.5 38.5l29-29M9.5 38.5l9-1M9.5 38.5l-1-9M38.5 9.5l1 9M38.5 9.5l-9-1" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="brand-text">ProFix<em>305</em></span>
    </a>

    <nav class="main-nav" id="main-nav" aria-label="Primary">
      <a href="/#services">Services</a>
      <a href="/#why-us">Why Us</a>
      <a href="/#process">How It Works</a>
      <a href="/#service-area">Service Area</a>
      <a href="/#reviews">Reviews</a>
      <a href="/#faq">FAQ</a>
      <a href="/#contact">Contact</a>
      <a href="/admin.html" class="nav-login">Staff Login</a>
    </nav>

    <div class="header-actions">
      <a class="phone-link" href="tel:${PHONE_TEL}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.5c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" fill="currentColor"/></svg>
        <span>${PHONE_DISPLAY}</span>
      </a>
      <a class="btn btn-primary" href="/#booking">Book a Repair</a>
    </div>

    <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>`;
}

function footer() {
  return `
<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <span class="brand-text">ProFix<em>305</em></span>
      <p>Commercial refrigeration, HVAC, and kitchen equipment repair for South Florida — Miami to Palm Beach.</p>
    </div>

    <div class="footer-col">
      <h4>Company</h4>
      <a href="/#services">Services</a>
      <a href="/#why-us">Why Us</a>
      <a href="/#process">How It Works</a>
      <a href="/#reviews">Reviews</a>
      <a href="/#faq">FAQ</a>
    </div>

    <div class="footer-col">
      <h4>Service Area</h4>
      <span>Miami-Dade County</span>
      <span>Broward County</span>
      <span>Palm Beach County</span>
    </div>

    <div class="footer-col">
      <h4>Contact</h4>
      <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>
      <a href="mailto:${EMAIL}">${EMAIL}</a>
      <span>24/7 Emergency Dispatch</span>
    </div>
  </div>

  <div class="footer-bottom container">
    <p>&copy; <span id="year"></span> ProFix305. All rights reserved. &middot;
    <a href="/privacy-policy/">Privacy Policy</a> &middot;
    <a href="/terms-of-service/">Terms of Service</a> &middot;
    <a href="/admin.html">Staff Login</a></p>
  </div>
</footer>

<a href="tel:${PHONE_TEL}" class="mobile-call-fab" aria-label="Call ProFix305 now">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.5c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" fill="currentColor"/></svg>
</a>`;
}

function renderLayout({ title, description, keywords, canonical, ogTitle, ogDescription, jsonLd, extraHead, bodyHtml }) {
  const canonicalUrl = `${SITE_URL}${canonical}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
${keywords ? `<meta name="keywords" content="${keywords}" />\n` : ''}<link rel="canonical" href="${canonicalUrl}" />

<meta property="og:type" content="website" />
<meta property="og:title" content="${ogTitle || title}" />
<meta property="og:description" content="${ogDescription || description}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:image" content="${SITE_URL}/images/og-cover.jpg" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${ogTitle || title}" />
<meta name="twitter:description" content="${ogDescription || description}" />
<meta name="twitter:image" content="${SITE_URL}/images/og-cover.jpg" />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/css/styles.css" />
<link rel="icon" href="${FAVICON}" />
${jsonLd ? `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>\n` : ''}${extraHead || ''}${analytics()}
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>

${header()}

<main id="main">
${bodyHtml}
</main>

${footer()}

<script src="/js/main.js"></script>
</body>
</html>
`;
}

module.exports = { renderLayout, SITE_NAME, SITE_URL, PHONE_DISPLAY, PHONE_TEL, EMAIL };
