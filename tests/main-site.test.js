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
    assert.match(vercel, /Strict-Transport-Security/);

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

test("optimized avatar is reasonably small", () => {
    const photo = path.join(root, "assets/images/photo.jpg");
    const size = fs.statSync(photo).size;
    assert.ok(size < 80 * 1024, `photo.jpg should be under 80 KB, got ${size}`);
});