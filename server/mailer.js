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

module.exports = { notifyNewBooking, smtpConfigured };
