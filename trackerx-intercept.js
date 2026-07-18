// Content script injected on TrackerX (document_start)
// Intercepts GMGN link clicks and window.open, routes via background

// 1. Capture-phase listener on document — fires before inline onclick
document.addEventListener("click", (e) => {
  let el = e.target;
  while (el && el !== document.body) {
    if (el.tagName === "A" && el.href && /^https?:\/\/gmgn\.ai\//.test(el.href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      chrome.runtime.sendMessage({ action: "routeToGmgn", url: el.href, origin: location.hostname });
      return;
    }
    el = el.parentElement;
  }
}, true);

// 2. Inject into page world to intercept window.open (for quote cards etc)
const script = document.createElement("script");
script.textContent = `
  (function() {
    const _open = window.open;
    window.open = function(url) {
      if (url && /^https?:\\/\\/gmgn\\.ai\\//.test(url)) {
        window.dispatchEvent(new CustomEvent("__trackerx_gmgn__", { detail: url }));
        return null;
      }
      return _open.apply(this, arguments);
    };
  })();
`;
(document.head || document.documentElement).appendChild(script);
script.remove();

// Listen for the custom event from page world
window.addEventListener("__trackerx_gmgn__", (e) => {
  chrome.runtime.sendMessage({ action: "routeToGmgn", url: e.detail, origin: location.hostname });
});
