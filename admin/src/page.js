// The dashboard page. Light theme only, with every color set explicitly (it is a private tool, viewed mostly on a phone).
export const PAGE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>TPOTDOC Visitors</title>
<style>
  /* Layout: one column of cards on a phone, two columns on a wide screen. */
  :root {
    color-scheme: light;
    --bg: #f5f6f9; --surface: #fcfcfb; --ink: #1b2340; --muted: #5d6478; --line: #dde1ea;
    --navy: #1f2d5c; --gold: #a87b22; --bar: #3f5fae; --bar-hover: #2f4a8a; --track: #eceff5;
    --font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --serif: Georgia, "Times New Roman", serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.5 var(--font); }
  header { background: var(--navy); color: #fff; padding: 18px 16px calc(18px + 0px); padding-top: calc(18px + env(safe-area-inset-top, 0px)); }
  .wrap { max-width: 1040px; margin: 0 auto; padding-inline: 16px; }
  header .wrap { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; padding: 0; }
  h1 { font: 600 1.35rem/1.2 var(--serif); margin: 0; text-wrap: balance; }
  header p { margin: 0; font-size: .85rem; opacity: .8; }
  main { padding-block: 20px 40px; display: grid; gap: 16px; }
  .ranges { display: flex; gap: 8px; flex-wrap: wrap; }
  .ranges button { font: 600 .92rem var(--font); border: 1px solid var(--line); background: var(--surface); color: var(--ink);
    padding: 8px 14px; border-radius: 999px; cursor: pointer; }
  .ranges button[aria-pressed="true"] { background: var(--navy); color: #fff; border-color: var(--navy); }
  .ranges button:focus-visible, summary:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr)); gap: 12px; }
  .tile { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 14px 16px; min-width: 0; }
  .tile .label { font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
  .tile .value { font: 600 2rem/1.15 var(--serif); font-variant-numeric: tabular-nums; margin-top: 4px; overflow-wrap: anywhere; }
  .tile .note { font-size: .85rem; color: var(--muted); margin-top: 2px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr)); gap: 16px; }
  .card { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 16px; min-width: 0; }
  .card h2 { font: 600 1.05rem/1.3 var(--serif); margin: 0 0 4px; }
  .card .sub { font-size: .85rem; color: var(--muted); margin: 0 0 12px; }
  /* Ranked bars: label, bar, value. Bars start at zero; values are direct labels in ink, not bar color. */
  .rank { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .rank li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 10px; align-items: center; }
  .rank .name { font-size: .92rem; overflow-wrap: anywhere; }
  .rank .num { font-variant-numeric: tabular-nums; font-size: .92rem; font-weight: 600; text-align: right; }
  .rank .track { grid-column: 1 / -1; height: 8px; background: var(--track); border-radius: 4px; overflow: hidden; }
  .rank .fill { height: 100%; background: var(--bar); border-radius: 0 4px 4px 0; min-width: 2px; }
  .quiet { margin: 12px 0 0; font-size: .88rem; color: var(--muted); }
  /* Daily chart */
  .daily { position: relative; }
  .daily svg { display: block; width: 100%; height: auto; overflow: visible; }
  .daily .tip { position: absolute; pointer-events: none; background: var(--ink); color: #fff; font-size: .82rem; padding: 6px 9px;
    border-radius: 6px; white-space: nowrap; transform: translate(-50%, -110%); }
  details { margin-top: 10px; font-size: .9rem; }
  summary { cursor: pointer; color: var(--muted); }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--line); }
  td:last-child, th:last-child { text-align: right; }
  .tablewrap { overflow-x: auto; max-height: 260px; }
  .status { background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 16px; }
  .status.error { border-left: 4px solid #b3261e; }
  .help { font-size: .88rem; color: var(--muted); }
  .help h2 { color: var(--ink); }
  .help dt { font-weight: 600; color: var(--ink); margin-top: 6px; }
  .help dd { margin: 0; }
  @media (prefers-reduced-motion: no-preference) { .rank .fill { transition: width .4s ease; } }
</style>
</head>
<body>
<header>
  <div class="wrap">
    <h1>TPOTDOC Visitors</h1>
    <p>Signed in as {{EMAIL}}</p>
  </div>
</header>
<main class="wrap">
  <div class="ranges" role="group" aria-label="Time range">
    <button type="button" id="r7" data-days="7" aria-pressed="false">Last 7 days</button>
    <button type="button" id="r30" data-days="30" aria-pressed="true">Last 30 days</button>
    <button type="button" id="r90" data-days="90" aria-pressed="false">Last 90 days</button>
  </div>

  <div id="status" class="status" role="status">Loading your visitor numbers…</div>

  <div id="content" hidden>
    <div class="tiles">
      <div class="tile"><div class="label">Visits</div><div class="value" id="t-visits">0</div><div class="note">times someone came to the site</div></div>
      <div class="tile"><div class="label">Pages read</div><div class="value" id="t-views">0</div><div class="note">pages opened in total</div></div>
      <div class="tile"><div class="label">Most-read page</div><div class="value" id="t-top" style="font-size:1.35rem">–</div><div class="note" id="t-top-note"></div></div>
    </div>

    <div class="card" style="margin-top:16px">
      <h2>Visits each day</h2>
      <p class="sub" id="daily-sub"></p>
      <div class="daily" id="daily"></div>
      <details><summary>Show as a table</summary><div class="tablewrap"><table id="daily-table"><thead><tr><th>Day</th><th>Visits</th></tr></thead><tbody></tbody></table></div></details>
    </div>

    <div class="grid" style="margin-top:16px">
      <div class="card">
        <h2>Which pages people read</h2>
        <p class="sub">Pages opened, most-read first</p>
        <ol class="rank" id="pages"></ol>
        <p class="quiet" id="quiet"></p>
      </div>
      <div class="card">
        <h2>How people found the site</h2>
        <p class="sub">The website people came from, by pages read</p>
        <ol class="rank" id="referrers"></ol>
      </div>
      <div class="card">
        <h2>Where visitors are</h2>
        <p class="sub">Country, by pages read</p>
        <ol class="rank" id="countries"></ol>
      </div>
      <div class="card">
        <h2>What they read on</h2>
        <p class="sub">Phone, computer or tablet, by pages read</p>
        <ol class="rank" id="devices"></ol>
      </div>
    </div>

    <div class="card help" style="margin-top:16px">
      <h2>What these numbers mean</h2>
      <dl>
        <dt>Visits</dt><dd>One person coming to the site. If they read three lessons in one sitting, that is one visit.</dd>
        <dt>Pages read</dt><dd>Every page opened. The same person reading three lessons counts as three.</dd>
        <dt>Privacy</dt><dd>These counts come from Cloudflare Web Analytics, which uses no cookies and never identifies anyone. Search-engine robots are left out.</dd>
      </dl>
    </div>
  </div>
</main>

<script>
(function () {
  var fmt = new Intl.NumberFormat("en-US");
  var current = 30;

  function el(id) { return document.getElementById(id); }
  function text(node, s) { node.textContent = s; return node; }

  function ranked(listId, rows, emptyText) {
    var list = el(listId);
    list.innerHTML = "";
    if (!rows.length) { var li = document.createElement("li"); text(li, emptyText || "No visits yet in this range."); list.appendChild(li); return; }
    var max = Math.max.apply(null, rows.map(function (r) { return r.views; })) || 1;
    rows.slice(0, 10).forEach(function (r) {
      var li = document.createElement("li");
      li.title = r.label + ": " + fmt.format(r.views) + " pages read, " + fmt.format(r.visits) + " visits";
      var name = text(document.createElement("span"), r.label); name.className = "name";
      var num = text(document.createElement("span"), fmt.format(r.views)); num.className = "num";
      var track = document.createElement("div"); track.className = "track";
      var fill = document.createElement("div"); fill.className = "fill"; fill.style.width = (100 * r.views / max) + "%";
      track.appendChild(fill);
      li.appendChild(name); li.appendChild(num); li.appendChild(track);
      list.appendChild(li);
    });
  }

  function dayLabel(iso) {
    var d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }

  function daily(rows) {
    var box = el("daily");
    box.innerHTML = "";
    var W = Math.max(280, Math.round(box.clientWidth || 640)), H = 180, padL = 30, padB = 22, padT = 8;
    var max = Math.max(1, Math.max.apply(null, rows.map(function (r) { return r.visits; })));
    var step = Math.pow(10, Math.floor(Math.log10(max)));
    var top = Math.ceil(max / step) * step;
    var n = rows.length, slot = (W - padL) / n, bw = Math.max(1, slot - 2);
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Bar chart of visits each day. The table below has the same numbers.");
    function y(v) { return padT + (H - padT - padB) * (1 - v / top); }
    [0, top / 2, top].forEach(function (v) {
      var line = document.createElementNS(ns, "line");
      line.setAttribute("x1", padL); line.setAttribute("x2", W); line.setAttribute("y1", y(v)); line.setAttribute("y2", y(v));
      line.setAttribute("stroke", v === 0 ? "#b9bfcc" : "#e6e9f0"); line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      var t = document.createElementNS(ns, "text");
      t.setAttribute("x", padL - 6); t.setAttribute("y", y(v) + 4); t.setAttribute("text-anchor", "end");
      t.setAttribute("font-size", "11"); t.setAttribute("fill", "#5d6478");
      t.textContent = fmt.format(v);
      svg.appendChild(t);
    });
    var tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true;
    rows.forEach(function (r, i) {
      var x = padL + i * slot + 1;
      var h = (H - padT - padB) * (r.visits / top);
      if (r.visits > 0) {
        var bar = document.createElementNS(ns, "path");
        var r4 = Math.min(4, bw / 2, h);
        var by = H - padB - h;
        bar.setAttribute("d", "M" + x + "," + (H - padB) + "V" + (by + r4) + "Q" + x + "," + by + " " + (x + r4) + "," + by +
          "H" + (x + bw - r4) + "Q" + (x + bw) + "," + by + " " + (x + bw) + "," + (by + r4) + "V" + (H - padB) + "Z");
        bar.setAttribute("fill", "#3f5fae");
        bar.setAttribute("data-i", i);
        svg.appendChild(bar);
      }
      var hit = document.createElementNS(ns, "rect");
      hit.setAttribute("x", padL + i * slot); hit.setAttribute("y", padT); hit.setAttribute("width", slot); hit.setAttribute("height", H - padT - padB);
      hit.setAttribute("fill", "transparent");
      hit.addEventListener("pointerenter", function () {
        tip.textContent = dayLabel(r.label) + ": " + fmt.format(r.visits) + (r.visits === 1 ? " visit" : " visits");
        tip.style.left = (100 * (padL + (i + 0.5) * slot) / W) + "%";
        tip.style.top = (100 * y(r.visits) / H) + "%";
        tip.hidden = false;
      });
      hit.addEventListener("pointerleave", function () { tip.hidden = true; });
      svg.appendChild(hit);
    });
    [0, n - 1].forEach(function (i) {
      var t = document.createElementNS(ns, "text");
      t.setAttribute("x", padL + (i + 0.5) * slot); t.setAttribute("y", H - 5);
      t.setAttribute("text-anchor", i === 0 ? "start" : "end"); t.setAttribute("font-size", "11"); t.setAttribute("fill", "#5d6478");
      t.textContent = dayLabel(rows[i].label);
      svg.appendChild(t);
    });
    box.appendChild(svg); box.appendChild(tip);
    var tbody = el("daily-table").querySelector("tbody");
    tbody.innerHTML = "";
    rows.slice().reverse().forEach(function (r) {
      var tr = document.createElement("tr");
      tr.appendChild(text(document.createElement("td"), dayLabel(r.label)));
      tr.appendChild(text(document.createElement("td"), fmt.format(r.visits)));
      tbody.appendChild(tr);
    });
  }

  function render(d) {
    text(el("t-visits"), fmt.format(d.totals.visits));
    text(el("t-views"), fmt.format(d.totals.views));
    var top = d.pages[0];
    text(el("t-top"), top ? top.label : "–");
    text(el("t-top-note"), top ? fmt.format(top.views) + " pages read" : "No visits yet");
    text(el("daily-sub"), d.range);
    daily(d.daily);
    ranked("pages", d.pages);
    text(el("quiet"), d.quiet.length ? "No visits yet in this range: " + d.quiet.join(", ") + "." : "");
    ranked("referrers", d.referrers);
    ranked("countries", d.countries);
    ranked("devices", d.devices);
  }

  function load(days) {
    current = days;
    ["r7", "r30", "r90"].forEach(function (id) { el(id).setAttribute("aria-pressed", String(el(id).dataset.days == days)); });
    var status = el("status");
    status.className = "status"; status.hidden = false; text(status, "Loading your visitor numbers…");
    fetch("/api/stats?days=" + days, { credentials: "same-origin" })
      .then(function (r) { return r.json().then(function (b) { if (!r.ok) throw new Error(b.error || "Request failed"); return b; }); })
      .then(function (d) { status.hidden = true; el("content").hidden = false; render(d); })
      .catch(function (e) {
        status.className = "status error";
        text(status, "Couldn't load the numbers right now. Please try again in a minute. (" + e.message + ")");
      });
  }

  ["r7", "r30", "r90"].forEach(function (id) {
    el(id).addEventListener("click", function () { load(Number(el(id).dataset.days)); });
  });
  load(current);
})();
</script>
</body>
</html>`;
