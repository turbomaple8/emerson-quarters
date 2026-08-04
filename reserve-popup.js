/* ── Reserve Popup – Emerson Quarters ── */
(function () {
  if (sessionStorage.getItem('reservePopupDismissed')) return;

  var BACKEND_API_URL = 'https://coliville-backend-626057356331.us-east1.run.app';
  var BACKEND_PROJECT_ID = 'emerson';

  var style = document.createElement('style');
  style.textContent = '\
    @keyframes rpSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }\
    .rp-overlay { position:fixed; inset:0; z-index:10000; display:flex; align-items:center; justify-content:center; padding:1rem; }\
    .rp-backdrop { position:absolute; inset:0; background:rgba(10,28,43,0.5); }\
    .rp-card { position:relative; width:100%; max-width:380px; border-radius:16px; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.3); background:#fff; animation:rpSlideUp 0.4s ease-out; }\
    .rp-close { position:absolute; right:12px; top:12px; z-index:2; background:none; border:none; cursor:pointer; padding:6px; border-radius:50%; transition:background 0.2s; color:rgba(255,255,255,0.8); }\
    .rp-close:hover { background:rgba(0,0,0,0.1); }\
    .rp-close--dark { color:#999; }\
    .rp-header { padding:20px 24px; text-align:center; color:#fff; background:linear-gradient(135deg,#1B3A4B 0%,#0F2637 100%); }\
    .rp-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.1); border-radius:50px; padding:4px 12px; font-size:12px; font-weight:500; margin-bottom:8px; }\
    .rp-pulse { width:6px; height:6px; border-radius:50%; background:#34D399; animation:rpPulse 2s infinite; }\
    @keyframes rpPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }\
    .rp-title { font-size:18px; font-weight:700; margin:0; }\
    .rp-sub { font-size:14px; margin:4px 0 0; opacity:0.7; }\
    .rp-body { padding:20px 24px; text-align:center; }\
    .rp-body p { font-size:14px; color:#5A6570; line-height:1.6; margin:0; }\
    .rp-body strong { color:#1A1A1A; }\
    .rp-cta { display:block; width:100%; margin-top:16px; padding:12px; border:none; border-radius:12px; font-size:14px; font-weight:600; color:#fff; background:#E07A3A; cursor:pointer; transition:filter 0.2s; }\
    .rp-cta:hover { filter:brightness(1.1); }\
    .rp-hint { font-size:11px; color:#8C939A; margin-top:10px; }\
    .rp-options { padding:12px 24px 24px; display:flex; flex-direction:column; gap:12px; }\
    .rp-option { display:flex; align-items:center; gap:14px; padding:14px 18px; border:1px solid #DDE0E4; border-radius:12px; background:#fff; cursor:pointer; text-align:left; transition:box-shadow 0.2s; }\
    .rp-option:hover { box-shadow:0 4px 12px rgba(0,0,0,0.08); }\
    .rp-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }\
    .rp-icon--primary { background:#1B3A4B; color:#fff; }\
    .rp-icon--muted { background:#F7F6F3; color:#1B3A4B; }\
    .rp-option-title { font-size:14px; font-weight:600; color:#1A1A1A; margin:0; }\
    .rp-option-desc { font-size:12px; color:#8C939A; margin:2px 0 0; }\
    .rp-center { text-align:center; padding:16px 24px 8px; }\
    .rp-center h3 { font-size:18px; font-weight:700; color:#1A1A1A; margin:0; }\
    .rp-center p { font-size:13px; color:#8C939A; margin:4px 0 0; }\
    @media (max-width:480px) { .rp-overlay { align-items:flex-end; } }\
  ';
  document.head.appendChild(style);

  var overlayEl = null;

  function closeSvg() {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
  }

  function dismiss() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    sessionStorage.setItem('reservePopupDismissed', '1');
  }

  function render(html) {
    if (overlayEl) overlayEl.remove();
    overlayEl = document.createElement('div');
    overlayEl.className = 'rp-overlay';
    overlayEl.innerHTML = '<div class="rp-backdrop"></div>' + html;
    document.body.appendChild(overlayEl);
    overlayEl.querySelector('.rp-backdrop').addEventListener('click', dismiss);
    var closeBtn = overlayEl.querySelector('.rp-close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
  }

  function showBanner() {
    render('\
      <div class="rp-card">\
        <button class="rp-close" aria-label="Close">' + closeSvg() + '</button>\
        <div class="rp-header">\
          <div class="rp-badge"><span class="rp-pulse"></span> Rooms available</div>\
          <h3 class="rp-title">Reserve Now</h3>\
          <p class="rp-sub">No payment or signup required.</p>\
        </div>\
        <div class="rp-body">\
          <p>Make an instant reservation in just a few clicks. Your room will be held for <strong>24 hours</strong> - completely free.</p>\
          <button class="rp-cta" id="rpBannerCta">Reserve a Room - Free</button>\
          <p class="rp-hint">Takes less than 30 seconds</p>\
        </div>\
      </div>\
    ');
    if (typeof track === 'function') track('reserve_prompt_shown', { trigger: document.body.classList.contains('page-body') ? 'scroll_60' : 'timer_10s' });
    document.getElementById('rpBannerCta').addEventListener('click', function () {
      if (typeof track === 'function') track('reserve_prompt_click', {});
      showChoose();
    });
  }

  function showChoose() {
    render('\
      <div class="rp-card">\
        <button class="rp-close rp-close--dark" aria-label="Close">' + closeSvg() + '</button>\
        <div class="rp-center"><h3>How would you like to reserve?</h3><p>Pick an option to continue</p></div>\
        <div class="rp-options">\
          <button class="rp-option" id="rpAny">\
            <div class="rp-icon rp-icon--primary"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>\
            <div><p class="rp-option-title">Any Room</p><p class="rp-option-desc">We\'ll match you with the best available</p></div>\
          </button>\
          <button class="rp-option" id="rpSelect">\
            <div class="rp-icon rp-icon--muted"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>\
            <div><p class="rp-option-title">Select a Room</p><p class="rp-option-desc">Choose a specific room type to reserve</p></div>\
          </button>\
        </div>\
      </div>\
    ');
    document.getElementById('rpAny').addEventListener('click', function () {
      if (typeof track === 'function') track('reserve_prompt_option', { option: 'any_room' });
      openReserveForm();
    });
    document.getElementById('rpSelect').addEventListener('click', function () {
      if (typeof track === 'function') track('reserve_prompt_option', { option: 'select_room' });
      openReserveForm();
    });
  }

  function openReserveForm() {
    dismiss();
    var existingModal = document.getElementById('reserveModal');
    if (existingModal) {
      var propInput = document.getElementById('reservePropertyInput');
      var roomInput = document.getElementById('reserveRoomInput');
      if (propInput) propInput.value = 'Emerson Quarters';
      if (roomInput) roomInput.value = 'Any Room';
      var ctx = document.getElementById('reserveContext');
      var propLabel = document.getElementById('reservePropertyLabel');
      var roomLabel = document.getElementById('reserveRoomLabel');
      if (ctx && propLabel) {
        propLabel.textContent = 'Emerson Quarters';
        if (roomLabel) roomLabel.textContent = 'Any Available Room';
        ctx.style.display = 'block';
      }
      existingModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  // Homepage: fire on a timer, as before.
  // Article pages (body.page-body): fire on reading depth instead. Someone ten
  // seconds into a long guide is reading it, and covering the text at that
  // moment is both bad for them and the kind of intrusive interstitial search
  // engines penalise. Waiting for ~60% scroll means we only interrupt readers
  // who actually finished most of the page.
  if (document.body.classList.contains('page-body')) {
    var fired = false;
    var onScroll = function () {
      if (fired) return;
      var scrolled = window.scrollY + window.innerHeight;
      if (scrolled / document.documentElement.scrollHeight >= 0.6) {
        fired = true;
        window.removeEventListener('scroll', onScroll);
        showBanner();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  } else {
    setTimeout(showBanner, 10000);
  }
})();
