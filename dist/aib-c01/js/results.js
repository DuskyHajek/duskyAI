/* Results for learn sets and timed mocks. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  function weightSegments(ids, ok) {
    const { core } = A;
    return core.DOMAIN_IDS.map((d) => {
      const domainIds = core.idsFor(core.defaultState(), String(d)).filter((id) => ids.includes(id));
      const answered = domainIds.filter((id) => id in ok);
      const correct = answered.filter((id) => ok[id]).length;
      const pct = answered.length ? correct / answered.length : null;
      return { domain: d, weight: core.DOMAIN_WEIGHT[d], short: core.DOMAIN_SHORT[d], pct };
    });
  }

  function layout(o) {
    const { core, ui } = A;
    const pct = o.total ? o.correct / o.total : 0;
    const W = A.widgets;
    const ruler = W ? W.passRuler({ pct, label: "Result on scaled score estimate" }) : ui.ring(pct);
    const segments = weightSegments(o.ids, o.ok);
    const weights = W ? W.weightsBar(segments) : "";
    const heatmap = W ? '<div class="heatmap-wrap"><h3 class="heatmap-title">Question map</h3>'
      + W.questionHeatmap(o.ids, o.ok, o.flags, o.missAct) + "</div>" : "";
    const missed = o.ids.map((id, i) => ({ id, i })).filter((row) => o.ok[row.id] === false);
    const rows = missed.map((row) =>
      '<button type="button" class="miss-row" data-act="' + o.missAct + '" data-index="' + row.i + '"><span class="qid">' + ui.esc(row.id) + "</span>"
      + '<span class="ask">' + ui.esc(core.askOf(core.BY_ID[row.id])) + "</span></button>").join("");
    return '<div class="results">'
      + '<section class="panel score-card"><p class="kicker">' + ui.esc(o.kicker) + "</p>"
      + '<div class="score-top">' + ruler
      + "<div><p class=\"score-num\">" + o.correct + "<span class=\"big-den\"> / " + o.total + "</span></p>"
      + '<p class="sub score-denom">' + Math.round(pct * 100) + "% correct</p></div></div>"
      + '<p class="sub">' + ui.esc(o.scoreline) + "</p>"
      + (weights ? '<div class="weights-wrap">' + weights + "</div>" : "")
      + '<div class="actions">' + o.actions + "</div></section>"
      + '<section class="panel missed-panel"><div class="panel-head"><h2>Missed</h2><span class="sub">' + (missed.length ? missed.length + " to revisit · click to open" : "Nothing missed") + "</span></div>"
      + heatmap
      + '<div class="miss-list">' + (rows || '<p class="sub">Clean run. Try the timed mock next.</p>') + "</div></section></div>";
  }

  function setHtml(set, setId) {
    const { btn } = A.ui;
    const sc = A.core.scoreOf(set);
    const missedCount = set.ids.filter((id) => set.ok[id] === false).length;
    return layout({
      kicker: "Results", ids: set.ids, ok: set.ok, correct: sc.correct, total: sc.total, flags: {},
      scoreline: sc.answered + " answered.",
      missAct: "review-q",
      actions: (missedCount ? btn("Practice the " + missedCount + " missed", "missed", { kind: "primary", data: { set: setId }, iconEnd: "arrowR" }) : "")
        + btn("Try again", "restart", { data: { set: setId }, icon: "redo" })
        + btn("Home", "home", { kind: "quiet", icon: "home" }),
    });
  }

  function examHtml(ex) {
    const { btn } = A.ui;
    const correct = ex.ids.filter((id) => ex.ok[id]).length;
    const last = A.ctx.state.examHistory[A.ctx.state.examHistory.length - 1];
    const mins = Math.round(((last ? last.at : Date.now()) - ex.startedAt) / 60000);
    return layout({
      kicker: "Mock results", ids: ex.ids, ok: ex.ok, correct, total: ex.ids.length, flags: ex.flags || {},
      scoreline: Math.min(mins, ex.durationMin) + " of " + ex.durationMin + " min used.",
      missAct: "exam-review",
      actions: btn("Review with rationales", "exam-review", { kind: "primary", data: { index: 0 }, iconEnd: "arrowR" })
        + btn("New mock", "exam-intro", { icon: "redo" })
        + btn("Home", "home", { kind: "quiet", icon: "home" }),
    });
  }

  A.results = { setHtml, examHtml };
})();