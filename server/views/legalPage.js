const { SITE_URL } = require('./layout');

function buildLegalPage(page) {
  const bodyHtml = `
  <nav class="breadcrumb container" aria-label="Breadcrumb">
    <a href="/">Home</a> <span>/</span> <span aria-current="page">${page.heading}</span>
  </nav>

  <section class="section legal-page">
    <div class="container legal-container">
      <h1>${page.heading}</h1>
      <p class="legal-updated">${page.updated}</p>
      <div class="legal-body">${page.bodyHtml}</div>
    </div>
  </section>
`;

  return {
    title: page.pageTitle,
    description: page.metaDescription,
    canonical: `/${page.slug}/`,
    ogTitle: page.pageTitle,
    ogDescription: page.metaDescription,
    bodyHtml,
  };
}

module.exports = { buildLegalPage };
