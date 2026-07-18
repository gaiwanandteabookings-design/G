const express = require('express');
const db = require('../db');
const auth = require('../auth');
const { buildInvoicePdf } = require('../pdf');
const { sendInvoiceEmail } = require('../mailer');
const { invoiceNumber, computeTotals } = require('../invoiceUtils');
const { SITE_URL } = require('../views/layout');

const router = express.Router();
router.use(auth.requireAdmin);

const STATUSES = new Set(['draft', 'sent', 'paid', 'void']);

function cleanString(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function validateLineItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const items = [];
  for (const item of raw) {
    const description = cleanString(item?.description, 300);
    const qty = Number(item?.qty);
    const unitPrice = Number(item?.unitPrice);
    if (!description || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return null;
    }
    items.push({ description, qty, unitPrice });
  }
  return items;
}

function withComputed(invoice) {
  return { ...invoice, invoice_number: invoiceNumber(invoice.id), totals: computeTotals(invoice.line_items, invoice.tax_rate) };
}

router.get('/', (req, res) => {
  res.json({ ok: true, invoices: db.listInvoices().map(withComputed) });
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  const customerName = cleanString(body.customerName, 160);
  const customerEmail = cleanString(body.customerEmail, 160);
  const customerPhone = cleanString(body.customerPhone, 40);
  const customerAddress = cleanString(body.customerAddress, 240);
  const notes = cleanString(body.notes, 1000);
  const taxRate = Number(body.taxRate) || 0;
  const lineItems = validateLineItems(body.lineItems);
  const bookingId = body.bookingId ? Number(body.bookingId) : null;

  if (!customerName) return res.status(400).json({ ok: false, error: 'Customer name is required.' });
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return res.status(400).json({ ok: false, error: 'A valid customer email is required.' });
  }
  if (!customerPhone) return res.status(400).json({ ok: false, error: 'Customer phone is required.' });
  if (!lineItems) return res.status(400).json({ ok: false, error: 'Add at least one valid line item (description, qty > 0, unit price >= 0).' });
  if (taxRate < 0 || taxRate > 100) return res.status(400).json({ ok: false, error: 'Tax rate must be between 0 and 100.' });

  const id = db.insertInvoice({
    bookingId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    lineItems,
    taxRate,
    notes,
  });

  let invoice = db.getInvoice(id);

  if (body.sendNow) {
    const result = await sendInvoiceNow(invoice);
    if (!result.ok) {
      return res.status(201).json({ ok: true, id, sendError: result.error });
    }
    invoice = db.getInvoice(id);
  }

  res.status(201).json({ ok: true, id, invoice: withComputed(invoice) });
});

router.get('/:id', (req, res) => {
  const invoice = db.getInvoice(Number(req.params.id));
  if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
  res.json({ ok: true, invoice: withComputed(invoice) });
});

router.get('/:id/pdf', async (req, res) => {
  const invoice = db.getInvoice(Number(req.params.id));
  if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });
  const pdfBuffer = await buildInvoicePdf(invoice);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `inline; filename="${invoiceNumber(invoice.id)}.pdf"`);
  res.send(pdfBuffer);
});

async function sendInvoiceNow(invoice) {
  const pdfBuffer = await buildInvoicePdf(invoice);
  const viewUrl = `${SITE_URL}/invoice/${invoice.public_id}/`;
  const result = await sendInvoiceEmail(invoice, pdfBuffer, viewUrl);
  if (result.ok) {
    db.updateInvoiceStatus(invoice.id, 'sent');
  }
  return result;
}

router.post('/:id/send', async (req, res) => {
  const invoice = db.getInvoice(Number(req.params.id));
  if (!invoice) return res.status(404).json({ ok: false, error: 'Invoice not found' });

  const result = await sendInvoiceNow(invoice);
  if (!result.ok) return res.status(422).json({ ok: false, error: result.error });

  res.json({ ok: true, invoice: withComputed(db.getInvoice(invoice.id)) });
});

router.patch('/:id/status', (req, res) => {
  const id = Number(req.params.id);
  const status = cleanString(req.body?.status, 20);
  if (!id || !STATUSES.has(status)) {
    return res.status(400).json({ ok: false, error: 'Invalid status.' });
  }
  const updated = db.updateInvoiceStatus(id, status);
  if (!updated) return res.status(404).json({ ok: false, error: 'Invoice not found' });
  res.json({ ok: true });
});

module.exports = router;
