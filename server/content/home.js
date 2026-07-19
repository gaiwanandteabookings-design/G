const { PHONE_TEL, PHONE_DISPLAY, EMAIL, SITE_URL } = require('../views/layout');
const { renderServiceIcon } = require('../views/icons');
const { services } = require('./services');
const { areas } = require('./areas');
const { equipmentCategories } = require('./equipment');
const { faqPageSchema } = require('../views/schema');

const countyGroups = [
  { county: 'Miami-Dade', slugs: ['miami', 'hialeah', 'doral', 'coral-gables', 'homestead', 'kendall'] },
  { county: 'Broward', slugs: ['fort-lauderdale', 'hollywood', 'pompano-beach', 'davie', 'sunrise'] },
  { county: 'Palm Beach', slugs: ['west-palm-beach', 'boca-raton', 'delray-beach', 'boynton-beach', 'jupiter'] },
];
const areaByslug = Object.fromEntries(areas.map((a) => [a.slug, a]));
const areaCardsHtml = countyGroups
  .map(
    (group) => `
        <div class="area-card">
          <h3>${group.county}</h3>
          <p>${group.slugs.map((slug) => `<a href="/areas/${slug}/">${areaByslug[slug].name}</a>`).join(' &bull; ')}</p>
        </div>`
  )
  .join('');

const faqs = [
  {
    q: 'How fast can a technician reach my location?',
    a: 'Most calls across Miami-Dade, Broward, and Palm Beach are dispatched the same day, with emergency breakdowns prioritized first.',
  },
  {
    q: 'Do you offer 24/7 emergency service?',
    a: 'Yes. Our emergency line is answered around the clock, seven days a week, because down equipment doesn’t wait for business hours.',
  },
  {
    q: 'What does a service call cost?',
    a: 'We provide a flat-rate quote after diagnosis, before any repair begins, so you always know the cost up front.',
  },
  {
    q: 'What types of commercial equipment do you service?',
    a: 'Refrigeration, HVAC/AC, ice machines, mixers, exhaust hoods, and kitchen equipment across all major brands — including custom-built units.',
  },
  {
    q: 'Can you set up a maintenance plan to prevent breakdowns?',
    a: 'Absolutely — scheduled maintenance plans across all your equipment are one of the most effective ways to avoid emergency downtime and extend equipment life.',
  },
  {
    q: 'What areas do you serve?',
    a: 'We cover the full South Florida corridor from Miami-Dade through Broward to Palm Beach County.',
  },
];

const meta = {
  title: 'Commercial Equipment Repair | Refrigeration, HVAC & Kitchen Equipment | Miami to Palm Beach | ProFix305',
  description: 'ProFix305 provides 24/7 commercial equipment repair — refrigeration, walk-in coolers & freezers, HVAC/AC, ice machines, mixers, exhaust hoods, and kitchen equipment — for restaurants, grocers, and facilities across Miami-Dade, Broward, and Palm Beach County. Insured technicians, same-day dispatch.',
  keywords: 'commercial equipment repair Miami, commercial refrigeration repair South Florida, walk-in cooler repair, commercial HVAC repair Miami, ice machine repair, commercial kitchen equipment repair, commercial mixer repair, exhaust hood repair, emergency repair Palm Beach',
  canonical: '/',
  ogTitle: 'Commercial Equipment Repair | ProFix305',
  ogDescription: '24/7 emergency repair for commercial refrigeration, HVAC, ice machines, and kitchen equipment across Miami, Fort Lauderdale, and Palm Beach. Insured, background-checked technicians, same-day service.',
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'ProFix305',
      image: `${SITE_URL}/images/og-cover.jpg`,
      logo: `${SITE_URL}/images/logo.png`,
      telephone: PHONE_TEL,
      email: EMAIL,
      priceRange: '$$',
      areaServed: [
        { '@type': 'City', name: 'Miami' },
        { '@type': 'City', name: 'Fort Lauderdale' },
        { '@type': 'City', name: 'West Palm Beach' },
        { '@type': 'City', name: 'Boca Raton' },
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Miami',
        addressRegion: 'FL',
        addressCountry: 'US',
      },
      openingHours: 'Mo-Su 00:00-23:59',
      url: `${SITE_URL}/`,
      makesOffer: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.serviceName, url: `${SITE_URL}/miami/${s.slug}/` },
      })),
    },
    faqPageSchema(faqs),
  ],
  extraHead: `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
<script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>`,
};

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

const equipmentTabsHtml = equipmentCategories
  .map(
    (cat, i) => `<button class="equipment-tab${i === 0 ? ' is-active' : ''}" data-target="${cat.slug}" role="tab" aria-selected="${i === 0}">${cat.label}</button>`
  )
  .join('');

const equipmentPanelsHtml = equipmentCategories
  .map(
    (cat, i) => `<ul class="bullet-grid equipment-panel${i === 0 ? ' is-active' : ''}" data-panel="${cat.slug}"${i === 0 ? '' : ' hidden'}>${cat.items
      .map((item) => `<li>${item}</li>`)
      .join('')}</ul>`
  )
  .join('');

const bodyHtml = `
  <!-- HERO -->
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-copy">
        <p class="eyebrow">Miami-Dade &bull; Broward &bull; Palm Beach</p>
        <h1>Commercial Equipment Repair, <span class="accent">Fast.</span></h1>
        <p class="hero-sub">Refrigeration, HVAC, ice machines, mixers, exhaust hoods, kitchen equipment — when any of it goes down, every hour costs you revenue. ProFix305 dispatches insured technicians across South Florida — often the same day — to keep restaurants, grocers, hotels, and commercial facilities running.</p>
        <div class="hero-cta">
          <a href="#booking" class="btn btn-primary btn-lg">Book a Repair</a>
          <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg">Call ${PHONE_DISPLAY}</a>
        </div>
        <ul class="trust-badges">
          <li>Insured &amp; Background-Checked</li>
          <li>24/7 Emergency Dispatch</li>
          <li>Same-Day Response</li>
          <li>15+ Years Combined Experience</li>
        </ul>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="hero-card hero-card-temp">
          <span class="label">Unit Status</span>
          <span class="value">Online</span>
          <span class="status status-ok"><i class="pulse-dot"></i>Running normal</span>
        </div>
        <div class="hero-card hero-card-eta">
          <span class="label">Next Available Tech</span>
          <span class="value">Today</span>
          <span class="status" id="local-time">South Florida</span>
        </div>
        <div class="hero-glow"></div>
      </div>
    </div>
  </section>

  <!-- SERVICES -->
  <section class="section" id="services">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">What We Fix</p>
        <h2>Full-Service Commercial Equipment Repair</h2>
        <p class="section-sub">One call covers it all — refrigeration, climate control, and the kitchen line. Our technicians work on every major brand and system type used in commercial kitchens, grocery stores, hotels, and cold-storage warehouses.</p>
      </div>

      <div class="grid services-grid">${serviceCards}
      </div>
      <p class="services-note">Also servicing: compressor &amp; refrigerant systems, digital controls &amp; calibration, preventive maintenance plans, and new equipment installation — ask when you book.</p>
    </div>
  </section>

  <!-- EQUIPMENT WE SERVICE -->
  <section class="section section-alt" id="equipment">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Equipment We Service</p>
        <h2>Every Make and Model, By Category</h2>
        <p class="section-sub">Tap a category to see the specific equipment types our technicians repair — all major commercial brands.</p>
      </div>

      <div class="equipment-tabs" role="tablist" aria-label="Equipment categories">${equipmentTabsHtml}</div>
      <div class="equipment-panels">${equipmentPanelsHtml}</div>
    </div>
  </section>

  <!-- WHY US -->
  <section class="section section-alt" id="why-us">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Why South Florida Businesses Call Us</p>
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

  <!-- HOW IT WORKS -->
  <section class="section" id="process">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">The Process</p>
        <h2>From Call to Fixed, in Four Steps</h2>
      </div>

      <ol class="process-list">
        <li>
          <span class="process-step">1</span>
          <h3>Reach Out</h3>
          <p>Book online in under two minutes or call our dispatch line and tell us what's happening.</p>
        </li>
        <li>
          <span class="process-step">2</span>
          <h3>We Dispatch</h3>
          <p>A certified technician is routed to your address, with priority given to emergency breakdowns.</p>
        </li>
        <li>
          <span class="process-step">3</span>
          <h3>Diagnose &amp; Quote</h3>
          <p>We identify the root cause and walk you through a flat-rate quote before any work starts.</p>
        </li>
        <li>
          <span class="process-step">4</span>
          <h3>Repair &amp; Protect</h3>
          <p>We complete the repair on-site and can set you up on a maintenance plan to prevent the next breakdown.</p>
        </li>
      </ol>
    </div>
  </section>

  <!-- AIRFLOW / EXHAUST FAN -->
  <section class="section fan-section" id="airflow-visual">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">HVAC &amp; Exhaust</p>
        <h2>Your Air, Always Moving</h2>
      </div>
      <div class="fan-scene" aria-hidden="true">
        <svg class="fan-illustration" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
          <rect x="16" y="16" width="208" height="208" rx="22" fill="#0c1b2e" />
          <circle cx="120" cy="120" r="88" fill="none" stroke="#35d0e0" stroke-width="6" />
          <g stroke="#35d0e0" stroke-width="3" stroke-linecap="round" opacity="0.55">
            <line x1="120" y1="34" x2="120" y2="70" />
            <line x1="120" y1="170" x2="120" y2="206" />
            <line x1="34" y1="120" x2="70" y2="120" />
            <line x1="170" y1="120" x2="206" y2="120" />
          </g>
          <g class="fan-blades">
            <defs>
              <path id="fan-blade" d="M120 120 C 104 100 104 70 120 52 C 136 62 142 94 120 120 Z" fill="#c9d6e2" />
            </defs>
            <use href="#fan-blade" transform="rotate(0 120 120)" />
            <use href="#fan-blade" transform="rotate(120 120 120)" />
            <use href="#fan-blade" transform="rotate(240 120 120)" />
            <circle cx="120" cy="120" r="15" fill="#35d0e0" />
          </g>
        </svg>
      </div>
      <p class="fan-caption">Scroll — that fan spins with you, just like the HVAC and exhaust systems we keep running across South Florida.</p>
    </div>
  </section>

  <!-- SERVICE AREA -->
  <section class="section section-alt" id="service-area">
    <div class="container service-area-inner">
      <div class="section-head align-left">
        <p class="eyebrow">Where We Work</p>
        <h2>Serving South Florida, Miami to Palm Beach</h2>
        <p class="section-sub">Our technicians cover the full tri-county corridor, so wherever your kitchen, market, hotel, or warehouse sits between Homestead and Jupiter, help isn't far away.</p>
      </div>

      <div id="service-map" data-map role="img" aria-label="Map of the ProFix305 service area across Miami-Dade, Broward, and Palm Beach counties"></div>

      <div class="grid service-area-grid">${areaCardsHtml}
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="section" id="reviews">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">Reviews</p>
        <h2>What Operators Are Saying</h2>
      </div>

      <!-- SAMPLE PLACEHOLDER REVIEWS — replace with real, verifiable customer reviews before launch. -->
      <div class="reviews-carousel" id="reviews-carousel">
        <div class="reviews-track">
          <div class="review-slide">
            <blockquote class="review-card">
              <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <p>"Our walk-in cooler failed on a Friday night rush. Tech was on-site within a couple of hours and had us back up before the weekend."</p>
              <footer>— Restaurant Manager, Miami</footer>
            </blockquote>
          </div>
          <div class="review-slide">
            <blockquote class="review-card">
              <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <p>"AC went out in the middle of a heat wave. They had a tech out same day and were upfront about pricing the whole time."</p>
              <footer>— Property Manager, Fort Lauderdale</footer>
            </blockquote>
          </div>
          <div class="review-slide">
            <blockquote class="review-card">
              <div class="stars" aria-label="5 out of 5 stars">★★★★★</div>
              <p>"We put our fridges, ice machine, and ovens all on one maintenance plan with them. Haven't had an emergency call since."</p>
              <footer>— Facilities Manager, West Palm Beach</footer>
            </blockquote>
          </div>
        </div>
        <div class="reviews-dots" role="tablist" aria-label="Reviews"></div>
      </div>
    </div>
  </section>

  <!-- BOOKING FORM -->
  <section class="section section-booking" id="booking">
    <div class="container booking-inner">
      <div class="booking-copy">
        <p class="eyebrow">Book a Repair</p>
        <h2>Tell Us What's Happening — We'll Take It From There</h2>
        <p class="section-sub">Fill out the form and our dispatch team will confirm your appointment. For an active emergency, calling gets you the fastest response.</p>
        <a class="btn btn-outline" href="tel:${PHONE_TEL}">Or call ${PHONE_DISPLAY}</a>
      </div>

      <form class="booking-form" id="booking-form" novalidate>
        <div class="form-row">
          <div class="form-field">
            <label for="name">Full Name*</label>
            <input type="text" id="name" name="name" autocomplete="name" maxlength="120" required />
          </div>
          <div class="form-field">
            <label for="phone">Phone*</label>
            <input type="tel" id="phone" name="phone" autocomplete="tel" maxlength="40" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="email">Email*</label>
            <input type="email" id="email" name="email" autocomplete="email" maxlength="160" required />
          </div>
          <div class="form-field">
            <label for="businessName">Business Name</label>
            <input type="text" id="businessName" name="businessName" autocomplete="organization" maxlength="160" />
          </div>
        </div>

        <div class="form-field">
          <label for="address">Service Address*</label>
          <input type="text" id="address" name="address" autocomplete="street-address" maxlength="240" required />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label for="equipmentType">Equipment*</label>
            <select id="equipmentType" name="equipmentType" required>
              <option value="" disabled selected>Select equipment</option>
              <option value="refrigeration">Refrigeration (Walk-In, Reach-In, Display Case)</option>
              <option value="hvac">HVAC / Air Conditioning</option>
              <option value="ice-machine">Ice Machine</option>
              <option value="kitchen-equipment">Kitchen Equipment (Range, Oven, Fryer, Dishwasher)</option>
              <option value="mixer">Commercial Mixer</option>
              <option value="exhaust-hood">Exhaust Hood</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-field">
            <label for="urgency">Urgency*</label>
            <select id="urgency" name="urgency" required>
              <option value="" disabled selected>Select urgency</option>
              <option value="emergency">Emergency — down right now</option>
              <option value="this-week">Needs attention this week</option>
              <option value="scheduled">Just scheduling maintenance</option>
            </select>
          </div>
        </div>

        <div class="form-field" id="equipment-detail-wrap" hidden>
          <label for="equipment-detail-select">Specific Equipment</label>
          <select id="equipment-detail-select"></select>
        </div>
        <div class="form-field" id="equipment-detail-other-wrap" hidden>
          <label for="equipment-detail-other">Please Specify Equipment</label>
          <input type="text" id="equipment-detail-other" placeholder="e.g. Bar Cooler" maxlength="160" />
        </div>
        <input type="hidden" id="equipmentDetail" name="equipmentDetail" />

        <div class="form-row">
          <div class="form-field">
            <label for="preferredDate">Preferred Date</label>
            <input type="date" id="preferredDate" name="preferredDate" />
          </div>
          <div class="form-field">
            <label for="preferredTime">Preferred Time</label>
            <input type="time" id="preferredTime" name="preferredTime" />
          </div>
        </div>

        <div class="form-field">
          <label for="issueDescription">Describe the Issue*</label>
          <textarea id="issueDescription" name="issueDescription" rows="4" maxlength="2000" required></textarea>
        </div>

        <div class="form-field">
          <label for="photo">Photo of the Issue (optional)</label>
          <input type="file" id="photo" accept="image/jpeg,image/png,image/webp" />
          <p class="field-hint">JPEG, PNG, or WebP — up to 5 MB. Helps our techs come prepared with the right parts.</p>
          <div class="photo-preview" id="photo-preview" hidden>
            <img id="photo-preview-img" alt="Selected photo preview" />
            <button type="button" class="btn btn-outline btn-sm" id="photo-remove-btn">Remove Photo</button>
          </div>
          <p class="form-status" id="photo-status" role="status"></p>
        </div>

        <!-- honeypot field, hidden from real users -->
        <div class="hp-field" aria-hidden="true">
          <label for="website">Leave this field empty</label>
          <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
        </div>

        <label class="consent-field">
          <input type="checkbox" id="consent" required />
          <span>I agree to the <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a> and
          <a href="/terms-of-service" target="_blank" rel="noopener">Terms of Service</a>, and consent to
          receive calls/texts about my request (msg &amp; data rates may apply).*</span>
        </label>

        <button type="submit" class="btn btn-primary btn-lg" id="booking-submit">Request Repair</button>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>

  <!-- FAQ -->
  <section class="section" id="faq">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow">FAQ</p>
        <h2>Common Questions</h2>
      </div>

      <div class="faq-list">${faqs
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
        .join('')}
      </div>
    </div>
  </section>

  <!-- FINAL CTA -->
  <section class="section cta-band" id="contact">
    <div class="container cta-band-inner">
      <h2>Equipment Down? Don't Wait for the Losses to Add Up.</h2>
      <p>Call now for emergency dispatch, or book online and we'll confirm your appointment shortly.</p>
      <div class="hero-cta">
        <a href="tel:${PHONE_TEL}" class="btn btn-primary btn-lg">Call ${PHONE_DISPLAY}</a>
        <a href="#booking" class="btn btn-outline btn-lg">Book Online</a>
      </div>
    </div>
  </section>
`;

module.exports = { meta, bodyHtml };
