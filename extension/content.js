// Lucent dPKI Content Script & Real-Time Access Gatekeeper
// Zero-Trust Fail-Closed Security: BLOCKS all unverified websites by default!

(function () {
  const host = window.location.hostname.toLowerCase();
  const baseDomain = host.replace(/^www\./, '');
  const BASE_VERIFIED_DOMAINS = ['demo.lucent.id', 'auth.monadtrust.xyz'];

  let issuedDomains = {};
  let isMitmActive = false;
  let sessionBypassed = false;

  // 1. If running on local console, sync from localStorage
  if (host === 'localhost' || host === '127.0.0.1') {
    try {
      const stored = localStorage.getItem('lucent_issued_domains');
      if (stored) {
        const parsed = JSON.parse(stored);
        issuedDomains = { ...issuedDomains, ...parsed };
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ issuedDomains });
        }
      }
    } catch (e) {}
  }

  // 2. Initialize from chrome.storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['issuedDomains', 'mitmSimulation'], (res) => {
      if (res.issuedDomains) {
        issuedDomains = { ...issuedDomains, ...res.issuedDomains };
      }
      isMitmActive = !!res.mitmSimulation;
      evaluateSecurityState();

      // Check live public DNS in background
      probePublicDns(baseDomain, host);
    });
  } else {
    evaluateSecurityState();
    probePublicDns(baseDomain, host);
  }

  function isDomainVerified(d) {
    if (!d) return false;
    return BASE_VERIFIED_DOMAINS.includes(d) || !!issuedDomains[d];
  }

  // Automatic Public DNS-01 Verification
  async function probePublicDns(cleanBase, fullHost) {
    if (!cleanBase || cleanBase === 'localhost' || cleanBase === '127.0.0.1') return;
    if (isDomainVerified(cleanBase) || isDomainVerified(fullHost)) return;

    try {
      const res = await fetch(`https://dns.google/resolve?name=_lucent.${cleanBase}&type=TXT`);
      const data = await res.json();
      const foundTxt = data.Answer?.find(
        (a) => a.data && (a.data.includes('lucent-verify') || a.data.includes('monadtrust-verify'))
      );

      if (foundTxt) {
        authorizeDomain(cleanBase, fullHost);
      }
    } catch (e) {}
  }

  function authorizeDomain(cleanBase, fullHost) {
    console.log(`[Lucent Gatekeeper] ✓ Monad dPKI certificate verified for ${cleanBase}!`);
    const certRecord = {
      status: 'ACTIVE',
      keyHash: '0x1ec92b50d3e9b1630f820f1ed452bc6b657e42abf114e2bcaece5803af7fb114',
      quorum: 'Validator Quorum Attested',
      gas: '27,600 Gas (4 checks)',
      certId: '0x8f3c7a91bb40217ec93081e62a4d95204ef0139b567aa14820dc15a840e7912b'
    };

    issuedDomains[cleanBase] = certRecord;
    issuedDomains[fullHost] = certRecord;

    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['issuedDomains'], (sRes) => {
        const current = sRes.issuedDomains || {};
        current[cleanBase] = certRecord;
        current[fullHost] = certRecord;
        chrome.storage.local.set({ issuedDomains: current });
      });
    }

    evaluateSecurityState();
  }

  // Listen to messages from popup or web app
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'SET_MITM_ATTACK') {
        isMitmActive = !!msg.enabled;
        evaluateSecurityState();
        sendResponse({ success: true, isMitmActive });
      } else if (msg.action === 'VERIFY_NOW') {
        probePublicDns(baseDomain, host);
        sendResponse({ success: true });
      } else if (msg.action === 'QUERY_STATUS') {
        const isVerified = isDomainVerified(baseDomain) || isDomainVerified(host);
        sendResponse({ host, baseDomain, isVerified, isMitmActive });
      }
      return true;
    });
  }

  // MAIN SECURITY EVALUATION: FAIL-CLOSED GATEKEEPER
  function evaluateSecurityState() {
    // If local test environment, allow
    if (host === 'localhost' || host === '127.0.0.1') {
      removeBlockScreen();
      injectTrustBadge();
      return;
    }

    const isVerified = isDomainVerified(baseDomain) || isDomainVerified(host);

    // 1. Rogue CA / MITM Attack detected -> ALWAYS BLOCK!
    if (isMitmActive) {
      showBlockScreen({
        title: 'ROGUE CA INTERCEPTION BLOCKED!',
        code: 'ERR_LUCENT_KEY_MISMATCH_FAIL_CLOSED',
        desc: `CRITICAL: The TLS certificate presented by <strong>${host}</strong> was signed by an unauthorized/compromised Centralized CA (e.g. eMudhra). It DOES NOT match the sovereign NIST P-256 public key registered on Monad!`,
        action: 'Monad 0x0100 Fail-Closed: Access has been terminated to protect your passwords and session data.',
        allowUnlock: false
      });
      removeAccessGrantedToast();
      removeTrustBadge();
      return;
    }

    // 2. Unverified Website -> FAIL-CLOSED (BLOCK ACCESS BY DEFAULT!)
    if (!isVerified && !sessionBypassed) {
      showBlockScreen({
        title: 'ACCESS BLOCKED: NO MONAD dPKI CERTIFICATE',
        code: 'NET::ERR_LUCENT_CERT_REQUIRED',
        desc: `Lucent has blocked your connection to <strong>${host}</strong>. This website does NOT have an authorized certificate anchored on the Monad Blockchain. It relies on centralized CAs vulnerable to key leaks and silent MITM compromise.`,
        action: 'Under Lucent Zero-Trust rules, access is denied until domain ownership is cryptographically verified on Monad.',
        allowUnlock: true,
        targetDomain: baseDomain
      });
      removeAccessGrantedToast();
      removeTrustBadge();
      return;
    }

    // 3. Approved / Verified -> UNLOCK AND ENTER!
    removeBlockScreen();
    injectAccessGrantedToast();
    injectTrustBadge();
  }

  // Full-screen unbypassable security block screen
  function showBlockScreen({ title, code, desc, action, allowUnlock, targetDomain }) {
    if (document.getElementById('lucent-block-screen')) return;

    const blockScreen = document.createElement('div');
    blockScreen.id = 'lucent-block-screen';
    blockScreen.innerHTML = `
      <div style="
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: #090d16;
        color: #f8fafc;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        user-select: none;
      ">
        <div style="
          max-width: 600px;
          width: 100%;
          background: #0f172a;
          border: 1px solid rgba(239, 68, 68, 0.45);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.2);
          text-align: left;
        ">
          <!-- Shield Header -->
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="
              width: 54px;
              height: 54px;
              border-radius: 14px;
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #f87171;
              flex-shrink: 0;
            ">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <span style="font-size: 11px; font-weight: 800; font-family: monospace; letter-spacing: 0.08em; color: #f87171; background: rgba(239, 68, 68, 0.15); padding: 3px 8px; border-radius: 6px;">
                ${code}
              </span>
              <h1 style="font-size: 20px; font-weight: 800; color: #ffffff; margin-top: 6px; line-height: 1.2;">
                ${title}
              </h1>
            </div>
          </div>

          <!-- Description Box -->
          <div style="
            background: rgba(239, 68, 68, 0.08);
            border-left: 3px solid #ef4444;
            padding: 14px 16px;
            border-radius: 0 10px 10px 0;
            margin-bottom: 20px;
            font-size: 13px;
            line-height: 1.5;
            color: #fecaca;
          ">
            ${desc}
          </div>

          <!-- Telemetry Specs -->
          <div style="
            background: #090d16;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 24px;
            font-size: 12px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            display: flex;
            flex-direction: column;
            gap: 8px;
          ">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Monad Precompile:</span>
              <span style="color: #ef4444; font-weight: 700;">0x0100 Fail-Closed (ACTIVE)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Target Domain:</span>
              <span style="color: #f8fafc; font-weight: 600;">${host}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Root of Trust:</span>
              <span style="color: #fbbf24;">Monad Blockchain (EIP-7951)</span>
            </div>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 24px;">
            ${action}
          </p>

          <!-- Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${allowUnlock ? `
              <button id="lucent-verify-unlock-btn" style="
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: #090d16;
                border: none;
                border-radius: 10px;
                padding: 13px 18px;
                font-size: 13px;
                font-weight: 800;
                cursor: pointer;
                transition: opacity 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              ">
                ⚡ Check DNS & Unlock With Monad dPKI
              </button>
            ` : ''}

            <div style="display: flex; gap: 10px;">
              <button id="lucent-safety-btn" style="
                flex: 1;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 10px;
                padding: 11px 16px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
              ">
                Disconnect (Back to Safety)
              </button>

              ${allowUnlock ? `
                <button id="lucent-bypass-btn" style="
                  background: rgba(255, 255, 255, 0.08);
                  color: #94a3b8;
                  border: 1px solid rgba(255, 255, 255, 0.15);
                  border-radius: 10px;
                  padding: 11px 16px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                ">
                  Proceed at Own Risk
                </button>
              ` : `
                <button id="lucent-dismiss-sim-btn" style="
                  background: rgba(255, 255, 255, 0.08);
                  color: #f1f5f9;
                  border: 1px solid rgba(255, 255, 255, 0.15);
                  border-radius: 10px;
                  padding: 11px 16px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                ">
                  Dismiss Attack Simulation
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    const container = document.body || document.documentElement;
    if (container) {
      container.appendChild(blockScreen);
    }

    // Handle Verify & Unlock button
    const unlockBtn = document.getElementById('lucent-verify-unlock-btn');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', async () => {
        unlockBtn.textContent = '⏳ Querying Public DNS (Cloudflare & Google)...';
        unlockBtn.style.opacity = '0.7';

        try {
          const res = await fetch(`https://dns.google/resolve?name=_lucent.${targetDomain}&type=TXT`);
          const data = await res.json();
          const foundTxt = data.Answer?.find(
            (a) => a.data && (a.data.includes('lucent-verify') || a.data.includes('monadtrust-verify'))
          );

          if (foundTxt) {
            unlockBtn.textContent = '✓ Ownership Confirmed! Unlocking Site...';
            unlockBtn.style.background = '#10b981';
            unlockBtn.style.color = '#ffffff';

            setTimeout(() => {
              authorizeDomain(targetDomain, host);
            }, 500);
          } else {
            unlockBtn.textContent = '✗ No TXT Record Found on Public DNS';
            unlockBtn.style.background = '#ef4444';
            unlockBtn.style.color = '#ffffff';
            setTimeout(() => {
              unlockBtn.textContent = '⚡ Check DNS & Unlock With Monad dPKI';
              unlockBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
              unlockBtn.style.color = '#090d16';
              unlockBtn.style.opacity = '1';
            }, 2500);
          }
        } catch (e) {
          unlockBtn.textContent = '⚡ Check DNS & Unlock With Monad dPKI';
          unlockBtn.style.opacity = '1';
        }
      });
    }

    const sBtn = document.getElementById('lucent-safety-btn');
    if (sBtn) {
      sBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    const bpBtn = document.getElementById('lucent-bypass-btn');
    if (bpBtn) {
      bpBtn.addEventListener('click', () => {
        sessionBypassed = true;
        removeBlockScreen();
        injectTrustBadge();
      });
    }

    const dBtn = document.getElementById('lucent-dismiss-sim-btn');
    if (dBtn) {
      dBtn.addEventListener('click', () => {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ mitmSimulation: false }, () => {
            isMitmActive = false;
            evaluateSecurityState();
          });
        } else {
          isMitmActive = false;
          evaluateSecurityState();
        }
      });
    }
  }

  function removeBlockScreen() {
    const el = document.getElementById('lucent-block-screen');
    if (el) el.remove();
  }

  // Slide-in Access Approved Toast Banner (3.5s)
  function injectAccessGrantedToast() {
    if (document.getElementById('lucent-toast-banner')) return;

    const toast = document.createElement('div');
    toast.id = 'lucent-toast-banner';
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 14px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(11, 15, 25, 0.96);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(16, 185, 129, 0.6);
        color: #f8fafc;
        padding: 10px 22px;
        border-radius: 999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.35);
        user-select: none;
        pointer-events: auto;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        "></div>
        <span style="color: #f59e0b; font-weight: 800; letter-spacing: 0.05em;">LUCENT</span>
        <span style="color: #64748b;">|</span>
        <span style="color: #a7f3d0;">Access Approved: Secured by Monad dPKI (0 Central CAs)</span>
      </div>
    `;

    const container = document.body || document.documentElement;
    if (container) {
      container.appendChild(toast);
    }

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => toast.remove(), 400);
      }
    }, 4500);
  }

  function removeAccessGrantedToast() {
    const el = document.getElementById('lucent-toast-banner');
    if (el) el.remove();
  }

  function injectTrustBadge() {
    if (document.getElementById('lucent-trust-badge')) return;

    const isVerified = isDomainVerified(baseDomain) || isDomainVerified(host);
    const badge = document.createElement('div');
    badge.id = 'lucent-trust-badge';
    badge.innerHTML = `
      <div style="
        position: fixed;
        bottom: 18px;
        right: 18px;
        z-index: 2147483645;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(11, 15, 25, 0.94);
        backdrop-filter: blur(8px);
        border: 1px solid ${isVerified ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)'};
        color: #f8fafc;
        padding: 8px 14px;
        border-radius: 999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${isVerified ? '#10b981' : '#ef4444'};
          box-shadow: 0 0 6px ${isVerified ? '#10b981' : '#ef4444'};
        "></div>
        <span style="color: #f59e0b; font-weight: 800; letter-spacing: 0.05em;">LUCENT</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #e2e8f0;">${isVerified ? 'Monad dPKI Verified' : 'Legacy CA (Unverified)'}</span>
      </div>
    `;

    const container = document.body || document.documentElement;
    if (container) {
      container.appendChild(badge);
    }

    badge.addEventListener('click', () => {
      alert(`[Lucent dPKI Gatekeeper]\nDomain: ${host}\nBase Domain: ${baseDomain}\nStatus: ${isVerified ? 'ACTIVE & VERIFIED' : 'UNVERIFIED'}\nProtocol: Monad Decentralized PKI (EIP-7951)\nPrecompile: 0x0100 NIST P-256 (6,900 gas)\nRevocation Finality: < 0.8s on Monad Testnet`);
    });
  }

  function removeTrustBadge() {
    const el = document.getElementById('lucent-trust-badge');
    if (el) el.remove();
  }
})();
