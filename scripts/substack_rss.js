// scripts/substack_rss.js
// Fetch Substack RSS and write _data/substack.json (for Jekyll to consume)

import fs from "node:fs/promises";
import Parser from "rss-parser";

const FEED_URL =
  process.env.SUBSTACK_FEED ||
  "https://waypointinstitute.substack.com/feed";

// Substack blocks default Node UA; present a browser-like UA and accept RSS
const parser = new Parser({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    "Cache-Control": "no-cache",
  },
  timeout: 15000,
});

async function main() {
  console.log("Fetching:", FEED_URL);
  let feed;
  try {
    feed = await parser.parseURL(FEED_URL);
  } catch (err) {
    console.error("RSS fetch failed:", err?.message || err);
    process.exit(1);
  }

  const items = (feed.items || []).map((it) => ({
    title: it.title || "",
    link: it.link || "",
    pubDate: it.pubDate || it.isoDate || "",
    // Prefer content:encoded if present, fall back to content / summary
    content_html: it["content:encoded"] || it.content || it.summary || "",
    author: it.creator || it.author || "",
    guid: it.guid || "",
  }));

  const out = { source: FEED_URL, fetched_at: new Date().toISOString(), items };
  await fs.mkdir("_data", { recursive: true });
  await fs.writeFile("_data/substack.json", JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${items.length} items to _data/substack.json`);
}

main();
