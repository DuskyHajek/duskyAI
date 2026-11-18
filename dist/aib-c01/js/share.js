/* Share canonical page URL (native share or copy link). */
(function () {
  function canonicalUrl() {
    var link = document.querySelector('link[rel="canonical"]');
    return link && link.href ? link.href : location.origin + location.pathname;
  }

  function flashCopied(btn) {
    var el = btn.querySelector(".btn-label");
    if (!el) return;
    var prev = el.textContent;
    el.textContent = "Copied";
    btn.setAttribute("aria-label", "Link copied");
    window.setTimeout(function () {
      el.textContent = prev;
      btn.setAttribute("aria-label", "Share this page");
    }, 2000);
  }

  function copyUrl(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(url).then(function () { return true; });
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

  function onShareClick(btn) {
    var url = canonicalUrl();
    var title = document.title;
    if (navigator.share) {
      navigator.share({ url: url, title: title }).catch(function (err) {
        if (err && err.name === "AbortError") return;
        copyUrl(url).then(function (ok) {
          if (ok) flashCopied(btn);
        });
      });
      return;
    }
    copyUrl(url).then(function (ok) {
      if (ok) flashCopied(btn);
    });
  }

  function init() {
    var btn = document.getElementById("share-page");
    if (!btn) return;
    btn.setAttribute("aria-label", "Share this page");
    btn.addEventListener("click", function () {
      onShareClick(btn);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();