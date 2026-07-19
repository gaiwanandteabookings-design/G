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

  // Phone fields: strip anything that isn't a digit or common formatting
  // character (+, (, ), -, space) as the user types, so letters/symbols
  // simply can't end up in a phone number — not just a post-submit error.
  // Plain 10-digit US numbers are also auto-formatted as (305) 555-0100 as you
  // type; a leading "+" (international number) is left unformatted but still
  // stripped of invalid characters.
  function formatPhoneValue(rawValue) {
    const cleaned = rawValue.replace(/[^\d+()\-.\s]/g, '');
    if (cleaned.trim().startsWith('+')) return cleaned;
    let digits = cleaned.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('1')) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    if (!digits) return '';
    if (digits.length < 4) return `(${digits}`;
    if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  function attachPhoneFormatting(input) {
    input.setAttribute('inputmode', 'tel');
    input.addEventListener('input', () => {
      const cursorPos = input.selectionStart;
      const digitsBeforeCursor = input.value.slice(0, cursorPos).replace(/\D/g, '').length;
      const formatted = formatPhoneValue(input.value);
      if (formatted === input.value) return;
      input.value = formatted;
      let count = 0;
      let newPos = formatted.length;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) count++;
        if (count === digitsBeforeCursor) { newPos = i + 1; break; }
      }
      if (digitsBeforeCursor === 0) newPos = 0;
      input.setSelectionRange(newPos, newPos);
    });
  }
  window.attachPhoneFormatting = attachPhoneFormatting;
  document.querySelectorAll('input[type="tel"]').forEach(attachPhoneFormatting);

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

  // Equipment category tabs
  const equipmentTabs = document.querySelectorAll('.equipment-tab');
  if (equipmentTabs.length) {
    const panels = document.querySelectorAll('.equipment-panel');
    equipmentTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        equipmentTabs.forEach((t) => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-selected', String(t === tab));
        });
        panels.forEach((p) => {
          p.hidden = p.getAttribute('data-panel') !== target;
        });
      });
    });
  }

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
      // Scroll only the carousel track itself (horizontal), never the page —
      // element.scrollIntoView() here would also drag the whole page's vertical
      // scroll position toward the carousel whenever it's off-screen.
      track.scrollTo({ left: slides[i].offsetLeft, behavior: 'smooth' });
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

    // Only auto-advance while the carousel is actually on screen.
    let carouselVisible = false;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          carouselVisible = entry.isIntersecting;
          if (carouselVisible) startAuto();
          else stopAuto();
        });
      },
      { threshold: 0.3 }
    );
    visibilityObserver.observe(carousel);

    carousel.addEventListener('mouseenter', stopAuto);
    carousel.addEventListener('mouseleave', () => { if (carouselVisible) startAuto(); });
    carousel.addEventListener('touchstart', stopAuto, { passive: true });
  }

  // Exhaust fan — blades rotate as you scroll past it, driven by scroll delta
  // rather than a fixed animation so it actually tracks how far you've scrolled.
  const fanBlades = document.querySelector('.fan-blades');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fanBlades && !prefersReducedMotion) {
    const fanScene = document.querySelector('.fan-scene');
    let fanVisible = false;
    let bladeDeg = 0;
    let lastScrollY = window.scrollY;

    function updateFan() {
      const currentScrollY = window.scrollY;
      if (fanVisible) {
        bladeDeg += (currentScrollY - lastScrollY) * 1.8;
        // Native SVG transform (not CSS) so it always rotates around the exact
        // (120, 120) hub point — CSS transform-origin on an asymmetric group of
        // shapes uses the bounding box center instead, which drifts sideways.
        fanBlades.setAttribute('transform', `rotate(${bladeDeg} 120 120)`);
      }
      lastScrollY = currentScrollY;
    }

    const fanObserver = new IntersectionObserver(
      (entries) => { entries.forEach((entry) => { fanVisible = entry.isIntersecting; }); },
      { threshold: 0 }
    );
    fanObserver.observe(fanScene);

    window.addEventListener('scroll', updateFan, { passive: true });
  }

  // Cascading "specific equipment" picker — populates from the category chosen above,
  // with a trailing "Other — please specify" option that reveals a free-text field.
  const equipmentTypeSelect = document.getElementById('equipmentType');
  if (equipmentTypeSelect) {
    const dataEl = document.getElementById('equipment-data');
    const categories = dataEl ? JSON.parse(dataEl.textContent) : [];
    const detailWrap = document.getElementById('equipment-detail-wrap');
    const detailSelect = document.getElementById('equipment-detail-select');
    const otherWrap = document.getElementById('equipment-detail-other-wrap');
    const otherInput = document.getElementById('equipment-detail-other');
    const hiddenDetail = document.getElementById('equipmentDetail');
    const OTHER_VALUE = '__other__';

    function syncHiddenDetail() {
      if (!otherWrap.hidden) {
        hiddenDetail.value = otherInput.value.trim();
      } else if (!detailWrap.hidden && detailSelect.value && detailSelect.value !== OTHER_VALUE) {
        hiddenDetail.value = detailSelect.value;
      } else {
        hiddenDetail.value = '';
      }
    }

    equipmentTypeSelect.addEventListener('change', () => {
      const category = categories.find((c) => c.slug === equipmentTypeSelect.value);
      otherWrap.hidden = true;
      otherInput.value = '';

      if (category) {
        detailSelect.innerHTML =
          `<option value="" disabled selected>Select ${category.label.toLowerCase()}</option>` +
          category.items.map((item) => `<option value="${item}">${item}</option>`).join('') +
          `<option value="${OTHER_VALUE}">Other — please specify</option>`;
        detailWrap.hidden = false;
      } else {
        detailWrap.hidden = true;
        // The top-level "Other" option has no item list — go straight to free text.
        otherWrap.hidden = equipmentTypeSelect.value !== 'other';
      }
      syncHiddenDetail();
    });

    detailSelect.addEventListener('change', () => {
      otherWrap.hidden = detailSelect.value !== OTHER_VALUE;
      if (!otherWrap.hidden) otherInput.focus();
      syncHiddenDetail();
    });

    otherInput.addEventListener('input', syncHiddenDetail);
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
