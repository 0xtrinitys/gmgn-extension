// TrackerX Extension — Background Service Worker v2.3
// Routes GMGN links to largest window with Next.js SPA navigation
// + TrackerX handle API + FastSniper referral injection

const TRACKERX_URL = 'https://trackerx.io';

// ─── Window helpers ───────────────────────────────────────────────────────────

async function findLargestWindow() {
  const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
  if (windows.length === 0) return null;
  return windows.reduce((a, b) => (a.width * a.height >= b.width * b.height) ? a : b);
}

// ─── GMGN SPA routing ────────────────────────────────────────────────────────

async function routeToGmgn(url) {
  try {
    const largest = await findLargestWindow();
    if (!largest) { chrome.tabs.create({ url }); return; }

    const gmgnTabs = await chrome.tabs.query({ windowId: largest.id, url: 'https://gmgn.ai/*' });

    if (gmgnTabs.length > 0) {
      const tab = gmgnTabs[0];
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(largest.id, { focused: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: (fullUrl) => {
          const target = new URL(fullUrl);
          const targetPath = target.pathname + target.search + target.hash;

          // Strategy 1: Next.js router
          try {
            if (window.next?.router?.push) {
              window.next.router.push(targetPath, targetPath, { shallow: false });
              setTimeout(() => {
                if (window.location.pathname !== target.pathname) window.location.assign(fullUrl);
              }, 500);
              return;
            }
          } catch (e) {}

          // Strategy 2: History API + popstate
          try {
            window.history.pushState({}, '', fullUrl);
            window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
            window.dispatchEvent(new Event('routeChangeStart'));
            const oldContent = document.querySelector('main')?.innerHTML?.slice(0, 100) || '';
            setTimeout(() => {
              const newContent = document.querySelector('main')?.innerHTML?.slice(0, 100) || '';
              if (window.location.pathname !== target.pathname || oldContent === newContent) {
                window.location.assign(fullUrl);
              }
            }, 800);
            return;
          } catch (e) {}

          // Strategy 3: Hard navigate
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

// ─── FastSniper referral injection ───────────────────────────────────────────

function injectReferral(url, origin) {
  if (origin !== 'fastsniper.net') return url;
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/([^/]+)\/token\/(.+)$/);
    if (m && !m[2].startsWith('yodacalls_')) {
      u.pathname = `/${m[1]}/token/yodacalls_${m[2]}`;
      return u.href;
    }
  } catch {}
  return url;
}

// ─── TrackerX handle API ──────────────────────────────────────────────────────

async function handleAddHandle(handle) {
  try {
    const { trackerxToken } = await chrome.storage.local.get('trackerxToken');
    if (!trackerxToken) return { error: 'token not configured' };
    const res = await fetch(`${TRACKERX_URL}/api/handles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${trackerxToken}` },
      body: JSON.stringify({ handle }),
    });
    return await res.json();
  } catch (err) {
    return { error: `connection failed: ${err.message}` };
  }
}

// ─── Chart tab tracking (from gmgn-extension) ────────────────────────────────

let chartTabId = null;

chrome.tabs.onRemoved.addListener(id => { if (id === chartTabId) chartTabId = null; });
chrome.tabs.query({ url: '*://gmgn.ai/*/token/*' }, tabs => {
  if (tabs.length) chartTabId = tabs[0].id;
});

// ─── Message router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // TrackerX/FastSniper → GMGN routing
  if (msg.action === 'routeToGmgn') {
    const finalUrl = injectReferral(msg.url, msg.origin || '');
    routeToGmgn(finalUrl);
    return false;
  }

  // Handle capture → TrackerX API
  if (msg.action === 'addHandle') {
    handleAddHandle(msg.handle).then(sendResponse);
    return true;
  }

  // GMGN internal: register chart tab
  if (msg.type === 'registerChart') {
    chartTabId = sender.tab?.id ?? null;
    return false;
  }

  // GMGN internal: route from follow/popout
  if (msg.type === 'openChart') {
    routeToGmgn(msg.url);
    return false;
  }
});

console.log('[TrackerX Extension] Background loaded v2.3');
