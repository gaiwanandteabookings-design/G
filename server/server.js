require('dotenv').config();
const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');

const db = require('./db');
const { notifyNewBooking, smtpConfigured } = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const EQUIPMENT_TYPES = new Set(['walk-in-cooler', 'walk-in-freezer', 'both', 'other']);
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
    notifyNewBooking(booking).catch(() => {});
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    console.error('[api] Ошибка сохранения заявки:', err);
    return res.status(500).json({ ok: false, error: 'Внутренняя ошибка сервера. Попробуйте позвонить нам напрямую.' });
  }
});

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token || '';
  const provided = Buffer.from(String(token));
  const expected = Buffer.from(ADMIN_TOKEN);
  if (!ADMIN_TOKEN || provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

app.get('/api/bookings', requireAdmin, (req, res) => {
  res.json({ ok: true, bookings: db.listBookings() });
});

app.patch('/api/bookings/:id/status', requireAdmin, (req, res) => {
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

app.get('/api/health', (req, res) => {
  res.json({ ok: true, smtpConfigured });
});

app.listen(PORT, () => {
  console.log(`ColdChain305 server running on http://localhost:${PORT}`);
  if (!ADMIN_TOKEN) {
    console.warn('[warn] ADMIN_TOKEN не задан в .env — страница /admin.html не будет работать.');
  }
  if (!smtpConfigured) {
    console.warn('[warn] SMTP не настроен — email-уведомления о заявках отключены (заявки всё равно сохраняются в БД).');
  }
});
