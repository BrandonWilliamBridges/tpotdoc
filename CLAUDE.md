# The Principles of the Doctrine of Christ (TPOTDOC)

A Bible-foundations site for new believers, written by Dianna "Yv'e" Bridges and built by Brandon Bridges. It is based on Hebrews 6:1-2.
Live preview (GitHub Pages, served from `main` → `docs/`): https://brandonwilliambridges.github.io/tpotdoc/

## Layout
- `prototype/index.html` is the single source of truth for all page content. It is in artifact format (no `<html>`/`<head>`) and is also published as a private Claude artifact.
- `build.py` (run through `./build.sh`) generates `docs/` from it:
  - Version A: one long page at `docs/index.html`.
  - Version B: one page per lesson at `docs/v2/<slug>/`.
  - `sitemap.xml`, `robots.txt`, `llms.txt` and `llms-full.txt`.
  - Every page gets a title, meta description, canonical URL, Open Graph tags and JSON-LD.
- `printables/measure-of-faith/` holds the card source (`cards.js`, `cards.css`). `render.sh` regenerates the PDF and card PNGs.
- `source-material/` holds Yv'e's original photos and journal pages. It is git-ignored and must never be published.
- `scripts/check_site.py` checks the build for SEO and AI-search problems.

## Standing rules
- **Always optimize for search (SEO) and AI answers (GEO/AEO).** This is part of every change, not a separate task. Use the `ship-site` skill.
- **Never commit to `main`.** Work on a `feature/...` branch, push it, and open a PR. Merging the PR to `main` is what publishes the site.
- Scripture is KJV. Greek and Hebrew word studies cite *The New Strong's Exhaustive Concordance* (Thomas Nelson, 1990).
- Yv'e approves all teaching content. Mark any wording that Claude wrote, rather than took from her notes, so she can review it.
- `INDEXABLE = False` in `build.py` keeps every page `noindex` until Yv'e approves and the site launches. Do not flip it without Brandon saying so.
