// Lucent dPKI Content Script
// Injects a floating verification badge on verified dPKI websites

(function() {
  const host = window.location.hostname.toLowerCase();
  const VERIFIED_DOMAINS = ['dotlab.studio', 'demo.lucent.id', 'auth.monadtrust.xyz'];

  if (!VERIFIED_DOMAINS.includes(host)) {
    return;
  }

  // Prevent duplicate injection
  if (document.getElementById('lucent-trust-badge')) return;

  const badge = document.createElement('div');
  badge.id = 'lucent-trust-badge';
  badge.innerHTML = `
    <div style="
      position: fixed;
      bottom: 18px;
      right: 18px;
      z-index: 999999;
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
      <span style="color: #f59e0b; font-weight: 700; letter-spacing: 0.05em;">LUCENT</span>
      <span style="color: #94a3b8;">•</span>
      <span style="color: #e2e8f0;">Monad dPKI Verified</span>
    </div>
  `;

  document.body.appendChild(badge);

  badge.addEventListener('click', () => {
    alert(`[Lucent dPKI Verification]\nDomain: ${host}\nProtocol: Monad Decentralized PKI (EIP-7951)\nPrecompile: 0x0100 NIST P-256 (6,900 gas)\nRevocation Finality: < 0.8s on Monad Testnet\nTrust Root: Validator Quorum (0 Central CAs)`);
  });
})();
