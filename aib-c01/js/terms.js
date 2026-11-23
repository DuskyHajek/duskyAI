/* Live filter, domain chips, self-test, and letter index for the terms page. */
(function (root) {
  function domainsOf(item) {
    return String(item.domain || "").split(/\s+/).filter(Boolean);
  }

  function filterTerms(items, query, domain) {
    const q = String(query || "").trim().toLowerCase();
    const d = String(domain || "").trim();
    return items.filter((item) => {
      if (q && !(item.term + " " + item.text).toLowerCase().includes(q)) return false;
      if (d && d !== "all" && domainsOf(item).indexOf(d) === -1) return false;
      return true;
    });
  }

  function filterMixups(items, query, domain) {
    const q = String(query || "").trim().toLowerCase();
    const d = String(domain || "").trim();
    return items.filter((item) => {
      const hay = (item.search + " " + item.text).toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (d && d !== "all" && domainsOf(item).indexOf(d) === -1) return false;
      return true;
    });
  }

  function visibleGroups(groups, query, domain) {
    return groups
      .map((group) => ({ letter: group.letter, items: filterTerms(group.items, query, domain) }))
      .filter((group) => group.items.length > 0);
  }

  function addRelated(doc) {
    Array.prototype.forEach.call(doc.querySelectorAll(".term[data-related]"), (el) => {
      if (el.querySelector(".term-related")) return;
      const p = doc.createElement("p");
      p.className = "term-related";
      let any = false;
      String(el.getAttribute("data-related") || "").split(/\s+/).forEach((id) => {
        if (!id) return;
        const target = doc.getElementById(id);
        const term = target && (target.classList.contains("term") ? target : target.closest(".term"));
        if (!term) return;
        if (any) p.appendChild(doc.createTextNode(", "));
        else p.appendChild(doc.createTextNode("Related: "));
        const link = doc.createElement("a");
        link.href = "#" + id;
        link.textContent = term.getAttribute("data-term") || id;
        p.appendChild(link);
        any = true;
      });
      const dd = el.querySelector("dd");
      if (any && dd) dd.appendChild(p);
    });
  }

  function bind(doc) {
    const input = doc.getElementById("term-search");
    const index = doc.getElementById("term-index");
    const count = doc.getElementById("term-count");
    const empty = doc.getElementById("term-empty");
    const main = doc.querySelector("main");
    const mixSection = doc.getElementById("dont-mix-up");
    if (!input || !main || (!index && !mixSection)) return;

    if (index) addRelated(doc);
    const domains = doc.querySelector(".term-domains");
    const selfBtn = doc.getElementById("term-selftest");
    const printBtn = doc.getElementById("print-sheet");
    const mixEmpty = doc.getElementById("mixups-empty");
    const riskLadder = doc.getElementById("eu-ai-act-tiers");
    const rulesBlock = doc.getElementById("decision-rules");
    const hint = doc.getElementById("term-hint");
    const list = doc.getElementById("term-list");

    const riskItem = riskLadder
      ? [{
          el: riskLadder,
          domain: riskLadder.getAttribute("data-domain") || "",
          search: riskLadder.getAttribute("data-search") || "",
          text: riskLadder.textContent || "",
        }]
      : [];

    const mixups = mixSection
      ? Array.prototype.slice.call(mixSection.querySelectorAll(".mixup")).map((el) => ({
          el: el,
          domain: el.getAttribute("data-domain") || "",
          search: el.getAttribute("data-search") || "",
          text: el.textContent || "",
        }))
      : [];

    const groups = Array.prototype.slice.call(doc.querySelectorAll(".letter")).map((section) => {
      const cards = Array.prototype.slice.call(section.querySelectorAll(".term"));
      return {
        section: section,
        letter: section.getAttribute("data-letter") || "",
        items: cards.map((el) => ({
          el: el,
          term: el.getAttribute("data-term") || "",
          text: el.textContent || "",
          domain: el.getAttribute("data-domain") || "",
        })),
      };
    });
    const total = groups.reduce((sum, group) => sum + group.items.length, 0);

    if (index) {
      index.innerHTML = groups.map((group) => {
        const id = "letter-" + group.letter.toLowerCase();
        return '<a href="#' + id + '" data-letter="' + group.letter + '">' + group.letter + "</a>";
      }).join("");
    }

    function domain() {
      const pressed = domains && domains.querySelector('[aria-pressed="true"]');
      return pressed ? pressed.getAttribute("data-domain") || "all" : "all";
    }

    function apply() {
      const d = domain();
      const q = input.value;
      const testing = main.classList.contains("is-testing");

      if (index && count && empty) {
        const shown = visibleGroups(groups, q, d);
        const letters = new Set(shown.map((group) => group.letter));
        const visible = new Set();
        shown.forEach((group) => group.items.forEach((item) => visible.add(item.el)));
        groups.forEach((group) => {
          group.section.hidden = !letters.has(group.letter);
          group.items.forEach((item) => { item.el.hidden = !visible.has(item.el); });
        });
        Array.prototype.forEach.call(index.querySelectorAll("a"), (link) => {
          const on = letters.has(link.getAttribute("data-letter"));
          link.classList.toggle("dim", !on);
          if (on) link.removeAttribute("aria-disabled");
          else link.setAttribute("aria-disabled", "true");
        });
        const n = visible.size;
        count.textContent = n === total ? total + " terms" : n + " of " + total;
        empty.hidden = n !== 0;
      }

      if (mixSection && !testing) {
        const visibleMix = filterMixups(mixups, q, d);
        const mixSet = new Set(visibleMix.map((item) => item.el));
        mixups.forEach((item) => { item.el.hidden = !mixSet.has(item.el); });
        const anyMix = visibleMix.length > 0;
        const showRisk = riskLadder ? filterMixups(riskItem, q, d).length > 0 : false;
        mixSection.hidden = !anyMix;
        if (riskLadder) riskLadder.hidden = !showRisk;
        if (rulesBlock) rulesBlock.hidden = Boolean(String(q || "").trim()) || d !== "all";
        if (mixEmpty) mixEmpty.hidden = anyMix || showRisk;
        if (count && !index) {
          count.textContent = visibleMix.length === mixups.length
            ? mixups.length + " comparisons"
            : visibleMix.length + " of " + mixups.length;
        }
      } else if (mixSection) {
        mixSection.hidden = true;
        if (riskLadder) riskLadder.hidden = true;
        if (rulesBlock) rulesBlock.hidden = true;
        if (mixEmpty) mixEmpty.hidden = true;
      }

      if (hint) hint.hidden = !testing;
    }

    input.addEventListener("input", apply);
    if (domains) {
      domains.addEventListener("click", (event) => {
        const btn = event.target.closest(".term-chip");
        if (!btn) return;
        Array.prototype.forEach.call(domains.querySelectorAll(".term-chip"), (el) => {
          el.setAttribute("aria-pressed", el === btn ? "true" : "false");
        });
        apply();
      });
    }
    if (printBtn && typeof root.print === "function") {
      printBtn.addEventListener("click", () => { root.print(); });
    }
    if (selfBtn) {
      selfBtn.addEventListener("click", () => {
        const on = !main.classList.contains("is-testing");
        main.classList.toggle("is-testing", on);
        selfBtn.setAttribute("aria-pressed", on ? "true" : "false");
        Array.prototype.forEach.call(doc.querySelectorAll(".term"), (el) => {
          el.classList.remove("is-open");
          const link = el.querySelector("dt a");
          if (!link) return;
          if (on) link.setAttribute("aria-expanded", "false");
          else link.removeAttribute("aria-expanded");
        });
        apply();
      });
    }
    if (list) {
      list.addEventListener("click", (event) => {
        if (!main.classList.contains("is-testing")) return;
        const name = event.target.closest(".term dt");
        if (!name) return;
        event.preventDefault();
        const term = name.closest(".term");
        const open = term.classList.toggle("is-open");
        const link = name.querySelector("a");
        if (link) link.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
    if (index) {
      index.addEventListener("click", (event) => {
        const link = event.target.closest("a");
        if (link && link.getAttribute("aria-disabled") === "true") event.preventDefault();
      });
    }
    doc.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const typing = event.target.closest && event.target.closest("input, textarea");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        input.focus();
      }
      if (event.key === "Escape" && (doc.activeElement === input || input.value)) {
        input.value = "";
        apply();
        if (doc.activeElement === input) input.blur();
      }
    });
    apply();
    function syncNavOffset() {
      const nav = doc.querySelector(".site-nav");
      if (!nav) return;
      doc.documentElement.style.setProperty("--site-nav-h", Math.ceil(nav.getBoundingClientRect().height) + "px");
    }
    syncNavOffset();
    root.addEventListener("resize", syncNavOffset);
  }

  const api = { filterTerms: filterTerms, filterMixups: filterMixups, visibleGroups: visibleGroups, bind: bind };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else bind(root.document);
})(typeof globalThis !== "undefined" ? globalThis : this);