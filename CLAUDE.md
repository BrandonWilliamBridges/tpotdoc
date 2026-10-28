# The Principles of the Doctrine of Christ (TPOTDOC)

A Bible-foundations site for new believers, written by Dianna "Yv'e" Bridges and built by Brandon Bridges. It is based on Hebrews 6:1-2.
Live at https://tpotdoc.com (GitHub Pages, served from `main` → `docs/`; DNS on Cloudflare). tpotdoc.org forwards to it.

## Layout
- `prototype/index.html` is the single source of truth for all page content. It is in artifact format (no `<html>`/`<head>`) and is also published as a private Claude artifact.
- `build.py` (run through `./build.sh`) generates `docs/` from it:
  - One page per lesson: the home page at `docs/index.html`, and each lesson at `docs/<slug>/`. Yv'e chose this layout over one long page, and it's better for search.
  - Redirects from the old `/v2/` comparison URLs, plus a home-page script that forwards old one-page links like `/#ask`.
  - `sitemap.xml`, `robots.txt`, `llms.txt` and `llms-full.txt`.
  - Every page gets a title, meta description, canonical URL, Open Graph tags and JSON-LD.
- `printables/measure-of-faith/` holds the card source (`cards.js`, `cards.css`). `render.sh` regenerates the PDF and card PNGs.
- `source-material/` holds Yv'e's original photos and journal pages. It is git-ignored and must never be published.
- `scripts/check_site.py` checks the build for SEO and AI-search problems.
- `admin/` is a separate Cloudflare Worker for the private analytics dashboard at admin.tpotdoc.com, protected by Cloudflare Access. It is deployed with Wrangler, not GitHub Pages. See `admin/README.md`.

## Standing rules
- **Always optimize for search (SEO) and AI answers (GEO/AEO).** This is part of every change, not a separate task. Use the `ship-site` skill.
- **Never commit to `main`.** Work on a `feature/...` branch, push it, and open a PR. Merging the PR to `main` is what publishes the site.
- Scripture is KJV. Greek and Hebrew word studies cite *The New Strong's Exhaustive Concordance* (Thomas Nelson, 1990).
- Yv'e approves all teaching content. Mark any wording that Claude wrote, rather than took from her notes, so she can review it.
- `INDEXABLE = False` in `build.py` keeps every page `noindex` until Yv'e approves and the site launches. Do not flip it without Brandon saying so.
