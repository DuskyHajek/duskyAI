const test = require("node:test");
const assert = require("node:assert/strict");
const { filterTerms, visibleGroups } = require("../js/terms.js");

const items = [
  { term: "Bias", text: "A systematic difference in how the system treats similar people." },
  { term: "ROI", text: "Return on investment: benefits minus costs, divided by costs." },
];

test("empty query returns every term", () => {
  assert.equal(filterTerms(items, "  ").length, 2);
});

test("query matches the term", () => {
  assert.deepEqual(filterTerms(items, "roi").map((item) => item.term), ["ROI"]);
});

test("query matches the definition", () => {
  assert.deepEqual(filterTerms(items, "systematic").map((item) => item.term), ["Bias"]);
});

test("a letter with no match is hidden", () => {
  const groups = [
    { letter: "B", items: [items[0]] },
    { letter: "R", items: [items[1]] },
  ];
  assert.deepEqual(visibleGroups(groups, "").map((group) => group.letter), ["B", "R"]);
  assert.deepEqual(visibleGroups(groups, "roi").map((group) => group.letter), ["R"]);
});

test("domain filter keeps a term tagged with that domain", () => {
  const tagged = [
    { term: "Data quality", text: "fit for the decision", domain: "1 4" },
    { term: "ROI", text: "return on investment", domain: "2" },
  ];
  assert.deepEqual(filterTerms(tagged, "", "4").map((item) => item.term), ["Data quality"]);
  assert.deepEqual(filterTerms(tagged, "return", "4").map((item) => item.term), []);
  assert.deepEqual(filterTerms(tagged, "", "all").map((item) => item.term), ["Data quality", "ROI"]);
});

test("a letter is hidden when its domain does not match", () => {
  const groups = [
    { letter: "D", items: [{ term: "Data quality", text: "fit", domain: "1 4" }] },
    { letter: "R", items: [{ term: "ROI", text: "return", domain: "2" }] },
  ];
  assert.deepEqual(visibleGroups(groups, "", "2").map((group) => group.letter), ["R"]);
});

const fs = require("node:fs");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "../terms/index.html"), "utf8");
const practice = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");

test("the glossary page has the study pieces and no competitor link", () => {
  assert.equal(html.toLowerCase().includes("mindmesh"), false);
  assert.match(html, /id="dont-mix-up"/);
  assert.match(html, /id="aws-quick"/);
  assert.match(html, /id="amazon-quick"/);
  assert.match(html, /AIB-C01 glossary/);
  assert.match(html, /key terms/);
  assert.match(html, /cheat sheet/);
  assert.match(html, /Last reviewed November 2026/);
  assert.match(html, /href="\/aib-c01\/"/);
  assert.match(practice, /href="\/aib-c01\/terms\/"/);
});

test("every term is a sentence tagged with a domain, and related ids exist", () => {
  const blocks = html.match(/<div class="term"[\s\S]*?<\/div>/g) || [];
  assert.equal(blocks.length, 70);
  assert.match(html, /70 terms/);
  const ids = new Set();
  for (const block of blocks) {
    const id = block.match(/\sid="([^"]+)"/);
    assert.ok(id, block.slice(0, 80));
    ids.add(id[1]);
    assert.match(block, /data-domain="[1-4](?: [1-4])*"/);
    const desc = block.match(/itemprop="description">([\s\S]*?)<\/dd>/);
    assert.ok(desc, id[1]);
    const text = desc[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    assert.match(text, /\.$/, id[1]);
  }
  assert.ok(ids.has("amazon-quick") || html.includes('id="amazon-quick"'));
  const related = [...html.matchAll(/data-related="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
  for (const id of related) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
});
