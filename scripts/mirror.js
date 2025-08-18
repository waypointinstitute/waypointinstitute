// scripts/mirror.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");          // v2 (CommonJS)
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const SRC = path.join("_data", "substack_sources.json");
const OUT = path.join("_data", "substack_mirrors.json");

function log(...a){ console.log("[mirror]", ...a); }
function text(el){ return el ? el.textContent.trim() : ""; }
function attr(el, name){ return el ? el.getAttribute(name) || "" : ""; }

(async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`Missing ${SRC}. Create it with a JSON array of Substack URLs.`);
    process.exit(1);
  }
  let urls;
  try { urls = JSON.parse(fs.readFileSync(SRC, "utf8")); }
  catch (e) { console.error(`Invalid JSON in ${SRC}:`, e.message); process.exit(1); }

  if (!Array.isArray(urls) || urls.length === 0) {
    console.error(`${SRC} must be a non-empty JSON array of URLs.`);
    process.exit(1);
  }

  const results = [];

  for (const url of urls) {
    try {
      log("Fetching", url);
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WaypointBot/1.0)",
          "Accept": "text/html,application/xhtml+xml"
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Build DOM and try Readability first
      const dom = new JSDOM(html, { url });
      let article = null;
      try { article = new Readability(dom.window.document).parse(); }
      catch (_) { /* ignore */ }

      // Fallbacks when Readability returns null
      let title = article?.title || "";
      let content = article?.content || "";

      if (!title) {
        title =
          attr(dom.window.document.querySelector('meta[property="og:title"]'), "content") ||
          attr(dom.window.document.querySelector('meta[name="twitter:title"]'), "content") ||
          dom.window.document.title || "";
      }

      if (!content) {
        // Try common Substack containers
        const candidates = [
          'article',
          'div.post',                  // older themes
          'div.post-body',
          'div.body',
          'div#content',
          'div.newsletter-body',
          'main'
        ];
        for (const sel of candidates) {
          const el = dom.window.document.querySelector(sel);
          if (el && el.innerHTML && el.innerHTML.length > 300) { // avoid nav bars
            content = el.innerHTML;
            break;
          }
        }
      }

      if (!content) {
        throw new Error("Could not extract article content (Readability + fallbacks failed).");
      }

      // Date if present
      const date =
        attr(dom.window.document.querySelector('meta[property="article:published_time"]'), "content") ||
        attr(dom.window.document.querySelector("time[datetime]"), "datetime");

      results.push({ title, url, date, content });

    } catch (err) {
      console.error("[mirror] Failed:", url, "-", err.message);
      // Keep going with other URLs
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  log(`Wrote ${results.length} mirrored posts → ${OUT}`);
})();
