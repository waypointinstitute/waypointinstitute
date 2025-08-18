const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { Readability } = require("@mozilla/readability");
const SRC = path.join("_data","substack_sources.json");
const OUT = path.join("_data","substack_mirrors.json");
function absolutize(html, base){ const u=new URL(base); return html.replace(/(src|href)=\"\/(?!\/)/g, `$1="${u.protocol}//${u.host}/`); }
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
(async ()=>{
  const urls = JSON.parse(fs.readFileSync(SRC,"utf8"));
  const out = [];
  for(const url of urls){
    try{
      const html = await getHTML(url);
      const dom = new JSDOM(html, { url });
      let parsed = new Readability(dom.window.document).parse();
      if(!parsed || !parsed.content) throw new Error("Readability failed");
      out.push({
        title: parsed.title || dom.window.document.title || "",
        url: dom.window.location.href,
        date: dom.window.document.querySelector('meta[property="article:published_time"]')?.getAttribute("content") || "",
        content: absolutize(parsed.content, dom.window.location.href)
      });
      console.log("[mirror] OK:", out[out.length-1].title);
    }catch(e){
      console.error("[mirror] FAIL", url, "-", e.message);
    }
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log("[mirror] Wrote", out.length, "posts →", OUT);
})();
fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`[mirror] Wrote ${results.length} mirrored posts → ${OUT}`);
if (results.length === 0) {
  console.error("[mirror] No posts extracted. Failing the job so we notice.");
  process.exit(2);
}
