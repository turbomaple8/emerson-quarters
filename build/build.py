#!/usr/bin/env python3
"""
Emerson Quarters — static page builder.

Generates the content pages (SEO pillar hubs, and later blog posts) from
markdown in content/, wrapping each in the same chrome as the homepage.

Nav, footer and the three CTA modals are extracted from index.html at build
time rather than duplicated here. Edit the homepage nav once and every
generated page picks it up on the next build — which is the whole reason this
script exists instead of five hand-copied HTML files.

Usage:
    python3 build/build.py            # build all pages
    python3 build/build.py --check    # verify generated files are up to date

Requires: markdown (pip install markdown)
"""

import os
import re
import sys
import json
import html
import glob

import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE_URL = "https://www.emersonq.com"
CONTENT = os.path.join(ROOT, "content")
INDEX = os.path.join(ROOT, "index.html")


# ---------------------------------------------------------------- chrome

def rootify(fragment):
    """Rewrite homepage-relative links/assets to root-absolute.

    Generated pages live at /<slug>/index.html, so 'photos/x.webp' and
    'index.html#about' would resolve one level too deep.
    """
    fragment = re.sub(r'(href|src)="index\.html"', r'\1="/"', fragment)
    fragment = re.sub(r'(href|src)="(?!https?:|/|#|tel:|mailto:|data:)', r'\1="/', fragment)
    fragment = re.sub(r'href="#([a-z]+)"', r'href="/#\1"', fragment)
    return fragment


def extract_chrome():
    src = open(INDEX, encoding="utf-8").read()

    def grab(pattern, name):
        m = re.search(pattern, src, re.S)
        if not m:
            sys.exit(f"build: could not find {name} in index.html — template out of sync")
        return rootify(m.group(0))

    nav = grab(r'<nav class="nav">.*?</nav>', "nav")
    footer = grab(r'<footer class="footer">.*?</footer>', "footer")
    modals = "\n".join(
        rootify(m) for m in re.findall(
            r'<div class="modal-overlay" id="\w+Modal">.*?\n  </div>', src, re.S
        )
    )
    if modals.count("modal-overlay") != 3:
        sys.exit("build: expected 3 CTA modals in index.html, found "
                 f"{modals.count('modal-overlay')}")
    return nav, footer, modals


# ---------------------------------------------------------------- content

def parse(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n(.*)", raw, re.S)
    if not m:
        sys.exit(f"build: {path} has no frontmatter block")
    meta = {}
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            meta[k.strip()] = v.strip().strip('"')
    # The H1 is rendered from frontmatter by the template, so strip it from the
    # body — otherwise the page renders its title twice. lstrip() first: the
    # body starts with blank lines after the frontmatter block, so an
    # unanchored '^# ' would never match.
    body = m.group(2).lstrip()
    body = re.sub(r"\A# .*?\n", "", body, count=1)
    if body.lstrip().startswith("# "):
        sys.exit(f"build: {path} still has a leading H1 after stripping")
    for req in ("url", "title", "description", "h1"):
        if not meta.get(req):
            sys.exit(f"build: {path} is missing frontmatter '{req}'")
    return meta, body


def faq_items(body):
    """Pull Q&A pairs out of the FAQ section for FAQPage schema."""
    if "## Frequently asked questions" not in body:
        return []
    tail = body.split("## Frequently asked questions", 1)[1]
    tail = re.split(r"\n## ", tail)[0]
    pairs = re.findall(r"### (.+?)\n+(.+?)(?=\n### |\Z)", tail, re.S)
    out = []
    for q, a in pairs:
        text = re.sub(r"\s+", " ", re.sub(r"[*_`]", "", a)).strip()
        out.append({"q": q.strip(), "a": text})
    return out


def build_schema(meta, faqs):
    url = SITE_URL + meta["url"]
    graph = [
        {
            "@type": "Article",
            "@id": url + "#article",
            "headline": meta["h1"],
            "description": meta["description"],
            "url": url,
            "isPartOf": {"@id": SITE_URL + "/#website"},
            "about": {"@id": SITE_URL + "/#property"},
            "publisher": {"@id": SITE_URL + "/#organization"},
            "inLanguage": "en-US",
        },
        {
            "@type": "BreadcrumbList",
            "@id": url + "#breadcrumb",
            "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/"},
                {"@type": "ListItem", "position": 2, "name": meta["h1"], "item": url},
            ],
        },
    ]
    if faqs:
        graph.append({
            "@type": "FAQPage",
            "@id": url + "#faq",
            "mainEntity": [
                {"@type": "Question", "name": f["q"],
                 "acceptedAnswer": {"@type": "Answer", "text": f["a"]}}
                for f in faqs
            ],
        })
    return json.dumps({"@context": "https://schema.org", "@graph": graph},
                      indent=2, ensure_ascii=False)


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <link rel="canonical" href="{url}">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
  <meta name="google-site-verification" content="QI9jsJLHg663X3P5gQUsR4BtZDlt9PFNUvILft_5h3M">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Emerson Quarters">
  <meta property="og:url" content="{url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:image" content="{site}/photos/hero-exterior-1536.webp">
  <meta property="og:image:width" content="1536">
  <meta property="og:image:height" content="1024">
  <meta property="og:image:alt" content="Emerson Quarters apartment building in Queen Anne, Seattle">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>E</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap">
  <link rel="stylesheet" href="/styles.css">
  <script type="application/ld+json">
{schema}
  </script>
</head>
<body class="page-body">

{nav}

  <article class="article">
    <div class="container container--prose">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a> <span aria-hidden="true">/</span> <span>{breadcrumb}</span>
      </nav>
      <h1 class="article__title">{h1}</h1>
      <div class="prose">
{content}
      </div>
      <div class="article__cta">
        <h2>Ready to see it?</h2>
        <p>Hold a room for 24 hours with no payment and no obligation, or come and look around first.</p>
        <div class="btn-group">
          <a href="#" class="btn btn--accent btn--lg" data-modal="reserve" data-reserve-property="Emerson Quarters">Instant Reservation</a>
          <a href="#" class="btn btn--outline-white btn--lg" data-modal="tour">Schedule a Tour</a>
          <a href="#" class="btn btn--outline-white btn--lg" data-modal="apply">Apply Now</a>
        </div>
      </div>
      <nav class="guides" aria-label="Housing guides">
        <h2>More housing guides</h2>
        <ul>
{guides}
        </ul>
      </nav>
    </div>
  </article>

{footer}

{modals}

  <script src="/script.js"></script>
  <script src="/reserve-popup.js"></script>
</body>
</html>
"""


def main():
    check = "--check" in sys.argv
    nav, footer, modals = extract_chrome()

    pages = []
    for path in sorted(glob.glob(os.path.join(CONTENT, "*.md"))):
        meta, body = parse(path)
        pages.append((meta, body))

    stale = []
    for meta, body in pages:
        faqs = faq_items(body)
        content = markdown.markdown(body, extensions=["tables", "sane_lists"])
        # short label for cross-links: text before the first colon
        others = "\n".join(
            f'          <li><a href="{m["url"]}">{html.escape(m["h1"].split(":")[0])}</a></li>'
            for m, _ in pages if m["url"] != meta["url"]
        )
        page = PAGE.format(
            title=html.escape(meta["title"]),
            description=html.escape(meta["description"]),
            url=SITE_URL + meta["url"],
            site=SITE_URL,
            h1=html.escape(meta["h1"]),
            breadcrumb=html.escape(meta["h1"].split(":")[0]),
            schema=build_schema(meta, faqs),
            content=content,
            nav=nav, footer=footer, modals=modals, guides=others,
        )
        out = os.path.join(ROOT, meta["url"].strip("/"), "index.html")
        existing = open(out, encoding="utf-8").read() if os.path.exists(out) else None
        if existing != page:
            stale.append(meta["url"])
            if not check:
                os.makedirs(os.path.dirname(out), exist_ok=True)
                open(out, "w", encoding="utf-8").write(page)
        print(f"  {meta['url']:28} {len(content):>6} bytes  faq:{len(faqs)}")

    if check:
        if stale:
            sys.exit(f"build --check: out of date -> {', '.join(stale)}")
        print("build --check: all pages up to date")
    else:
        print(f"built {len(pages)} pages")
        write_sitemap([m["url"] for m, _ in pages])


def write_sitemap(urls):
    entries = "\n".join(
        f"  <url>\n    <loc>{SITE_URL}{u}</loc>\n    <lastmod>2026-07-27</lastmod>\n"
        f"    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>"
        for u in urls
    )
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{SITE_URL}/</loc>
    <lastmod>2026-07-27</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
{entries}
</urlset>
"""
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(xml)
    print(f"wrote sitemap.xml with {len(urls) + 1} URLs")


if __name__ == "__main__":
    main()
