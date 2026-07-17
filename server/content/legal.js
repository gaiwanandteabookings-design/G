const { SITE_NAME, EMAIL, PHONE_DISPLAY } = require('../views/layout');

const privacyPolicy = {
  slug: 'privacy-policy',
  navLabel: 'Privacy Policy',
  pageTitle: `Privacy Policy | ${SITE_NAME}`,
  metaDescription: `How ${SITE_NAME} collects, uses, and protects information submitted through our website and booking form.`,
  heading: 'Privacy Policy',
  updated: 'This policy was last updated July 2026.',
  bodyHtml: `
    <p>${SITE_NAME} ("we," "us," or "our") operates this website. This page explains what
    information we collect when you use it, how we use it, and the choices you have.</p>

    <h3>Information We Collect</h3>
    <p>When you submit our booking form, we collect the information you provide: name,
    phone number, email address (optional), business name (optional), service address,
    equipment type, urgency, preferred date/time, and a description of the issue. We do
    not collect payment information through this website.</p>

    <h3>How We Use Information</h3>
    <p>We use the information you submit to contact you, schedule and dispatch a
    technician, and provide the repair service you requested. We may also use your email
    to send you service-related updates, such as a confirmation that your request was
    received.</p>

    <h3>Information Sharing</h3>
    <p>We do not sell your personal information. We may share it with service providers
    who help us operate our business (for example, email delivery services), solely for
    the purpose of providing our service to you. We may disclose information if required
    to do so by law.</p>

    <h3>Data Retention</h3>
    <p>We retain booking request information for as long as reasonably necessary to
    provide our services, maintain business records, and comply with legal obligations.</p>

    <h3>Cookies &amp; Analytics</h3>
    <p>This site may use standard web analytics tools to understand how visitors use the
    site (for example, which pages are viewed). These tools may use cookies or similar
    technology. We do not use this data to identify you personally.</p>

    <h3>Your Choices</h3>
    <p>You can request a copy of the information we have on file for you, or ask us to
    delete it, by contacting us using the details below — subject to our legitimate need
    to retain business records.</p>

    <h3>Children's Privacy</h3>
    <p>This website and our services are intended for business customers and are not
    directed to children.</p>

    <h3>Changes to This Policy</h3>
    <p>We may update this policy from time to time. The date above reflects the most
    recent update.</p>

    <h3>Contact Us</h3>
    <p>Questions about this policy? Reach us at <a href="mailto:${EMAIL}">${EMAIL}</a> or
    <a href="tel:+13055550199">${PHONE_DISPLAY}</a>.</p>
  `,
};

const termsOfService = {
  slug: 'terms-of-service',
  navLabel: 'Terms of Service',
  pageTitle: `Terms of Service | ${SITE_NAME}`,
  metaDescription: `The terms that govern use of the ${SITE_NAME} website and booking requests submitted through it.`,
  heading: 'Terms of Service',
  updated: 'These terms were last updated July 2026.',
  bodyHtml: `
    <p>These Terms of Service govern your use of this website, operated by ${SITE_NAME}.
    By using this site or submitting a booking request, you agree to these terms.</p>

    <h3>Booking Requests</h3>
    <p>Submitting the booking form on this site is a request for service, not a
    guaranteed or confirmed appointment. Our dispatch team will contact you to confirm
    the appointment time, scope, and pricing before any work is performed.</p>

    <h3>Pricing &amp; Quotes</h3>
    <p>Any pricing information provided is an estimate until a technician has diagnosed
    the issue on-site. A flat-rate quote will be presented for your approval before any
    repair work begins.</p>

    <h3>Website Availability</h3>
    <p>We aim to keep this website available and accurate but do not guarantee
    uninterrupted access, and we may update or change site content, including pricing
    references and service descriptions, at any time.</p>

    <h3>Limitation of Liability</h3>
    <p>To the fullest extent permitted by law, ${SITE_NAME} is not liable for indirect,
    incidental, or consequential damages arising from use of this website. This does not
    limit any warranty we separately provide in writing for completed repair work.</p>

    <h3>Intellectual Property</h3>
    <p>The content, design, and branding on this website belong to ${SITE_NAME} and may
    not be copied or reused without permission.</p>

    <h3>Governing Law</h3>
    <p>These terms are governed by the laws of the State of Florida, without regard to
    conflict-of-law principles.</p>

    <h3>Changes to These Terms</h3>
    <p>We may update these terms from time to time. The date above reflects the most
    recent update.</p>

    <h3>Contact Us</h3>
    <p>Questions about these terms? Reach us at <a href="mailto:${EMAIL}">${EMAIL}</a> or
    <a href="tel:+13055550199">${PHONE_DISPLAY}</a>.</p>
  `,
};

module.exports = { privacyPolicy, termsOfService };
