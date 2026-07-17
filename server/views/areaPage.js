const { PHONE_TEL, PHONE_DISPLAY, SITE_URL } = require('./layout');
const { renderServiceIcon } = require('./icons');
const { services } = require('../content/services');
const { faqPageSchema, breadcrumbSchema } = require('./schema');

function buildAreaPage(area) {
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

  const neighborsList = area.neighbors.join(', ');

  const faqs = [
    {
      q: `Do you offer same-day repair in ${area.name}?`,
      a: `In most cases, yes — technicians dispatch across ${area.county} daily, with emergency breakdowns in ${area.name} prioritized first.`,
    },
    {
      q: `What commercial equipment do you repair in ${area.name}?`,
      a: `Refrigeration (walk-in coolers & freezers, reach-ins, display cases), HVAC/AC, ice machines, kitchen equipment, commercial mixers, and exhaust hoods — across restaurants, grocers, hotels, and facilities in ${area.name} and nearby ${neighborsList}.`,
    },
    {
      q: `Is there an emergency dispatch line for ${area.name}?`,
      a: `Yes — our emergency line is answered 24/7. For an active breakdown in ${area.name}, calling gets you the fastest response.`,
    },
  ];

  const faqHtml = faqs
    .map(
      (f) => `
        <div class="faq-item">
          <button class="faq-question" aria-expanded="false">
            ${f.q}
            <span class="faq-icon" aria-hidden="true"></span>
          </button>
          <div class="faq-answer"><p>${f.a}</p></div>
        </div>`
    )
    .join('');

  const bodyHtml = `
  <nav class="breadcrumb container" aria-label="Breadcrumb">
    <a href="/">Home</a> <span>/</span> <a href="/#service-area">Service Area</a> <span>/</span> <span aria-current="page">${area.name}</span>
  </nav>

  <section class="service-hero">
    <div class="container">
      <p class="eyebrow">${area.county} &bull; South Florida</p>
      <h1>Commercial Equipment Repair in ${area.name}, FL</h1>
      <p class="hero-sub">ProFix305 dispatches insured technicians to ${area.name} and the surrounding ${area.county} area — including ${neighborsList} — for refrigeration, HVAC, ice machine, kitchen equipment, mixer, and exhaust hood repair. Most calls are handled same day.</p>
      <div class="hero-cta">
        <a href="/#booking" class="btn btn-primary btn-lg">Book a Repair</a>
        <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg">Call ${PHONE_DISPLAY}</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">What We Fix in ${area.name}</p>
        <h2>Full-Service Commercial Equipment Repair</h2>
      </div>
      <div class="grid services-grid">${serviceCards}</div>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">FAQ</p>
        <h2>${area.name} Service Questions</h2>
      </div>
      <div class="faq-list">${faqHtml}</div>
    </div>
  </section>

  <section class="section cta-band">
    <div class="container cta-band-inner">
      <h2>Equipment Down in ${area.name}?</h2>
      <p>Call now for emergency dispatch, or book online and we'll confirm your appointment shortly.</p>
      <div class="hero-cta">
        <a href="tel:${PHONE_TEL}" class="btn btn-primary btn-lg">Call ${PHONE_DISPLAY}</a>
        <a href="/#booking" class="btn btn-outline btn-lg">Book Online</a>
      </div>
    </div>
  </section>
`;

  const title = `Commercial Equipment Repair in ${area.name}, FL | Refrigeration, HVAC & Kitchen Equipment | ProFix305`;
  const description = `24/7 commercial equipment repair in ${area.name} (${area.county}) — refrigeration, HVAC/AC, ice machines, kitchen equipment, mixers, and exhaust hoods. Insured technicians, same-day dispatch.`;

  return {
    title,
    description,
    canonical: `/areas/${area.slug}/`,
    ogTitle: title,
    ogDescription: description,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'ProFix305',
        telephone: PHONE_TEL,
        areaServed: { '@type': 'City', name: area.name },
        url: `${SITE_URL}/areas/${area.slug}/`,
      },
      faqPageSchema(faqs),
      breadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Service Area', path: '/#service-area' },
        { name: area.name },
      ]),
    ],
    bodyHtml,
  };
}

module.exports = { buildAreaPage };
