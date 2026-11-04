// Lucent dPKI Background Service Worker (Manifest V3)

const REGISTERED_DOMAINS = [
  'dotlab.studio',
  'demo.lucent.id',
  'auth.monadtrust.xyz',
  'localhost',
  '127.0.0.1'
];

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Lucent dPKI] Extension installed and background listener active.');
  chrome.action.setBadgeText({ text: 'dPKI' });
  chrome.action.setBadgeBackgroundColor({ color: '#D97706' });
});

// Intercept tab navigation and set security badge accordingly
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      const url = new URL(tab.url);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        chrome.action.setBadgeText({ tabId, text: '' });
        chrome.action.setTitle({ tabId, title: 'Lucent: Browser Internal Page' });
        return;
      }

      const host = url.hostname.toLowerCase();

      // Check if MITM attack simulation is currently active
      chrome.storage.local.get(['mitmSimulation'], (res) => {
        if (res && res.mitmSimulation) {
          chrome.action.setBadgeText({ tabId, text: '!' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#EF4444' });
          chrome.action.setTitle({ tabId, title: `Lucent: Rogue CA MITM Blocked for ${host}!` });
          return;
        }

        if (REGISTERED_DOMAINS.includes(host)) {
          chrome.action.setBadgeText({ tabId, text: '✓' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#10B981' });
          chrome.action.setTitle({ tabId, title: `Lucent: ${host} is verified on Monad via 0x0100` });
        } else {
          chrome.action.setBadgeText({ tabId, text: '?' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#F59E0B' });
          chrome.action.setTitle({ tabId, title: `Lucent: ${host} uses legacy Web PKI (Unverified)` });
        }
      });
    } catch (e) {
      // Ignore URL parsing errors
    }
  }
});
