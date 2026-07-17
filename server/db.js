const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

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
    issue_description TEXT NOT NULL,
    urgency TEXT NOT NULL,
    preferred_date TEXT,
    preferred_time TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertBookingStmt = db.prepare(`
  INSERT INTO bookings (
    name, phone, email, business_name, address, equipment_type,
    issue_description, urgency, preferred_date, preferred_time
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

function insertBooking(b) {
  const result = insertBookingStmt.run(
    b.name,
    b.phone,
    b.email || null,
    b.businessName || null,
    b.address,
    b.equipmentType,
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

module.exports = {
  insertBooking,
  listBookings,
  getBooking,
  updateBookingStatus,
};
