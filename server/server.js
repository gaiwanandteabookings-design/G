require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const path = require('node:path');

const db = require('./db');
const { notifyNewBooking, sendBookingConfirmation, mailConfigured } = require('./mailer');
const { renderLayout, SITE_URL, PHONE_TEL, PHONE_DISPLAY } = require('./views/layout');
const { buildServicePage } = require('./views/servicePage');
const { buildLegalPage } = require('./views/legalPage');
const { buildInvoiceView } = require('./views/invoiceView');
const { buildPricingPage } = require('./views/pricingPage');
const { buildAreaPage } = require('./views/areaPage');
const { buildInvoicePdf } = require('./pdf');
const { invoiceNumber } = require('./invoiceUtils');
const home = require('./content/home');
const { services } = require('./content/services');
const { pricing } = require('./content/pricing');
const { areas } = require('./content/areas');
const { privacyPolicy, termsOfService } = require('./content/legal');
const auth = require('./auth');
const invoiceRoutes = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Set this env var to true only when the app runs behind a reverse proxy / hosting
// platform (Render, Railway, nginx, etc.) that sets X-Forwarded-* headers, so
// req.secure and the rate limiter see the real client IP/protocol instead of the proxy's.
if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// A strict nonce-based CSP would require reworking every inline <script>/style="..."
// attribute across the site (there are many) — not worth the risk right now. This
// moderate policy still blocks the main threat (loading attacker JS from a third-party
// host after an XSS injection) while allowing the inline code + third-party assets the
// site actually uses (Google Fonts, GA4, Leaflet + its OpenStreetMap tiles).
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://unpkg.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://www.googletagmanager.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
}));
app.use(compression());

if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    if (req.secure || req.get('x-forwarded-proto') === 'https') return next();
    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

app.use(express.json({ limit: '20kb' }));
// Short cache window rather than a long/immutable one — there's no cache-busting
// filename hash on these assets, so a long cache would mean visitors keep seeing
// stale CSS/JS for a while after every deploy.
app.use(express.static(path.join(__dirname, 'public'), { index: false, maxAge: '1h' }));

app.get('/', (req, res) => {
  res.type('html').send(renderLayout({ ...home.meta, bodyHtml: home.bodyHtml }));
});

services.forEach((service) => {
  app.get(`/miami/${service.slug}`, (req, res) => {
    res.type('html').send(renderLayout(buildServicePage(service)));
  });

  if (pricing[service.slug]) {
    app.get(`/pricing/${service.slug}`, (req, res) => {
      res.type('html').send(renderLayout(buildPricingPage(service, pricing[service.slug])));
    });
  }
});

areas.forEach((area) => {
  app.get(`/areas/${area.slug}`, (req, res) => {
    res.type('html').send(renderLayout(buildAreaPage(area)));
  });
});

app.get(`/${privacyPolicy.slug}`, (req, res) => {
  res.type('html').send(renderLayout(buildLegalPage(privacyPolicy)));
});

app.get(`/${termsOfService.slug}`, (req, res) => {
  res.type('html').send(renderLayout(buildLegalPage(termsOfService)));
});

app.get('/invoice/:publicId', (req, res) => {
  const invoice = db.getInvoiceByPublicId(req.params.publicId);
  if (!invoice) return res.status(404).send('Invoice not found');
  res.type('html').send(renderLayout(buildInvoiceView(invoice)));
});

app.post('/invoice/:publicId/sign', (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isSignRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again later.' });
  }

  const invoice = db.getInvoiceByPublicId(req.params.publicId);
  if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
  if (invoice.signed_name) return res.status(400).json({ ok: false, error: 'This invoice has already been signed.' });

  const signedName = cleanString(req.body?.signedName, 160);
  if (!signedName) return res.status(400).json({ ok: false, error: 'Please type your full name to sign.' });

  db.signInvoice(invoice.id, signedName);
  res.json({ ok: true });
});

app.get('/invoice/:publicId/pdf', async (req, res) => {
  const invoice = db.getInvoiceByPublicId(req.params.publicId);
  if (!invoice) return res.status(404).send('Invoice not found');
  const pdfBuffer = await buildInvoicePdf(invoice);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `inline; filename="${invoiceNumber(invoice.id)}.pdf"`);
  res.send(pdfBuffer);
});

app.get('/sitemap.xml', (req, res) => {
  const urls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    ...services.map((s) => ({ loc: `${SITE_URL}/miami/${s.slug}/`, priority: '0.8' })),
    ...services.filter((s) => pricing[s.slug]).map((s) => ({ loc: `${SITE_URL}/pricing/${s.slug}/`, priority: '0.6' })),
    ...areas.map((a) => ({ loc: `${SITE_URL}/areas/${a.slug}/`, priority: '0.6' })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>
`;
  res.type('application/xml').send(xml);
});

const EQUIPMENT_TYPES = new Set(['refrigeration', 'hvac', 'ice-machine', 'kitchen-equipment', 'mixer', 'exhaust-hood', 'other']);
const URGENCY_LEVELS = new Set(['emergency', 'this-week', 'scheduled']);

// Простая защита от спама/перебора: не более 5 заявок с одного IP за 10 минут.
const submissionsByIp = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (submissionsByIp.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  submissionsByIp.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

// The invoice-sign endpoint is public (no login) so it needs its own limiter too —
// otherwise it's an open door to spam/brute-force public_id guesses with no cost.
const signAttemptsByIp = new Map();
const SIGN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const SIGN_RATE_LIMIT_MAX = 10;

function isSignRateLimited(ip) {
  const now = Date.now();
  const timestamps = (signAttemptsByIp.get(ip) || []).filter((t) => now - t < SIGN_RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  signAttemptsByIp.set(ip, timestamps);
  return timestamps.length > SIGN_RATE_LIMIT_MAX;
}

function cleanString(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function validateBookingPayload(body) {
  const errors = [];

  const name = cleanString(body.name, 120);
  const phone = cleanString(body.phone, 40);
  const email = cleanString(body.email, 160);
  const businessName = cleanString(body.businessName, 160);
  const address = cleanString(body.address, 240);
  const equipmentType = cleanString(body.equipmentType, 40);
  const equipmentDetail = cleanString(body.equipmentDetail, 160);
  const issueDescription = cleanString(body.issueDescription, 2000);
  const urgency = cleanString(body.urgency, 40);
  const preferredDate = cleanString(body.preferredDate, 20);
  const preferredTime = cleanString(body.preferredTime, 20);
  const botField = cleanString(body.website, 200); // honeypot

  if (botField) errors.push('spam detected');
  if (!name) errors.push('Укажите имя');
  if (!phone || phone.replace(/[^\d]/g, '').length < 7) errors.push('Укажите корректный телефон');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Некорректный email');
  if (!address) errors.push('Укажите адрес объекта');
  if (!EQUIPMENT_TYPES.has(equipmentType)) errors.push('Укажите тип оборудования');
  if (!URGENCY_LEVELS.has(urgency)) errors.push('Укажите срочность обращения');
  if (!issueDescription) errors.push('Опишите проблему');

  return {
    errors,
    data: {
      name,
      phone,
      email,
      businessName,
      address,
      equipmentType,
      equipmentDetail,
      issueDescription,
      urgency,
      preferredDate,
      preferredTime,
    },
  };
}

app.post('/api/bookings', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Слишком много заявок. Попробуйте позже или позвоните нам напрямую.' });
  }

  const { errors, data } = validateBookingPayload(req.body || {});
  if (errors.length) {
    return res.status(400).json({ ok: false, error: errors.join('; ') });
  }

  try {
    const id = db.insertBooking(data);
    const booking = db.getBooking(id);
    if (!mailConfigured || !process.env.NOTIFY_EMAIL) {
      db.updateNotifyStatus(id, 'skipped');
    } else {
      notifyNewBooking(booking)
        .then((result) => db.updateNotifyStatus(id, result?.ok ? 'sent' : 'failed'))
        .catch(() => db.updateNotifyStatus(id, 'failed'));
    }
    sendBookingConfirmation(booking).catch(() => {});
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('[api] Ошибка сохранения заявки:', err);
    return res.status(500).json({ ok: false, error: 'Внутренняя ошибка сервера. Попробуйте позвонить нам напрямую.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (auth.isLoginRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many login attempts. Try again later.' });
  }
  const { username, password } = req.body || {};
  if (!auth.verifyLogin(username, password)) {
    return res.status(401).json({ ok: false, error: 'Invalid username or password.' });
  }
  const token = auth.createSession();
  res.json({ ok: true, token });
});

app.post('/api/admin/logout', auth.requireAdmin, (req, res) => {
  const token = req.headers['x-admin-token'] || req.query.token || '';
  auth.destroySession(token);
  res.json({ ok: true });
});

app.get('/api/bookings', auth.requireAdmin, (req, res) => {
  res.json({ ok: true, bookings: db.listBookings() });
});

app.patch('/api/bookings/:id/status', auth.requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = cleanString(req.body?.status, 30);
  const allowed = new Set(['new', 'contacted', 'scheduled', 'completed', 'cancelled']);
  if (!id || !allowed.has(status)) {
    return res.status(400).json({ ok: false, error: 'Некорректные данные' });
  }
  const updated = db.updateBookingStatus(id, status);
  if (!updated) return res.status(404).json({ ok: false, error: 'Заявка не найдена' });
  res.json({ ok: true });
});

app.use('/api/invoices', invoiceRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, mailConfigured });
});

app.use((req, res) => {
  const bodyHtml = `
  <section class="section error-page">
    <div class="container">
      <p class="error-code">404</p>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or may have moved. Try one of the links below, or call us directly.</p>
      <div class="hero-cta">
        <a href="/" class="btn btn-primary btn-lg">Back to Home</a>
        <a href="tel:${PHONE_TEL}" class="btn btn-outline btn-lg" style="border-color: var(--color-navy-700); color: var(--color-navy-800);">Call ${PHONE_DISPLAY}</a>
      </div>
    </div>
  </section>
`;
  res.status(404).type('html').send(
    renderLayout({
      title: 'Page Not Found | ProFix305',
      description: 'The page you requested could not be found.',
      canonical: '/404',
      bodyHtml,
    })
  );
});

app.listen(PORT, () => {
  console.log(`ProFix305 server running on http://localhost:${PORT}`);
  if (!auth.ADMIN_USERNAME || !auth.ADMIN_PASSWORD) {
    console.warn('[warn] ADMIN_USERNAME/ADMIN_PASSWORD не заданы в .env — вход в /admin.html не будет работать.');
  }
  if (!mailConfigured) {
    console.warn('[warn] SENDGRID_API_KEY не задан — email-уведомления о заявках отключены (заявки всё равно сохраняются в БД).');
  }
});
