const sgMail = require('@sendgrid/mail');
const { PHONE_DISPLAY } = require('./views/layout');

// Render's free plan blocks outbound SMTP (ports 25/465/587) entirely, so raw
// SMTP (nodemailer + Gmail) can never work there — connections just hang until
// they time out. SendGrid's API sends over plain HTTPS instead, which isn't blocked.
const mailConfigured = Boolean(process.env.SENDGRID_API_KEY);
if (mailConfigured) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function parseFrom(raw) {
  const match = /^(.*)<(.+)>$/.exec(raw || '');
  if (match) return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
  return { email: raw };
}

async function send(msg) {
  if (!mailConfigured) return { ok: false, error: 'Email is not configured on the server yet — set SENDGRID_API_KEY.' };
  try {
    await sgMail.send(msg);
    return { ok: true };
  } catch (err) {
    const detail = err.response?.body?.errors?.map((e) => e.message).join('; ') || err.message;
    console.error('[mailer] Не удалось отправить письмо:', detail);
    return { ok: false, error: detail };
  }
}

async function notifyNewBooking(booking) {
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

  await send({
    to,
    from: parseFrom(process.env.FROM_EMAIL),
    subject: `Новая заявка на ремонт (#${booking.id}) — ${booking.urgency === 'emergency' ? 'СРОЧНО' : 'плановая'}`,
    text: lines.join('\n'),
  });
}

async function sendBookingConfirmation(booking) {
  if (!booking.email) return;

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

  await send({
    to: booking.email,
    from: parseFrom(process.env.FROM_EMAIL),
    subject: `We received your repair request (#${booking.id}) — ProFix305`,
    text: lines.join('\n'),
  });
}

async function sendInvoiceEmail(invoice, pdfBuffer, viewUrl) {
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

  return send({
    to: invoice.customer_email,
    from: parseFrom(process.env.FROM_EMAIL),
    subject: `Invoice ${num} from ProFix305 — ${formatMoney(total)} due`,
    text: lines.join('\n'),
    attachments: [
      {
        filename: `${num}.pdf`,
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      },
    ],
  });
}

module.exports = { notifyNewBooking, sendBookingConfirmation, sendInvoiceEmail, mailConfigured };
