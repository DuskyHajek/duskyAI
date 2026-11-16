/* Live filter for the terms and concepts page. */
(function (root) {
  function filterTerms(items, query) {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return items.slice();
    return items.filter((item) => (item.term + " " + item.text).toLowerCase().includes(q));
  }

  function bind(doc) {
    const input = doc.getElementById("term-search");
    const list = doc.getElementById("term-list");
    const count = doc.getElementById("term-count");
    const empty = doc.getElementById("term-empty");
    if (!input || !list || !count || !empty) return;
    const cards = Array.prototype.slice.call(list.querySelectorAll(".term"));
    const items = cards.map((el) => ({ el: el, term: el.getAttribute("data-term") || "", text: el.textContent || "" }));

    function apply() {
      const shown = filterTerms(items, input.value);
      const visible = new Set(shown.map((item) => item.el));
      cards.forEach((el) => { el.hidden = !visible.has(el); });
      const n = shown.length;
      count.textContent = n === cards.length ? cards.length + " terms" : n + " of " + cards.length;
      empty.hidden = n !== 0;
    }

    input.addEventListener("input", apply);
    apply();
  }

  const api = { filterTerms: filterTerms, bind: bind };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else bind(root.document);
})(typeof globalThis !== "undefined" ? globalThis : this);
