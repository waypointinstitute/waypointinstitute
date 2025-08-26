// Fetch Substack RSS -> write _data/substack.json
// Requires: node >=18
import fs from 'node:fs/promises';

const FEED_URL = 'https://waypointinstitute.substack.com/feed';

async function main() {
  const res = await fetch(FEED_URL, {
    headers: {
      // Pretend to be a browser; Substack 403s generic bots
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
      'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8'
    }
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  const xml = await res.text();

  // Tiny XML parse (no deps): grab items
  const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map(m => {
    const chunk = m[1];
    const take = (tag) => (chunk.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))||[])[1]?.trim() || '';
    const cdata = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    return {
      title: cdata(take('title')),
      link: cdata(take('link')),
      pubDate: take('pubDate'),
      // Substack puts full HTML in content:encoded
      content_html: cdata((chunk.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)||[])[1] || ''),
      description: cdata(take('description'))
    };
  });

  const out = { source: FEED_URL, updated_at: new Date().toISOString(), items };
  await fs.mkdir('_data', { recursive: true });
  await fs.writeFile('_data/substack.json', JSON.stringify(out, null, 2), 'utf8');
  console.log(`Wrote _data/substack.json with ${items.length} items`);
}

main().catch(err => { console.error(err); process.exit(1); });
