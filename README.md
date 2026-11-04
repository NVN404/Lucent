# MonadTrust 🛡️
### Decentralized Public Key Infrastructure (dPKI) on Monad
*Eliminating Centralized CA Master Keys using Monad's Native P-256 (`0x0100`) Precompile*

**Monad Blitz Devcon Mumbai Hackathon Project**
* **Project Name:** MonadTrust (Lucent)
* **Blitz Portal:** [blitz.devnads.com](https://blitz.devnads.com)
* **Network:** Monad Testnet (`Chain ID: 10143`)
* **RPC URL:** `https://testnet-rpc.monad.xyz`
* **Explorer:** [testnet.monadscan.com](https://testnet.monadscan.com)

---

## 🚀 Live Monad Testnet Deployment (Verified On-Chain)

Both contracts are **deployed and active on Monad Testnet**:

| Contract | Monad Testnet Address | Explorer Link |
| :--- | :--- | :--- |
| **`CertRegistry`** | `0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b` | [View on MonadScan](https://testnet.monadscan.com/address/0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b) |
| **`ValidatorRegistry`** | `0x9854f6f7bc90A0D84dce9065E1bD3ae3B8d436E4` | [View on MonadScan](https://testnet.monadscan.com/address/0x9854f6f7bc90A0D84dce9065E1bD3ae3B8d436E4) |
| **Deployer Wallet** | `0xd886168001663855a8f1ea7DdEa1393A074Ee354` | [View on MonadScan](https://testnet.monadscan.com/address/0xd886168001663855a8f1ea7DdEa1393A074Ee354) |

* Quorum Configuration: **3 of 5** active P-256 validators
* Precompile Address: **`0x0000000000000000000000000000000000000100` (`0x0100`)**
* Gas per signature check: **6,900 gas** (EIP-7951 standard on Monad)

---

## 📌 The Incident & Motivation
Traditional Web PKI concentrates global internet trust in ~150 Certificate Authorities (CAs). The **eMudhra incident** exposed the core vulnerability of this architecture: an operational flaw during an HSM key wrap/unwrap ceremony generated weak intermediate CA private keys that remained undetected for ~18 months through multiple audit cycles.
* When a CA's master signing key is compromised or weak, fraudulent certificates can be forged for any domain worldwide.
* Traditional revocation mechanisms (CRLs and OCSP) are broken, slow to propagate, and compromise user privacy.
* Certificate Transparency (CT) logs are strictly *reactive* (they detect misissuance after the fact), not preventative.

## 💡 The Solution: MonadTrust
**MonadTrust eliminates the single CA master signing key.**
Instead of trusting a single organization's private key, certificate issuance and revocation are governed by an on-chain **3-of-5 independent validator quorum**, cryptographically enforced on Monad using its native secp256r1 (NIST P-256) precompiled contract at `0x0100` (EIP-7951).

```
Traditional PKI (Single Point of Failure):
Domain Owner ──> Single CA (1 Master HSM Key) ──> Certificate ──> Browser Blindly Trusts CA

MonadTrust (Decentralized Quorum PKI on Monad):
Domain Owner ──> Deterministic DNS Challenge
                       │
                       ▼
       5 Independent Rust Validators (P-256 Signatures)
                       │
                       ▼
       Monad Blockchain (Precompile 0x0100: P-256)
  [Verifies M-of-N Quorum + Proof-of-Possession on-chain]
                       │
                       ▼
         Tamper-Proof On-Chain Cert Registry
           (No Single Master Key Exists)
                       │
                       ▼
      Live Verifier Handshake with Web Server
     (TLS connection fingerprint binding against MITM)
```

---

## 🔑 Key Architectural Highlights

1. **Native Monad P-256 Precompile (`0x0100`):**
   * Uses Monad's EIP-7951 precompile at `0x0100` costing **6,900 gas** per verification.
   * Full 3-of-5 validator quorum + 1 owner Proof-of-Possession verification = **4 calls $\approx 27,600$ gas total**, executing in sub-seconds.
2. **Explicit Public Key Coordinates (No Address Extraction):**
   * Precompile `0x0100` takes `(hash, r, s, qx, qy)` and outputs `1` or `0`. `ValidatorRegistry.sol` directly stores the validator set's P-256 `(bytes32 qx, bytes32 qy)` coordinates.
3. **Strict Low-$s$ Invariant:**
   * Solidity layer enforces $0 < s \le \lfloor n / 2 \rfloor$ before calling `0x0100`, eliminating signature malleability.
4. **Anti-Name Squatting & Atomic Domain Binding:**
   * Domains are not pre-registered. Domain binding and certificate issuance occur in a single atomic transaction upon multi-validator quorum proof.
5. **Deterministic DNS Challenge:**
   * Value derived as: `sha256("MONADTRUST_DNS_CHALLENGE_V1" || chainId || subjectKeyHash || nonce)`. A challenge cannot be recycled for another key or request.
6. **Live Anti-Relay Handshake:**
   * When an auditor/client connects to the website, the server signs `(tls_cert_fingerprint || client_nonce || timestamp)` with its P-256 key. An attacker proxying traffic with a rogue TLS cert cannot relay the signature because their TLS certificate fingerprint will mismatch!
7. **No Admin Master Key (Timelocked Governance):**
   * `ValidatorRegistry` contains no instant admin backdoors. All validator updates and quorum parameter changes pass through a configurable **Timelock** controlled by a **3-of-5 Validator Governance Multisig**.

---

## 📂 Repository Structure

```
lucent/
├── contracts/               # Foundry smart contract suite
│   ├── src/
│   │   ├── P256.sol         # Low-level 0x0100 precompile caller + low-s & curve guards
│   │   ├── ValidatorRegistry.sol # 3-of-5 P-256 validator storage + Timelocked governance
│   │   └── CertRegistry.sol # Atomic issuance, PoP, sequential nonces, sovereign revocation
│   ├── script/
│   │   └── Deploy.s.sol     # Live deployment script for Monad Testnet (Chain ID 10143)
│   └── test/
│       └── CertRegistry.t.sol # 13 Foundry tests (9 invariant unit + 4 fuzz suites, 100% pass)
├── crates/
│   ├── common/              # Shared cryptographic types, canonicalization & pre-hash routines
│   ├── validator/           # Multi-source DNS-01 verification & P-256 signing daemon
│   ├── cli/                 # Domain owner ACME-style CLI (keygen, challenge, quorum requester)
│   └── verifier/            # Client verifier & live TLS anti-relay handshake auditor
├── frontend/                # Interactive React / Tailwind Web Dashboard
└── scripts/
    ├── simulate_network.sh  # Launches 5-node simulated validator network
    ├── stop_network.sh      # Cleanly shuts down daemon processes
    ├── deploy_testnet.sh    # Deploys smart contracts to Monad Testnet
    └── demo.sh              # 1-click end-to-end hackathon demonstration
```

---

## ⚡ Running the Complete End-to-End Demo

### Option 1: 1-Click Terminal Demo
Run the end-to-end integration demo script:
```bash
./scripts/demo.sh
```

**What it executes live:**
1. **Runs all 13 Foundry tests:** 9 invariant unit tests + 4 property fuzz suites (1,024 runs).
2. **Spins up 5 validator daemons:** Ports `8001..8005` with distinct P-256 keys.
3. **Generates sovereign owner keypair:** Saves `demo_owner.key`.
4. **Computes DNS TXT challenge:** Generates `_monadtrust.demo.monadtrust.xyz`.
5. **Collects 3-of-5 quorum signatures:** Contacting all 5 nodes and generating `submission_bundle.json`.
6. **Spins up live web server:** Serves `/.well-known/monadtrust/handshake`.
7. **Performs live client handshake:** Proves private key possession with TLS connection fingerprint binding.

### Option 2: Interactive Web Dashboard
```bash
npm run dev --prefix frontend
```
Open **`http://localhost:5173`** to test the interactive 4-step wizard!

---

## 📜 Monad Blitz Devcon Mumbai Submission Reference
* Initial fork: [monad-developers/monad-blitz-devcon-mumbai](https://github.com/monad-developers/monad-blitz-devcon-mumbai)
* Repository: [NVN404/Lucent](https://github.com/NVN404/Lucent)
* Blitz Portal: [blitz.devnads.com](https://blitz.devnads.com)
