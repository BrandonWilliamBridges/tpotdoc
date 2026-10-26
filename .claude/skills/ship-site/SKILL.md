---
name: ship-site
description: Use for ANY change to the TPOTDOC website (new lesson, edited wording, new section, printables, styling). Covers the SEO + AI-search (GEO/AEO) checklist, building, checking, and shipping through a feature branch and PR. Never push site changes to main directly.
---

# Ship a change to the TPOTDOC site

Search and AI-search optimization is part of every change. Work through all of the steps below each time.

## 1. Branch
```sh
git switch main && git pull && git switch -c feature/<short-name>
```

## 2. Make the change in `prototype/index.html`
- Each lesson is a top-level `<section class="block…" id="<id>">` inside `<main>`, indented two spaces. `build.py` splits pages on that pattern.
- Open each lesson with a one-sentence plain definition in `<p class="big-def">`. AI assistants quote these directly.
- Use real question headings, such as "What is repentance?". Use `<h3>` for subtopics, and give an `id` to any heading other pages link to.
- Put Scripture in `<figure class="scripture">` with a `<cite>` reference.
- Give every `<img>` meaningful `alt` text.
- To add an FAQ answer, add a `<details class="faq-item">` with a `<summary>` question and a `<div class="faq-answer">` answer. It flows into the FAQPage structured data automatically.

## 3. Register it in `build.py` (SEO/GEO metadata)
For a new page, add an entry to `PAGES`:
- `title`: 60 characters or fewer. Write it as the question or phrase people actually search for, e.g. "What Is Baptism? Meaning of Baptizo (Greek G907)".
- `description`: 70-160 characters. Answer the question in the first sentence.
- `type`: `"lesson"`, plus `about`, `published` (the date from Yv'e's journal, YYYY-MM-DD) and `nav`.
- Add lessons to `LESSON_ORDER`, and add every new `id` that is linked with `#anchor` to `ANCHORS`.
- If the new section belongs on the home page instead, add its id to the home page's `sections`.

## 4. Build and check
```sh
./build.sh && python3 scripts/check_site.py
```
Fix every error, and fix the warnings too unless there is a reason not to. If a card changed, run `printables/measure-of-faith/render.sh` before `./build.sh`. Do one visual check: screenshot `docs/index.html` and the changed page (`docs/<slug>/index.html`) with headless Chrome. Its minimum viewport is 500px.

## 5. Ship
```sh
git add -A && git commit -m "<what changed>"   # end the message with the attribution lines
git push -u origin HEAD
gh pr create --fill
```
Tell Brandon the PR link. Merging to `main` publishes the site within about a minute. If he wants the private Claude artifact updated as well, republish `prototype/index.html`.

## Never
- Never commit `source-material/`. It holds private originals.
- Never set `INDEXABLE = True` until Brandon says the site is launching.
- Never present Claude-written teaching as Yv'e's own words. Flag it for her review.
