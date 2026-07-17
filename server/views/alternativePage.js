const { PHONE_TEL, PHONE_DISPLAY, SITE_URL } = require('./layout');
const { renderServiceIcon } = require('./icons');
const { services } = require('../content/services');
const { breadcrumbSchema } = require('./schema');

function buildAlternativePage() {
  const serviceCards = services
    .map(
      (s) => `
        <article class="card service-card">
          <div class="card-icon">${renderServiceIcon(s.slug)}</div>
          <h3>${s.cardTitle}</h3>
          <p>${s.cardBlurb}</p>
          <a class="card-link" href="/miami/${s.slug}/">Learn more →</a>
        </article>`
    )
    .join('');

  const bodyHtml = `
  <nav class="breadcrumb container" aria-label="Breadcrumb">
    <a href="/">Home</a> <span>/</span> <span aria-current="page">BARO Service Alternative</span>
  </nav>

  <section class="service-hero">
    <div class="container">
      <p class="eyebrow">Comparing Options &bull; Miami-Dade &bull; Broward &bull; Palm Beach</p>
      <h1>Looking for a BARO Service Alternative in Miami?</h1>
      <p class="hero-sub">If you're comparing commercial refrigeration, HVAC, or kitchen equipment repair companies in Miami, here's what ProFix305 offers. ProFix305 is an independent, locally-dispatched repair company and is not affiliated with BARO Service.</p>
      <div class="hero-cta">
        <a href="/#booking" class="btn btn-primary btn-lg">Book a Repair</a>
        <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg">Call ${PHONE_DISPLAY}</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">What We Cover</p>
        <h2>Full-Service Commercial Equipment Repair</h2>
        <p class="section-sub">One call covers refrigeration, HVAC, ice machines, kitchen equipment, mixers, and exhaust hoods — so you're not juggling multiple vendors for different equipment types.</p>
      </div>
      <div class="grid services-grid">${serviceCards}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Why Businesses Choose Us</p>
        <h2>Built for Businesses That Can't Afford Downtime</h2>
      </div>
      <div class="grid why-grid">
        <div class="why-item">
          <span class="why-number">01</span>
          <h3>Rapid Response</h3>
          <p>Dispatch coordinated across Miami-Dade, Broward, and Palm Beach so a technician can typically reach you the same day you call.</p>
        </div>
        <div class="why-item">
          <span class="why-number">02</span>
          <h3>Insured &amp; Background-Checked</h3>
          <p>Every technician is background-checked and insured — your property and your health inspection are protected.</p>
        </div>
        <div class="why-item">
          <span class="why-number">03</span>
          <h3>Upfront Pricing</h3>
          <p>You approve a flat-rate quote before any repair begins. No surprise line items on the invoice.</p>
        </div>
        <div class="why-item">
          <span class="why-number">04</span>
          <h3>Workmanship Warranty</h3>
          <p>Every repair is backed by a written warranty on parts and labor, so a repeat failure doesn't cost you twice.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="section cta-band">
    <div class="container cta-band-inner">
      <h2>Get a Second Quote Before You Decide</h2>
      <p>Call now for emergency dispatch, or book online and we'll confirm your appointment shortly.</p>
      <div class="hero-cta">
        <a href="tel:${PHONE_TEL}" class="btn btn-primary btn-lg">Call ${PHONE_DISPLAY}</a>
        <a href="/#booking" class="btn btn-outline btn-lg">Book Online</a>
      </div>
    </div>
  </section>
`;

  const title = 'BARO Service Alternative in Miami — Commercial Equipment Repair | ProFix305';
  const description = 'Comparing commercial equipment repair companies in Miami? ProFix305 covers refrigeration, HVAC, ice machines, kitchen equipment, mixers, and exhaust hoods with insured techs and same-day dispatch.';

  return {
    title,
    description,
    canonical: '/alternative-to-baro-service/',
    ogTitle: title,
    ogDescription: description,
    jsonLd: breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'BARO Service Alternative' }]),
    bodyHtml,
  };
}

module.exports = { buildAlternativePage };
