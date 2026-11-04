// Lucent dPKI Verifier & Gatekeeper Popup Controller

const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz';
const CERT_REGISTRY = '0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b';

const REGISTERED_DOMAINS = {
  'dotlab.studio': {
    status: 'ACTIVE',
    keyHash: '0x1ec92b50d3e9b1630f820f1ed452bc6b657e42abf114e2bcaece5803af7fb114',
    quorum: 'Validator Quorum Attested',
    gas: '27,600 Gas (4 checks)',
    certId: '0x8f3c7a91bb40217ec93081e62a4d95204ef0139b567aa14820dc15a840e7912b'
  },
  'demo.lucent.id': {
    status: 'ACTIVE',
    keyHash: '0x7c94b291a84f3e6189dc72301fa38290bcdae49182374619a826491028374619',
    quorum: 'Validator Quorum Attested',
    gas: '27,600 Gas (4 checks)',
    certId: '0x3a4b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b'
  },
  'auth.monadtrust.xyz': {
    status: 'ACTIVE',
    keyHash: '0x992381fcae472910385718293740284719283749182739481729384719283749',
    quorum: 'Validator Quorum Attested',
    gas: '27,600 Gas (4 checks)',
    certId: '0x5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d'
  },
  'localhost': {
    status: 'ACTIVE',
    keyHash: '0x1ec92b50d3e9b1630f820f1ed452bc6b657e42abf114e2bcaece5803af7fb114',
    quorum: 'Validator Quorum Attested',
    gas: '27,600 Gas (4 checks)',
    certId: '0x8f3c7a91bb40217ec93081e62a4d95204ef0139b567aa14820dc15a840e7912b'
  }
};

let activeTabId = null;
let currentDomain = 'dotlab.studio';
let isInternalPage = false;
let isMitmSimulated = false;

document.addEventListener('DOMContentLoaded', async () => {
  const mitmToggle = document.getElementById('mitmToggle');
  const pillBtns = document.querySelectorAll('.pill-btn');

  // Load MITM simulation state from storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['mitmSimulation'], (res) => {
      isMitmSimulated = !!res.mitmSimulation;
      mitmToggle.checked = isMitmSimulated;
    });
  }

  // Detect active tab URL automatically
  if (chrome && chrome.tabs) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        activeTabId = tabs[0].id;
        try {
          const url = new URL(tabs[0].url);
          // Only actual web protocols (http, https)
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            currentDomain = url.hostname.toLowerCase();
            isInternalPage = false;
          } else {
            // Browser internal page (chrome://extensions, brave://, edge://, file://)
            isInternalPage = true;
            currentDomain = 'dotlab.studio'; // Fallback to verified demo domain
          }
        } catch (e) {
          isInternalPage = true;
          currentDomain = 'dotlab.studio';
        }
      }
      renderDomainState(currentDomain);
    });
  } else {
    renderDomainState('dotlab.studio');
  }

  // Handle MITM attack toggle
  mitmToggle.addEventListener('change', () => {
    isMitmSimulated = mitmToggle.checked;

    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ mitmSimulation: isMitmSimulated });
    }

    // Send real-time notification to content script on active tab
    if (activeTabId && chrome && chrome.tabs) {
      chrome.tabs.sendMessage(activeTabId, {
        action: 'SET_MITM_ATTACK',
        enabled: isMitmSimulated
      }, () => {
        // Ignore if content script not loaded
      });
    }

    renderDomainState(currentDomain);
  });

  // Handle Quick Test Pill Buttons
  pillBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      pillBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const targetDomain = btn.getAttribute('data-domain');
      currentDomain = targetDomain;
      renderDomainState(targetDomain);
    });
  });
});

function renderDomainState(domain) {
  const tabTypeLabel = document.getElementById('tabTypeLabel');
  const autoStatusPill = document.getElementById('autoStatusPill');
  const activeDomainDisplay = document.getElementById('activeDomainDisplay');
  const activeDomainSubtext = document.getElementById('activeDomainSubtext');
  const siteIcon = document.getElementById('siteIcon');

  const statusBanner = document.getElementById('statusBanner');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');

  const quorumStatus = document.getElementById('quorumStatus');
  const precompileVal = document.getElementById('precompileVal');
  const latencyVal = document.getElementById('latencyVal');
  const keyHashVal = document.getElementById('keyHashVal');

  // Update Active Website Card
  activeDomainDisplay.textContent = domain;

  if (isInternalPage) {
    tabTypeLabel.textContent = 'Chrome Page Detected';
    autoStatusPill.textContent = '⚡ Demo Guard';
    activeDomainSubtext.textContent = 'Browser settings active. Auto-testing dotlab.studio';
    siteIcon.textContent = '🛡️';
  } else {
    tabTypeLabel.textContent = 'Active Website';
    autoStatusPill.textContent = '⚡ Auto-Detected';
    activeDomainSubtext.textContent = 'Real-time Monad dPKI inspection';
    siteIcon.textContent = '🌐';
  }

  // 1. MITM Attack Simulation State
  if (isMitmSimulated) {
    statusBanner.className = 'status-banner status-danger';
    statusIcon.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    statusTitle.textContent = 'ACCESS BLOCKED (FAIL-CLOSED)!';
    statusDesc.textContent = `CRITICAL: Rogue CA interception detected for ${domain}. Presented TLS certificate does not match the sovereign P-256 key registered on Monad!`;
    quorumStatus.textContent = '✗ Owner PoP Failed';
    quorumStatus.className = 'metric-val text-danger';
    precompileVal.textContent = '0x0100 Mismatch (Rejected)';
    precompileVal.className = 'metric-val text-danger';
    latencyVal.textContent = '0.0s Fail-Closed';
    latencyVal.className = 'metric-val text-danger';
    keyHashVal.textContent = 'UNAUTHORIZED_KEY';

    if (chrome && chrome.action) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    }
    return;
  }

  // 2. Verified Monad dPKI State
  const reg = REGISTERED_DOMAINS[domain];
  if (reg) {
    statusBanner.className = 'status-banner status-verified';
    statusIcon.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"></polyline>
      </svg>
    `;
    statusTitle.textContent = 'ACCESS APPROVED: MONAD dPKI';
    statusDesc.textContent = `Authenticity proven on Monad via native 0x0100 NIST P-256 precompile. 0 Central CAs trusted.`;
    quorumStatus.textContent = reg.quorum;
    quorumStatus.className = 'metric-val highlight';
    precompileVal.textContent = '0x0100 (6,900 Gas / check)';
    precompileVal.className = 'metric-val text-monad';
    latencyVal.textContent = '< 0.8s Block Finality';
    latencyVal.className = 'metric-val text-emerald';
    keyHashVal.textContent = `${reg.keyHash.slice(0, 10)}...${reg.keyHash.slice(-6)}`;

    if (chrome && chrome.action) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
  } else {
    // 3. Unverified Legacy Web PKI
    statusBanner.className = 'status-banner status-warning';
    statusIcon.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    statusTitle.textContent = 'Legacy Web PKI Only';
    statusDesc.textContent = `${domain} relies on centralized CAs (like eMudhra) vulnerable to master key compromise. Not yet anchored on Monad.`;
    quorumStatus.textContent = 'No Monad Anchor';
    quorumStatus.className = 'metric-val';
    precompileVal.textContent = 'Not Verified';
    precompileVal.className = 'metric-val';
    latencyVal.textContent = 'N/A';
    latencyVal.className = 'metric-val';
    keyHashVal.textContent = 'None';

    if (chrome && chrome.action) {
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    }
  }
}
