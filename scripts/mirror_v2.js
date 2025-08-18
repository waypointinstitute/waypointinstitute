// scripts/mirror_v2.js  — sanity writer
const fs = require("fs");
const path = require("path");
const OUT = path.join("_data", "substack_mirrors.json");

const results = [{
  title: "Sanity Post",
  url: "https://example.com",
  date: "2025-08-10T00:00:00Z",
  content: "<p>If you see this, the workflow->commit->pages chain works.</p>"
}];

fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log("[mirror_v2] wrote", results.length, "post(_]()
