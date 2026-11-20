const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(__dirname, "../index.html");
const html = fs.readFileSync(htmlPath, "utf8");

function stripTags(s) {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

function faqFromJsonLd(source) {
  const match = source.match(/"@type": "FAQPage"[\s\S]*?"mainEntity": (\[[\s\S]*?\])\s*\n\s*}/);
  assert.ok(match, "FAQPage JSON-LD block");
  return JSON.parse(match[1]);
}

function faqFromDom(source) {
  const section = source.match(/id="faq"[\s\S]*?<\/section>/);
  assert.ok(section, "FAQ section");
  const items = [...section[0].matchAll(/<div class="seo-faq-item"[^>]*>[\s\S]*?<h3>([\s\S]*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/g)];
  return items.map((m) => ({
    question: stripTags(m[1]),
    answer: stripTags(m[2]),
  }));
}

test("seo-about is collapsed by default", () => {
  assert.match(html, /<details class="seo-about">/);
  assert.doesNotMatch(html, /<details class="seo-about"\s+open/);
});

test("FAQ has no nested details inside #faq", () => {
  const faq = html.match(/id="faq"[\s\S]*?<\/section>/);
  assert.ok(faq);
  assert.doesNotMatch(faq[0], /<details/);
});

test("static SEO landmarks stay in HTML", () => {
  assert.match(html, /<title>AIB-C01 Practice Exam \| AWS AI Business Strategist<\/title>/);
  assert.match(html, /<h1>AIB-<em>C01<\/em> practice exam<\/h1>/);
  assert.match(html, /class="seo-tagline"[\s\S]*AIB-C01 practice test[\s\S]*AWS Certified AI Business Strategist/);
  assert.match(html, /id="hero-slot"/);
  assert.match(html, /class="seo-landing"[\s\S]*ai-business-strategist-01\.html/);
  assert.match(html, /href="\/aib-c01\/terms\/"/);
  assert.match(html, /AI Fundamentals and Literacy \(24%\)/);
  assert.match(html, /AI Strategy and Business Value Creation \(28%\)/);
  assert.match(html, /AI Governance and Responsible AI Leadership \(24%\)/);
  assert.match(html, /Business Readiness, Leadership, and AI Transformation \(24%\)/);
});

test("FAQ visible copy matches FAQPage JSON-LD", () => {
  const fromLd = faqFromJsonLd(html);
  const fromDom = faqFromDom(html);
  assert.equal(fromDom.length, 5);
  assert.equal(fromLd.length, 5);
  fromLd.forEach((entry, i) => {
    assert.equal(fromDom[i].question, entry.name);
    assert.equal(fromDom[i].answer, entry.acceptedAnswer.text);
  });
  assert.match(html, /id="amazon-ai-certificate"/);
});