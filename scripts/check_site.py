#!/usr/bin/env python3
"""Checks the built site in docs/ for SEO and AI-search basics. Run after ./build.sh; exits 1 on errors.

Errors:   broken local links/images, redirects to missing pages, invalid JSON-LD, not exactly one <h1>, missing title/description/canonical,
          missing llms.txt / sitemap.xml / robots.txt.
Warnings: title over 60 characters, description outside 70-160 characters, images without an alt attribute.
"""
import html
import json
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
errors, warnings = [], []

for f in ("llms.txt", "llms-full.txt", "sitemap.xml", "robots.txt"):
    if not (DOCS / f).exists():
        errors.append(f"missing docs/{f}")

for page in sorted(DOCS.rglob("*.html")):
    rel = page.relative_to(DOCS)
    s = page.read_text()
    refresh = re.search(r'http-equiv="refresh" content="0; url=([^"]+)"', s)
    if refresh:  # redirect stub: only check that it points at a page that exists
        target = refresh.group(1)
        if target.startswith("http"):
            local = DOCS / re.sub(r"^https?://[^/]+/", "", target)
            if not (local / "index.html" if target.endswith("/") else local).exists():
                errors.append(f"{rel}: redirects to missing page {target}")
        continue
    h1 = len(re.findall(r"<h1[\s>]", s))
    if h1 != 1:
        errors.append(f"{rel}: {h1} <h1> elements (want exactly 1)")
    title = re.search(r"<title>(.*?)</title>", s, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    if not title:
        errors.append(f"{rel}: no <title>")
    elif len(html.unescape(title.group(1))) > 60:
        warnings.append(f"{rel}: title is {len(html.unescape(title.group(1)))} chars (Google shows ~60)")
    if not desc:
        errors.append(f"{rel}: no meta description")
    elif not 70 <= len(html.unescape(desc.group(1))) <= 160:
        warnings.append(f"{rel}: description is {len(html.unescape(desc.group(1)))} chars (aim for 70-160)")
    if '<link rel="canonical"' not in s:
        errors.append(f"{rel}: no canonical link")
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    if not blocks:
        errors.append(f"{rel}: no JSON-LD structured data")
    for b in blocks:
        try:
            json.loads(b)
        except json.JSONDecodeError as e:
            errors.append(f"{rel}: invalid JSON-LD ({e})")
    for img in re.findall(r"<img\b[^>]*>", s):
        if 'alt="' not in img:  # alt="" is fine for decorative images
            warnings.append(f"{rel}: image without alt attribute: {img[:80]}")
    for href in re.findall(r'(?:href|src)="([^"#:?][^"#?]*)', s):
        if href.startswith(("http", "mailto", "tel")):
            continue
        target = page.parent / href
        if href.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            errors.append(f"{rel}: broken link {href}")

for w in warnings:
    print("warning:", w)
for e in errors:
    print("ERROR:", e)
print(f"check_site: {len(errors)} errors, {len(warnings)} warnings")
sys.exit(1 if errors else 0)
