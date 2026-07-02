(function() {
  const T = location.href.includes('/follow') || location.href.includes('popout=true');
  const P = location.href.includes('/token/');

  if (P) {
    chrome.runtime.sendMessage({ type: 'registerChart' });
    chrome.runtime.onMessage.addListener(m => {
      if (m.type !== 'navigateToken') return;
      // GMGN uses Next.js — use window.location to navigate.
      // To avoid full page reload flash, use location.assign() 
      // which reuses the same tab without creating history bloat
      const url = 'https://gmgn.ai/' + m.chain + '/token/' + m.address;
      window.location.assign(url);
    });
  }

  if (T) {
    document.addEventListener('click', e => {
      const l = e.target.closest('a[href*="/token/"]');
      if (!l) return;
      const h = l.getAttribute('href') || '';
      const m = h.match(/\/(sol|bsc|eth|base)\/token\/([A-Za-z0-9]+)/);
      if (!m) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      chrome.runtime.sendMessage({ type: 'openChart', chain: m[1], address: m[2], url: 'https://gmgn.ai/' + m[1] + '/token/' + m[2] });
    }, true);
  }
})();
