const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

test("main site assets and SEO hygiene", () => {
    const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const script = fs.readFileSync(path.join(root, "assets/js/script.js"), "utf8");
    const vercel = fs.readFileSync(path.join(root, "vercel.json"), "utf8");

    assert.doesNotMatch(index, /favicon\.svg/);
    assert.doesNotMatch(script, /visuals\.php/);
    assert.match(index, /og-image\.jpg/);
    assert.match(index, /ProfilePage/);
    assert.match(index, /AI Solutions, Web Dev, Generative Media, Automation/);
    assert.match(index, /aria-label="Image gallery"/);
    assert.match(vercel, /font-src 'self' https:\/\/fonts\.gstatic\.com/);
    assert.match(vercel, /script-src 'self' 'unsafe-inline' https:\/\/cdn\.credly\.com/);
    assert.match(vercel, /frame-src https:\/\/www\.credly\.com/);
    assert.match(vercel, /Strict-Transport-Security/);

    const about = fs.readFileSync(path.join(root, "about.html"), "utf8");
    assert.match(about, /data-share-badge-id="1cbd3b83-bca0-4f8e-8571-17a2cd109661"/);
    assert.match(about, /https:\/\/cdn\.credly\.com\/assets\/utilities\/embed\.js/);
    assert.match(index, /aws-aibs-badge\.png/);
    assert.match(index, /https:\/\/www\.credly\.com\/badges\/1cbd3b83-bca0-4f8e-8571-17a2cd109661/);
    assert.ok(fs.existsSync(path.join(root, "assets/images/aws-aibs-badge.png")));

    assert.ok(!fs.existsSync(path.join(root, "assets/favicon/favicon.svg")));
    assert.ok(fs.existsSync(path.join(root, "404.html")));
    assert.ok(fs.existsSync(path.join(root, "assets/images/og-image.jpg")));

    const manifest = JSON.parse(
        fs.readFileSync(path.join(root, "assets/images/visuals/manifest.json"), "utf8")
    );
    const first = manifest.duskylab?.[0];
    assert.ok(first?.thumb, "gallery items should include thumb paths");
    assert.doesNotMatch(first.name, /_2k_/);
});

test("every project link opens in a new tab (HTML and JS stay in sync)", () => {
    const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const script = fs.readFileSync(path.join(root, "assets/js/script.js"), "utf8");

    const links = [...index.matchAll(/<a class="project-link"[^>]*>/g)];
    assert.ok(links.length >= 6, "expected static project links in index.html");
    for (const m of links) {
        assert.match(m[0], /target="_blank"/, `missing target="_blank": ${m[0]}`);
        assert.match(m[0], /rel="noopener"/, `missing rel="noopener": ${m[0]}`);
    }

    assert.doesNotMatch(script, /sameTab/);
    assert.match(script, /target="_blank" rel="noopener"/);
});

test("optimized avatar is reasonably small", () => {
    const photo = path.join(root, "assets/images/photo.jpg");
    const size = fs.statSync(photo).size;
    assert.ok(size < 80 * 1024, `photo.jpg should be under 80 KB, got ${size}`);
});

test("AIB-C01 project card copy matches between index.html and script.js", () => {
    const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const script = fs.readFileSync(path.join(root, "assets/js/script.js"), "utf8");
    const blurb = "Unofficial practice exam, 70-term glossary, and exam concepts for AWS AI Business Strategist";
    assert.ok(index.includes(blurb));
    assert.ok(script.includes(blurb));
    assert.match(index, /exam concepts/);
});