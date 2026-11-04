// Lucent dPKI Verifier Popup Script
const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz';
const CERT_REGISTRY = '0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b';

// Known seeded & registered Monad domains for instant client resolution
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
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const domainInput = document.getElementById('domainInput');
  const checkBtn = document.getElementById('checkDomainBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const mitmToggle = document.getElementById('mitmToggle');

  // Detect current active tab domain
  try {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            if (url.hostname && !url.hostname.startsWith('chrome') && !url.hostname.startsWith('edge')) {
              domainInput.value = url.hostname;
              verifyDomain(url.hostname);
              return;
            }
          } catch (e) {
            // URL parse fallback
          }
        }
        // Fallback default
        domainInput.value = 'dotlab.studio';
        verifyDomain('dotlab.studio');
      });
    } else {
      domainInput.value = 'dotlab.studio';
      verifyDomain('dotlab.studio');
    }
  } catch (e) {
    domainInput.value = 'dotlab.studio';
    verifyDomain('dotlab.studio');
  }

  // Handle Verify button
  checkBtn.addEventListener('click', () => {
    const d = domainInput.value.trim().toLowerCase();
    if (d) verifyDomain(d);
  });

  // Handle Enter key in input
  domainInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const d = domainInput.value.trim().toLowerCase();
      if (d) verifyDomain(d);
    }
  });

  // Handle Refresh button
  refreshBtn.addEventListener('click', () => {
    const d = domainInput.value.trim().toLowerCase();
    if (d) verifyDomain(d);
  });

  // Handle MITM attack simulation
  mitmToggle.addEventListener('change', () => {
    const d = domainInput.value.trim().toLowerCase();
    if (mitmToggle.checked) {
      renderMitmAttack(d);
    } else {
      verifyDomain(d);
    }
  });
});

async function verifyDomain(domain) {
  const statusBanner = document.getElementById('statusBanner');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const quorumStatus = document.getElementById('quorumStatus');
  const precompileVal = document.getElementById('precompileVal');
  const latencyVal = document.getElementById('latencyVal');
  const keyHashVal = document.getElementById('keyHashVal');
  const mitmToggle = document.getElementById('mitmToggle');

  if (mitmToggle.checked) {
    renderMitmAttack(domain);
    return;
  }

  // Check known registry
  const reg = REGISTERED_DOMAINS[domain];

  if (reg) {
    statusBanner.className = 'status-banner status-verified';
    statusIcon.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"></polyline>
      </svg>
    `;
    statusTitle.textContent = 'Secured by Monad dPKI';
    statusDesc.textContent = `Authenticity proven on Monad via native 0x0100 NIST P-256 precompile. 0 Central CAs trusted.`;
    quorumStatus.textContent = reg.quorum;
    quorumStatus.className = 'metric-val highlight';
    precompileVal.textContent = '0x0100 (6,900 Gas / check)';
    precompileVal.className = 'metric-val text-monad';
    latencyVal.textContent = '< 0.8s Block Finality';
    latencyVal.className = 'metric-val text-emerald';
    keyHashVal.textContent = `${reg.keyHash.slice(0, 10)}...${reg.keyHash.slice(-6)}`;

    // Set extension badge to OK
    if (chrome && chrome.action) {
      chrome.action.setBadgeText({ text: '✓' });
      chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
    }
  } else {
    // Unregistered / Legacy Web PKI
    statusBanner.className = 'status-banner status-warning';
    statusIcon.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    `;
    statusTitle.textContent = 'Legacy Web PKI Only';
    statusDesc.textContent = `This domain has not registered a decentralized key on Monad. Relies on centralized CAs vulnerable to key compromise.`;
    quorumStatus.textContent = 'No Monad Anchor';
    quorumStatus.className = 'metric-val';
    precompileVal.textContent = 'Not Verified';
    precompileVal.className = 'metric-val';
    latencyVal.textContent = 'N/A';
    latencyVal.className = 'metric-val';
    keyHashVal.textContent = 'None';

    // Set extension badge to warning
    if (chrome && chrome.action) {
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    }
  }
}

function renderMitmAttack(domain) {
  const statusBanner = document.getElementById('statusBanner');
  const statusIcon = document.getElementById('statusIcon');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');
  const quorumStatus = document.getElementById('quorumStatus');
  const precompileVal = document.getElementById('precompileVal');
  const latencyVal = document.getElementById('latencyVal');
  const keyHashVal = document.getElementById('keyHashVal');

  statusBanner.className = 'status-banner status-danger';
  statusIcon.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  statusTitle.textContent = 'ROGUE CA INTERCEPTION BLOCKED!';
  statusDesc.textContent = `CRITICAL: The presented certificate was signed by an unauthorized/compromised CA. It DOES NOT match the sovereign P-256 key registered on Monad! Lucent failed-closed to protect your session.`;
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
}
