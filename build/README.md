# Build

`build.py` generates the content pages (SEO pillar hubs, and later blog posts)
from markdown in `content/`, wrapping each in the same chrome as the homepage.

```bash
python3 build/build.py          # regenerate pages + sitemap.xml
python3 build/build.py --check  # fail if generated files are stale
```

Requires `markdown` (`pip install markdown`). Generated HTML is committed, so
the site stays a plain static deploy — Vercel runs no build.

**Nav, footer and the three CTA modals are read out of `index.html` at build
time.** Edit the homepage nav once and rerun the build; every content page
picks it up. Do not hand-edit a generated `<slug>/index.html` — the next build
overwrites it. Edit `content/<slug>.md` instead.

Adding a page: drop a markdown file in `content/` with `url`, `title`,
`description` and `h1` frontmatter, then run the build.

## Content rules

Emerson Quarters is long-term residential housing. Every resident signs an
individual **12-month residential lease** and pays rent monthly. The insurer
reads this site, and copy that makes the building look like short-term,
hospitality or coliving accommodation put the policy renewal at risk in
November 2026. So, in every page and post:

- The lease is 12 months. No six-month, "shorter", "flexible", month-to-month,
  single-quarter or summer-only terms.
- No "coliving" / "co-living". Say private room in a shared apartment, or
  renting by the room.
- No intern or internship housing content. Residents are SPU students and
  working professionals.
- No hospitality vocabulary for living here: stay, book, booking, guest,
  check-in, nightly, weekly rates. People apply, sign a lease and move in.
- The CTA is "Hold a Room": a free 24-hour hold while someone applies. It is
  not a reservation or a booking.

`build.py` fails on the most common offenders (see `BANNED`). The check is a
backstop, not the full rule set. The coliving and intern pages were removed
and their URLs redirect in `vercel.json`; do not recreate them.
