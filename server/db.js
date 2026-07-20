const { createClient } = require('@libsql/client');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DATA_DIR = process.env.TURSO_DATABASE_URL ? null : path.join(__dirname, 'data');
if (DATA_DIR && !fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// TURSO_DATABASE_URL (libsql://...) + TURSO_AUTH_TOKEN make this a real, persistent,
// hosted database (data survives every redeploy). Without them it falls back to a local
// file — fine for local dev, but on Render's free tier that file is wiped on every
// deploy since the disk isn't persistent there.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || `file:${path.join(DATA_DIR, 'bookings.db')}`,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Once real data lives in a database that actually persists, we can no longer just
// drop/recreate tables to change the schema — so new columns get added here, guarded
// by a check against the table's current columns, instead of baking them into CREATE TABLE.
async function addColumnIfMissing(table, column, definition) {
  const { rows } = await db.execute(`PRAGMA table_info(${table})`);
  const exists = rows.some((row) => row.name === column);
  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

const ready = (async () => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      business_name TEXT,
      address TEXT NOT NULL,
      equipment_type TEXT NOT NULL,
      equipment_detail TEXT,
      issue_description TEXT NOT NULL,
      urgency TEXT NOT NULL,
      preferred_date TEXT,
      preferred_time TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      notify_status TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await addColumnIfMissing('bookings', 'photo_data', 'TEXT');
  await addColumnIfMissing('bookings', 'photo_mime', 'TEXT');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT NOT NULL UNIQUE,
      booking_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      customer_address TEXT,
      line_items TEXT NOT NULL,
      tax_rate REAL NOT NULL DEFAULT 0,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      sent_at TEXT,
      paid_at TEXT,
      signed_name TEXT,
      signed_at TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings (id)
    )
  `);

  // Tracks an in-progress SMS conversation per phone number (the SMS booking bot) —
  // stored in the DB rather than in-memory so an in-progress text conversation survives
  // a redeploy instead of leaving the customer stuck mid-conversation.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sms_sessions (
      phone TEXT PRIMARY KEY,
      step INTEGER NOT NULL DEFAULT 0,
      answers TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
})();

async function getSmsSession(phone) {
  const { rows } = await db.execute({ sql: 'SELECT * FROM sms_sessions WHERE phone = ?', args: [phone] });
  if (!rows[0]) return null;
  return { step: rows[0].step, answers: JSON.parse(rows[0].answers) };
}

async function saveSmsSession(phone, session) {
  await db.execute({
    sql: `
      INSERT INTO sms_sessions (phone, step, answers, updated_at) VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(phone) DO UPDATE SET step = excluded.step, answers = excluded.answers, updated_at = excluded.updated_at
    `,
    args: [phone, session.step, JSON.stringify(session.answers)],
  });
}

async function clearSmsSession(phone) {
  await db.execute({ sql: 'DELETE FROM sms_sessions WHERE phone = ?', args: [phone] });
}

async function insertBooking(b) {
  const result = await db.execute({
    sql: `
      INSERT INTO bookings (
        name, phone, email, business_name, address, equipment_type, equipment_detail,
        issue_description, urgency, preferred_date, preferred_time, photo_data, photo_mime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    args: [
      b.name,
      b.phone,
      b.email || null,
      b.businessName || null,
      b.address,
      b.equipmentType,
      b.equipmentDetail || null,
      b.issueDescription,
      b.urgency,
      b.preferredDate || null,
      b.preferredTime || null,
      b.photoData || null,
      b.photoMime || null,
    ],
  });
  return Number(result.lastInsertRowid);
}

async function listBookings() {
  const { rows } = await db.execute(`
    SELECT id, name, phone, email, business_name, address, equipment_type, equipment_detail,
      issue_description, urgency, preferred_date, preferred_time, status, notify_status, created_at,
      (photo_data IS NOT NULL) AS has_photo
    FROM bookings ORDER BY created_at DESC
  `);
  return rows;
}

async function getBooking(id) {
  const { rows } = await db.execute({ sql: 'SELECT * FROM bookings WHERE id = ?', args: [id] });
  return rows[0];
}

async function getBookingPhoto(id) {
  const { rows } = await db.execute({ sql: 'SELECT photo_data, photo_mime FROM bookings WHERE id = ?', args: [id] });
  return rows[0];
}

async function updateBookingStatus(id, status) {
  const result = await db.execute({ sql: 'UPDATE bookings SET status = ? WHERE id = ?', args: [status, id] });
  return result.rowsAffected > 0;
}

async function updateNotifyStatus(id, notifyStatus) {
  await db.execute({ sql: 'UPDATE bookings SET notify_status = ? WHERE id = ?', args: [notifyStatus, id] });
}

const insertInvoiceSql = `
  INSERT INTO invoices (
    public_id, booking_id, customer_name, customer_email, customer_phone,
    customer_address, line_items, tax_rate, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

async function insertInvoice(inv) {
  const publicId = crypto.randomBytes(12).toString('hex');
  const result = await db.execute({
    sql: insertInvoiceSql,
    args: [
      publicId,
      inv.bookingId || null,
      inv.customerName,
      inv.customerEmail || null,
      inv.customerPhone || null,
      inv.customerAddress || null,
      JSON.stringify(inv.lineItems),
      inv.taxRate || 0,
      inv.notes || null,
    ],
  });
  return Number(result.lastInsertRowid);
}

function parseInvoiceRow(row) {
  if (!row) return row;
  return { ...row, line_items: JSON.parse(row.line_items) };
}

async function listInvoices() {
  const { rows } = await db.execute('SELECT * FROM invoices ORDER BY created_at DESC');
  return rows.map(parseInvoiceRow);
}

async function getInvoice(id) {
  const { rows } = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
  return parseInvoiceRow(rows[0]);
}

async function getInvoiceByPublicId(publicId) {
  const { rows } = await db.execute({ sql: 'SELECT * FROM invoices WHERE public_id = ?', args: [publicId] });
  return parseInvoiceRow(rows[0]);
}

async function updateInvoiceStatus(id, status) {
  const timestampCol = status === 'sent' ? 'sent_at' : status === 'paid' ? 'paid_at' : null;
  const sql = timestampCol
    ? `UPDATE invoices SET status = ?, ${timestampCol} = datetime('now') WHERE id = ?`
    : 'UPDATE invoices SET status = ? WHERE id = ?';
  const result = await db.execute({ sql, args: [status, id] });
  return result.rowsAffected > 0;
}

async function signInvoice(id, signedName) {
  const result = await db.execute({
    sql: "UPDATE invoices SET signed_name = ?, signed_at = datetime('now') WHERE id = ? AND signed_name IS NULL",
    args: [signedName, id],
  });
  return result.rowsAffected > 0;
}

async function exportAllData() {
  const [bookings, invoices] = await Promise.all([
    db.execute(`
      SELECT id, name, phone, email, business_name, address, equipment_type, equipment_detail,
        issue_description, urgency, preferred_date, preferred_time, status, notify_status, created_at
      FROM bookings ORDER BY id ASC
    `),
    db.execute('SELECT * FROM invoices ORDER BY id ASC'),
  ]);
  return {
    exportedAt: new Date().toISOString(),
    bookings: bookings.rows,
    invoices: invoices.rows.map(parseInvoiceRow),
  };
}

module.exports = {
  ready,
  insertBooking,
  listBookings,
  getBooking,
  getBookingPhoto,
  updateBookingStatus,
  updateNotifyStatus,
  insertInvoice,
  listInvoices,
  getInvoice,
  getInvoiceByPublicId,
  updateInvoiceStatus,
  signInvoice,
  exportAllData,
  getSmsSession,
  saveSmsSession,
  clearSmsSession,
};
