# Lucent dPKI Chrome / Brave Browser Extension (Gatekeeper v2.0)

A lightweight, zero-dependency Manifest V3 browser extension and security gatekeeper that cryptographically verifies websites using **Monad's native NIST P-256 precompile (`0x0100` / EIP-7951)**. It intercepts rogue/compromised CAs and **enforces Fail-Closed connection blocking** in real time.

---

## ⚡ How It Works (100% Automated)

1. **Automatic Active Tab Detection**:
   - You **do not** need to type any domain!
   - When you visit any website (e.g. `https://dotlab.studio`, `https://google.com`, `http://localhost:5173`), the extension **automatically detects the active website's domain** directly from the tab.
   - When you are on a browser settings page like `chrome://extensions`, it automatically switches into **Demo Guard Mode** testing against `dotlab.studio`.

2. **Real-Time On-Chain Verification**:
   - Checks the authoritative Monad `CertRegistry.sol` contract (`0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b`).
   - Verifies the website's P-256 public key coordinates `(qx, qy)` using Monad's native precompile `0x0100` for 6,900 gas.

3. **Access Control (Gatekeeper & Fail-Closed Blocker)**:
   - 🟢 **Verified Websites (`dotlab.studio`)**:
     - Access is **APPROVED**!
     - Top notification toast slides in: `🛡️ Monad dPKI Guard: Access Approved (0 Central CAs Trusted)`.
     - Discreet floating green trust badge is pinned in the corner.
   - 🚨 **Rogue CA / MITM Attack**:
     - Access is **IMMEDIATELY BLOCKED (Fail-Closed)**!
     - A full-screen security block screen covers the page:
       `🛑 ACCESS BLOCKED BY LUCENT dPKI: Rogue CA Interception Detected!`
       Preventing the user from entering the website or having credentials stolen.

---

## 🚀 How to Install or Reload (15 Seconds)

1. Open `chrome://extensions` in Chrome, Brave, or Edge.
2. Turn on **"Developer mode"** in the top-right corner.
3. If previously loaded: Click the **🔄 Reload (circular arrow)** icon on the Lucent extension card.
   *If loading for the first time:* Click **"Load unpacked"** and select the [`extension/`](./) folder.
4. Pin the **Lucent Shield** to your browser toolbar!

---

## 🧪 Testing the Live Gatekeeper

1. **Test Auto-Detection on a Live Website:**
   - Open a tab to `http://localhost:5173` or any website.
   - Click the extension icon. Notice it **automatically detects the domain** and verifies it instantly without asking you to type anything!
2. **Test Fail-Closed Attack Defense:**
   - In the extension popup, toggle **"Simulate Rogue CA / MITM Attack"**.
   - Notice the current tab is **immediately locked down with the full-screen red security blocker screen**!
   - Toggle it off to dismiss the simulation and restore access.
