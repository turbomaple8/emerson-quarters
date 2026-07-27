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
