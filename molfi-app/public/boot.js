(function () {
  try {
    var t = localStorage.getItem("lx-theme");
    if (t !== "light" && t !== "dark") t = "dark";
    var d = document.documentElement;
    d.classList.remove("light", "dark");
    d.classList.add(t);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();

(function () {
  var k = "lx-chunk-reload";
  function r() {
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
    var u = new URL(location.href);
    u.searchParams.set("_lx", Date.now());
    location.replace(u.toString());
  }
  function ok(m) {
    m = (m || "").toLowerCase();
    return (
      m.indexOf("mime type") > -1 ||
      m.indexOf("failed to load module script") > -1 ||
      m.indexOf("dynamically imported module") > -1 ||
      m.indexOf("chunkloaderror") > -1
    );
  }
  window.addEventListener("vite:preloadError", r);
  window.addEventListener(
    "error",
    function (e) {
      var t = e.target;
      if (
        t &&
        t.tagName === "SCRIPT" &&
        t.src &&
        (t.src.indexOf("/assets/") > -1 || /\.m?js(?:[?#]|$)/.test(t.src))
      )
        r();
      else if (ok(e.message) || ok(e.filename)) r();
    },
    true,
  );
  window.addEventListener("unhandledrejection", function (e) {
    var m =
      e.reason && e.reason.message
        ? e.reason.message
        : typeof e.reason === "string"
          ? e.reason
          : "";
    if (ok(m)) r();
  });
  window.addEventListener("load", function () {
    sessionStorage.removeItem(k);
  });
})();
