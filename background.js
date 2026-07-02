let c = null;
chrome.runtime.onMessage.addListener((m, s, r) => {
  if (m.type === 'registerChart') { c = s.tab.id; return; }
  if (m.type === 'openChart') {
    chrome.tabs.query({ url: '*://gmgn.ai/*' }, t => {
      if (c) {
        let f = t.find(x => x.id === c);
        if (f) {
          chrome.tabs.sendMessage(c, { type: 'navigateToken', chain: m.chain, address: m.address });
          chrome.tabs.update(c, { active: true });
          chrome.windows.update(f.windowId, { focused: true });
          return;
        }
        c = null;
      }
      let f = t.find(x => x.url && x.url.includes('/token/') && x.id !== s.tab.id);
      if (f) {
        c = f.id;
        chrome.tabs.sendMessage(f.id, { type: 'navigateToken', chain: m.chain, address: m.address });
        chrome.tabs.update(f.id, { active: true });
        chrome.windows.update(f.windowId, { focused: true });
        return;
      }
      chrome.tabs.create({ url: m.url }, n => { c = n.id; });
    });
  }
});
chrome.tabs.onRemoved.addListener(i => { if (i === c) c = null; });
chrome.tabs.query({ url: '*://gmgn.ai/*/token/*' }, t => { if (t.length) c = t[0].id; });
