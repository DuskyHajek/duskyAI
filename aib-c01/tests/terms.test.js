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
