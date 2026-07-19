const { SITE_NAME, EMAIL, PHONE_DISPLAY, PHONE_TEL } = require('../views/layout');

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

    <p style="padding:14px 18px;background:#eef2f6;border-radius:8px;font-weight:600;">
    We do not sell, rent, or trade your personal information to anyone. Full stop.</p>

    <h3>Information We Collect</h3>
    <p>When you submit our booking form or chat with our website assistant, we collect the
    information you provide: name, phone number, email address, business name (optional),
    service address, equipment type, urgency, preferred date/time, a description of the
    issue, and — if you choose to attach one — a photo of the equipment or problem. We do
    not collect payment information through this website.</p>

    <h3>How We Use Information</h3>
    <p>We use the information you submit to contact you, schedule and dispatch a
    technician, and provide the repair service you requested. By submitting your phone
    number, you agree that we (or our dispatch team) may call or text you about your
    service request; this isn't a condition of any purchase, and standard message/data
    rates may apply. We use your email to send you service-related messages, such as a
    confirmation that your request was received and, if applicable, an invoice.</p>

    <h3>Information Sharing</h3>
    <p>We do not sell your personal information, and we never share it for anyone else's
    marketing purposes. We do share it with a small number of service providers who help
    us operate our business, strictly to deliver the service you requested — for example:
    an email delivery provider to send booking confirmations and invoices, and a database
    host to store booking and invoice records securely. These providers are only permitted
    to use your information to perform the service we've hired them for. We may also
    disclose information if required to do so by law, or to protect our rights, property,
    or safety, or that of our customers.</p>

    <h3>Data Security</h3>
    <p>Information submitted through this site travels over an encrypted (HTTPS)
    connection. We apply reasonable technical safeguards — including access controls on
    our admin systems and rate-limiting on public forms — to help protect your
    information from unauthorized access. No method of transmission or storage is 100%
    secure, but we take reasonable steps consistent with Florida law to protect your data
    and will notify affected individuals as required by law in the event of a breach
    involving personal information.</p>

    <h3>Data Retention</h3>
    <p>We retain booking request information for as long as reasonably necessary to
    provide our services, maintain business records, and comply with legal obligations.</p>

    <h3>Cookies &amp; Analytics</h3>
    <p>This site may use standard web analytics tools (such as Google Analytics) to
    understand how visitors use the site — for example, which pages are viewed. These
    tools may use cookies or similar technology and may collect information such as your
    general location, device type, and browsing behavior on this site. We do not use this
    data to identify you personally, and it is not linked to the information you submit
    through our booking form.</p>

    <h3>Your Choices &amp; Rights</h3>
    <p>You can request a copy of the information we have on file for you, ask us to
    correct it, or ask us to delete it, by contacting us using the details below —
    subject to our legitimate need to retain certain business records (for example,
    invoices, for accounting purposes). Depending on where you live, you may have
    additional rights under state privacy law; contact us and we'll do our best to
    honor your request regardless of where you're located.</p>

    <h3>Children's Privacy</h3>
    <p>This website and our services are intended for business customers and are not
    directed to children. We do not knowingly collect personal information from
    children under 13.</p>

    <h3>Changes to This Policy</h3>
    <p>We may update this policy from time to time. The date above reflects the most
    recent update.</p>

    <h3>Contact Us</h3>
    <p>Questions about this policy, or want to access/delete your information? Reach us
    at <a href="mailto:${EMAIL}">${EMAIL}</a> or
    <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>.</p>
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

    <h3>Communications Consent</h3>
    <p>By submitting the booking form or chatting with our website assistant, you consent
    to receive calls, texts, and emails from us related to your service request
    (confirmations, scheduling, and invoices). Consent is not a condition of any purchase.
    Message and data rates may apply to text messages. See our
    <a href="/privacy-policy">Privacy Policy</a> for details on how we handle your
    information.</p>

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
    <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>.</p>
  `,
};

const accessibilityStatement = {
  slug: 'accessibility',
  navLabel: 'Accessibility',
  pageTitle: `Accessibility Statement | ${SITE_NAME}`,
  metaDescription: `${SITE_NAME}'s commitment to a website that's usable by everyone, including people who use assistive technology.`,
  heading: 'Accessibility Statement',
  updated: 'This statement was last updated July 2026.',
  bodyHtml: `
    <p>${SITE_NAME} is committed to making this website usable by everyone, including
    people who use assistive technology such as screen readers, screen magnifiers, or
    keyboard-only navigation.</p>

    <h3>What We've Done</h3>
    <p>This site is built with accessibility in mind: descriptive alt text on images,
    labeled form fields, visible keyboard focus indicators, a "skip to content" link,
    sufficient color contrast on text, and support for browser zoom and text resizing.
    We generally aim to conform to the <strong>Web Content Accessibility Guidelines
    (WCAG) 2.1, Level AA</strong>.</p>

    <h3>Ongoing Effort</h3>
    <p>Accessibility is an ongoing effort, not a one-time fix. If you encounter any part
    of this site that's difficult to use with assistive technology, we want to know so
    we can fix it.</p>

    <h3>Alternative Ways to Reach Us</h3>
    <p>If any part of this website is not accessible to you, you can always reach us
    directly by phone at <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a> to book a repair
    or ask a question — you don't need to use the website at all.</p>

    <h3>Contact Us</h3>
    <p>Found an accessibility issue, or need this information in another format? Contact
    us at <a href="mailto:${EMAIL}">${EMAIL}</a> or
    <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a> and we'll do our best to help
    promptly.</p>
  `,
};

module.exports = { privacyPolicy, termsOfService, accessibilityStatement };
