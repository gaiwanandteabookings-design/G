(function () {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const mainNav = document.getElementById('main-nav');
  navToggle?.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  mainNav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.getAttribute('data-open') === 'true';
      document.querySelectorAll('.faq-item').forEach((other) => {
        other.setAttribute('data-open', 'false');
        other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.setAttribute('data-open', 'true');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Reveal-on-scroll
  const revealTargets = document.querySelectorAll('.card, .why-item, .process-list li, .area-card, .review-card');
  revealTargets.forEach((el) => el.setAttribute('data-reveal', ''));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => observer.observe(el));

  // Booking form submit
  const form = document.getElementById('booking-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('booking-submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    statusEl.textContent = '';
    statusEl.removeAttribute('data-state');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        form.reset();
        statusEl.textContent = `Thanks! Your request (#${data.id}) was received — our dispatch team will call you shortly to confirm.`;
        statusEl.setAttribute('data-state', 'success');
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', { transaction_id: String(data.id) });
        }
      } else {
        statusEl.textContent = data.error || 'Something went wrong. Please call us instead.';
        statusEl.setAttribute('data-state', 'error');
      }
    } catch (err) {
      statusEl.textContent = 'Network error. Please call us at (305) 555-0199.';
      statusEl.setAttribute('data-state', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request Repair';
    }
  });
})();
