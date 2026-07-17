(function () {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Live South Florida (Eastern) clock in the hero status card — real data, not staged.
  const localTimeEl = document.getElementById('local-time');
  if (localTimeEl) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
    });
    const tick = () => { localTimeEl.textContent = `${fmt.format(new Date())} local time`; };
    tick();
    setInterval(tick, 15000);
  }

  // Subtle shadow once the page has scrolled past the hero
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    const updateHeaderShadow = () => {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    updateHeaderShadow();
    window.addEventListener('scroll', updateHeaderShadow, { passive: true });
  }

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

  // Reviews carousel
  const carousel = document.getElementById('reviews-carousel');
  if (carousel) {
    const track = carousel.querySelector('.reviews-track');
    const slides = Array.from(carousel.querySelectorAll('.review-slide'));
    const dotsWrap = carousel.querySelector('.reviews-dots');
    let activeIndex = 0;
    let autoTimer;

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Show review ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function setActive(i) {
      activeIndex = i;
      dots.forEach((d, idx) => d.setAttribute('aria-selected', idx === i ? 'true' : 'false'));
    }

    function goTo(i) {
      slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setActive(i);
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => goTo((activeIndex + 1) % slides.length), 6000);
    }
    function stopAuto() { if (autoTimer) clearInterval(autoTimer); }

    const slideObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActive(slides.indexOf(entry.target));
          }
        });
      },
      { root: track, threshold: [0.6] }
    );
    slides.forEach((s) => slideObserver.observe(s));

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', startAuto);
    carousel.addEventListener('touchstart', stopAuto, { passive: true });

    startAuto();
  }

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
      statusEl.textContent = 'Network error. Please call us at (786) 919-7675.';
      statusEl.setAttribute('data-state', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request Repair';
    }
  });

  // Service area map (Leaflet loads with `defer`, so it's ready by DOMContentLoaded,
  // which always fires after deferred scripts even though this file itself is not deferred)
  const mapEl = document.getElementById('service-map');
  if (mapEl) {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof L === 'undefined') return;

      const map = L.map(mapEl, { scrollWheelZoom: false }).setView([26.35, -80.13], 9);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      const pinIcon = L.divIcon({ className: 'map-pin-badge', iconSize: [14, 14] });

      const cities = [
        { name: 'Miami', county: 'Miami-Dade County', coords: [25.7617, -80.1918] },
        { name: 'Fort Lauderdale', county: 'Broward County', coords: [26.1224, -80.1373] },
        { name: 'Boca Raton', county: 'Palm Beach County', coords: [26.3683, -80.1289] },
        { name: 'West Palm Beach', county: 'Palm Beach County', coords: [26.7153, -80.0534] },
      ];

      const latlngs = cities.map((c) => c.coords);
      L.polyline(latlngs, { color: '#35d0e0', weight: 2, dashArray: '6 8', opacity: 0.8 }).addTo(map);

      cities.forEach((c) => {
        L.marker(c.coords, { icon: pinIcon })
          .addTo(map)
          .bindPopup(`<strong>${c.name}</strong><br>${c.county}`);
      });

      map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] });
    });
  }
})();
