// tpotdoc-admin: a private analytics dashboard for tpotdoc.com.
// Cloudflare Access protects the hostname; this Worker also verifies the Access token itself, so it stays
// closed even if the Access app is ever misconfigured or removed (fail closed).
import { PAGE } from "./page.js";

const GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";
const RANGES = { 7: "Last 7 days", 30: "Last 30 days", 90: "Last 90 days" };

// Friendly names for the site's pages.
const PAGE_NAMES = {
  "/": "Home", "/mission/": "Our Mission", "/repentance/": "Repentance", "/faith/": "Faith",
  "/fruitful/": "Neither barren nor unfruitful", "/questions/": "Questions", "/prayers/": "Scripture Prayers",
  "/ask/": "Ask & Pray", "/churches/": "Churches & prayer", "/cards/": "Measure of Faith cards",
  "/about/": "About Yv'e", "/privacy/": "Privacy",
};

export default {
  async fetch(request, env) {
    const who = await verifyAccess(request, env);
    if (!who) return new Response("Sign-in required.", { status: 403, headers: { "content-type": "text/plain" } });

    const url = new URL(request.url);
    const headers = { "cache-control": "no-store", "x-frame-options": "DENY", "referrer-policy": "no-referrer" };
    if (url.pathname === "/api/stats") {
      const days = RANGES[url.searchParams.get("days")] ? Number(url.searchParams.get("days")) : 30;
      try {
        return Response.json(await stats(env, days), { headers });
      } catch (e) {
        return Response.json({ error: String(e.message || e) }, { status: 502, headers });
      }
    }
    if (url.pathname === "/") {
      return new Response(PAGE.replace("{{EMAIL}}", escapeHtml(who)), {
        headers: { ...headers, "content-type": "text/html; charset=utf-8",
          "content-security-policy": "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" },
      });
    }
    return new Response("Not found", { status: 404 });
  },
};

// ---------- Cloudflare Access JWT check ----------
let certCache = { at: 0, keys: [] };

async function verifyAccess(request, env) {
  const jwt = request.headers.get("cf-access-jwt-assertion");
  if (!jwt || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;
  const [h, p, sig] = jwt.split(".");
  if (!sig) return null;
  try {
    const header = JSON.parse(b64text(h));
    const payload = JSON.parse(b64text(p));
    const now = Math.floor(Date.now() / 1000);
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.ACCESS_AUD)) return null;
    if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
    if (!payload.exp || payload.exp < now) return null;
    if (Date.now() - certCache.at > 3600_000) {
      const res = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
      certCache = { at: Date.now(), keys: (await res.json()).keys || [] };
    }
    const jwk = certCache.keys.find((k) => k.kid === header.kid);
    if (!jwk || header.alg !== "RS256") return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64bytes(sig), new TextEncoder().encode(`${h}.${p}`));
    return ok ? (payload.email || "signed in") : null;
  } catch {
    return null;
  }
}

function b64bytes(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function b64text(s) { return new TextDecoder().decode(b64bytes(s)); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`); }

// ---------- Analytics (Cloudflare Web Analytics via GraphQL) ----------
async function stats(env, days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400_000);
  const filter = { AND: [
    { datetime_geq: start.toISOString(), datetime_leq: end.toISOString() },
    { siteTag: env.SITE_TAG }, { bot: 0 },
  ] };
  const group = (alias, dim, limit, order) =>
    `${alias}: rumPageloadEventsAdaptiveGroups(limit: ${limit}, filter: $filter, orderBy: [${order}]) { count sum { visits } dimensions { ${dim} } }`;
  const query = `query ($account: string!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
    viewer { accounts(filter: { accountTag: $account }) {
      total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $filter) { count sum { visits } }
      ${group("byDay", "date", 100, "date_ASC")}
      ${group("pages", "requestPath", 25, "count_DESC")}
      ${group("referrers", "refererHost", 10, "count_DESC")}
      ${group("countries", "countryName", 10, "count_DESC")}
      ${group("devices", "deviceType", 5, "count_DESC")}
    } } }`;
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_API_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables: { account: env.ACCOUNT_ID, filter } }),
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
  const a = body.data?.viewer?.accounts?.[0];
  if (!a) throw new Error("No analytics data returned for this account.");

  const rows = (list, key, name = (v) => v || "(unknown)") =>
    (list || []).map((r) => ({ label: name(r.dimensions[key]), views: r.count, visits: r.sum.visits }));

  // Fill in days with no visits so the daily chart has no gaps.
  const byDate = new Map((a.byDay || []).map((r) => [r.dimensions.date, r]));
  const daily = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400_000)) {
    const key = d.toISOString().slice(0, 10);
    const r = byDate.get(key);
    daily.push({ label: key, views: r ? r.count : 0, visits: r ? r.sum.visits : 0 });
  }

  // Merge page paths that differ only by a trailing slash or index.html.
  const pages = new Map();
  for (const r of a.pages || []) {
    let path = (r.dimensions.requestPath || "/").replace(/index\.html$/, "");
    if (!path.endsWith("/")) path += "/";
    const p = pages.get(path) || { label: PAGE_NAMES[path] || path, path, views: 0, visits: 0 };
    p.views += r.count; p.visits += r.sum.visits;
    pages.set(path, p);
  }
  const allPages = Object.keys(PAGE_NAMES);
  const quiet = allPages.filter((p) => !pages.has(p)).map((p) => PAGE_NAMES[p]);

  return {
    range: RANGES[days], days,
    totals: { views: a.total?.[0]?.count || 0, visits: a.total?.[0]?.sum?.visits || 0 },
    daily,
    pages: [...pages.values()].sort((x, y) => y.views - x.views),
    quiet,
    referrers: rows(a.referrers, "refererHost", (v) => v || "Typed in or bookmarked"),
    countries: rows(a.countries, "countryName"),
    devices: rows(a.devices, "deviceType", (v) => ({ desktop: "Computer", mobile: "Phone", tablet: "Tablet" }[v] || v || "(unknown)")),
  };
}
