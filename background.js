// GMGN Full Chart — Background Service Worker v2.0
// Routes GMGN token clicks to largest window with Next.js SPA navigation

async function findLargestWindow() {
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
  if (windows.length === 0) return null;
  return windows.reduce((a, b) => (a.width * a.height >= b.width * b.height) ? a : b);
}

async function routeToGmgn(url) {
  try {
    const largest = await findLargestWindow();
    if (!largest) { chrome.tabs.create({ url }); return; }

    const gmgnTabs = await chrome.tabs.query({ windowId: largest.id, url: "https://gmgn.ai/*" });

    if (gmgnTabs.length > 0) {
      const tab = gmgnTabs[0];
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(largest.id, { focused: true });

      // SPA navigation — 3 strategies with fallback (based on TrackerX approach)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: "MAIN",
        func: (fullUrl) => {
          const target = new URL(fullUrl);
          const targetPath = target.pathname + target.search + target.hash;

          // Strategy 1: Next.js router (if available)
          try {
            if (window.next?.router?.push) {
              window.next.router.push(targetPath, targetPath, { shallow: false });
              setTimeout(() => {
                if (window.location.pathname !== target.pathname) {
                  window.location.assign(fullUrl);
                }
              }, 500);
              return;
            }
          } catch (e) {}

          // Strategy 2: History API + popstate
          try {
            window.history.pushState({}, "", fullUrl);
            window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
            const oldContent = document.querySelector("main")?.innerHTML?.slice(0, 100) || "";
            setTimeout(() => {
              const newContent = document.querySelector("main")?.innerHTML?.slice(0, 100) || "";
              if (window.location.pathname !== target.pathname || oldContent === newContent) {
                window.location.assign(fullUrl);
              }
            }, 800);
            return;
          } catch (e) {}

          // Strategy 3: Hard navigate (fallback)
          window.location.assign(fullUrl);
        },
        args: [url],
      });
    } else {
      await chrome.tabs.create({ url, windowId: largest.id, active: true });
      await chrome.windows.update(largest.id, { focused: true });
    }
  } catch (err) {
    chrome.tabs.create({ url });
  }
}

let c = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'registerChart') {
    c = sender.tab.id;
    return false;
  }
  if (msg.type === 'openChart') {
    routeToGmgn(msg.url);
    return false;
  }
});

chrome.tabs.onRemoved.addListener(i => { if (i === c) c = null; });
chrome.tabs.query({ url: '*://gmgn.ai/*/token/*' }, t => { if (t.length) c = t[0].id; });

console.log("[GMGN Full Chart] Background loaded v2.0");
