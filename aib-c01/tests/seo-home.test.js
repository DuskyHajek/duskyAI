const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const QUESTIONS = require("../questions.js");
const createCore = require("../js/core.js");

const rootDir = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");

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

test("all browser scripts parse without syntax errors", () => {
  const jsDir = path.join(rootDir, "js");
  const files = fs.readdirSync(jsDir).filter((f) => f.endsWith(".js"));
  assert.ok(files.length >= 9);
  for (const file of files) {
    const src = fs.readFileSync(path.join(jsDir, file), "utf8");
    assert.doesNotThrow(() => new vm.Script(src, { filename: file }), file + " should parse cleanly");
  }
});

test("home, hero CTA, quiz, exam, and results modules render across states", () => {
  const core = createCore(QUESTIONS);
  const state = core.defaultState();
  const sandbox = {
    AIB: { core, ctx: { state, view: { name: "home" }, justRevealed: false }, widgets: null },
    globalThis: null,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const mod of ["widgets.js", "ui.js", "home.js", "quiz.js", "exam.js", "results.js"]) {
    const code = fs.readFileSync(path.join(rootDir, "js", mod), "utf8");
    vm.runInContext(code, sandbox, { filename: mod });
  }

  const A = sandbox.AIB;
  const freshHome = A.home.html();
  const freshHero = A.home.heroCtaHtml(state);
  assert.match(freshHome, /Full practice set/);
  assert.match(freshHome, /Start full set/);
  assert.match(freshHome, /Saved questions/);
  assert.match(freshHome, /Timed mock/);
  assert.match(freshHome, /Domains/);
  assert.match(freshHome, /class="study-strip"/);
  assert.match(freshHome, /href="\/aib-c01\/concepts\/"/);
  assert.match(freshHome, /href="\/aib-c01\/terms\/"/);
  assert.match(freshHome, /Concept comparisons/);
  assert.doesNotMatch(freshHero || "", /Start full set/);

  // Active progress + saved questions state
  state.sets.all = core.blankSet(core.idsFor(state, "all"), false);
  state.sets.all.ok[QUESTIONS[0].id] = false;
  core.recordAnswer(state, QUESTIONS[0].id, false);
  const activeHome = A.home.html();
  const activeHero = A.home.heroCtaHtml(state);
  assert.match(activeHome, /1 of 85 answered/);
  assert.match(activeHome, /1 saved from misses and pins/);
  assert.match(activeHome, /Continue/);
  assert.match(activeHero, /First try/);
  assert.match(A.home.introHtml(), /Exam guide pace/);
  assert.match(A.home.menuHtml(), /Shuffle on retry/);
});

test("base.css does not push seo-about below the fold", () => {
  const baseCss = fs.readFileSync(path.join(rootDir, "css/base.css"), "utf8");
  assert.doesNotMatch(baseCss, /\.wrap\s*\{[^}]*min-height:\s*100dvh/);
  assert.doesNotMatch(baseCss, /#app\s*\{\s*flex:\s*1/);
});

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
  assert.match(html, /<h1><span class="exam-code">AIB-<em>C01<\/em><\/span> practice exam<\/h1>/);
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
