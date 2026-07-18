const PDFDocument = require('pdfkit');
const { invoiceNumber, computeTotals, formatMoney } = require('./invoiceUtils');
const { PHONE_DISPLAY, EMAIL } = require('./views/layout');
const { INVOICE_TERMS } = require('./content/invoiceTerms');

const NAVY = '#0c1b2e';
const CYAN = '#0e9bab'; // darker cyan for print/paper contrast
const SLATE = '#5a6b82';
const LINE = '#dbe3ec';

function buildInvoicePdf(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { subtotal, tax, total } = computeTotals(invoice.line_items, invoice.tax_rate);
    const createdDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/New_York',
    });

    // Header
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(22).text('ProFix305', 50, 50);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(SLATE)
      .text('Commercial Equipment Repair — Miami to Palm Beach', 50, 78)
      .text(`${PHONE_DISPLAY}  •  ${EMAIL}`, 50, 91);

    doc.font('Helvetica-Bold').fontSize(20).fillColor(NAVY).text('INVOICE', 380, 50, { width: 165, align: 'right' });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(SLATE)
      .text(invoiceNumber(invoice.id), 380, 78, { width: 165, align: 'right' })
      .text(createdDate, 380, 92, { width: 165, align: 'right' });

    doc.rect(50, 112, 495, 3).fill(CYAN);
    doc.moveTo(50, 120).lineTo(545, 120).strokeColor(LINE).stroke();

    // Bill to
    doc.font('Helvetica-Bold').fontSize(10).fillColor(SLATE).text('BILL TO', 50, 138);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(NAVY).text(invoice.customer_name, 50, 154);
    let y = 170;
    doc.font('Helvetica').fontSize(10).fillColor(SLATE);
    if (invoice.customer_address) {
      doc.text(invoice.customer_address, 50, y);
      y += 14;
    }
    if (invoice.customer_phone) {
      doc.text(invoice.customer_phone, 50, y);
      y += 14;
    }
    if (invoice.customer_email) {
      doc.text(invoice.customer_email, 50, y);
      y += 14;
    }

    // Line items table
    let tableY = Math.max(y + 20, 220);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
    doc.rect(50, tableY, 495, 22).fill(NAVY);
    doc.fillColor('#ffffff');
    doc.text('DESCRIPTION', 60, tableY + 7);
    doc.text('QTY', 340, tableY + 7, { width: 40, align: 'right' });
    doc.text('UNIT PRICE', 385, tableY + 7, { width: 70, align: 'right' });
    doc.text('AMOUNT', 465, tableY + 7, { width: 70, align: 'right' });

    let rowY = tableY + 22;
    doc.font('Helvetica').fontSize(10);
    invoice.line_items.forEach((item, i) => {
      const amount = Number(item.qty) * Number(item.unitPrice);
      const rowHeight = 24;
      if (i % 2 === 1) {
        doc.rect(50, rowY, 495, rowHeight).fill('#f4faff');
      }
      doc.fillColor(NAVY);
      doc.text(item.description, 60, rowY + 7, { width: 270 });
      doc.text(String(item.qty), 340, rowY + 7, { width: 40, align: 'right' });
      doc.text(formatMoney(item.unitPrice), 385, rowY + 7, { width: 70, align: 'right' });
      doc.text(formatMoney(amount), 465, rowY + 7, { width: 70, align: 'right' });
      rowY += rowHeight;
    });

    doc.moveTo(50, rowY).lineTo(545, rowY).strokeColor(LINE).stroke();
    rowY += 12;

    const totalsX = 385;
    doc.font('Helvetica').fontSize(10).fillColor(SLATE);
    doc.text('Subtotal', totalsX, rowY, { width: 70, align: 'left' });
    doc.fillColor(NAVY).text(formatMoney(subtotal), 465, rowY, { width: 70, align: 'right' });
    rowY += 16;

    if (Number(invoice.tax_rate) > 0) {
      doc.fillColor(SLATE).text(`Tax (${invoice.tax_rate}%)`, totalsX, rowY, { width: 70, align: 'left' });
      doc.fillColor(NAVY).text(formatMoney(tax), 465, rowY, { width: 70, align: 'right' });
      rowY += 16;
    }

    doc.moveTo(totalsX, rowY).lineTo(545, rowY).strokeColor(LINE).stroke();
    rowY += 8;
    doc.font('Helvetica-Bold').fontSize(12).fillColor(NAVY);
    doc.text('Total Due', totalsX, rowY, { width: 70, align: 'left' });
    doc.text(formatMoney(total), 465, rowY, { width: 70, align: 'right' });
    rowY += 30;

    if (invoice.notes) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE).text('NOTES', 50, rowY);
      rowY += 14;
      doc.font('Helvetica').fontSize(10).fillColor(NAVY).text(invoice.notes, 50, rowY, { width: 495 });
      rowY = doc.y + 20;
    } else {
      rowY += 10;
    }

    doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE).text('TERMS & CONDITIONS', 50, rowY);
    rowY = doc.y + 6;
    doc.font('Helvetica').fontSize(9).fillColor(NAVY);
    INVOICE_TERMS.forEach((term, i) => {
      doc.text(`${i + 1}. ${term}`, 50, rowY, { width: 495 });
      rowY = doc.y + 4;
    });
    rowY += 16;

    if (invoice.signed_name) {
      const signedDate = new Date(invoice.signed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/New_York',
      });
      doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE).text('CUSTOMER ACCEPTANCE', 50, rowY);
      rowY = doc.y + 6;
      doc.font('Helvetica').fontSize(10).fillColor(NAVY).text(`Signed by ${invoice.signed_name} on ${signedDate}`, 50, rowY);
      rowY = doc.y + 20;
    } else {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(SLATE).text('CUSTOMER ACCEPTANCE (sign below)', 50, rowY);
      rowY += 26;
      doc.moveTo(50, rowY).lineTo(300, rowY).strokeColor(LINE).stroke();
      rowY += 10;
      doc.font('Helvetica').fontSize(8).fillColor(SLATE).text('Signature', 50, rowY);
      rowY += 20;
    }

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(SLATE)
      .text('Thank you for your business.', 50, rowY + 10, { width: 495, align: 'center' });

    doc.end();
  });
}

module.exports = { buildInvoicePdf };
