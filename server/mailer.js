const sgMail = require('@sendgrid/mail');
const { PHONE_DISPLAY, PHONE_TEL, SITE_URL } = require('./views/layout');
const { wrapEmail, detailRow, detailTable, escapeHtml } = require('./emailTemplates');

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
  if (!to) return { ok: false, error: 'NOTIFY_EMAIL is not set.' };

  const isEmergency = booking.urgency === 'emergency';
  const equipmentLabel = booking.equipment_detail ? `${booking.equipment_type} — ${booking.equipment_detail}` : booking.equipment_type;

  const lines = [
    `Новая заявка на ремонт #${booking.id}`,
    ``,
    `Имя: ${booking.name}`,
    `Телефон: ${booking.phone}`,
    `Email: ${booking.email || '-'}`,
    `Компания/объект: ${booking.business_name || '-'}`,
    `Адрес: ${booking.address}`,
    `Оборудование: ${equipmentLabel}`,
    `Срочность: ${booking.urgency}`,
    `Желаемая дата/время: ${booking.preferred_date || '-'} ${booking.preferred_time || ''}`,
    `Описание проблемы: ${booking.issue_description}`,
  ];

  const html = wrapEmail({
    eyebrow: isEmergency ? 'Срочная заявка' : 'Новая заявка',
    heading: `Заявка на ремонт #${booking.id}`,
    bodyHtml:
      detailTable([
        detailRow('Имя', booking.name),
        detailRow('Телефон', booking.phone),
        detailRow('Email', booking.email),
        detailRow('Компания/объект', booking.business_name),
        detailRow('Адрес', booking.address),
        detailRow('Оборудование', equipmentLabel),
        detailRow('Срочность', booking.urgency),
        detailRow('Желаемая дата/время', [booking.preferred_date, booking.preferred_time].filter(Boolean).join(' ')),
      ]) +
      `<p style="margin:0 0 4px;color:#0c1b2e;font-size:13px;font-weight:600;">Описание проблемы</p>
       <p style="margin:0 0 4px;color:#5a6b82;font-size:14px;line-height:1.6;">${escapeHtml(booking.issue_description)}</p>`,
    ctaLabel: 'Open Admin Dashboard',
    ctaUrl: `${SITE_URL}/admin.html`,
  });

  const PHOTO_EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const attachments = booking.photo_data
    ? [
        {
          filename: `booking-${booking.id}-photo.${PHOTO_EXT[booking.photo_mime] || 'jpg'}`,
          content: booking.photo_data,
          type: booking.photo_mime || 'image/jpeg',
          disposition: 'attachment',
        },
      ]
    : undefined;

  return send({
    to,
    from: parseFrom(process.env.FROM_EMAIL),
    subject: `Новая заявка на ремонт (#${booking.id}) — ${isEmergency ? 'Срочная' : 'Плановая'}`,
    text: lines.join('\n'),
    html,
    ...(attachments ? { attachments } : {}),
  });
}

async function sendBookingConfirmation(booking) {
  if (!booking.email) return;

  const equipmentLabel = booking.equipment_detail ? `${booking.equipment_type} — ${booking.equipment_detail}` : booking.equipment_type;

  const lines = [
    `Hi ${booking.name},`,
    ``,
    `Thanks for reaching out to ProFix305. We've received your repair request (#${booking.id}) and our dispatch team will call you shortly at ${booking.phone} to confirm the appointment.`,
    ``,
    `Request summary:`,
    `Equipment: ${equipmentLabel}`,
    `Address: ${booking.address}`,
    `Urgency: ${booking.urgency}`,
    `Issue: ${booking.issue_description}`,
    ``,
    `If this is an active emergency, you can also call us directly at ${PHONE_DISPLAY}.`,
    ``,
    `— ProFix305`,
  ];

  const html = wrapEmail({
    eyebrow: 'Request Received',
    heading: `Thanks, ${booking.name} — we've got your request`,
    intro: `We've received your repair request <strong>#${booking.id}</strong> and our dispatch team will call you shortly at ${escapeHtml(booking.phone)} to confirm the appointment.`,
    bodyHtml: detailTable([
      detailRow('Equipment', equipmentLabel),
      detailRow('Address', booking.address),
      detailRow('Urgency', booking.urgency),
      detailRow('Issue', booking.issue_description),
    ]),
    ctaLabel: `Call ${PHONE_DISPLAY}`,
    ctaUrl: `tel:${PHONE_TEL}`,
  });

  await send({
    to: booking.email,
    from: parseFrom(process.env.FROM_EMAIL),
    subject: `We received your repair request (#${booking.id}) — ProFix305`,
    text: lines.join('\n'),
    html,
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

  const html = wrapEmail({
    eyebrow: 'Invoice',
    heading: `Invoice ${num} — ${formatMoney(total)} due`,
    intro: `Please find your invoice from ProFix305 attached as a PDF.${invoice.notes ? ` <br/><br/><em>${escapeHtml(invoice.notes)}</em>` : ''}`,
    bodyHtml: `<p style="margin:0;color:#5a6b82;font-size:13px;">Questions about this invoice? Just reply to this email or call us at ${PHONE_DISPLAY}.</p>`,
    ctaLabel: 'View Invoice Online',
    ctaUrl: viewUrl,
  });

  return send({
    to: invoice.customer_email,
    from: parseFrom(process.env.FROM_EMAIL),
    subject: `Invoice ${num} from ProFix305 — ${formatMoney(total)} due`,
    text: lines.join('\n'),
    html,
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
