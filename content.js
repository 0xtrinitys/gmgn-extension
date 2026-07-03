(function() {
  const T = location.href.includes('/follow') || location.href.includes('popout=true');
  const P = location.href.includes('/token/');

  if (P) {
    chrome.runtime.sendMessage({ type: 'registerChart' });
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
      chrome.runtime.sendMessage({
        type: 'openChart',
        chain: m[1],
        address: m[2],
        url: 'https://gmgn.ai/' + m[1] + '/token/' + m[2]
      });
    }, true);
  }
})();
