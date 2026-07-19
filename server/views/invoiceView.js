const { invoiceNumber, computeTotals, formatMoney } = require('../invoiceUtils');
const { PHONE_DISPLAY, PHONE_TEL, EMAIL } = require('./layout');
const { INVOICE_TERMS } = require('../content/invoiceTerms');
const { escapeHtml } = require('../htmlUtils');

function buildInvoiceView(invoice) {
  const num = invoiceNumber(invoice.id);
  const { subtotal, tax, total } = computeTotals(invoice.line_items, invoice.tax_rate);
  const createdDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });

  const rowsHtml = invoice.line_items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.description)}</td>
          <td class="num">${item.qty}</td>
          <td class="num">${formatMoney(item.unitPrice)}</td>
          <td class="num">${formatMoney(item.qty * item.unitPrice)}</td>
        </tr>`
    )
    .join('');

  const statusLabel = { draft: 'Draft', sent: 'Awaiting Payment', paid: 'Paid', void: 'Void' }[invoice.status] || invoice.status;

  const termsHtml = INVOICE_TERMS.map((t) => `<li>${t}</li>`).join('');

  const signatureHtml = invoice.signed_name
    ? `
        <div class="invoice-signed">
          <p class="label">Accepted</p>
          <p>Signed by <strong>${escapeHtml(invoice.signed_name)}</strong> on ${new Date(invoice.signed_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/New_York',
          })}</p>
        </div>`
    : `
        <div class="invoice-sign-form" id="invoice-sign-form">
          <p class="label">Customer Acceptance</p>
          <p class="invoice-sign-hint">Type your full name to confirm the work above was completed and accept this invoice.</p>
          <div class="invoice-sign-row">
            <input type="text" id="signed-name-input" placeholder="Full name" maxlength="160" />
            <button type="button" class="btn btn-primary" id="sign-btn">Accept &amp; Sign</button>
          </div>
          <p class="invoice-sign-status" id="sign-status" role="status"></p>
        </div>`;

  const bodyHtml = `
  <section class="section invoice-page">
    <div class="container invoice-container">
      <div class="invoice-card">
        <div class="invoice-head">
          <div>
            <div class="invoice-brand">ProFix<em>305</em></div>
            <p class="invoice-brand-sub">Commercial Equipment Repair — Miami to Palm Beach</p>
            <p class="invoice-brand-sub">${PHONE_DISPLAY} &bull; ${EMAIL}</p>
          </div>
          <div class="invoice-meta">
            <h1>Invoice</h1>
            <p>${num}</p>
            <p>${createdDate}</p>
            <span class="invoice-status invoice-status-${invoice.status}">${statusLabel}</span>
          </div>
        </div>

        <div class="invoice-bill-to">
          <p class="label">Bill To</p>
          <p class="name">${escapeHtml(invoice.customer_name)}</p>
          ${invoice.customer_address ? `<p>${escapeHtml(invoice.customer_address)}</p>` : ''}
          ${invoice.customer_phone ? `<p>${escapeHtml(invoice.customer_phone)}</p>` : ''}
          ${invoice.customer_email ? `<p>${escapeHtml(invoice.customer_email)}</p>` : ''}
        </div>

        <table class="invoice-table">
          <thead>
            <tr><th>Description</th><th class="num">Qty</th><th class="num">Unit Price</th><th class="num">Amount</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>

        <div class="invoice-totals">
          <div><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
          ${Number(invoice.tax_rate) > 0 ? `<div><span>Tax (${invoice.tax_rate}%)</span><span>${formatMoney(tax)}</span></div>` : ''}
          <div class="invoice-total-due"><span>Total Due</span><span>${formatMoney(total)}</span></div>
        </div>

        ${invoice.notes ? `<div class="invoice-notes"><p class="label">Notes</p><p>${escapeHtml(invoice.notes)}</p></div>` : ''}

        <div class="invoice-terms">
          <p class="label">Terms &amp; Conditions</p>
          <ul>${termsHtml}</ul>
        </div>

        ${signatureHtml}

        <div class="invoice-actions">
          <a class="btn btn-primary btn-lg" href="/invoice/${invoice.public_id}/pdf">Download PDF</a>
          <a class="btn btn-outline" style="border-color:var(--color-navy-700); color:var(--color-navy-800);" href="tel:${PHONE_TEL}">Questions? Call ${PHONE_DISPLAY}</a>
        </div>
      </div>
    </div>
  </section>

  <script>
  (function () {
    var btn = document.getElementById('sign-btn');
    if (!btn) return;
    var input = document.getElementById('signed-name-input');
    var status = document.getElementById('sign-status');
    btn.addEventListener('click', function () {
      var name = input.value.trim();
      if (!name) { status.textContent = 'Please type your full name.'; return; }
      btn.disabled = true;
      btn.textContent = 'Signing…';
      fetch('/invoice/${invoice.public_id}/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedName: name }),
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (result.ok && result.data.ok) {
            window.location.reload();
          } else {
            status.textContent = (result.data && result.data.error) || 'Something went wrong — please try again.';
            btn.disabled = false;
            btn.textContent = 'Accept & Sign';
          }
        })
        .catch(function () {
          status.textContent = 'Network error — please try again.';
          btn.disabled = false;
          btn.textContent = 'Accept & Sign';
        });
    });
  })();
  </script>
`;

  return {
    title: `Invoice ${num} | ProFix305`,
    description: `Invoice ${num} from ProFix305.`,
    canonical: `/invoice/${invoice.public_id}/`,
    bodyHtml,
  };
}

module.exports = { buildInvoiceView };
