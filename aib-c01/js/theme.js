/* Dark / light toggle in the site nav. Shares the practice progress key. */
(function () {
  var KEY = "aib-c01-practice-v2";
  var SUN = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  var MOON = '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z"/>';

  function isDark() {
    return document.documentElement.dataset.theme === "dark";
  }

  function paint(btn, dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#14110e" : "#f3efe6");
    if (!btn) return;
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    var icon = btn.querySelector(".ic");
    var label = btn.querySelector(".btn-label");
    if (icon) icon.innerHTML = dark ? SUN : MOON;
    if (label) label.textContent = dark ? "Light" : "Dark";
  }

  function persist(dark) {
    var app = window.AIB;
    if (app && app.ctx && app.ctx.state) {
      if (!app.ctx.state.prefs) app.ctx.state.prefs = {};
      app.ctx.state.prefs.theme = dark ? "dark" : "light";
      if (app.app && app.app.save) app.app.save();
      return;
    }
    var state = {};
    try {
      state = JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
      state = {};
    }
    if (!state.prefs || typeof state.prefs !== "object") state.prefs = {};
    state.prefs.theme = dark ? "dark" : "light";
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function init() {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    paint(btn, isDark());
    btn.addEventListener("click", function () {
      var next = !isDark();
      persist(next);
      paint(btn, next);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();