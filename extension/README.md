# Lucent dPKI Chrome / Brave Browser Extension

A lightweight, zero-dependency Manifest V3 browser extension that cryptographically verifies websites using **Monad's native NIST P-256 precompile (`0x0100` / EIP-7951)** and decentralized validator quorums.

---

## Why This Browser Extension Exists

In traditional Web PKI, when your browser connects to a website over HTTPS, it blindly trusts over **150+ centralized Certificate Authorities (CAs)**. If any intermediate CA is compromised (e.g., the **October 2026 eMudhra incident** where 8 intermediate private keys leaked), attackers can forge trusted SSL certificates for any website in the world and silently perform Man-In-The-Middle (MITM) attacks.

**Lucent replaces centralized CAs with Monad dPKI:**
1. The domain owner generates their own sovereign **NIST P-256 keypair** locally.
2. The domain is registered on Monad's `CertRegistry.sol` contract via **Validator Quorum consensus**.
3. Every signature is verified in **0.8s on Monad for just 6,900 gas via native precompile `0x0100`**.
4. When a user navigates to a website, this **Lucent Browser Extension** checks the domain against Monad's on-chain registry. If a compromised CA attempts to present an unauthorized certificate, the extension detects the P-256 public key mismatch and **instantly fails-closed**, protecting the user.

---

## 🚀 How to Install in Chrome, Brave, or Edge (15 Seconds)

1. Open your browser and navigate to:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. In the top-right corner, turn on **"Developer mode"**.
3. Click the **"Load unpacked"** button in the top-left toolbar.
4. Select the `extension/` folder inside this repository:
   ```
   /Users/yunohu/Documents/lucent/extension
   ```
5. Pin the **Lucent Shield** icon to your browser toolbar!

---

## 🧪 Testing the Extension

### 1. Test a Verified Domain
- Open the extension popup.
- Enter `dotlab.studio` (or any domain you issued in the Lucent Console) and click **"Verify"**.
- The extension shows:
  - 🟢 **"Secured by Monad dPKI"**
  - **Quorum Consensus**: Validator Quorum Attested
  - **On-Chain Precompile**: `0x0100` (6,900 gas)
  - **Verification Latency**: `< 0.8s Block Finality`
  - Direct MonadScan contract link to `0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b`.

### 2. Test Rogue CA / MITM Attack Detection
- In the extension popup, toggle the switch: **"Simulate Rogue CA / MITM Attack"**.
- Watch Lucent immediately catch the fake certificate and fail-closed:
  - 🚨 **"CRITICAL: ROGUE CA INTERCEPTION BLOCKED!"**
  - The browser extension refuses to proceed with the forged connection because the server's key does not match the sovereign P-256 key registered on Monad.

---

## Technical Specifications
- **Manifest Version**: 3
- **Network**: Monad Testnet (RPC: `https://testnet-rpc.monad.xyz`, Chain ID: `10143`)
- **Precompile**: EIP-7951 NIST P-256 Precompiled Contract at `0x0100`
- **Smart Contract**: `CertRegistry.sol` (`0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b`)
- **Crypto Engine**: WebCrypto API (`crypto.subtle`) + Monad JSON-RPC
