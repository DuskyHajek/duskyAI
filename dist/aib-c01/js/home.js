/* Home dashboard and timed mock intro. */
(function (root) {
  const A = (root.AIB = root.AIB || {});

  function effectivePhase(set) {
    if (!set) return "new";
    const phase = A.core.phaseOf(set);
    if (phase === "active" && A.core.scoreOf(set).answered === 0) return "new";
    return phase;
  }

  function lastMockRun(history) {
    const list = history || [];
    for (let i = list.length - 1; i >= 0; i--) {
      const entry = list[i];
      const answered = entry.answered != null ? entry.answered : (entry.correct > 0 ? entry.total : 0);
      if (answered > 0) return entry;
    }
    return null;
  }

  function setActions(setId, phase) {
    const { btn } = A.ui;
    const data = { set: setId };
    if (phase === "active") {
      return btn("Continue", "start", { data, iconEnd: "arrowR", cls: "sm" })
        + btn("", "restart", { data, kind: "quiet", cls: "sm icon-only", icon: "redo", title: "Start over" });
    }
    if (phase === "done") {
      return btn("Results", "results", { data, cls: "sm" })
        + btn("", "restart", { data, kind: "quiet", cls: "sm icon-only", icon: "redo", title: "Try again" });
    }
    return btn("Start", "start", { data, iconEnd: "arrowR", cls: "sm" });
  }

  function heroPrimaryHtml(state) {
    const { core, ui } = A;
    if (core.hasActiveExam(state)) {
      return ui.btn("Continue mock", "exam-continue", { kind: "primary", icon: "clock", iconEnd: "arrowR" });
    }
    const all = state.sets.all;
    const allPhase = core.phaseOf(all);
    const displayPhase = effectivePhase(all);
    if (allPhase === "active") {
      const sc = core.scoreOf(all);
      if (sc.answered > 0) {
        return ui.btn("", "start", {
          kind: "primary",
          data: { set: "all" },
          iconEnd: "arrowR",
          htmlLabel: '<span class="btn-label">Continue full set <span class="hero-count">' + sc.answered + " / " + sc.total + "</span></span>",
        });
      }
    }
    const savedN = core.savedIds(state).length;
    if (displayPhase === "done" && savedN) {
      const savedSet = state.sets.saved;
      const sp = core.savedProgress(state);
      if (core.phaseOf(savedSet) === "active" && sp.reviewed > 0 && sp.reviewed < sp.total) {
        return ui.btn("", "start", {
          kind: "primary",
          data: { set: "saved" },
          iconEnd: "arrowR",
          htmlLabel: '<span class="btn-label">Continue saved <span class="hero-count">' + sp.reviewed + " / " + sp.total + "</span></span>",
        });
      }
      return ui.btn("", "restart", {
        kind: "primary",
        data: { set: "saved" },
        iconEnd: "arrowR",
        htmlLabel: '<span class="btn-label">Review saved <span class="hero-count">' + savedN + "</span></span>",
      });
    }
    if (allPhase === "done") {
      return ui.btn("Review results", "results", { kind: "primary", data: { set: "all" }, iconEnd: "arrowR" });
    }
    return ui.btn("Start full set", "start", { kind: "primary", data: { set: "all" }, iconEnd: "arrowR" });
  }

  function firstTryChipHtml(state) {
    const stats = A.core.firstTryStats(state);
    if (stats.overall.answered < 1) return "";
    const pct = Math.round(stats.overall.pct * 100);
    const tip = "First-try accuracy across " + stats.overall.answered + " answered questions";
    return '<p class="first-try-chip" title="' + A.ui.esc(tip) + '">First try · '
      + stats.overall.answered + "/" + stats.overall.total + " · " + pct + "%</p>";
  }

  function heroCtaHtml(state) {
    return '<div class="hero-cta">' + firstTryChipHtml(state) + heroPrimaryHtml(state) + "</div>";
  }

  function scoreMeter(correct, total) {
    const pct = total ? Math.round(correct / total * 100) : 0;
    const label = correct + " of " + total + " correct";
    return '<div class="track" role="meter" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + correct + '" aria-label="' + A.ui.esc(label) + '"><i style="width:' + pct + '%"></i></div>';
  }

  function domainMeter(state, domainId) {
    const ids = A.core.idsFor(state, String(domainId));
    const tries = state.firstTry || {};
    const answeredIds = ids.filter((id) => id in tries);
    if (!answeredIds.length) return "";
    const correct = answeredIds.filter((id) => tries[id]).length;
    const answered = answeredIds.length;
    const pct = correct / answered;
    const low = answered >= 5 && pct < 0.6 ? " low" : "";
    const label = correct + " of " + answered + " correct on first try";
    const pctLabel = Math.round(pct * 100) + "% first try";
    return '<span class="dacc-wrap" title="' + A.ui.esc(label) + '">'
      + '<span class="dacc-label">' + pctLabel + "</span>"
      + '<div class="track dacc' + low + '" role="meter" aria-valuemin="0" aria-valuemax="' + answered + '" aria-valuenow="' + correct + '" aria-label="' + A.ui.esc("First try, " + label) + '"><i style="width:' + Math.round(pct * 100) + '%"></i></div></span>';
  }

  function setNote(set, phase, fallback, compact) {
    const display = effectivePhase(set);
    if (display === "new") return fallback;
    const sc = A.core.scoreOf(set);
    if (display === "done") return sc.correct + (compact ? "/" : " of ") + sc.total + " correct";
    return compact
      ? sc.answered + "/" + sc.total + " done"
      : sc.answered + " of " + sc.total + " answered · " + sc.correct + " right";
  }

  function domainsHtml(state) {
    const { core, ui } = A;
    const stats = core.firstTryStats(state);
    const rows = core.DOMAIN_IDS.map((d) => {
      const id = String(d);
      const set = state.sets[id];
      const phase = effectivePhase(set);
      const count = core.idsFor(state, id).length;
      const weight = core.DOMAIN_WEIGHT[d] != null
        ? '<span class="wt-pill">' + core.DOMAIN_WEIGHT[d] + "%</span>"
        : "";
      const weakest = stats.weakestDomain === d
        ? '<span class="weak-badge">Weakest</span>'
        : "";
      return '<div class="drow">'
        + '<div class="dname"><span class="dnum">' + d + "</span><div><strong>"
        + ui.esc(core.DOMAIN_SHORT[d] || "Domain " + d)
        + weight + weakest
        + "</strong><small>" + ui.esc(core.DOMAINS[d]) + "</small></div></div>"
        + '<div class="dset"><span>' + ui.esc(setNote(set, phase, count + " questions", true)) + "</span>"
        + domainMeter(state, id)
        + '<div class="actions">' + setActions(id, phase) + "</div></div>"
        + "</div>";
    }).join("");
    return '<section class="panel domains"><div class="panel-head"><h2>Domains</h2></div>' + rows + "</section>";
  }

  function tilesHtml(state) {
    const { core, ui } = A;
    const all = state.sets.all;
    const allPhase = effectivePhase(all);
    const fullSc = allPhase === "new" ? null : core.scoreOf(all);
    const fullScore = fullSc && fullSc.answered > 0 ? scoreMeter(fullSc.correct, fullSc.total) : "";
    const fullOrder = all && all.shuffled
      ? core.QUESTIONS.length + " questions, shuffled"
      : core.QUESTIONS.length + " questions in exam order";
    const full = '<article class="tile"><div class="tile-row"><div class="tile-copy"><h3>Full practice set</h3><p>'
      + ui.esc(setNote(all, allPhase, fullOrder)) + '</p></div><div class="actions">'
      + setActions("all", allPhase) + "</div></div>" + fullScore + "</article>";

    const sp = core.savedProgress(state);
    const savedSet = state.sets.saved;
    const savedPhase = effectivePhase(savedSet);
    let savedNote;
    if (sp.total) {
      if (savedPhase === "active" && sp.reviewed > 0) savedNote = sp.reviewed + " of " + sp.total + " reviewed";
      else if (savedPhase === "active") savedNote = sp.total + " left to review";
      else savedNote = sp.total + " saved from misses and pins";
    }
    const saved = sp.total
      ? '<article class="tile"><div class="tile-row"><div class="tile-copy"><h3>Saved questions</h3><p>'
        + ui.esc(savedNote)
        + '</p></div><div class="actions">'
        + ui.btn(savedPhase === "active" ? "Continue" : "Review", savedPhase === "active" ? "start" : "restart", { data: { set: "saved" }, iconEnd: "arrowR", cls: "sm" })
        + "</div></div></article>"
      : '<article class="tile empty"><div class="tile-row"><div class="tile-copy"><h3>Saved questions</h3><p>Misses auto-save here; pin with Save or <kbd>S</kbd>.</p></div></div></article>';

    const active = core.hasActiveExam(state);
    const last = lastMockRun(state.examHistory);
    const mockNote = active
      ? "In progress · " + Math.max(0, Math.ceil(core.examTimeLeft(state.exam) / 60000)) + " min left"
      : last ? "Last run " + last.correct + "/" + last.total + " · " + core.QUESTIONS.length + " questions, no hints"
        : "No mock yet · " + core.QUESTIONS.length + " questions, no hints";
    const mock = '<article class="tile dark"><div class="tile-row"><div class="tile-copy"><h3>Timed mock</h3><p>'
      + ui.esc(mockNote)
      + '</p></div><div class="actions">'
      + (active ? ui.btn("Continue", "exam-continue", { cls: "sm", iconEnd: "arrowR" }) : ui.btn("Start mock", "exam-intro", { cls: "sm", icon: "clock" }))
      + "</div></div></article>";
    return '<div class="tiles">' + full + saved + mock + "</div>";
  }

  function menuHtml() {
    const { btn, icon } = A.ui;
    const prefs = A.ctx.state.prefs || {};
    const shuffleRetry = prefs.shuffleOnRetry !== false;
    return '<details class="menu"><summary class="btn quiet sm settings-btn" aria-label="Settings" title="Settings">'
      + icon("sliders") + '<span class="btn-label">Settings</span></summary>'
      + '<div class="menu-pop">'
      + btn("Shuffle on retry", "shuffle-retry", { kind: "quiet", icon: "redo", pressed: shuffleRetry, title: "Full set order and shuffles on retry for finished domain and saved runs. Missed questions always shuffle." })
      + "<hr>"
      + btn("Export progress", "export", { kind: "quiet", icon: "download" })
      + btn("Import progress", "import", { kind: "quiet", icon: "upload" })
      + "<hr>" + btn("Clear all progress", "clear", { kind: "danger", icon: "trash" })
      + "</div></details>";
  }

  function html() {
    const state = A.ctx.state;
    return '<div class="home"><div class="home-grid">' + tilesHtml(state) + domainsHtml(state) + "</div></div>";
  }

  function introHtml() {
    const { core, ui } = A;
    const state = A.ctx.state;
    const active = core.hasActiveExam(state);
    const warn = active
      ? '<div class="warn"><span>A mock is already running with ' + Math.max(0, Math.ceil(core.examTimeLeft(state.exam) / 60000)) + " min left. Starting a new one discards it.</span>"
        + ui.btn("Continue it", "exam-continue", { cls: "sm", iconEnd: "arrowR" }) + "</div>"
      : "";
    const pace = (min, title, sub) => '<button type="button" class="pace" data-act="exam-start" data-min="' + min + '"><strong>' + min + "<small>min</small></strong><span>" + title + "</span><em>" + sub + "</em>" + ui.icon("arrowR", "ic-end") + "</button>";
    return '<section class="panel intro"><p class="kicker">Timed mock</p><h2>' + core.QUESTIONS.length + " questions, exam pressure</h2>"
      + '<ul class="rules"><li>' + ui.icon("x") + "No rationales until you submit</li><li>" + ui.icon("flag") + "Flag items with <kbd>M</kbd> to revisit</li><li>" + ui.icon("clock") + "Blanks count as wrong; time up submits</li></ul>"
      + warn
      + '<div class="pace-grid">' + pace(130, "Exam guide pace", "Recommended") + pace(170, "Beta pace", "Extra time") + "</div>"
      + ui.btn("Back", "home", { kind: "quiet", icon: "arrowL" }) + "</section>";
  }

  A.home = { html, introHtml, menuHtml, heroCtaHtml };
})(this);