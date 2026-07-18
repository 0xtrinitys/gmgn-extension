// gmgn-content.js — GMGN content script (merged)
// 1. Full Chart: registra aba de chart e intercepta cliques em follow/popout
// 2. Handle Capture: captura cliques no "+" para adicionar handle no TrackerX

(function () {

  // ─── Full Chart (from gmgn-extension) ───────────────────────────────────────

  const isTokenPage      = location.href.includes('/token/');
  const isFollowOrPopout = location.href.includes('/follow') || location.href.includes('popout=true');

  if (isTokenPage) {
    chrome.runtime.sendMessage({ type: 'registerChart' });
  }

  if (isFollowOrPopout) {
    document.addEventListener('click', e => {
      const l = e.target.closest('a[href*="/token/"]');
      if (!l) return;
      const h = l.getAttribute('href') || '';
      const m = h.match(/\/(sol|bsc|eth|base|robinhood)\/token\/([A-Za-z0-9]+)/);
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

  // ─── Handle Capture (from TrackerX Extension gmgn-capture.js) ───────────────

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const svg = btn.querySelector('svg');
    if (!svg) return;
    const paths = svg.querySelectorAll('path');
    if (paths.length < 2) return;

    // Sobe até encontrar um link com x.com/handle
    let handle = null;
    let parent = btn.parentElement;
    for (let i = 0; i < 5 && parent; i++) {
      const link = parent.querySelector('a[href*="x.com/"]');
      if (link) {
        const m = link.getAttribute('href').match(/x\.com\/([A-Za-z0-9_]+)/);
        if (m) { handle = m[1]; break; }
      }
      parent = parent.parentElement;
    }
    if (!handle) return;

    try {
      const response = await chrome.runtime.sendMessage({ action: 'addHandle', handle });
      if (response.error) {
        if (response.error.includes('token')) {
          showToast(`@${handle} — Token não configurado`, 'error');
        } else if (response.error.includes('already') || response.error.includes('exists')) {
          showToast(`@${handle} já está no TrackerX`, 'info');
        } else {
          showToast(`@${handle} — ${response.error}`, 'error');
        }
      } else {
        showToast(`@${handle} adicionado ao TrackerX ✓`, 'success');
      }
    } catch (err) {
      showToast(`@${handle} — erro: ${err.message}`, 'error');
    }
  }, true);

  // ─── Toast helper ────────────────────────────────────────────────────────────

  function showToast(text, type = 'info') {
    const existing = document.getElementById('trackerx-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'trackerx-toast';
    toast.textContent = text;

    const colors = {
      success: 'rgba(0, 200, 83, 0.95)',
      error:   'rgba(220, 50, 50, 0.95)',
      info:    'rgba(60, 60, 60, 0.95)',
    };

    Object.assign(toast.style, {
      position:   'fixed',
      bottom:     '20px',
      right:      '20px',
      padding:    '10px 18px',
      borderRadius: '8px',
      background: colors[type] || colors.info,
      color:      '#fff',
      fontSize:   '13px',
      fontFamily: 'system-ui, sans-serif',
      fontWeight: '500',
      zIndex:     '999999',
      boxShadow:  '0 4px 12px rgba(0,0,0,0.4)',
      transition: 'opacity 0.3s',
      opacity:    '1',
    });

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  console.log('[TrackerX Extension] GMGN content loaded v2.3');
})();
