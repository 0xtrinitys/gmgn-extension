(function() {
  const T = location.href.includes('/follow') || location.href.includes('popout=true');
  const P = location.href.includes('/token/');

  if (P) {
    chrome.runtime.sendMessage({ type: 'registerChart' });
    chrome.runtime.onMessage.addListener(m => {
      if (m.type !== 'navigateToken') return;
      const url = 'https://gmgn.ai/' + m.chain + '/token/' + m.address;
      // Create a temporary anchor and click it — Next.js router intercepts
      // the click and does client-side navigation (no full reload)
      const a = document.createElement('a');
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
