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

## Mirrored to website-samples
This site is mirrored to [BrandonWilliamBridges/website-samples](https://github.com/BrandonWilliamBridges/website-samples) (folder `tpotdoc/`, live at https://brandonwilliambridges.github.io/website-samples/tpotdoc/) by `.github/workflows/sync-samples.yml`, which runs on every push to `main`.

- **The sync workflow must keep working whenever the site changes.** It copies the committed `docs/` folder as it is, so keep committing the `./build.sh` output with each change. If you move or rename the site's output, add a build step, or add files that must not be public, update the workflow in the same change.
- Only the public site is copied. Never let it copy `.env` files, secrets, keys, databases or real customer data. `.github/scripts/sync-to-samples.py` strips those, points links at the copy's folder, removes analytics, adds `noindex`, stops forms from sending, and halts the sync if anything still looks like a secret. The same script is in every repo that syncs, so change it everywhere at once.
- The workflow needs the repo secret `SAMPLES_TOKEN`: a fine-grained token limited to website-samples, with Contents read and write. When it expires, make a new one and update the secret in every source repo.
