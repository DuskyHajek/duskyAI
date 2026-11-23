/*
 * ============================================================
 *  duskyAI — script.js
 * ============================================================
 *
 *  HOW TO ADD VISUALS:
 *    1. Drop images/videos into assets/images/visuals/{project}/
 *    2. Run npm run build (regenerates manifest.json + thumbs on optimize)
 *    3. Refresh — they appear in the full-screen gallery
 *
 *  HOW TO ADD A PROJECT:
 *    Edit the PROJECTS array below and mirror the link in index.html
 *    (#project-list) so crawlers without JavaScript still see it.
 *    All project links open in a new tab (target="_blank").
 * ============================================================
 */

const PROJECTS = [
    {
        title: "crm.urbanista.sk",
        desc: "CRM for estate agents — deal workflows and document automation",
        url: "https://crm.urbanista.sk/",
        tag: "Web",
        preview: "/assets/images/projects/urbanista.png"
    },
    {
        title: "AIB-C01 practice exam",
        desc: "Unofficial practice exam, 70-term glossary, and exam concepts for AWS AI Business Strategist",
        url: "/aib-c01/",
        tag: "Web"
    },
    {
        title: "aibookdb.com",
        desc: "Curated directory of essential AI literature with editorial summaries",
        url: "https://www.aibookdb.com/",
        tag: "Web",
        preview: "/assets/images/projects/aibookdb.png"
    },
    {
        title: "makeaivisible.com",
        desc: "AI recommendation visibility — articles, glossary, resources, and a fetch check for sites",
        url: "https://www.makeaivisible.com/",
        tag: "Web",
        preview: "/assets/images/projects/makeaivisible.png"
    },
    {
        title: "@duskylab",
        desc: "AI Visual Production Studio",
        url: "https://www.instagram.com/duskylab/",
        tag: "Instagram",
        isGallery: true,
        galleryKey: "duskylab"
    },
    {
        title: "@pokerartai",
        desc: "AI-generated poker art & videos",
        url: "https://www.instagram.com/pokerart.ai/",
        tag: "Instagram",
        preview: "/assets/images/projects/pokerartai.png"
    }
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Render Projects ──────────────────────────────────────

function renderProjects() {
    const el = document.getElementById("project-list");
    if (!el) return;

    const MAX_THUMBS = window.innerWidth <= 860 ? 2 : 3;

    el.innerHTML = PROJECTS.map((p) => {
        const preview = p.preview
            ? `<div class="project-preview" style="background-image:url('${p.preview}')"></div>`
            : "";

        let galleryStrip = "";
        if (p.isGallery && p.galleryKey) {
            const items = visualsData[p.galleryKey] || [];
            if (items.length > 0) {
                const visible = items.slice(0, MAX_THUMBS);
                const remaining = items.length - MAX_THUMBS;

                const thumbs = visible.map((item, i) => {
                    const src = item.thumb || item.file;
                    const alt = item.name || "Gallery image";
                    return `<button type="button" class="gallery-thumb-btn" data-gallery="${p.galleryKey}" data-index="${i}" aria-label="Open gallery: ${alt}"><img class="gallery-thumb" src="/${src.replace(/^\//, "")}" alt="" loading="lazy" width="120" height="80"></button>`;
                }).join("");

                const moreBtn = remaining > 0
                    ? `<button type="button" class="gallery-more" data-gallery="${p.galleryKey}" data-start="${MAX_THUMBS}">+${remaining} more</button>`
                    : "";

                galleryStrip = `<div class="gallery-strip">${thumbs}${moreBtn}</div>`;
            }
        }

        const tag = p.comingSoon ? "div" : "a";
        const extraAttr = p.comingSoon
            ? `role="text"`
            : `href="${p.url}" target="_blank" rel="noopener"`;

        const arrow = p.comingSoon ? "" : `
                <span class="project-arrow" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="7" y1="17" x2="17" y2="7"/>
                        <polyline points="7 7 17 7 17 17"/>
                    </svg>
                </span>`;

        return `
        <li class="project reveal${p.preview ? " has-preview" : ""}${p.isGallery ? " has-gallery" : ""}${p.comingSoon ? " is-soon" : ""}">
            <${tag} class="project-link" ${extraAttr} aria-label="${p.title} — ${p.desc}">
            ${preview}
            <div class="project-body">
                <div class="project-name">${p.title}</div>
                <div class="project-desc">${p.desc}</div>
            </div>
            <div class="project-actions">
                <span class="project-tag${p.comingSoon ? " project-tag--soon" : ""}">${p.tag}</span>
                ${arrow}
            </div>
            </${tag}>
            ${galleryStrip}
        </li>`;
    }).join("");
}

function initProjectListDelegation() {
    const el = document.getElementById("project-list");
    if (!el) return;

    el.addEventListener("click", (e) => {
        const thumbBtn = e.target.closest(".gallery-thumb-btn");
        if (thumbBtn) {
            e.preventDefault();
            e.stopPropagation();
            openGallery(e, thumbBtn.dataset.gallery, Number(thumbBtn.dataset.index));
            return;
        }
        const moreBtn = e.target.closest(".gallery-more");
        if (moreBtn) {
            e.preventDefault();
            e.stopPropagation();
            openGallery(e, moreBtn.dataset.gallery, Number(moreBtn.dataset.start));
        }
    });
}


// ── Load Visuals ─────────────────────────────────────────

let visualsData = {};

async function loadVisuals() {
    try {
        const r = await fetch("/assets/images/visuals/manifest.json");
        if (r.ok) visualsData = await r.json();
    } catch {
        /* gallery optional */
    }
}


// ── Lightbox Gallery ─────────────────────────────────────

let lbItems = [];
let lbIndex = 0;
let lbLastFocus = null;

const lb = document.getElementById("lightbox");
const lbStage = document.getElementById("lb-stage");
const lbCount = document.getElementById("lb-counter");
const lbPrev = document.getElementById("lb-prev");
const lbNext = document.getElementById("lb-next");
const lbClose = document.getElementById("lb-close");

const lbFocusables = () => {
    if (!lb) return [];
    return [...lb.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
        .filter((node) => !node.hasAttribute("disabled") && node.offsetParent !== null);
};

function setLightboxOpen(open) {
    if (!lb) return;
    if (open) {
        lb.removeAttribute("aria-hidden");
        lb.removeAttribute("inert");
        lbLastFocus = document.activeElement;
        lbClose?.focus();
    } else {
        lb.setAttribute("aria-hidden", "true");
        lb.setAttribute("inert", "");
        if (lbLastFocus && typeof lbLastFocus.focus === "function") {
            lbLastFocus.focus();
        }
        lbLastFocus = null;
    }
}

function mediaSrc(file) {
    return file.startsWith("/") ? file : `/${file}`;
}

function showSlide(idx) {
    lbIndex = idx;
    const item = lbItems[idx];
    lbCount.textContent = `${idx + 1} / ${lbItems.length}`;

    let media;
    if (item.type === "video") {
        media = document.createElement("video");
        media.src = mediaSrc(item.file);
        media.autoplay = true;
        media.loop = true;
        media.muted = true;
        media.playsInline = true;
    } else {
        media = document.createElement("img");
        media.src = mediaSrc(item.file);
        media.alt = item.name || "";
    }

    lbStage.innerHTML = "";
    lbStage.appendChild(media);
    if (!prefersReducedMotion) {
        requestAnimationFrame(() => requestAnimationFrame(() => media.classList.add("visible")));
    } else {
        media.classList.add("visible");
    }
}

function openGallery(e, key, startIndex = 0) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    lbItems = visualsData[key] || [];
    if (!lbItems.length) return;

    lbIndex = startIndex;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    setLightboxOpen(true);
    showSlide(startIndex);
}

function closeGallery() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
    lbStage.innerHTML = "";
    setLightboxOpen(false);
}

if (lbClose) lbClose.addEventListener("click", closeGallery);
if (lbPrev) {
    lbPrev.addEventListener("click", () => {
        if (lbItems.length) showSlide((lbIndex - 1 + lbItems.length) % lbItems.length);
    });
}
if (lbNext) {
    lbNext.addEventListener("click", () => {
        if (lbItems.length) showSlide((lbIndex + 1) % lbItems.length);
    });
}
if (lb) {
    lb.addEventListener("click", (e) => {
        if (e.target === lb || e.target === lbStage) closeGallery();
    });
}

document.addEventListener("keydown", (e) => {
    if (!lb?.classList.contains("open")) return;

    if (e.key === "Escape") {
        closeGallery();
        return;
    }
    if (e.key === "ArrowLeft") {
        lbPrev?.click();
        return;
    }
    if (e.key === "ArrowRight") {
        lbNext?.click();
        return;
    }
    if (e.key === "Tab") {
        const nodes = lbFocusables();
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
});


// ── UI Enhancements ──────────────────────────────────────

function initMagneticCTA() {
    if (prefersReducedMotion) return;
    const cta = document.querySelector(".cta-btn");
    if (!cta || !window.matchMedia("(hover: hover)").matches) return;

    cta.addEventListener("mousemove", (e) => {
        const rect = cta.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        cta.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    cta.addEventListener("mouseleave", () => {
        cta.style.transform = "";
    });
}

function revealElements(elements, { stagger = true, baseDelay = 50, step = 60 } = {}) {
    const list = [...elements];
    if (!list.length) return;
    if (prefersReducedMotion) {
        list.forEach((el) => el.classList.add("revealed"));
        return;
    }
    list.forEach((el, i) => {
        setTimeout(() => {
            el.classList.add("revealed");
        }, stagger ? baseDelay + i * step : 0);
    });
}

function initStaggeredReveal() {
    revealElements(document.querySelectorAll(".reveal:not(.revealed)"));
}

// ── Init ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
    const page = document.querySelector(".page");
    if (page) page.classList.add("ready");

    initMagneticCTA();
    initProjectListDelegation();
    renderProjects();
    initStaggeredReveal();

    loadVisuals().then(() => {
        renderProjects();
        revealElements(document.querySelectorAll("#project-list .reveal:not(.revealed)"), {
            baseDelay: 0,
            step: 40
        });
    });
});