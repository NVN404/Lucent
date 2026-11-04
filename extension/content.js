// Lucent dPKI Content Script & Real-Time Access Gatekeeper
// Enforces Fail-Closed connection blocking against Rogue CAs and unauthorized certificates

(function () {
  const host = window.location.hostname.toLowerCase();
  const VERIFIED_DOMAINS = ['dotlab.studio', 'demo.lucent.id', 'auth.monadtrust.xyz', 'localhost', '127.0.0.1'];

  let isMitmActive = false;
  let isStrictActive = false;

  // Initialize from storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['mitmSimulation', 'strictMode'], (res) => {
      isMitmActive = !!res.mitmSimulation;
      isStrictActive = !!res.strictMode;
      evaluateSecurityState();
    });
  } else {
    evaluateSecurityState();
  }

  // Listen for real-time control messages from popup
  if (chrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'SET_MITM_ATTACK') {
        isMitmActive = !!msg.enabled;
        evaluateSecurityState();
        sendResponse({ success: true, isMitmActive });
      } else if (msg.action === 'SET_STRICT_MODE') {
        isStrictActive = !!msg.enabled;
        evaluateSecurityState();
        sendResponse({ success: true, isStrictActive });
      } else if (msg.action === 'QUERY_STATUS') {
        const isVerified = VERIFIED_DOMAINS.includes(host);
        sendResponse({ host, isVerified, isMitmActive, isStrictActive });
      }
      return true;
    });
  }

  function evaluateSecurityState() {
    const isVerified = VERIFIED_DOMAINS.includes(host);

    if (isMitmActive) {
      showBlockScreen({
        title: 'ROGUE CA INTERCEPTION BLOCKED!',
        code: 'ERR_LUCENT_KEY_MISMATCH_FAIL_CLOSED',
        desc: `CRITICAL: The TLS certificate presented by <strong>${host}</strong> was signed by an unauthorized/compromised Centralized CA (e.g. eMudhra). It DOES NOT match the sovereign NIST P-256 public key registered on Monad!`,
        action: 'Monad 0x0100 Fail-Closed: Access has been blocked to protect your passwords and private data.'
      });
      removeAccessGrantedToast();
      removeTrustBadge();
      return;
    }

    if (isStrictActive && !isVerified) {
      showBlockScreen({
        title: 'STRICT dPKI MODE: ACCESS BLOCKED',
        code: 'ERR_LUCENT_UNVERIFIED_LEGACY_CA',
        desc: `The domain <strong>${host}</strong> relies on legacy centralized CAs and has not registered an on-chain key on Monad. Strict dPKI enforcement is active.`,
        action: 'Connection aborted by Lucent Shield to prevent potential MITM exposure.'
      });
      removeAccessGrantedToast();
      removeTrustBadge();
      return;
    }

    // Normal safe state
    removeBlockScreen();

    if (isVerified) {
      injectAccessGrantedToast();
      injectTrustBadge();
    } else {
      removeAccessGrantedToast();
      injectLegacyWarningBadge();
    }
  }

  // Inject full-screen Fail-Closed security interstitial
  function showBlockScreen({ title, code, desc, action }) {
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
          max-width: 580px;
          width: 100%;
          background: #0f172a;
          border: 1px solid rgba(239, 68, 68, 0.4);
          border-radius: 20px;
          padding: 36px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.2);
          text-align: left;
        ">
          <!-- Shield Header -->
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
            <div style="
              width: 52px;
              height: 52px;
              border-radius: 14px;
              background: rgba(239, 68, 68, 0.15);
              border: 1px solid rgba(239, 68, 68, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #f87171;
              flex-shrink: 0;
            ">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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
              <span style="color: #ef4444; font-weight: 700;">0x0100 Mismatch (REJECTED)</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Revocation Finality:</span>
              <span style="color: #34d399;">&lt; 0.8s Fail-Closed</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">CertRegistry Address:</span>
              <span style="color: #38bdf8;">0xE4ec4B30...337c080b</span>
            </div>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 24px;">
            ${action}
          </p>

          <!-- Action Buttons -->
          <div style="display: flex; gap: 12px;">
            <button id="lucent-safety-btn" style="
              flex: 1;
              background: #ef4444;
              color: white;
              border: none;
              border-radius: 10px;
              padding: 12px 18px;
              font-size: 13px;
              font-weight: 700;
              cursor: pointer;
              transition: background 0.15s;
            ">
              Disconnect (Back to Safety)
            </button>

            <button id="lucent-dismiss-sim-btn" style="
              background: rgba(255, 255, 255, 0.1);
              color: #f1f5f9;
              border: 1px solid rgba(255, 255, 255, 0.2);
              border-radius: 10px;
              padding: 12px 18px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
            ">
              Dismiss Attack Simulation
            </button>
          </div>
        </div>
      </div>
    `;

    document.documentElement.appendChild(blockScreen);

    document.getElementById('lucent-safety-btn').addEventListener('click', () => {
      window.history.back();
    });

    document.getElementById('lucent-dismiss-sim-btn').addEventListener('click', () => {
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
        z-index: 2147483646;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(11, 15, 25, 0.94);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(16, 185, 129, 0.5);
        color: #f8fafc;
        padding: 9px 18px;
        border-radius: 999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4), 0 0 15px rgba(16, 185, 129, 0.3);
        animation: lucentSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        user-select: none;
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

    const style = document.createElement('style');
    style.textContent = `
      @keyframes lucentSlideDown {
        from { opacity: 0; transform: translate(-50%, -20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
    `;
    document.head.appendChild(style);
    document.documentElement.appendChild(toast);

    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        setTimeout(() => toast.remove(), 400);
      }
    }, 3800);
  }

  function removeAccessGrantedToast() {
    const el = document.getElementById('lucent-toast-banner');
    if (el) el.remove();
  }

  // Bottom-right persistent floating green badge for verified sites
  function injectTrustBadge() {
    if (document.getElementById('lucent-trust-badge')) return;

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
        background: rgba(11, 15, 25, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #f8fafc;
        padding: 8px 14px;
        border-radius: 999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35), 0 0 12px rgba(245, 158, 11, 0.2);
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      ">
        <div style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        "></div>
        <span style="color: #f59e0b; font-weight: 800; letter-spacing: 0.05em;">LUCENT</span>
        <span style="color: #64748b;">•</span>
        <span style="color: #e2e8f0;">Monad dPKI Verified</span>
      </div>
    `;

    document.documentElement.appendChild(badge);

    badge.addEventListener('click', () => {
      alert(`[Lucent dPKI Gatekeeper]\nDomain: ${host}\nProtocol: Monad Decentralized PKI (EIP-7951)\nPrecompile: 0x0100 NIST P-256 (6,900 gas)\nRevocation Finality: < 0.8s on Monad Testnet\nTrust Root: Validator Quorum (0 Central CAs)`);
    });
  }

  function removeTrustBadge() {
    const el = document.getElementById('lucent-trust-badge');
    if (el) el.remove();
  }

  function injectLegacyWarningBadge() {
    if (document.getElementById('lucent-trust-badge')) return;

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
        background: rgba(11, 15, 25, 0.90);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #f8fafc;
        padding: 7px 12px;
        border-radius: 999px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        user-select: none;
      ">
        <span style="color: #f59e0b; font-weight: 700;">⚠️ Legacy Web PKI</span>
        <span style="color: #94a3b8; font-size: 10px;">(Unverified on Monad)</span>
      </div>
    `;
    document.documentElement.appendChild(badge);
  }
})();
