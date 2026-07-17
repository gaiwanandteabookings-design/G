const nodemailer = require('nodemailer');

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
    `If this is an active emergency, you can also call us directly at (305) 555-0199.`,
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

module.exports = { notifyNewBooking, sendBookingConfirmation, smtpConfigured };
