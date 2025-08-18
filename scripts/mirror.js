// scripts/mirror.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");

const SRC = path.join("_data", "substack_sources.json");
const OUT = path.join("_data", "substack_mirrors.json");

function log(...a){ console.log("[mirror]", ...a); }
function absolutize(html, base){
  const u = new URL(base);
  return html.replace(/(src|href)=\"\/(?!\/)/g, `$1="${u.protocol}//${u.host}/`);
}
async function getHTML(url){
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://google.com/"
    }
  });
  if(!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}
async function extractFrom(url){
  log("Fetching", url);
  let html = await getHTML(url);
  let dom = new JSDOM(html, { url });
  let parsed = null;
  try { parsed = new Readability(dom.window.document).parse(); } catch {}

  if (!parsed || !parsed.content) {
    const canon = dom.window.document.querySelector('meta[property="og:url"]')?.getAttribute("content");
    if (canon && canon !== url) {
      log("Refetching canonical", canon);
      html = await getHTML(canon);
      dom = new JSDOM(html, { url: canon });
      try { parsed = new Readability(dom.window.document).parse(); } catch {}
    }
  }

  if (!parsed || !parsed.content) {
    const current = dom.window.location.href;
    const amp = current.includes("?") ? current + "&output=amp" : current + "?output=amp";
    log("Trying AMP", amp);
    html = await getHTML(amp);
    dom = new JSDOM(html, { url: amp });
    try { parsed = new Readability(dom.window.document).parse(); } catch {}
  }

  if (!parsed || !parsed.content) throw new Error("No article content found.");

  const title =
    parsed.title ||
    dom.window.document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
    dom.window.document.title || "";

  const date =
    dom.window.document.querySelector('meta[property="article:published_time"]')?.getAttribute("content") ||
    dom.window.document.querySelector("time[datetime]")?.getAttribute("datetime") || "";

  const content = absolutize(parsed.content, dom.window.location.href);

  return { title, url: dom.window.location.href, date, content };
}

(async ()=>{
  if (!fs.existsSync(SRC)) { console.error(`Missing ${SRC}`); process.exit(1); }
  let urls;
  try { urls = JSON.parse(fs.readFileSync(SRC, "utf8")); }
  catch(e){ console.error(`Invalid JSON in ${SRC}: ${e.message}`); process.exit(1); }
  if (!Array.isArray(urls) || urls.length === 0) { console.error(`${SRC} must be a non-empty array of URLs.`); process.exit(1); }

  const results = [];
  for (const u of urls) {
    try {
      const post = await extractFrom(u);
      results.push(post);
      log("OK:", post.title || post.url);
    } catch (err) {
      console.error("[mirror] FAIL", u, "-", err.message);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.log(`[mirror] Wrote ${results.length} mirrored posts → ${OUT}`);
  if (results.length === 0) { console.error("[mirror] No posts extracted. Failing."); process.exit(2); }
})();
