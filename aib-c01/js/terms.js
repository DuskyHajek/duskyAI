/* Live filter and letter index for the terms and concepts page. */
(function (root) {
  function filterTerms(items, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return items.slice();
    return items.filter((item) => (item.term + " " + item.text).toLowerCase().includes(q));
  }

  function visibleGroups(groups, query) {
    return groups
      .map((group) => ({ letter: group.letter, items: filterTerms(group.items, query) }))
      .filter((group) => group.items.length > 0);
  }

  function bind(doc) {
    const input = doc.getElementById("term-search");
    const index = doc.getElementById("term-index");
    const count = doc.getElementById("term-count");
    const empty = doc.getElementById("term-empty");
    if (!input || !index || !count || !empty) return;

    const groups = Array.prototype.slice.call(doc.querySelectorAll(".letter")).map((section) => {
      const cards = Array.prototype.slice.call(section.querySelectorAll(".term"));
      return {
        section: section,
        letter: section.getAttribute("data-letter") || "",
        items: cards.map((el) => ({ el: el, term: el.getAttribute("data-term") || "", text: el.textContent || "" })),
      };
    });
    const total = groups.reduce((sum, group) => sum + group.items.length, 0);

    index.innerHTML = groups.map((group) => {
      const id = "letter-" + group.letter.toLowerCase();
      return '<a href="#' + id + '" data-letter="' + group.letter + '">' + group.letter + "</a>";
    }).join("");

    function apply() {
      const shown = visibleGroups(groups, input.value);
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

    input.addEventListener("input", apply);
    index.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (link && link.getAttribute("aria-disabled") === "true") event.preventDefault();
    });
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
  }

  const api = { filterTerms: filterTerms, visibleGroups: visibleGroups, bind: bind };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else bind(root.document);
})(typeof globalThis !== "undefined" ? globalThis : this);
