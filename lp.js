/* ========================================
   EMERSON QUARTERS — landing page form
   Depends on script.js (track, sendToBackend, sendToEmail, recordLead).

   The visitor is told the request was sent only after /api/lead accepted it.
   On any failure they get the phone number and WhatsApp instead of a false
   "thanks" — a lead we lose silently is worse than one we never had.
======================================== */
(function () {
  'use strict';

  /* Hero photos: cross-fade. Only the first is in the HTML as a real src, so
     the others do not compete with it for the first paint. */
  (function () {
    var slider = document.getElementById('lp-slider');
    if (!slider) return;
    var imgs = slider.querySelectorAll('img');
    var dots = slider.querySelectorAll('.lp-slider__dot');
    if (imgs.length < 2) return;
    var i = 0, timer = null;
    function load(img) {
      var src = img.getAttribute('data-src');
      if (src) { img.src = src; img.removeAttribute('data-src'); }
    }
    function go(n) {
      load(imgs[n]);
      imgs[i].classList.remove('is-on'); if (dots[i]) dots[i].classList.remove('is-on');
      i = n;
      imgs[i].classList.add('is-on'); if (dots[i]) dots[i].classList.add('is-on');
      load(imgs[(i + 1) % imgs.length]); // warm the next one
    }
    Array.prototype.forEach.call(dots, function (d, n) {
      d.addEventListener('click', function () { clearInterval(timer); go(n); });
    });
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) {
      window.addEventListener('load', function () {
        load(imgs[1]);
        timer = setInterval(function () { go((i + 1) % imgs.length); }, 4500);
      });
    }
  })();

  var form = document.getElementById('lp-form');
  if (!form) return;

  var variant = document.documentElement.getAttribute('data-lp') || 'lp';
  var submit = document.getElementById('lp-submit');
  var errorBox = document.getElementById('lp-error');
  var bar = document.getElementById('lp-bar');
  var card = document.getElementById('request');
  var started = false;
  var backendSent = false;
  var barWatch = null;

  function safeTrack(name, params) {
    try { if (typeof track === 'function') track(name, params); } catch (e) { /* never block the form */ }
  }

  form.addEventListener('input', function () {
    if (started) return;
    started = true;
    safeTrack('form_start', { lead_type: 'tour', lp_variant: variant });
  });

  function showSuccess() {
    card.innerHTML =
      '<div class="lp-success">' +
        '<div class="lp-success__icon">&#10003;</div>' +
        '<h2>Request received</h2>' +
        '<p>We\'ll be in touch within 24 hours.</p>' +
        '<a data-whatsapp href="#" class="lp-btn lp-btn--full lp-btn--wa">Message us on WhatsApp</a>' +
      '</div>';
    if (typeof window.EQ_wireWhatsApp === 'function') window.EQ_wireWhatsApp();
    // The request is in: the bar has nothing left to offer, keep it away.
    if (barWatch) barWatch.disconnect();
    if (bar) bar.classList.add('lp-bar--hidden');
  }

  function showError() {
    errorBox.hidden = false;
    submit.disabled = false;
    submit.textContent = 'Check availability';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = new FormData(form);

    // Honeypot: answer as though it worked, send nothing.
    if (data.get('company')) { showSuccess(); return; }

    if (typeof sendToEmail !== 'function' || typeof recordLead !== 'function') { showError(); return; }

    var name = (data.get('name') || '').trim();
    var parts = name.split(/\s+/);
    var moveIn = data.get('moveIn') || '';

    errorBox.hidden = true;
    submit.disabled = true;
    submit.textContent = 'Sending…';

    // Once per page view: a retry after a failed email must not post twice.
    if (!backendSent) try {
      backendSent = true;
      sendToBackend('tour-requests', {
        firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '',
        email: data.get('email'), phone: data.get('phone') || null,
        property: 'Emerson Quarters', date: moveIn, time: 'morning',
        notes: 'Landing page ' + location.pathname + (moveIn ? ' · move-in ' + moveIn : ''),
        sourceWebsite: 'emersonq.com', city: 'Seattle'
      });
    } catch (err) { /* secondary destination; not a condition */ }

    var sent = sendToEmail('tour', {
      Name: name,
      Email: data.get('email') || '',
      Phone: data.get('phone') || '',
      'Move-in Date': moveIn,
      Source: 'Landing page ' + location.pathname
    });

    recordLead(sent, 'lead_tour', { lead_type: 'tour', lp_variant: variant });

    Promise.resolve(sent).then(function (res) {
      if (res && res.ok) showSuccess(); else showError();
    });
  });

  // Hide the sticky bar while the form itself is on screen.
  if (bar && card && 'IntersectionObserver' in window) {
    barWatch = new IntersectionObserver(function (entries) {
      bar.classList.toggle('lp-bar--hidden', entries[entries.length - 1].isIntersecting);
    }, { threshold: 0.35 });
    barWatch.observe(card);
  }
})();
