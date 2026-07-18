const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'bookings.db'));

db.exec(`
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

const insertBookingStmt = db.prepare(`
  INSERT INTO bookings (
    name, phone, email, business_name, address, equipment_type, equipment_detail,
    issue_description, urgency, preferred_date, preferred_time
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertBooking(b) {
  const result = insertBookingStmt.run(
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
    b.preferredTime || null
  );
  return Number(result.lastInsertRowid);
}

function listBookings() {
  return db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all();
}

function getBooking(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
}

function updateBookingStatus(id, status) {
  const result = db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
  return result.changes > 0;
}

function updateNotifyStatus(id, notifyStatus) {
  db.prepare('UPDATE bookings SET notify_status = ? WHERE id = ?').run(notifyStatus, id);
}

db.exec(`
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

const insertInvoiceStmt = db.prepare(`
  INSERT INTO invoices (
    public_id, booking_id, customer_name, customer_email, customer_phone,
    customer_address, line_items, tax_rate, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertInvoice(inv) {
  const publicId = crypto.randomBytes(12).toString('hex');
  const result = insertInvoiceStmt.run(
    publicId,
    inv.bookingId || null,
    inv.customerName,
    inv.customerEmail || null,
    inv.customerPhone || null,
    inv.customerAddress || null,
    JSON.stringify(inv.lineItems),
    inv.taxRate || 0,
    inv.notes || null
  );
  return Number(result.lastInsertRowid);
}

function parseInvoiceRow(row) {
  if (!row) return row;
  return { ...row, line_items: JSON.parse(row.line_items) };
}

function listInvoices() {
  return db.prepare('SELECT * FROM invoices ORDER BY created_at DESC').all().map(parseInvoiceRow);
}

function getInvoice(id) {
  return parseInvoiceRow(db.prepare('SELECT * FROM invoices WHERE id = ?').get(id));
}

function getInvoiceByPublicId(publicId) {
  return parseInvoiceRow(db.prepare('SELECT * FROM invoices WHERE public_id = ?').get(publicId));
}

function updateInvoiceStatus(id, status) {
  const timestampCol = status === 'sent' ? 'sent_at' : status === 'paid' ? 'paid_at' : null;
  const sql = timestampCol
    ? `UPDATE invoices SET status = ?, ${timestampCol} = datetime('now') WHERE id = ?`
    : 'UPDATE invoices SET status = ? WHERE id = ?';
  const result = db.prepare(sql).run(status, id);
  return result.changes > 0;
}

function signInvoice(id, signedName) {
  const result = db
    .prepare("UPDATE invoices SET signed_name = ?, signed_at = datetime('now') WHERE id = ? AND signed_name IS NULL")
    .run(signedName, id);
  return result.changes > 0;
}

module.exports = {
  insertBooking,
  listBookings,
  getBooking,
  updateBookingStatus,
  updateNotifyStatus,
  insertInvoice,
  listInvoices,
  getInvoice,
  getInvoiceByPublicId,
  updateInvoiceStatus,
  signInvoice,
};
