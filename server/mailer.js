const nodemailer = require('nodemailer');
const { PHONE_DISPLAY } = require('./views/layout');

const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function notifyNewBooking(booking) {
  if (!transporter) {
    console.log(`[mailer] SMTP не настроен — письмо о заявке #${booking.id} не отправлено (заявка сохранена в БД).`);
    return;
  }

  const to = process.env.NOTIFY_EMAIL;
  if (!to) return;

  const lines = [
    `Новая заявка на ремонт #${booking.id}`,
    ``,
    `Имя: ${booking.name}`,
    `Телефон: ${booking.phone}`,
    `Email: ${booking.email || '-'}`,
    `Компания/объект: ${booking.business_name || '-'}`,
    `Адрес: ${booking.address}`,
    `Оборудование: ${booking.equipment_type}`,
    `Срочность: ${booking.urgency}`,
    `Желаемая дата/время: ${booking.preferred_date || '-'} ${booking.preferred_time || ''}`,
    `Описание проблемы: ${booking.issue_description}`,
  ];

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to,
      subject: `Новая заявка на ремонт (#${booking.id}) — ${booking.urgency === 'emergency' ? 'СРОЧНО' : 'плановая'}`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[mailer] Не удалось отправить письмо:', err.message);
  }
}

async function sendBookingConfirmation(booking) {
  if (!transporter || !booking.email) return;

  const lines = [
    `Hi ${booking.name},`,
    ``,
    `Thanks for reaching out to ProFix305. We've received your repair request (#${booking.id}) and our dispatch team will call you shortly at ${booking.phone} to confirm the appointment.`,
    ``,
    `Request summary:`,
    `Equipment: ${booking.equipment_type}`,
    `Address: ${booking.address}`,
    `Urgency: ${booking.urgency}`,
    `Issue: ${booking.issue_description}`,
    ``,
    `If this is an active emergency, you can also call us directly at ${PHONE_DISPLAY}.`,
    ``,
    `— ProFix305`,
  ];

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: booking.email,
      subject: `We received your repair request (#${booking.id}) — ProFix305`,
      text: lines.join('\n'),
    });
  } catch (err) {
    console.error('[mailer] Не удалось отправить письмо-подтверждение клиенту:', err.message);
  }
}

async function sendInvoiceEmail(invoice, pdfBuffer, viewUrl) {
  if (!transporter) {
    return { ok: false, error: 'SMTP is not configured on the server yet — set SMTP_* env vars.' };
  }
  if (!invoice.customer_email) {
    return { ok: false, error: 'This invoice has no customer email address on file.' };
  }

  const { invoiceNumber, computeTotals, formatMoney } = require('./invoiceUtils');
  const { total } = computeTotals(invoice.line_items, invoice.tax_rate);
  const num = invoiceNumber(invoice.id);

  const lines = [
    `Hi ${invoice.customer_name},`,
    ``,
    `Please find your invoice ${num} from ProFix305 attached (PDF), for a total of ${formatMoney(total)}.`,
    ``,
    `You can also view it online here: ${viewUrl}`,
    ``,
    invoice.notes ? `Notes: ${invoice.notes}\n` : '',
    `Questions about this invoice? Reply to this email or call us at ${PHONE_DISPLAY}.`,
    ``,
    `— ProFix305`,
  ].filter(Boolean);

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: invoice.customer_email,
      subject: `Invoice ${num} from ProFix305 — ${formatMoney(total)} due`,
      text: lines.join('\n'),
      attachments: [
        {
          filename: `${num}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    return { ok: true };
  } catch (err) {
    console.error('[mailer] Не удалось отправить инвойс:', err.message);
    return { ok: false, error: 'Failed to send email — check SMTP settings.' };
  }
}

module.exports = { notifyNewBooking, sendBookingConfirmation, sendInvoiceEmail, smtpConfigured };
