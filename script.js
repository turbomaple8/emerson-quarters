/* ========================================
   EMERSON QUARTERS — Queen Anne, Seattle
   Main JavaScript
======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollAnimations();
  initModals();
  initMobileMenu();
  initSmoothScroll();
  initFAQ();
  initGalleryLightbox();
});

/* ---- Navigation Scroll Effect ---- */
function initNavigation() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  function handleScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* ---- Mobile Menu ---- */
function initMobileMenu() {
  const hamburger = document.querySelector('.nav__hamburger');
  const mobileMenu = document.querySelector('.nav__mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });
}

/* ---- Scroll Animations ---- */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ---- Smooth Scroll for Anchor Links ---- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const id = this.getAttribute('href');
      if (id === '#' || id.startsWith('#modal')) return;

      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ---- FAQ Accordion ---- */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });
}

/* ---- Gallery Lightbox ---- */
function initGalleryLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  if (!lightbox || !lightboxImg) return;

  document.querySelectorAll('.gallery-grid__img').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  });
}

/* ---- Modals ---- */
function initModals() {
  // Tour modal
  document.querySelectorAll('[data-modal="tour"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('tourModal');
    });
  });

  // Apply modal
  document.querySelectorAll('[data-modal="apply"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('applyModal');
    });
  });

  // Reserve modal
  document.querySelectorAll('[data-modal="reserve"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const property = btn.getAttribute('data-reserve-property') || '';
      const room = btn.getAttribute('data-reserve-room') || '';

      const propInput = document.getElementById('reservePropertyInput');
      const roomInput = document.getElementById('reserveRoomInput');
      if (propInput) propInput.value = property;
      if (roomInput) roomInput.value = room;

      const ctx = document.getElementById('reserveContext');
      const propLabel = document.getElementById('reservePropertyLabel');
      const roomLabel = document.getElementById('reserveRoomLabel');
      if (ctx && (property || room)) {
        ctx.style.display = 'block';
        if (propLabel) propLabel.textContent = property;
        if (roomLabel) roomLabel.textContent = room;
      } else if (ctx) {
        ctx.style.display = 'none';
      }

      openModal('reserveModal');
    });
  });

  // Close modals
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAllModals();
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

/* ---- Analytics ----
   Every call is wrapped: a tracking failure must never stop a lead from being
   submitted. If gtag is blocked, still loading, or throws, the form carries on.
   source_page is the point of the whole thing — it tells us which guide
   produced an enquiry, not just that one happened. */

const LEAD_TYPES = { tourModal: 'tour', applyModal: 'apply', reserveModal: 'reserve' };

function track(name, params) {
  try {
    if (typeof gtag !== 'function') return;
    gtag('event', name, Object.assign({
      source_page: location.pathname,
      page_group: location.pathname === '/' ? 'home' : 'guide'
    }, params || {}));
  } catch (e) { /* analytics is never allowed to break the form */ }
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (LEAD_TYPES[id]) track('form_start', { lead_type: LEAD_TYPES[id] });
  }
}

// Phone taps are a conversion too, and on mobile they are often the only one.
document.addEventListener('click', function (e) {
  const tel = e.target.closest && e.target.closest('a[href^="tel:"]');
  if (tel) track('contact_phone', { method: 'phone' });
});

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

/* ---- Backend API ---- */
const BACKEND_API_URL = 'https://coliville-backend-626057356331.us-east1.run.app';
const BACKEND_PROJECT_ID = 'emerson';

function sendToBackend(endpoint, payload) {
  fetch(`${BACKEND_API_URL}/v1/public/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Project-Id': BACKEND_PROJECT_ID },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

/* ---- Lead Email ---- */
// Our own serverless function (api/lead.js), which sends through the Private
// Email mailbox info@emersonq.com. Until this existed the backend call above
// was the only destination for a lead, and it went to a project that was never
// registered — so every enquiry was silently discarded.
const MAIL_ENDPOINT = '/api/lead';

function sendToEmail(kind, fields) {
  fetch(MAIL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: kind, fields: fields, replyTo: fields.Email || '' })
  }).catch(() => {});
}

/* ---- Form Handling ---- */

function handleTourForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const nameParts = (data.get('name') || '').trim().split(/\s+/);

  sendToBackend('tour-requests', {
    firstName: nameParts[0] || '', lastName: nameParts.slice(1).join(' ') || '',
    email: data.get('email'), phone: data.get('phone') || null,
    property: 'Emerson Quarters', date: data.get('date') || '',
    time: 'morning', notes: data.get('message') || null,
    sourceWebsite: 'emersonq.com', city: 'Seattle'
  });

  sendToEmail('tour', {
    Name: (data.get('name') || '').trim(),
    Email: data.get('email') || '',
    Phone: data.get('phone') || '',
    'Preferred Date': data.get('date') || '',
    Message: data.get('message') || ''
  });

  track('generate_lead', { lead_type: 'tour' });

  form.innerHTML = `
    <div class="success-message">
      <div class="success-message__icon">&#10003;</div>
      <h3>Viewing Scheduled</h3>
      <p style="color: var(--text-light); margin-top: 0.5rem;">We'll be in touch within 24 hours to confirm your visit.</p>
    </div>
  `;
}

function handleApplyForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  sendToBackend('applications', {
    fullName: `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim(),
    email: data.get('email'), phone: data.get('phone') || null,
    property: 'Emerson Quarters', roomType: data.get('roomType') || null,
    moveInDate: data.get('moveIn') || null, leaseDuration: data.get('duration') || null,
    aboutYou: data.get('message') || null,
    sourceWebsite: 'emersonq.com', city: 'Seattle'
  });

  sendToEmail('apply', {
    Name: `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim(),
    Email: data.get('email') || '',
    Phone: data.get('phone') || '',
    'Room Type': data.get('roomType') || '',
    'Move-in Date': data.get('moveIn') || '',
    'Lease Duration': data.get('duration') || '',
    'About': data.get('message') || ''
  });

  track('generate_lead', { lead_type: 'apply' });

  form.innerHTML = `
    <div class="success-message">
      <div class="success-message__icon">&#10003;</div>
      <h3>Application Received</h3>
      <p style="color: var(--text-light); margin-top: 0.5rem;">Our team will review your details and respond within 48 hours.</p>
    </div>
  `;
}

function handleReserveForm(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  const fullName = `${data.get('firstName') || ''} ${data.get('lastName') || ''}`.trim();
  const email = data.get('email');
  const phone = data.get('phone');
  const moveIn = data.get('moveIn');
  const property = data.get('reserveProperty') || 'Emerson Quarters';
  const room = data.get('reserveRoom') || '';

  sendToBackend('reservations', {
    fullName, email, phone: phone || null, moveInDate: moveIn || null,
    property: property || null,
    propertySlug: 'emerson-quarters',
    roomName: room || null, sourceWebsite: 'emersonq.com', city: 'Seattle'
  });

  sendToEmail('reserve', {
    Name: fullName,
    Email: email || '',
    Phone: phone || '',
    'Move-in Date': moveIn || '',
    Property: property,
    Room: room
  });

  track('generate_lead', { lead_type: 'reserve', room_name: room || '(any)' });

  const ctx = document.getElementById('reserveContext');
  if (ctx) ctx.style.display = 'none';

  form.parentElement.innerHTML = `
    <div style="text-align: center; padding: 1.5rem 0;">
      <div style="width: 56px; height: 56px; border-radius: 50%; background: #ecfdf5; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 style="margin: 0 0 0.25rem;">You're all set!</h3>
      <p style="color: var(--accent, #b08968); font-weight: 500; margin: 0 0 1rem;">Your room is reserved for 24 hours.</p>
      <div style="background: var(--cream, #f5f0eb); border-radius: 8px; padding: 0.6rem 1rem; margin-bottom: 1rem;">
        <strong>Emerson Quarters</strong>
        ${room ? '<br><span style="font-size: 0.85rem; color: var(--text-light, #888);">' + room + '</span>' : ''}
      </div>
      <p style="color: var(--text-light, #888); font-size: 0.9rem;">No payment was charged. A member of our team will reach out shortly to help you complete your booking.</p>
      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 0.5rem 1rem; margin-top: 0.75rem;">
        <p style="font-size: 0.75rem; color: #92400e; margin: 0;">This hold expires in 24 hours. If not confirmed, the room is automatically released.</p>
      </div>
    </div>
  `;
}

/* ========================================
   WhatsApp Floating Button — injected on every page
======================================== */
(function () {
  var WHATSAPP_URL = 'https://wa.me/14256839032';
  var ICON = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M19.11 17.36c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.22-.62.07-.29-.14-1.21-.45-2.3-1.42-.85-.76-1.42-1.7-1.59-1.98-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.4 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.91 4.34.69.3 1.22.47 1.64.61.69.22 1.31.19 1.81.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM16.03 27.06h-.01a10.9 10.9 0 0 1-5.55-1.52l-.4-.24-4.13 1.08 1.1-4.02-.26-.41a10.86 10.86 0 0 1-1.67-5.82c0-6.02 4.9-10.92 10.93-10.92a10.85 10.85 0 0 1 10.91 10.93c0 6.02-4.9 10.92-10.92 10.92zm9.3-20.22A13.06 13.06 0 0 0 16.02 3C8.83 3 3 8.83 3 16.02c0 2.3.6 4.54 1.74 6.52L3 29l6.6-1.73a13.02 13.02 0 0 0 6.42 1.68h.01c7.19 0 13.03-5.84 13.03-13.03 0-3.48-1.36-6.75-3.73-9.08z"/></svg>';

  function injectWhatsAppFab() {
    if (document.querySelector('.whatsapp-fab')) return;
    var a = document.createElement('a');
    a.className = 'whatsapp-fab';
    a.href = WHATSAPP_URL;
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', 'Chat with us on WhatsApp');
    a.innerHTML = ICON;
    a.addEventListener('click', function () {
      // Routed through track() so this carries source_page like every other
      // conversion — otherwise a WhatsApp enquiry cannot be attributed to the
      // guide that produced it.
      track('whatsapp_click', { link_url: WHATSAPP_URL, method: 'whatsapp' });
    });
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWhatsAppFab);
  } else {
    injectWhatsAppFab();
  }
})();
