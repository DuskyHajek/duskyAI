const test = require("node:test");
const assert = require("node:assert/strict");
const widgets = require("../js/widgets.js");

test("highlightEvidence wraps numbers and skips standard ids", () => {
  const out = widgets.highlightEvidence("10 to 180 pages. ISO/IEC 42001. 20 percent.");
  assert.match(out, /<mark class="ev">10<\/mark>/);
  assert.match(out, /<mark class="ev">180 pages<\/mark>/);
  assert.match(out, /ISO\/IEC 42001/);
  assert.doesNotMatch(out, /<mark class="ev">ISO/);
  assert.match(out, /<mark class="ev">20 percent<\/mark>/);
});

test("passRuler shows 700 pass line and linear estimate footnote", () => {
  const html = widgets.passRuler({ pct: 0.5, label: "Test" });
  assert.match(html, /pass-cut/);
  assert.match(html, />700</);
  assert.match(html, /Linear estimate/);
  assert.match(html, /pass-user/);
  assert.match(html, />550</);
});

test("weightsBar uses proportional columns", () => {
  const html = widgets.weightsBar([
    { domain: 1, weight: 24, short: "Fundamentals", pct: 0.8 },
    { domain: 2, weight: 28, short: "Strategy", pct: 0.5 },
    { domain: 3, weight: 24, short: "Gov", pct: null },
    { domain: 4, weight: 24, short: "Ready", pct: 0.6 },
  ]);
  assert.match(html, /24fr 28fr 24fr 24fr/);
  assert.match(html, /wt-lbl/);
});

test("segmentedBar and questionGrid render expected structure", () => {
  const store = { ids: ["1.1", "1.2", "1.3"], drafts: {} };
  const bar = widgets.segmentedBar(store, 1, { graded: { "1.1": true } });
  assert.match(bar, /seg-bar/);
  assert.match(bar, /--seg-n:3/);
  const pop = widgets.questionGrid(store, 1, { hidden: true, jumpAct: "jump-learn" });
  assert.match(pop, /id="qjump-pop"/);
  assert.match(pop, /hidden/);
  assert.match(pop, /data-act="jump-learn"/);
});