const { PHONE_DISPLAY, EMAIL } = require('./views/layout');
const { escapeHtml } = require('./htmlUtils');

const NAVY = '#0c1b2e';
const CYAN = '#0e9bab';
const SLATE = '#5a6b82';
const BORDER = '#e2e8f0';
const BG = '#eef2f6';

function detailRow(label, value) {
  if (!value) return '';
  return `
  <tr>
    <td style="padding:7px 0;color:${SLATE};font-size:13px;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:7px 0;color:${NAVY};font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
  </tr>`;
}

function detailTable(rows) {
  const filtered = rows.filter(Boolean);
  if (!filtered.length) return '';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};border-radius:8px;padding:6px 16px;margin:0 0 20px;">
    ${filtered.join('')}
  </table>`;
}

function wrapEmail({ eyebrow, heading, intro, bodyHtml, ctaLabel, ctaUrl }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER};">
  <tr>
    <td style="background:${NAVY};padding:22px 28px;">
      <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">ProFix<span style="color:#35d0e0;">305</span></span>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 28px 4px;">
      ${eyebrow ? `<p style="margin:0 0 8px;color:${CYAN};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>` : ''}
      <h1 style="margin:0 0 14px;color:${NAVY};font-size:21px;line-height:1.3;">${escapeHtml(heading)}</h1>
      ${intro ? `<p style="margin:0 0 20px;color:${SLATE};font-size:14px;line-height:1.6;">${intro}</p>` : ''}
    </td>
  </tr>
  <tr>
    <td style="padding:0 28px 4px;">
      ${bodyHtml || ''}
    </td>
  </tr>
  ${ctaUrl ? `
  <tr>
    <td style="padding:20px 28px 8px;">
      <a href="${ctaUrl}" style="display:inline-block;background:${CYAN};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:999px;">${escapeHtml(ctaLabel || 'View')}</a>
    </td>
  </tr>` : ''}
  <tr>
    <td style="padding:28px;">
      <div style="height:1px;background:${BORDER};margin-bottom:20px;"></div>
      <p style="margin:0 0 4px;color:${SLATE};font-size:12px;">ProFix305 — Commercial Equipment Repair, Miami to Palm Beach</p>
      <p style="margin:0;color:${SLATE};font-size:12px;">${PHONE_DISPLAY} &middot; ${EMAIL}</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

module.exports = { wrapEmail, detailRow, detailTable, escapeHtml };
