#!/usr/bin/env python3
"""Builds the GitHub Pages site in docs/ from prototype/index.html (the single source of truth).

Outputs
  docs/index.html, docs/<slug>/index.html   one page per lesson, each with its own URL
  docs/v2/...                               redirects from the old comparison URLs
  docs/sitemap.xml, robots.txt, llms.txt, llms-full.txt   search + AI-search files

Every page gets a title, description, canonical URL, Open Graph tags and JSON-LD structured data.
Flip INDEXABLE to True only when Yv'e has approved the wording and the site launches.
"""
import datetime
import html
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "prototype" / "index.html"
OUT = ROOT / "docs"

SITE_URL = "https://tpotdoc.com"
CUSTOM_DOMAIN = "tpotdoc.com"  # written to docs/CNAME so GitHub Pages serves the site there
SITE_NAME = "The Principles of the Doctrine of Christ"
INDEXABLE = False  # draft: every page says noindex until launch
TODAY = datetime.date.today().isoformat()

AUTHOR = {
    "@type": "Person",
    "name": "Dianna Bridges",
    "alternateName": "Yv'e Bridges",
    "description": "Bible teacher writing foundational lessons for new believers, based on Hebrews 6:1-2.",
}

# Pages: slug -> which source sections it holds, plus its search metadata.
PAGES = [
    {
        "slug": "", "sections": ["welcome", "verse-band", "foundations", "next", "merch"],
        "title": f"{SITE_NAME} | For New Believers",
        "description": "Welcome to the family of God. Simple Bible lessons for new Christians on the six foundations of Hebrews 6:1-2, starting with repentance and faith.",
        "type": "home",
    },
    {
        "slug": "repentance", "sections": ["repentance"],
        "title": "What Is Repentance? Meaning of Metanoia (Greek G3341)",
        "description": "Repentance means changing your mind about sin and God, and letting it turn your life around. A simple word study of metanoia for new believers.",
        "type": "lesson", "about": "Repentance", "published": "2026-09-23", "nav": "Repentance",
    },
    {
        "slug": "faith", "sections": ["faith"],
        "title": "What Is Faith Toward God? Meaning of Pistis (Greek G4102)",
        "description": "Faith means being persuaded that God is true and leaning your whole weight on Jesus. A simple word study of pistis, with Matthew 8 and 9.",
        "type": "lesson", "about": "Faith", "published": "2026-10-14", "nav": "Faith",
    },
    {
        "slug": "fruitful", "sections": ["fruitful"],
        "title": "Neither Barren nor Unfruitful: 2 Peter 1:8 Word Study",
        "description": "What 'barren' and 'unfruitful' mean in 2 Peter 1:8, and Peter's plan for growth: add to your faith virtue, knowledge, patience, godliness and love.",
        "type": "lesson", "about": "Spiritual growth", "published": "2026-10-13", "nav": "Fruitful",
    },
    {
        "slug": "questions", "sections": ["faq"],
        "title": "Questions New Believers Ask",
        "description": "Answers from God's Word to questions new Christians ask, like 'How do I know I really repented?'",
        "type": "faq",
    },
    {
        "slug": "ask", "sections": ["ask"],
        "title": "Ask a Question or Request Prayer",
        "description": "Send a question about the Christian faith or a prayer request. Every message is read personally and answered from God's Word.",
        "type": "contact",
    },
    {
        "slug": "churches", "sections": ["churches"],
        "title": "Churches and 24/7 Prayer We Recommend",
        "description": "Find a church that preaches the Word, and pray with someone 24/7: Billy Graham, Crossroads and Family Life Radio prayer lines, and BPN Radio.",
        "type": "churches", "nav": "Churches",
    },
    {
        "slug": "prayers", "sections": ["prayers"],
        "title": "Scripture Prayers for Everyday Needs",
        "description": "Prayers built from God's Word for everyday needs: a prayer before a test, and a prayer for when you are tested or tempted (Hebrews 4:15).",
        "type": "prayers", "nav": "Prayers",
    },
    {
        "slug": "about", "sections": ["about"],
        "title": "About Dianna \"Yv'e\" Bridges",
        "description": "Yv'e Bridges has taught God's Word in children's, youth, women's and singles ministries for decades, and wrote Praying A to Z.",
        "type": "about", "nav": "About",
    },
    {
        "slug": "cards", "sections": ["printables"],
        "title": "Measure of Faith Scripture Cards (Free Printable)",
        "description": "Free printable Scripture and prayer cards on the assurance of salvation: John 3:16, Romans 10:13, Acts 4:12 and more. Based on Romans 12:3.",
        "type": "cards",
    },
]
LESSON_ORDER = ["repentance", "faith", "fruitful"]

# In-page anchors in the source, and where they live on the built site (relative to the home page).
ANCHORS = {
    "top": "", "foundations": "#foundations", "next": "#next", "merch": "#merch",
    "repentance": "repentance/", "three-things": "repentance/#three-things",
    "fruit-of-repentance": "repentance/#fruit-of-repentance",
    "faith": "faith/", "fruitful": "fruitful/", "faq": "questions/", "ask": "ask/",
    "printables": "cards/", "churches": "churches/", "prayers": "prayers/", "about": "about/",
    "prayer-for-a-test": "prayers/#prayer-for-a-test", "prayer-when-tested": "prayers/#prayer-when-tested",
}


# ---------- parsing ----------

def grab(pattern, text, flags=re.S):
    m = re.search(pattern, text, flags)
    if not m:
        raise SystemExit(f"build.py: could not find {pattern!r} in {SRC.name}")
    return m.group(0)


def parse(src):
    parts = {
        "fonts": "\n".join(re.findall(r"<link [^>]*>", src.split("<style>")[0])),
        "style": grab(r"<style>.*?</style>", src),
        "banner": grab(r'<div class="proto-banner">.*?</div>', src),
        "header": grab(r'<header class="site">.*?</header>', src),
        "footer": grab(r"<footer>.*?</footer>", src),
        "script": grab(r"<script>.*?</script>", src),
        "main": grab(r'<main id="top">.*?</main>', src),
    }
    sections = {}
    for m in re.finditer(r'\n  (<section([^>]*)>.*?\n  </section>|<div class="verse-band">.*?\n  </div>)', parts["main"], re.S):
        block = m.group(1)
        if block.startswith('<div class="verse-band">'):
            key = "verse-band"
        else:
            idm = re.search(r'id="([^"]+)"', m.group(2) or "")
            key = idm.group(1) if idm else "welcome"
        sections[key] = block
    return parts, sections


# ---------- helpers ----------

def page_url(slug):
    return f"{SITE_URL}/" + (f"{slug}/" if slug else "")


def text_of(fragment):
    t = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", fragment, flags=re.S)
    t = re.sub(r"</(p|li|h[1-6]|dt|dd|summary|figure|blockquote|div)>", "\n", t)
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in t.splitlines()]
    return "\n".join(ln for ln in lines if ln)


def faq_items(sections):
    out = []
    for m in re.finditer(r'<details class="faq-item"[^>]*>\s*<summary>(.*?)</summary>\s*<div class="faq-answer">(.*?)</div>\s*</details>', sections.get("faq", ""), re.S):
        out.append((text_of(m.group(1)), text_of(m.group(2)).replace("\n", " ")))
    return out


def rewrite_links(fragment, root, home):
    """Point source #anchors at the page that now holds them; fix asset paths for the page's depth."""
    def fix(m):
        target = m.group(1)
        if target not in ANCHORS:
            print(f"  warning: unmapped anchor #{target}")
            return m.group(0)
        return f'href="{home}{ANCHORS[target]}"'
    fragment = re.sub(r'href="#([\w-]+)"', fix, fragment)
    fragment = fragment.replace('src="img/', f'src="{root}img/')
    fragment = fragment.replace('src="printables/', f'src="{root}printables/')
    fragment = fragment.replace('href="printables/', f'href="{root}printables/')
    return fragment


def promote_heading(fragment):
    """A lesson's h2 becomes the page's single h1."""
    return re.sub(r"<h2([^>]*)>(.*?)</h2>", r"<h1\1>\2</h1>", fragment, count=1, flags=re.S)


# ---------- page shell ----------

PAGE_CSS = """
<style>
  .pager { border-top: 1px solid var(--line); padding-block: 24px; }
  .pager .wrap { display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .pager a { font-weight: 600; text-decoration: none; }
</style>"""


def head(parts, title, description, canonical, og_image, jsonld, extra=""):
    robots = "index, follow, max-snippet:-1, max-image-preview:large" if INDEXABLE else "noindex, nofollow"
    ld = "\n".join(f'<script type="application/ld+json">{json.dumps(obj, ensure_ascii=False)}</script>' for obj in jsonld)
    t, d = html.escape(title), html.escape(description)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<meta name="robots" content="{robots}">
<meta name="author" content="Dianna (Yv'e) Bridges">
<link rel="canonical" href="{canonical}">
<link rel="alternate" type="text/plain" title="LLM summary" href="{SITE_URL}/llms.txt">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{og_image}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{og_image}">
<meta name="theme-color" content="#1f2d5c">
<link rel="icon" type="image/png" href="{SITE_URL}/img/favicon.png">
<link rel="apple-touch-icon" href="{SITE_URL}/img/logo.png">
{ld}
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{parts['fonts']}
{parts['style']}
{PAGE_CSS}
{extra}
</head>
<body>"""


def website_ld(url):
    return {
        "@context": "https://schema.org", "@type": "WebSite", "name": SITE_NAME,
        "alternateName": "TPOTDOC", "url": url, "inLanguage": "en",
        "description": PAGES[0]["description"], "author": AUTHOR, "publisher": AUTHOR,
        "about": [{"@type": "Thing", "name": n} for n in ["Repentance", "Faith", "Baptism", "Laying on of hands", "Resurrection of the dead", "Eternal judgment"]],
    }


def faq_ld(items):
    return {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items],
    }


def breadcrumb_ld(page):
    crumbs = [{"@type": "ListItem", "position": 1, "name": "Home", "item": page_url("")}]
    if page["slug"]:
        crumbs.append({"@type": "ListItem", "position": 2, "name": page.get("nav") or page["title"].split(" | ")[0], "item": page_url(page["slug"])})
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": crumbs}


def page_ld(page, sections):
    url = page_url(page["slug"])
    out = [breadcrumb_ld(page)]
    if page["type"] == "home":
        out.insert(0, website_ld(url))
    elif page["type"] == "lesson":
        out.insert(0, {
            "@context": "https://schema.org", "@type": ["Article", "LearningResource"],
            "headline": page["title"].split(" | ")[0], "description": page["description"],
            "url": url, "mainEntityOfPage": url, "inLanguage": "en",
            "author": AUTHOR, "publisher": AUTHOR,
            "datePublished": page["published"], "dateModified": TODAY,
            "image": f"{SITE_URL}/img/og.png",
            "about": {"@type": "Thing", "name": page["about"]},
            "educationalLevel": "Beginner", "audience": {"@type": "Audience", "audienceType": "New Christians"},
            "isPartOf": {"@type": "WebSite", "name": SITE_NAME, "url": page_url("")},
            "citation": "The New Strong's Exhaustive Concordance of the Bible, Thomas Nelson Publishers, 1990",
        })
    elif page["type"] == "faq":
        out.insert(0, faq_ld(faq_items(sections)))
    elif page["type"] == "churches":
        churches = re.findall(r'<article class="church">\s*<h3>(.*?)</h3>.*?<a href="([^"]+)"', sections.get("churches", ""), re.S)
        out.insert(0, {
            "@context": "https://schema.org", "@type": "ItemList", "name": page["title"],
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Organization", "name": html.unescape(n), "url": u}}
                                for i, (n, u) in enumerate(churches)],
        })
    elif page["type"] == "prayers":
        out.insert(0, {
            "@context": "https://schema.org", "@type": "CollectionPage", "name": page["title"],
            "description": page["description"], "url": url, "inLanguage": "en", "author": AUTHOR,
            "hasPart": [{"@type": "CreativeWork", "name": text_of(h), "url": f"{url}#{i}"}
                        for i, h in re.findall(r'<article class="prayer" id="([^"]+)">.*?<h3>(.*?)</h3>', sections.get("prayers", ""), re.S)],
        })
    elif page["type"] == "about":
        out.insert(0, {
            "@context": "https://schema.org", "@type": "ProfilePage", "url": url,
            "mainEntity": {**AUTHOR, "image": f"{SITE_URL}/img/dianna.jpg"},
        })
    elif page["type"] == "cards":
        out.insert(0, {
            "@context": "https://schema.org", "@type": "DigitalDocument", "name": "Measure of Faith cards, Set 1: Assurance of Salvation",
            "description": page["description"], "encodingFormat": "application/pdf", "isAccessibleForFree": True,
            "url": f"{SITE_URL}/printables/measure-of-faith/measure-of-faith-set-1.pdf", "author": AUTHOR,
        })
    return out


def pager(page, home):
    if page["slug"] not in LESSON_ORDER:
        return ""
    i = LESSON_ORDER.index(page["slug"])
    by_slug = {p["slug"]: p for p in PAGES}
    prev_link = f'<a href="{home}{LESSON_ORDER[i-1]}/">← {by_slug[LESSON_ORDER[i-1]]["nav"]}</a>' if i > 0 else f'<a href="{home}#foundations">← All foundations</a>'
    next_link = f'<a href="{home}{LESSON_ORDER[i+1]}/">Next: {by_slug[LESSON_ORDER[i+1]]["nav"]} →</a>' if i + 1 < len(LESSON_ORDER) else f'<a href="{home}questions/">Questions &amp; answers →</a>'
    return f'<nav class="pager" aria-label="Lessons"><div class="wrap">{prev_link}{next_link}</div></nav>'


# ---------- build ----------

def build():
    src = SRC.read_text()
    parts, sections = parse(src)

    if OUT.exists():
        for child in OUT.iterdir():
            shutil.rmtree(child) if child.is_dir() else child.unlink()
    (OUT / "img").mkdir(parents=True, exist_ok=True)
    for f in (ROOT / "prototype" / "img").iterdir():
        if f.suffix.lower() in (".jpg", ".png"):
            shutil.copy2(f, OUT / "img" / f.name)
    cards = ROOT / "printables" / "measure-of-faith"
    (OUT / "printables" / "measure-of-faith" / "img").mkdir(parents=True, exist_ok=True)
    shutil.copy2(cards / "measure-of-faith-set-1.pdf", OUT / "printables" / "measure-of-faith")
    for f in (cards / "img").glob("*.png"):
        shutil.copy2(f, OUT / "printables" / "measure-of-faith" / "img" / f.name)
    (OUT / ".nojekyll").touch()
    (OUT / "CNAME").write_text(CUSTOM_DOMAIN + "\n")
    og = f"{SITE_URL}/img/og.png"

    # Old one-page links (e.g. /#ask) forward to the page that now holds that section.
    moved = {k: v for k, v in ANCHORS.items() if v and not v.startswith("#")}
    hash_redirect = ("<script>(function(){var m=" + json.dumps(moved) +
                     ";var h=location.hash.slice(1);if(m[h])location.replace(m[h]);})();</script>")

    for page in PAGES:
        root = "../" if page["slug"] else ""
        body = "\n".join(sections[k] for k in page["sections"])
        if page["slug"]:
            body = promote_heading(body)
        body = rewrite_links(body, root, root)
        header = rewrite_links(parts["header"], root, root)
        if page["slug"]:
            target = f'href="{root}{page["slug"]}/"'
            header = header.replace(target, target + ' aria-current="page"', 1)
        doc = head(parts, page["title"], page["description"], page_url(page["slug"]), og, page_ld(page, sections),
                   extra="" if page["slug"] else hash_redirect)
        doc += "\n" + parts["banner"] + "\n" + header
        doc += f'\n<main id="top">\n  {body}\n</main>\n' + pager(page, root) + "\n"
        doc += rewrite_links(parts["footer"], root, root) + "\n" + parts["script"] + "\n</body>\n</html>\n"
        dest = OUT / page["slug"] / "index.html" if page["slug"] else OUT / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(doc)

    # The comparison period used /v2/ URLs; keep them working by forwarding to the new addresses.
    for page in PAGES:
        target = page_url(page["slug"])
        dest = OUT / "v2" / page["slug"] / "index.html" if page["slug"] else OUT / "v2" / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Moved</title>
<meta name="robots" content="noindex"><link rel="canonical" href="{target}">
<meta http-equiv="refresh" content="0; url={target}">
<script>location.replace({json.dumps(target)} + location.hash);</script>
</head><body><p>This page moved to <a href="{target}">{target}</a>.</p></body></html>
""")

    # sitemap.xml
    urls = [page_url(p["slug"]) for p in PAGES]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    sm += [f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod></url>" for u in urls]
    sm.append("</urlset>")
    (OUT / "sitemap.xml").write_text("\n".join(sm) + "\n")

    # robots.txt: welcome search engines and AI assistants (only honored at a domain root)
    bots = ["*", "Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot",
            "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"]
    robots = "\n".join(f"User-agent: {b}\nAllow: /\n" for b in bots) + f"\nSitemap: {SITE_URL}/sitemap.xml\n"
    (OUT / "robots.txt").write_text(robots)

    # llms.txt (llmstxt.org) and llms-full.txt: plain summaries AI assistants can read and quote
    by_slug = {p["slug"]: p for p in PAGES}
    lines = [f"# {SITE_NAME}", "",
             "> Simple, Scripture-based Bible lessons for people who are new to faith in Jesus Christ, built on the six foundations named in Hebrews 6:1-2: repentance from dead works, faith toward God, the doctrine of baptisms, laying on of hands, resurrection of the dead, and eternal judgment. Written by Dianna \"Yv'e\" Bridges. Scripture quotations are KJV; Greek word studies use Strong's Concordance.",
             "", "## Lessons"]
    lines += [f"- [{by_slug[s]['title'].split(' | ')[0]}]({page_url(s)}): {by_slug[s]['description']}" for s in LESSON_ORDER]
    lines += ["", "## Help for new believers"]
    lines += [f"- [{by_slug[s]['title'].split(' | ')[0]}]({page_url(s)}): {by_slug[s]['description']}" for s in ["prayers", "questions", "ask", "churches", "cards", "about"]]
    lines += ["", "## Optional", f"- [Full text of every lesson]({SITE_URL}/llms-full.txt): all lessons as plain text"]
    (OUT / "llms.txt").write_text("\n".join(lines) + "\n")

    full = [f"# {SITE_NAME}", f"Source: {SITE_URL}/", f"Updated: {TODAY}", ""]
    for p in PAGES[1:]:
        full += [f"## {p['title'].split(' | ')[0]}", f"URL: {page_url(p['slug'])}", "",
                 "\n\n".join(text_of(sections[k]) for k in p["sections"]), ""]
    (OUT / "llms-full.txt").write_text("\n".join(full) + "\n")

    print(f"Built {len(PAGES)} pages, /v2/ redirects, sitemap, robots.txt, llms.txt. Indexable: {INDEXABLE}")


if __name__ == "__main__":
    build()
