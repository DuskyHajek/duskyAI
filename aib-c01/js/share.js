/* Share canonical page URL: menu with LinkedIn, copy, and system share. */
(function () {
  var open = false;
  var pop = null;
  var trigger = null;

  function canonicalUrl() {
    var link = document.querySelector('link[rel="canonical"]');
    return link && link.href ? link.href : location.origin + location.pathname;
  }

  function pageTitle() {
    return document.title;
  }

  function menuBtn(label, act) {
    return (
      '<button type="button" class="btn quiet" role="menuitem" data-share-act="' +
      act +
      '"><span class="btn-label">' +
      label +
      "</span></button>"
    );
  }

  function buildPop() {
    var html = menuBtn("LinkedIn", "linkedin") + menuBtn("Copy link", "copy");
    if (navigator.share) html += menuBtn("More…", "native");
    pop.innerHTML = html;
    pop.id = "share-pop";
    pop.setAttribute("role", "menu");
    pop.setAttribute("aria-label", "Share options");
    pop.hidden = true;
  }

  function setOpen(next) {
    open = next;
    if (!pop || !trigger) return;
    pop.hidden = !open;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function flashMenuLabel(btn, text) {
    var el = btn.querySelector(".btn-label");
    if (!el) return;
    var prev = el.textContent;
    el.textContent = text;
    window.setTimeout(function () {
      el.textContent = prev;
    }, 2000);
  }

  function copyUrl(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url).then(function () {
        return true;
      });
    }
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(ta);
      resolve(ok);
    });
  }

  function shareLinkedIn(url) {
    var shareUrl =
      "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  function onMenuAction(btn, act) {
    var url = canonicalUrl();
    var title = pageTitle();
    if (act === "linkedin") {
      shareLinkedIn(url);
      setOpen(false);
      return;
    }
    if (act === "copy") {
      copyUrl(url).then(function (ok) {
        if (ok) flashMenuLabel(btn, "Copied");
        setOpen(false);
      });
      return;
    }
    if (act === "native" && navigator.share) {
      navigator.share({ url: url, title: title }).catch(function (err) {
        if (err && err.name === "AbortError") return;
      });
      setOpen(false);
    }
  }

  function onDocClick(ev) {
    if (!open) return;
    var wrap = document.getElementById("share-wrap");
    if (wrap && !wrap.contains(ev.target)) setOpen(false);
  }

  function onDocKey(ev) {
    if (open && ev.key === "Escape") {
      ev.preventDefault();
      setOpen(false);
      trigger.focus();
    }
  }

  function init() {
    trigger = document.getElementById("share-page");
    var wrap = document.getElementById("share-wrap");
    if (!trigger || !wrap) return;
    trigger.setAttribute("aria-label", "Share this page");
    pop = document.createElement("div");
    pop.className = "share-pop";
    buildPop();
    wrap.appendChild(pop);

    trigger.addEventListener("click", function (ev) {
      ev.stopPropagation();
      setOpen(!open);
    });

    pop.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-share-act]");
      if (!btn) return;
      onMenuAction(btn, btn.getAttribute("data-share-act"));
    });

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onDocKey);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();