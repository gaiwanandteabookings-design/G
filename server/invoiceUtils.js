function invoiceNumber(id) {
  return `INV-${1000 + Number(id)}`;
}

function computeTotals(lineItems, taxRate) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.qty) * Number(item.unitPrice), 0);
  const tax = subtotal * (Number(taxRate) / 100);
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function formatMoney(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

module.exports = { invoiceNumber, computeTotals, formatMoney };
