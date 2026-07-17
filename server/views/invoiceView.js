const { invoiceNumber, computeTotals, formatMoney } = require('../invoiceUtils');

function buildInvoiceView(invoice) {
  const num = invoiceNumber(invoice.id);
  const { subtotal, tax, total } = computeTotals(invoice.line_items, invoice.tax_rate);
  const createdDate = new Date(invoice.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const rowsHtml = invoice.line_items
    .map(
      (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="num">${item.qty}</td>
          <td class="num">${formatMoney(item.unitPrice)}</td>
          <td class="num">${formatMoney(item.qty * item.unitPrice)}</td>
        </tr>`
    )
    .join('');

  const statusLabel = { draft: 'Draft', sent: 'Awaiting Payment', paid: 'Paid', void: 'Void' }[invoice.status] || invoice.status;

  const bodyHtml = `
  <section class="section invoice-page">
    <div class="container invoice-container">
      <div class="invoice-card">
        <div class="invoice-head">
          <div>
            <div class="invoice-brand">ProFix<em>305</em></div>
            <p class="invoice-brand-sub">Commercial Equipment Repair — Miami to Palm Beach</p>
            <p class="invoice-brand-sub">(305) 555-0199 &bull; booking@profix305.com</p>
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
          <p class="name">${invoice.customer_name}</p>
          ${invoice.customer_address ? `<p>${invoice.customer_address}</p>` : ''}
          ${invoice.customer_phone ? `<p>${invoice.customer_phone}</p>` : ''}
          ${invoice.customer_email ? `<p>${invoice.customer_email}</p>` : ''}
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

        ${invoice.notes ? `<div class="invoice-notes"><p class="label">Notes</p><p>${invoice.notes}</p></div>` : ''}

        <div class="invoice-actions">
          <a class="btn btn-primary btn-lg" href="/invoice/${invoice.public_id}/pdf">Download PDF</a>
          <a class="btn btn-outline" style="border-color:var(--color-navy-700); color:var(--color-navy-800);" href="tel:+13055550199">Questions? Call (305) 555-0199</a>
        </div>
      </div>
    </div>
  </section>
`;

  return {
    title: `Invoice ${num} | ProFix305`,
    description: `Invoice ${num} from ProFix305.`,
    canonical: `/invoice/${invoice.public_id}/`,
    bodyHtml,
  };
}

module.exports = { buildInvoiceView };
