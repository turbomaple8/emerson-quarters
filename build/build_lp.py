#!/usr/bin/env python3
"""
Emerson Quarters — paid-traffic landing pages.

One template, one JSON file per variant (lp/*.json) -> /<slug>/index.html.
These pages are for ad traffic only: no site navigation, one form, noindex,
and they are deliberately left out of sitemap.xml (build.py owns that file).

The form posts through the same path as the site's tour form (script.js:
sendToEmail -> /api/lead, recordLead -> GA4 lead_tour + Google Ads + Meta),
so a landing-page lead is counted under exactly the same delivery rule.

Every claim on these pages is already stated on the homepage. Do not add a
fact here that the main site does not make.

Usage:
    python3 build/build_lp.py            # build all variants
    python3 build/build_lp.py --check    # verify generated files are up to date
"""
import glob
import html
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://www.emersonq.com"

FAQ = {
    "included": ("What's included in the rent?",
                 "Your rent covers a fully furnished private bedroom with a bed, desk, chair, TV, and storage. "
                 "Utilities (water, electricity, heat, garbage) and high-speed WiFi are all included. "
                 "You share the kitchen and bathroom with your roommates in the unit."),
    "byroom": ("How does renting by the room work?",
               "You sign an individual lease for your private bedroom. You're only responsible for your room's rent, "
               "not the entire unit. We handle roommate matching and each person has their own lease agreement."),
    "lease": ("What is the lease term?",
              "Standard leases run 6 or 12 months. Shorter terms may be available depending on availability. "
              "Contact us to discuss your needs."),
    "spu": ("How close is Seattle Pacific University?",
            "Emerson Quarters is about a 3-minute walk from Seattle Pacific University's campus."),
    "tour": ("Can I tour the property before signing a lease?",
             "Absolutely. Send the form on this page or call us at (253) 263-0612 and we'll arrange a walkthrough."),
}

HERO_SLIDES = [
    ("465cc780942a3d34a7accc5221cb5db2.webp", "Furnished bedroom at Emerson Quarters"),
    ("42a527af61d7b64ef54fbe3eebc2a0d3.webp", "Bedroom with blue accents and desk"),
    ("de9835a1adc66fd980a66d71b1b1fe7a.webp", "Bedroom with balcony door"),
    ("fcfc8f577103cb71df9192eb07c8895b.webp", "Bedroom with workspace"),
]

INSIDE = [
    ("3a85987b6a3de365df01b88fce938284.webp", "Bedroom with wall-mounted TV"),
    ("f914f4ed7f58e4ec9c0c0de642a46f30.webp", "Bedroom with balcony view"),
    ("abc1502e6f8fb9ce10f849ca12f5307d.webp", "Bedroom with desk setup"),
    ("1e159adb8a10e8c5b1d27ce2dbdff900.webp", "Kitchen with full appliances"),
    ("a4e7cde6c0dfab7c21588346daa751f4.webp", "Updated bathroom"),
    ("10c5fe84cbf9d60e95a18c45a6d5350f.webp", "Bedroom with closet"),
]

AROUND = [
    ("hero-exterior-1024.webp", "Emerson Quarters exterior", 1024, 683),
    ("lp/ac9463eecd75e3c3fc616a1bc030abdc-960.webp", "Balcony neighborhood view", 960, 640),
    ("lp/c5b8800ba067690a87f958574cfe9396-960.webp", "Balcony city view", 960, 640),
]

CARDS = [
    ("Fully furnished", "bed, desk, chair, TV and storage"),
    ("All utilities included", "water, electricity, heat, garbage and WiFi"),
    ("Individual lease", "6 or 12 months, your room only"),
]

NEARBY = [
    ("Seattle Pacific University", "3 min walk"),
    ("Metro bus stops", "2 min walk"),
    ("Queen Anne Ave shops & dining", "8 min walk"),
    ("Fremont", "5 min drive"),
    ("Downtown Seattle", "10 min drive"),
]

NO_MORE = [
    ("No furniture run", "Move in with just your suitcase."),
    ("No bill juggling", "Utilities and WiFi are in the rent. One monthly payment."),
    ("No joint lease", "You're only responsible for your own room."),
    ("No roommate hunt", "We handle roommate matching."),
]

STEPS = [
    ("Send your details", "Tell us your move-in date. No payment and no obligation."),
    ("Tour the building", "We'll be in touch within 24 hours to arrange a walkthrough."),
    ("Apply and move in", "Applications are reviewed within 48 hours. Sign your own lease and move in."),
]

WA_ICON = '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M19.11 17.36c-.29-.15-1.7-.84-1.96-.93-.26-.1-.45-.15-.64.14-.19.29-.74.93-.9 1.12-.17.19-.33.22-.62.07-.29-.14-1.21-.45-2.3-1.42-.85-.76-1.42-1.7-1.59-1.98-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.4 0 1.41 1.03 2.78 1.17 2.97.14.19 2.03 3.1 4.91 4.34.69.3 1.22.47 1.64.61.69.22 1.31.19 1.81.11.55-.08 1.7-.7 1.94-1.37.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34zM16.03 27.06h-.01a10.9 10.9 0 0 1-5.55-1.52l-.4-.24-4.13 1.08 1.1-4.02-.26-.41a10.86 10.86 0 0 1-1.67-5.82c0-6.02 4.9-10.92 10.93-10.92a10.85 10.85 0 0 1 10.91 10.93c0 6.02-4.9 10.92-10.92 10.92zm9.3-20.22A13.06 13.06 0 0 0 16.02 3C8.83 3 3 8.83 3 16.02c0 2.3.6 4.54 1.74 6.52L3 29l6.6-1.73a13.02 13.02 0 0 0 6.42 1.68h.01c7.19 0 13.03-5.84 13.03-13.03 0-3.48-1.36-6.75-3.73-9.08z"/></svg>'

e = lambda s: html.escape(str(s), quote=True)


def lp_img(name):
    """photos/<hash>.webp -> its 960px copy in photos/lp/ (made once with Pillow;
    the 2000px originals are several times heavier than a phone needs)."""
    return name.replace(".webp", "-960.webp")


def head(d, url):
    return f"""<!DOCTYPE html>
<html lang="en" data-page-group="lp" data-lp="{e(d['slug'])}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{e(d['title'])}</title>
  <meta name="description" content="{e(d['description'])}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="noindex,follow">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-NSZQVSN2CF"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-NSZQVSN2CF');
    gtag('config', 'AW-18501735502');
  </script>
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Emerson Quarters">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{e(d['title'])}">
  <meta property="og:description" content="{e(d['description'])}">
  <meta property="og:image" content="{SITE_URL}/photos/hero-exterior-1536.webp">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>E</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap">
  <link rel="preload" as="image" href="/photos/lp/{lp_img(HERO_SLIDES[0][0])}" fetchpriority="high">
  <!-- Meta Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s)
  {{if(f.fbq)return;n=f.fbq=function(){{n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)}};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '4687077431619563');
  fbq('track', 'PageView');
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=4687077431619563&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Meta Pixel Code -->
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/lp.css">
</head>
"""


def render(d):
    url = f"{SITE_URL}/{d['slug']}/"
    # First slide loads with the page; the rest are fetched when first shown.
    slides = "".join(
        (f'<img class="is-on" src="/photos/lp/{lp_img(f)}" alt="{e(alt)}" width="960" height="640" fetchpriority="high" decoding="sync">'
         if i == 0 else
         f'<img data-src="/photos/lp/{lp_img(f)}" alt="{e(alt)}" width="960" height="640" decoding="async">')
        for i, (f, alt) in enumerate(HERO_SLIDES))
    dots = "".join(
        f'<button type="button" class="lp-slider__dot{" is-on" if i == 0 else ""}" aria-label="Photo {i + 1}"></button>'
        for i in range(len(HERO_SLIDES)))
    cards = "".join(f'<div class="lp-card3"><strong>{e(a)}</strong><span>{e(b)}</span></div>' for a, b in CARDS)
    nearline = ", ".join(f"{e(a)} {e(b)}" for a, b in NEARBY[:4])
    inside = "".join(
        f'<img src="/photos/lp/{lp_img(f)}" alt="{e(alt)}" width="960" height="640" loading="lazy" decoding="async">'
        for f, alt in INSIDE)
    chips = "".join(f'<span class="lp-chip">{e(a)} <em>{e(b)}</em></span>' for a, b in NEARBY)
    around = "".join(
        f'<img src="/photos/{f}" alt="{e(alt)}" width="{w}" height="{h}" loading="lazy" decoding="async">'
        for f, alt, w, h in AROUND)
    nomore = "".join(f'<div class="lp-item"><strong>{e(a)}</strong><span>{e(b)}</span></div>' for a, b in NO_MORE)
    steps = "".join(
        f'<div class="lp-step"><span class="lp-step__n">{i}</span><strong>{e(a)}</strong><span>{e(b)}</span></div>'
        for i, (a, b) in enumerate(STEPS, 1))
    faqs = "".join(
        f'<div class="faq-item"><button class="faq-question" type="button">{e(FAQ[k][0])}</button>'
        f'<div class="faq-answer"><p>{e(FAQ[k][1])}</p></div></div>'
        for k in d["faqOrder"])
    return head(d, url) + f"""<body class="lp">

  <header class="lp-header">
    <div class="lp-wrap lp-header__in">
      <span class="lp-logo"><span class="lp-logo__name">Emerson</span><span class="lp-logo__sub">Quarters</span></span>
      <a href="#request" class="lp-btn lp-btn--sm">Check availability</a>
    </div>
  </header>

  <main>
  <section class="lp-hero">
    <div class="lp-wrap lp-hero__in">
      <div class="lp-hero__copy">
        <h1>{e(d['h1'])}</h1>
        <p class="lp-hero__tag">{e(d['tag'])}</p>
        <p class="lp-hero__price">From <strong>$895/month</strong> · utilities and WiFi included · 6 or 12 months</p>
        <div class="lp-hero__cta">
          <a href="#request" class="lp-btn">Check availability</a>
          <a data-whatsapp href="#request" class="lp-link">or message us on WhatsApp</a>
        </div>
      </div>
      <div class="lp-slider" id="lp-slider">{slides}<div class="lp-slider__dots">{dots}</div></div>
    </div>
  </section>

  <section class="lp-sec">
    <div class="lp-wrap">
      <h2 class="lp-narrow">{e(d['promise'])}</h2>
      <p class="lp-price">$895/month</p>
      <p class="lp-price__label">Private rooms from</p>
      <div class="lp-cards3">{cards}</div>
      <p class="lp-nearline"><strong>Nearby</strong> — {nearline}</p>
    </div>
  </section>

  <section class="lp-sec lp-sec--navy">
    <div class="lp-wrap">
      <h2>Take a look inside</h2>
      <div class="lp-grid6">{inside}</div>
      <a href="#request" class="lp-btn">Check availability</a>
    </div>
  </section>

  <section class="lp-sec">
    <div class="lp-wrap">
      <h2>608 W Emerson St.<br>Queen Anne, Seattle.</h2>
      <div class="lp-chips">{chips}</div>
      <div class="lp-grid3">{around}</div>
    </div>
  </section>

  <section class="lp-sec lp-sec--cream">
    <div class="lp-wrap">
      <h2>What you won't<br>have to deal with</h2>
      <div class="lp-items">{nomore}</div>
    </div>
  </section>

  <section class="lp-sec">
    <div class="lp-wrap">
      <h2>How it works</h2>
      <div class="lp-steps">{steps}</div>
    </div>
  </section>

  <section class="lp-sec lp-sec--alt lp-formsec">
    <div class="lp-wrap">
      <h2>{e(d['formTitle'])}</h2>
      <div class="lp-form" id="request">
        <form id="lp-form">
          <div class="form-group">
            <label for="lp-name">Full name</label>
            <input id="lp-name" type="text" name="name" required autocomplete="name">
          </div>
          <div class="form-group">
            <label for="lp-email">Email</label>
            <input id="lp-email" type="email" name="email" required autocomplete="email">
          </div>
          <div class="form-group">
            <label for="lp-phone">Phone</label>
            <input id="lp-phone" type="tel" name="phone" required autocomplete="tel">
          </div>
          <div class="form-group">
            <label for="lp-movein">Move-in date <span class="lp-optional">(optional)</span></label>
            <input id="lp-movein" type="date" name="moveIn">
          </div>
          <div class="lp-hp" aria-hidden="true">
            <label for="lp-company">Company</label>
            <input id="lp-company" type="text" name="company" tabindex="-1" autocomplete="off">
          </div>
          <p class="lp-form__error" id="lp-error" role="alert" hidden>We couldn't send your request. Please call <a href="tel:+12532630612">(253) 263-0612</a> or <a data-whatsapp href="#request">message us on WhatsApp</a>.</p>
          <button type="submit" class="lp-btn lp-btn--full" id="lp-submit">Check availability</button>
          <p class="lp-form__note">No payment needed. We'll be in touch within 24 hours.</p>
        </form>
      </div>
    </div>
  </section>

  <section class="lp-sec">
    <div class="lp-wrap">
      <h2>Questions</h2>
      <div class="faq-list lp-faq">{faqs}</div>
    </div>
  </section>
  </main>

  <footer class="lp-footer">
    <div class="lp-wrap">
      <span class="lp-logo"><span class="lp-logo__name">Emerson</span><span class="lp-logo__sub">Quarters</span></span>
      <p>608 W Emerson St, Seattle, WA 98119 · <a href="tel:+12532630612">(253) 263-0612</a></p>
      <p>&copy; 2026 Emerson Quarters · Equal Housing Opportunity · <a href="/">emersonq.com</a></p>
    </div>
  </footer>

  <div class="lp-bar" id="lp-bar">
    <a href="#request" class="lp-btn lp-bar__main">Check availability</a>
    <a data-whatsapp href="#request" class="lp-bar__wa" aria-label="Message us on WhatsApp">{WA_ICON}</a>
  </div>

  <script src="/script.js"></script>
  <script src="/lp.js"></script>
</body>
</html>
"""


def main():
    check = "--check" in sys.argv
    stale = []
    for path in sorted(glob.glob(os.path.join(ROOT, "lp", "*.json"))):
        d = json.load(open(path, encoding="utf-8"))
        out = os.path.join(ROOT, d["slug"], "index.html")
        page = render(d)
        if check:
            if not os.path.exists(out) or open(out, encoding="utf-8").read() != page:
                stale.append(d["slug"])
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, "w", encoding="utf-8").write(page)
        print(f"  /{d['slug']}/  {len(page)} bytes")
    if check:
        if stale:
            sys.exit(f"build_lp --check: out of date -> {', '.join(stale)}")
        print("build_lp --check: all landing pages up to date")


if __name__ == "__main__":
    main()
