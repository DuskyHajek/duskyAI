const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

test("glossary and concepts pages use viewport-fit=cover", () => {
  for (const page of ["terms/index.html", "concepts/index.html"]) {
    const html = fs.readFileSync(path.join(rootDir, page), "utf8");
    assert.match(html, /viewport-fit=cover/);
  }
});

test("share.js uses native share on mobile viewports when available", () => {
  const src = fs.readFileSync(path.join(rootDir, "js/share.js"), "utf8");
  assert.match(src, /isMobileShare/);
  assert.match(src, /max-width: 640px/);
  assert.match(src, /navigator\.share/);
});

test("mobile nav shell CSS: bottom tabs and body clearance", () => {
  const base = fs.readFileSync(path.join(rootDir, "css/base.css"), "utf8");
  assert.match(base, /body:not\(\.in-quiz\)/);
  assert.match(base, /\.site-sections[\s\S]*position:\s*fixed/);
  assert.match(base, /padding-bottom:\s*env\(safe-area-inset-bottom/);
});

test("concepts mobile CSS hides print control and compacts comparison grid", () => {
  const css = fs.readFileSync(path.join(rootDir, "css/concepts.css"), "utf8");
  assert.match(css, /\.concepts-landing \.print-btn \{ display: none/);
  assert.match(css, /\.quick-check:not\(\[open\]\) > summary::after/);
});