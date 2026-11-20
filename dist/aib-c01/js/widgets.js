/* Exam-specific UI: evidence highlight, pass ruler, weights bar, progress segments, question grid. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  const SKIP_RE = /\b(?:AIB-C01|ISO\/IEC\s+\d+|Domain\s+\d|Tier\s+\d|NIST\s+AI)\b/gi;
  const EVIDENCE_RE = /(?:\$[\d,]+(?:\.\d+)?(?:\s*(?:million|billion|thousand))?|\d[\d,]*(?:\.\d+)?\s*(?:%|percent|minutes?|hours?|days?|weeks?|months?|years?|seconds?|pages?|queries|customers?|stores?|SKUs?|tokens?|min)\b|\d[\d,]*(?:\.\d+)?)/gi;

  function highlightEvidence(escapedText) {
    if (!escapedText) return "";
    const skips = [];
    let masked = escapedText.replace(SKIP_RE, (m) => {
      const key = "__SKIP" + String.fromCharCode(65 + skips.length) + "__";
      skips.push(m);
      return key;
    });
    masked = masked.replace(EVIDENCE_RE, (m) => '<mark class="ev">' + m + "</mark>");
    return masked.replace(/__SKIP([A-Z])__/g, (_, ch) => skips[ch.charCodeAt(0) - 65] || "");
  }

  function passRuler(opts) {
    opts = opts || {};
    const pct = opts.pct;
    const score = pct != null ? 100 + Math.round(pct * 900) : null;
    const marker = score != null ? '<span class="pass-user" style="left:' + (((score - 100) / 900) * 100).toFixed(2) + '%" aria-hidden="true"></span>' : "";
    const scoreLabel = score != null
      ? '<span class="pass-score">' + score + "</span>"
      : '<span class="pass-score muted">-</span>';
    return '<div class="pass-ruler" role="img" aria-label="' + (opts.label || "Scaled score estimate") + '">'
      + '<div class="pass-track">'
      + '<span class="pass-mark pass-100" style="left:0%">100</span>'
      + '<span class="pass-line pass-cut" style="left:66.667%" aria-hidden="true"></span>'
      + '<span class="pass-mark pass-700" style="left:66.667%">700</span>'
      + '<span class="pass-mark pass-1000" style="right:0">1000</span>'
      + marker
      + "</div>"
      + '<div class="pass-foot">' + scoreLabel
      + '<span class="pass-note">Linear estimate · official AWS scoring is weighted</span></div></div>';
  }

  function weightsBar(segments) {
    const cols = segments.map((s) => (s.weight || 24) + "fr").join(" ");
    let html = '<div class="weights-bar" style="grid-template-columns:' + cols + '" role="img" aria-label="Exam domain weights and your accuracy">';
    segments.forEach((s) => {
      const fill = s.pct != null ? Math.round(s.pct * 100) : 0;
      const low = s.pct != null && fill < 60 ? " low" : "";
      const tip = "Domain " + s.domain + " · " + (s.weight || 0) + "% · " + (s.pct != null ? fill + "% first try" : "not started");
      html += '<div class="wt-seg" title="' + tip + '"><i class="wt-fill' + low + '" style="width:' + fill + '%"></i>'
        + '<span class="wt-lbl">' + (A.ui ? A.ui.esc(s.short || "D" + s.domain) : (s.short || ("D" + s.domain))) + "</span></div>";
    });
    return html + "</div>";
  }

  function segmentState(store, id, i, cursor, graded, answered, flags) {
    if (i === cursor) return "on";
    if (graded && id in graded) return graded[id] ? "hit" : "miss";
    if (flags && flags[id]) return "flagged";
    if ((answered && answered[id] && answered[id].length) || (store.drafts && store.drafts[id] && store.drafts[id].length)) return "answered";
    return "";
  }

  function segmentedBar(store, cursor, o) {
    o = o || {};
    const flags = o.flags || {};
    const graded = o.graded || null;
    const answered = o.answered || {};
    let cells = "";
    store.ids.forEach((id, i) => {
      const st = segmentState(store, id, i, cursor, graded, answered, flags);
      cells += '<span class="seg' + (st ? " " + st : "") + '" aria-hidden="true"></span>';
    });
    return '<div class="seg-bar" style="--seg-n:' + store.ids.length + '" role="presentation" aria-hidden="true">' + cells + "</div>";
  }

  function questionGrid(store, cursor, o) {
    o = o || {};
    const flags = o.flags || {};
    const graded = o.graded || null;
    const answered = o.answered || {};
    const jumpAct = o.jumpAct || "jump-learn";
    const id = o.id || "qjump-pop";
    const hidden = o.hidden !== false;
    let html = '<div class="qjump-pop" id="' + id + '"' + (hidden ? " hidden" : "") + ' role="dialog" aria-label="Jump to question"><div class="qgrid">';
    store.ids.forEach((qid, i) => {
      let cls = "qcell";
      const bits = ["Question " + (i + 1)];
      if (i === cursor) { cls += " on"; bits.push("current"); }
      if (flags[qid]) { cls += " flagged"; bits.push("flagged"); }
      if (graded && qid in graded) {
        cls += graded[qid] ? " hit" : " miss";
        bits.push(graded[qid] ? "correct" : "missed");
      } else if ((answered[qid] && answered[qid].length) || (store.drafts && store.drafts[qid] && store.drafts[qid].length)) {
        cls += " answered";
      }
      html += '<button type="button" class="' + cls + '" data-act="' + jumpAct + '" data-index="' + i + '" aria-label="' + bits.join(", ") + '">' + (i + 1) + "</button>";
    });
    return html + "</div></div>";
  }

  function questionHeatmap(ids, ok, flags, jumpAct) {
    const grid = questionGrid(
      { ids: ids, drafts: {} },
      -1,
      { graded: ok, flags: flags || {}, answered: {}, jumpAct: jumpAct || "review-q", id: "results-heatmap", hidden: false },
    );
    return grid.replace('class="qjump-pop"', 'class="qheatmap"');
  }

  A.widgets = {
    highlightEvidence,
    passRuler,
    weightsBar,
    segmentedBar,
    questionGrid,
    questionHeatmap,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = A.widgets;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);