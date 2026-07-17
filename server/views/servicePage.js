const { PHONE_TEL, PHONE_DISPLAY, SITE_URL } = require('./layout');
const { services } = require('../content/services');

function buildServicePage(service) {
  const otherServices = services.filter((s) => s.slug !== service.slug);

  const bulletsHtml = service.bullets.map((b) => `<li>${b}</li>`).join('');

  const faqHtml = service.faqs
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

  const relatedHtml = otherServices
    .map((s) => `<a href="/miami/${s.slug}/">${s.cardTitle}</a>`)
    .join('');

  const bodyHtml = `
  <nav class="breadcrumb container" aria-label="Breadcrumb">
    <a href="/">Home</a> <span>/</span> <a href="/#services">Services</a> <span>/</span> <span aria-current="page">${service.serviceName}</span>
  </nav>

  <section class="service-hero">
    <div class="container">
      <p class="eyebrow">${service.heroEyebrow} &bull; Miami-Dade &bull; Broward &bull; Palm Beach</p>
      <h1>${service.heroHeadline}</h1>
      <p class="hero-sub">${service.heroSub}</p>
      <div class="hero-cta">
        <a href="/#booking" class="btn btn-primary btn-lg">Book a Repair</a>
        <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg">Call ${PHONE_DISPLAY}</a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head align-left">
        <p class="eyebrow">What We Repair</p>
        <h2>${service.serviceName} Services</h2>
      </div>
      <ul class="bullet-grid">${bulletsHtml}</ul>
    </div>
  </section>

  <section class="section section-alt">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">FAQ</p>
        <h2>${service.serviceName} Questions</h2>
      </div>
      <div class="faq-list">${faqHtml}</div>
    </div>
  </section>

  <section class="section cta-band">
    <div class="container cta-band-inner">
      <h2>Need ${service.serviceName} in South Florida?</h2>
      <p>Call now for emergency dispatch, or book online and we'll confirm your appointment shortly.</p>
      <div class="hero-cta">
        <a href="tel:${PHONE_TEL}" class="btn btn-primary btn-lg">Call ${PHONE_DISPLAY}</a>
        <a href="/#booking" class="btn btn-outline btn-lg">Book Online</a>
      </div>
    </div>
  </section>

  <section class="section related-services">
    <div class="container">
      <p class="eyebrow" style="text-align:center;">Also Servicing</p>
      <div class="related-links">${relatedHtml}</div>
    </div>
  </section>
`;

  return {
    title: service.pageTitle,
    description: service.metaDescription,
    keywords: service.keywords,
    canonical: `/miami/${service.slug}/`,
    ogTitle: service.pageTitle,
    ogDescription: service.metaDescription,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: service.serviceName,
      name: `${service.serviceName} | ProFix305`,
      areaServed: [
        { '@type': 'City', name: 'Miami' },
        { '@type': 'City', name: 'Fort Lauderdale' },
        { '@type': 'City', name: 'West Palm Beach' },
      ],
      provider: {
        '@type': 'LocalBusiness',
        name: 'ProFix305',
        telephone: PHONE_TEL,
        url: `${SITE_URL}/`,
      },
      url: `${SITE_URL}/miami/${service.slug}/`,
    },
    bodyHtml,
  };
}

module.exports = { buildServicePage };
