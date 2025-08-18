// scripts/mirror.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const SRC = path.join("_data", "substack_sources.json");
const OUT = path.join("_data", "substack_mirrors.json");

function log(...a){ console.log("[mirror]", ...a); }
function attr(el, name){ return el ? el.getAttribute(name) || "" : ""; }
function absolutize(html, base) {
  // make src/href starting with / absolute to the substack host
  const u = new URL(base);
  return html
    .replace(/(src|href)=\"\/(?!\/)/g, `$1="${u.protocol}//${u.host}/`);
}

async function getHTML(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; WaypointBot/1.0)",
      "Accept": "text/html,application/xhtml+xml"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function extractFrom(url) {
  log("Fetching", url);
  let html = await getHTML(url);
  let dom = new JSDOM(html, { url });
  let parsed = null;

  // 1) Readability first
  try { parsed = new Readability(dom.window.document).parse(); } catch {}

  // 2) If null, try canonical URL (og:url)
  if (!parsed || !parsed.content) {
    const og = dom.window.document.querySelector('meta[property="og:url"]');
    const canon = attr(og, "content");
    if (canon && canon !== url) {
      log("Refetching canonical", canon);
      html = await getHTML(canon);
      dom = new JSDOM(html, { url: canon });
      try { parsed = new Readability(dom.window.document).parse(); } catch {}
    }
  }

  // 3) If still null, try AMP version
  if (!parsed || !parsed.content) {
    const current = dom.window.location.href;
    const amp = current.includes("?") ? current + "&output=amp" : current + "?output=amp";
    log("Trying AMP", amp);
    html = await getHTML(amp);
    dom = new JSDOM(html, { url: amp });
    try { parsed = new Readability(dom.window.document).parse(); } catch {}
  }

  // 4) Substack-specific fallbacks (common containers)
  let title = parsed?.title || "";
  let content = parsed?.content || "";
  if (!content) {
    const d = dom.window.document;
    const picks = [
      "article",
      "div.available-content",
      "div.post-body",
      "div.body",
      "div#content",
      "main"
    ];
    for (const sel of picks) {
      const el = d.querySelector(sel);
      if (el && el.innerHTML && el.innerHTML.length > 300) { content = el.innerHTML; break; }
    }
    if (!title) {
      title =
        attr(d.querySelector('meta[property="og:title"]'), "content") ||
        attr(d.querySelector('meta[name="twitter:title"]'), "content") ||
        d.title || "";
    }
  }

  if (!content) throw new Error("Could not extract article content.");
  const date =
    attr(dom.window.document.querySelector('meta[property="article:published_time"]'), "content") ||
    attr(dom.window.document.querySelector("time[datetime]"), "datetime");

  // Fix relative URLs for images/links
  content = absolutize(content, dom.window.location.href);

  return { title, url: dom.window.location.href, date, content };
}

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`Missing ${SRC}`);
    process.exit(1);
  }
  let urls = [];
  try { urls = JSON.parse(fs.readFileSync(SRC, "utf8")); }
  catch (e) { console.error(`Invalid JSON in ${SRC}:`, e.message); process.exit(1); }
  if (!Array.isArray(urls) || urls.length === 0) {
    console.error(`${SRC} must be a non-empty array of URLs.`);
    process.exit(1);
  }

  const results = [];
  for (const u of urls) {
    try {
      const post = await extractFrom(u);
      results.push(post);
      log("OK:", post.title || post.url);
    } catch (err) {
      console.error("[mirror] Failed:", u, "-", err.message);
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  log(`Wrote ${results.length} mirrored posts → ${OUT}`);
})();
