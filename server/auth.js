const crypto = require('node:crypto');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const sessions = new Map(); // token -> expiresAt

// Brute-force protection on the login endpoint itself — separate from the general
// booking-form rate limiter since this guards actual account access.
const loginAttemptsByIp = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

function isLoginRateLimited(ip) {
  const now = Date.now();
  const attempts = (loginAttemptsByIp.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  attempts.push(now);
  loginAttemptsByIp.set(ip, attempts);
  return attempts.length > LOGIN_MAX_ATTEMPTS;
}

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal-length buffers so failure timing doesn't
    // leak the correct length via an early return.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyLogin(username, password) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) return false;
  const userOk = timingSafeStringEqual(username || '', ADMIN_USERNAME);
  const passOk = timingSafeStringEqual(password || '', ADMIN_PASSWORD);
  return userOk && passOk;
}

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function destroySession(token) {
  sessions.delete(token);
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token || '';
  if (!isValidSession(token)) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

module.exports = {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  isLoginRateLimited,
  verifyLogin,
  createSession,
  destroySession,
  requireAdmin,
};
