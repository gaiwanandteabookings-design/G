const { PHONE_TEL, PHONE_DISPLAY, SITE_URL } = require('./layout');
const { renderServiceIcon } = require('./icons');
const { breadcrumbSchema } = require('./schema');

function buildPricingPage(service, priceData) {
  const itemRows = priceData.items
    .map(
      (i) => `
        <tr>
          <td>${i.label}</td>
          <td class="price-cell">${i.range}</td>
        </tr>`
    )
    .join('');

  const factorsHtml = priceData.factors.map((f) => `<li>${f}</li>`).join('');

  const bodyHtml = `
  <nav class="breadcrumb container" aria-label="Breadcrumb">
    <a href="/">Home</a> <span>/</span> <a href="/miami/${service.slug}/">${service.serviceName}</a> <span>/</span> <span aria-current="page">Pricing</span>
  </nav>

  <section class="service-hero">
    <div class="container">
      <div class="service-hero-icon">${renderServiceIcon(service.slug, 34)}</div>
      <p class="eyebrow">Pricing Guide &bull; Miami-Dade &bull; Broward &bull; Palm Beach</p>
      <h1>How Much Does ${service.serviceName} Cost in Miami?</h1>
      <p class="hero-sub">General price ranges below reflect typical South Florida commercial repair rates. Every job still gets a firm, flat-rate quote after an on-site diagnosis — before any work begins.</p>
      <div class="hero-cta">
        <a href="/#booking" class="btn btn-primary btn-lg">Book a Repair</a>
        <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg">Call ${PHONE_DISPLAY}</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head align-left">
        <p class="eyebrow">Typical Costs</p>
        <h2>${service.serviceName} Price Ranges</h2>
        <p class="section-sub">Diagnostic / service call fee: <strong>${priceData.serviceCallFee}</strong> (applied toward the repair if you move forward)</p>
      </div>
      <table class="pricing-table">
        <thead><tr><th>Common Repair</th><th>Typical Range</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p class="pricing-disclaimer">These are general estimates for planning purposes, not a quote — the exact price depends on your equipment, parts availability, and the root cause. We always confirm a flat-rate price with you before starting any work.</p>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="section-head align-left">
        <p class="eyebrow">What Affects the Price</p>
        <h2>Factors That Change the Cost</h2>
      </div>
      <ul class="bullet-grid">${factorsHtml}</ul>
    </div>
  </section>

  <section class="section cta-band">
    <div class="container cta-band-inner">
      <h2>Want an Exact Price for Your Equipment?</h2>
      <p>Call now for emergency dispatch, or book online and we'll confirm a diagnostic appointment shortly.</p>
      <div class="hero-cta">
        <a href="tel:${PHONE_TEL}" class="btn btn-primary btn-lg">Call ${PHONE_DISPLAY}</a>
        <a href="/#booking" class="btn btn-outline btn-lg">Book Online</a>
      </div>
    </div>
  </section>
`;

  const title = `How Much Does ${service.serviceName} Cost in Miami? (Pricing Guide) | ProFix305`;
  const description = `Typical price ranges for ${service.serviceName.toLowerCase()} in Miami-Dade, Broward, and Palm Beach — diagnostic fees, common repair costs, and what affects the price.`;

  return {
    title,
    description,
    canonical: `/pricing/${service.slug}/`,
    ogTitle: title,
    ogDescription: description,
    jsonLd: breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: service.serviceName, path: `/miami/${service.slug}/` },
      { name: 'Pricing' },
    ]),
    bodyHtml,
  };
}

module.exports = { buildPricingPage };
