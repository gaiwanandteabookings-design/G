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
const { privacyPolicy, termsOfService, accessibilityStatement } = require('./content/legal');
const auth = require('./auth');
const invoiceRoutes = require('./routes/invoices');
const smsBot = require('./smsBot');
const crypto = require('node:crypto');

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

// One canonical host in production: force HTTPS AND redirect every other hostname the
// app answers on (bare profix305.com, the old *.onrender.com address) to it. Without
// this, search engines see full duplicate copies of the site on multiple hosts and
// split ranking signals between them — canonical tags alone only partially mitigate that.
const CANONICAL_HOST = 'www.profix305.com';
if (IS_PRODUCTION) {
  app.use((req, res, next) => {
    const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
    if (!isHttps || req.headers.host !== CANONICAL_HOST) {
      return res.redirect(301, `https://${CANONICAL_HOST}${req.originalUrl}`);
    }
    next();
  });
}

// /api/bookings gets its own, much larger body parser below (it optionally carries a
// base64 photo) — skip the small default parser for that one route so it doesn't 413
// before the route-specific parser gets a chance to run.
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/bookings') return next();
  express.json({ limit: '20kb' })(req, res, next);
});
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

app.get(`/${accessibilityStatement.slug}`, (req, res) => {
  res.type('html').send(renderLayout(buildLegalPage(accessibilityStatement)));
});

app.get('/invoice/:publicId', async (req, res) => {
  const invoice = await db.getInvoiceByPublicId(req.params.publicId);
  if (!invoice) return res.status(404).send('Invoice not found');
  res.type('html').send(renderLayout(buildInvoiceView(invoice)));
});

app.post('/invoice/:publicId/sign', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isSignRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many attempts. Please try again later.' });
  }

  const invoice = await db.getInvoiceByPublicId(req.params.publicId);
  if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
  if (invoice.signed_name) return res.status(400).json({ ok: false, error: 'This invoice has already been signed.' });

  const signedName = cleanString(req.body?.signedName, 160);
  if (!signedName) return res.status(400).json({ ok: false, error: 'Please type your full name to sign.' });

  await db.signInvoice(invoice.id, signedName);
  res.json({ ok: true });
});

app.get('/invoice/:publicId/pdf', async (req, res) => {
  const invoice = await db.getInvoiceByPublicId(req.params.publicId);
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
    { loc: `${SITE_URL}/${privacyPolicy.slug}/`, priority: '0.3' },
    { loc: `${SITE_URL}/${termsOfService.slug}/`, priority: '0.3' },
    { loc: `${SITE_URL}/${accessibilityStatement.slug}/`, priority: '0.3' },
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

// A real customer can't fill name/phone/email/address/description in under this
// long — anything faster came from a script that auto-filled the form.
const MIN_FORM_FILL_MS = 3000;

// Cold-outreach spam ("we can build you an app", "improve your SEO", etc.) submitted
// through the repair-request form itself, disguised as a booking. None of these
// phrases have any legitimate reason to appear in a description of broken equipment.
const SPAM_KEYWORDS = [
  'mobile app', 'quick chat', 'seo service', 'search engine optimization', 'digital marketing',
  'increase your traffic', 'increase your ranking', 'web design service', 'backlink', 'guest post',
  'link building', 'social media management', 'grow your business', 'boost your sales',
  'would you be open', "let's connect", 'partner with you', 'business proposal',
  'collaboration opportunity', 'unsubscribe', 'this is not spam',
];

function containsSpamKeywords(...texts) {
  const combined = texts.join(' ').toLowerCase();
  return SPAM_KEYWORDS.some((kw) => combined.includes(kw));
}

// The SMS booking bot is a public webhook (Twilio can't send an admin token), so it
// gets its own per-phone-number limiter — a stuck/looping conversation or a prank
// texter shouldn't be able to hammer the DB indefinitely.
const smsMessagesByPhone = new Map();
const SMS_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const SMS_RATE_LIMIT_MAX = 40;

function isSmsRateLimited(phone) {
  const now = Date.now();
  const timestamps = (smsMessagesByPhone.get(phone) || []).filter((t) => now - t < SMS_RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  smsMessagesByPhone.set(phone, timestamps);
  return timestamps.length > SMS_RATE_LIMIT_MAX;
}

// Confirms a webhook request actually came from Twilio (not a spoofed POST to our public
// endpoint) — Twilio signs every request with HMAC-SHA1 over the exact webhook URL plus
// its sorted form params, keyed with the account's auth token. The webhook URL here MUST
// match byte-for-byte what's configured in the Twilio console (see README).
function verifyTwilioSignature(req) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = req.headers['x-twilio-signature'];
  if (!authToken || !signature) return false;

  const url = `${SITE_URL}/api/sms/inbound`;
  const sortedKeys = Object.keys(req.body).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + req.body[key];
  }
  const expected = crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB decoded

// Accepts a "data:image/jpeg;base64,...." string from the client. Never trusts the
// declared mime type alone — the first bytes of the decoded buffer have to actually
// match that type's file signature, so a renamed/relabeled file can't sneak through.
function parsePhotoDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl) return null;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1];
  let buffer;
  try {
    buffer = Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }
  if (!buffer.length || buffer.length > MAX_PHOTO_BYTES) return null;

  const isJpeg = buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8;
  const isPng = buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length > 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  const signatureMatches =
    (mime === 'image/jpeg' && isJpeg) || (mime === 'image/png' && isPng) || (mime === 'image/webp' && isWebp);
  if (!signatureMatches) return null;

  return { mime, base64: match[2] };
}

function validateBookingPayload(body) {
  const errors = [];

  const name = cleanString(body.name, 120);
  const phone = cleanString(body.phone, 40);
  const email = cleanString(body.email, 160);
  const businessName = cleanString(body.businessName, 160);
  const street = cleanString(body.address, 200);
  const city = cleanString(body.city, 80);
  const state = cleanString(body.state, 10);
  const zip = cleanString(body.zip, 12);
  // The main booking form sends street/city/state/zip as separate fields (so we can
  // actually validate them); the chat widget and SMS bot still collect one free-text
  // address per their conversational flow, so fall back to that when the structured
  // fields are absent instead of forcing every intake channel to match.
  const hasStructuredAddress = Boolean(city || state || zip);
  let address = street;
  if (hasStructuredAddress) {
    if (!city) errors.push('Укажите город');
    if (!/^[A-Za-z]{2}$/.test(state)) errors.push('Штат — 2 буквы, например FL');
    if (!/^\d{5}(-\d{4})?$/.test(zip)) errors.push('Некорректный индекс (ZIP), нужно 5 цифр');
    if (city && /^[A-Za-z]{2}$/.test(state) && /^\d{5}(-\d{4})?$/.test(zip)) {
      address = `${street}, ${city}, ${state.toUpperCase()} ${zip}`;
    }
  }
  const equipmentType = cleanString(body.equipmentType, 40);
  const equipmentDetail = cleanString(body.equipmentDetail, 160);
  const issueDescription = cleanString(body.issueDescription, 2000);
  const urgency = cleanString(body.urgency, 40);
  const preferredDate = cleanString(body.preferredDate, 20);
  const preferredTime = cleanString(body.preferredTime, 20);
  const botField = cleanString(body.website, 200); // honeypot
  const renderedAt = Number(body.ts);

  if (botField) errors.push('spam detected');
  if (Number.isFinite(renderedAt) && renderedAt > 0 && Date.now() - renderedAt < MIN_FORM_FILL_MS) {
    errors.push('spam detected');
  }
  if (containsSpamKeywords(issueDescription, businessName, name)) errors.push('spam detected');
  if (!name) errors.push('Укажите имя');
  if (!phone || phone.replace(/[^\d]/g, '').length < 7) errors.push('Укажите корректный телефон');
  if (!email) errors.push('Укажите email');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Некорректный email');
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

app.post('/api/bookings', express.json({ limit: '8mb' }), async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Слишком много заявок. Попробуйте позже или позвоните нам напрямую.' });
  }

  const { errors, data } = validateBookingPayload(req.body || {});

  let photo = null;
  if (req.body && req.body.photo) {
    photo = parsePhotoDataUrl(req.body.photo);
    if (!photo) errors.push('Фото повреждено или имеет неподдерживаемый формат (нужны JPEG, PNG или WebP до 5 МБ)');
  }
  if (errors.length) {
    return res.status(400).json({ ok: false, error: errors.join('; ') });
  }

  try {
    const id = await db.insertBooking({ ...data, photoData: photo?.base64, photoMime: photo?.mime });
    const booking = await db.getBooking(id);
    if (!mailConfigured || !process.env.NOTIFY_EMAIL) {
      db.updateNotifyStatus(id, 'skipped').catch(() => {});
    } else {
      notifyNewBooking(booking)
        .then((result) => db.updateNotifyStatus(id, result?.ok ? 'sent' : 'failed'))
        .catch(() => db.updateNotifyStatus(id, 'failed').catch(() => {}));
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

app.get('/api/bookings', auth.requireAdmin, async (req, res) => {
  res.json({ ok: true, bookings: await db.listBookings() });
});

app.get('/api/bookings/:id/photo', auth.requireAdmin, async (req, res) => {
  const row = await db.getBookingPhoto(Number(req.params.id));
  if (!row || !row.photo_data) return res.status(404).send('No photo');
  res.set('Content-Type', row.photo_mime || 'application/octet-stream');
  res.set('Cache-Control', 'private, max-age=3600');
  res.send(Buffer.from(row.photo_data, 'base64'));
});

app.patch('/api/bookings/:id/status', auth.requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const status = cleanString(req.body?.status, 30);
  const allowed = new Set(['new', 'contacted', 'scheduled', 'completed', 'cancelled']);
  if (!id || !allowed.has(status)) {
    return res.status(400).json({ ok: false, error: 'Некорректные данные' });
  }
  const updated = await db.updateBookingStatus(id, status);
  if (!updated) return res.status(404).json({ ok: false, error: 'Заявка не найдена' });
  res.json({ ok: true });
});

app.get('/api/admin/export', auth.requireAdmin, async (req, res) => {
  const data = await db.exportAllData();
  const date = new Date().toISOString().slice(0, 10);
  res.set('Content-Disposition', `attachment; filename="profix305-export-${date}.json"`);
  res.json(data);
});

app.use('/api/invoices', invoiceRoutes);

// Twilio webhook target for the SMS booking bot — a customer texts the business number,
// this walks them through the same questions as the booking form/chat widget, one text
// at a time, and creates a real booking at the end. Configure this exact URL
// (SITE_URL + /api/sms/inbound) as the "A MESSAGE COMES IN" webhook on the Twilio number.
app.post('/api/sms/inbound', express.urlencoded({ extended: false, limit: '20kb' }), async (req, res) => {
  const from = cleanString(req.body?.From, 40);
  const bodyText = typeof req.body?.Body === 'string' ? req.body.Body : '';

  if (!verifyTwilioSignature(req)) {
    return res.status(403).type('text/plain').send('Forbidden');
  }
  if (!from) {
    return res.status(400).type('text/plain').send('Bad Request');
  }

  let reply;
  if (isSmsRateLimited(from)) {
    reply = "You've sent a lot of messages — please call us directly instead: " + PHONE_DISPLAY;
  } else {
    try {
      reply = await smsBot.handleMessage(from, bodyText);
    } catch (err) {
      console.error('[sms] Ошибка обработки входящего сообщения:', err);
      reply = `Sorry, something went wrong on our end — please call us directly at ${PHONE_DISPLAY}.`;
    }
  }

  res.type('text/xml').send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(reply)}</Message></Response>`);
});

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

db.ready
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ProFix305 server running on http://localhost:${PORT}`);
      if (!auth.ADMIN_USERNAME || !auth.ADMIN_PASSWORD) {
        console.warn('[warn] ADMIN_USERNAME/ADMIN_PASSWORD не заданы в .env — вход в /admin.html не будет работать.');
      }
      if (!mailConfigured) {
        console.warn('[warn] SENDGRID_API_KEY не задан — email-уведомления о заявках отключены (заявки всё равно сохраняются в БД).');
      }
      if (!process.env.TURSO_DATABASE_URL) {
        console.warn('[warn] TURSO_DATABASE_URL не задан — используется локальный файл БД, который НЕ переживёт передеплой на Render.');
      }
    });
  })
  .catch((err) => {
    console.error('[fatal] Не удалось инициализировать базу данных:', err);
    process.exit(1);
  });
