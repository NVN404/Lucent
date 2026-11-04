import React, { useState } from 'react'
import {
  CheckCircle2, AlertTriangle, Key, Globe, Cpu,
  Server, ExternalLink, Copy, Check, Lock, ArrowRight, Activity,
  Zap, Layers, FileCheck, AlertOctagon, ChevronRight, Sparkles,
  Network, Database, Code, Gauge, Clock, Fingerprint
} from 'lucide-react'

// Live Monad Testnet Addresses
const CERT_REGISTRY_ADDR = '0xE4ec4B30F417260cf0C3cdca8fbEAE6d337c080b'
const VALIDATOR_REGISTRY_ADDR = '0x9854f6f7bc90A0D84dce9065E1bD3ae3B8d436E4'
const MONAD_PRECOMPILE_ADDR = '0x0000000000000000000000000000000000000100'

export default function LandingPage({ onLaunchConsole }) {
  const [copiedAddress, setCopiedAddress] = useState('')
  const [benchmarkCertCount, setBenchmarkCertCount] = useState(100)
  const [activeStep, setActiveStep] = useState(0)

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(id)
    setTimeout(() => setCopiedAddress(''), 2000)
  }

  // Cost calculation for comparison
  const ethGasPerVerify = 350000
  const monadGasPerVerify = 6900
  const ethGasCostUsd = ((ethGasPerVerify * 25 * 1e-9 * 3200) * benchmarkCertCount).toFixed(2)
  const monadGasCostUsd = ((monadGasPerVerify * 50 * 1e-9 * 4.5) * benchmarkCertCount).toFixed(4)
  const gasSavingsPct = (((ethGasPerVerify - monadGasPerVerify) / ethGasPerVerify) * 100).toFixed(1)

  const steps = [
    {
      title: 'Domain Ownership & P-256 Curve Bind',
      tag: 'Step 01',
      desc: 'Website operators generate an elliptic curve NIST P-256 keypair. The public key is bound to the target domain through a cryptographically signed DNS-01 TXT record challenge.',
      codeSnippet: `// Domain-bound challenge record\n_acme-challenge.example.com IN TXT "lucent-verify=0x1ec92b50d3...7d43919d"`
    },
    {
      title: '5-Node Independent Geographic Attestation',
      tag: 'Step 02',
      desc: 'Independent validator nodes in Virginia, Frankfurt, Mumbai, Singapore, and São Paulo fetch and verify DNS records over DNSSEC. A minimum 3-of-5 threshold is mandatory.',
      codeSnippet: `// Multi-region validator quorum validation\nQuorum: 5/5 responsive (minimum 3 required)\nAttestations: [0x2f8e...4c1, 0x3f8e...13c1, 0x4f8e...22c1]`
    },
    {
      title: 'Monad Precompile 0x0100 Verification',
      tag: 'Step 03',
      desc: 'Aggregated threshold signatures and public keys are committed to the Monad CertRegistry. Monad native precompile at address 0x0100 verifies NIST P-256 signatures in 6,900 gas.',
      codeSnippet: `// CertRegistry.sol invokes EIP-7951 precompile\n(bool ok, bytes memory out) = address(0x0100).staticcall(p256Calldata);\nrequire(ok && out[31] == 1, "P256_VERIFY_FAILED");`
    },
    {
      title: 'Sub-Second Browser Trust Handshake',
      tag: 'Step 04',
      desc: 'The browser client queries the Monad full node for live on-chain status. In 800ms, certificates verify without relying on centralized CAs or stale 48-hour CRL caching.',
      codeSnippet: `// 8-Layer cryptographic client inspection\nLayer 1: Monad State Root Verified\nLayer 2: Precompile Signature Valid\nLayer 8: RevocationRegistry Status: ACTIVE (Not Revoked)`
    }
  ]

  return (
    <div className="w-full bg-[#FAFAFA] text-slate-900 selection:bg-amber-300 selection:text-slate-950 relative overflow-hidden">
      {/* Ambient Warm Golden Gradient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[580px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(251,191,36,0.22),rgba(245,158,11,0.06)_50%,transparent_80%)] pointer-events-none -z-0" />
      <div className="absolute -top-24 right-8 w-[420px] h-[420px] bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute top-80 -left-16 w-[380px] h-[380px] bg-yellow-200/25 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Sleek Dedicated Landing Page Navigation Bar */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand Identity (Clean Typographic Mark) */}
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-xl tracking-tight text-slate-950 font-sans">
              Lucent
            </span>
            <span className="text-[11px] font-mono uppercase bg-amber-50 text-amber-900 border border-amber-200/90 px-2.5 py-0.5 rounded-full font-semibold">
              dPKI on Monad
            </span>
          </div>

          {/* Section Jump Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <a href="#incident" className="hover:text-amber-800 transition-colors">eMudhra Incident</a>
            <a href="#pillars" className="hover:text-amber-800 transition-colors">Pillars</a>
            <a href="#benchmark" className="hover:text-amber-800 transition-colors">Benchmark</a>
            <a href="#workflow" className="hover:text-amber-800 transition-colors">Workflow</a>
            <a href="#contracts" className="hover:text-amber-800 transition-colors">Contracts</a>
          </nav>

          {/* Telemetry and Single Launch App CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-amber-50/70 border border-amber-200/80 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-900">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-800">Monad Testnet</span>
              <span className="text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded font-bold">#10143</span>
            </div>
            <button
              onClick={onLaunchConsole}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 1. HERO SECTION (Anti-Center Split Screen, Viewport Restraint, Max 4 Text Elements) */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 border-b border-slate-200/80 overflow-hidden bg-gradient-to-b from-[#FFFDF5] via-[#FAFAFA] to-[#FAFAFA]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#FDE68A15_1px,transparent_1px),linear-gradient(to_bottom,#FDE68A15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Hero Stack (Strictly 4 Elements: Eyebrow, Headline, Subtext, CTAs) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Element 1: Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/90 text-amber-900 text-[11px] font-mono uppercase tracking-wider font-semibold mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                DECENTRALIZED WEB PKI ON MONAD
              </div>

              {/* Element 2: Headline (Max 2 lines desktop) */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-slate-950 leading-[1.08] mb-5">
                Replacing vulnerable CAs with on-chain cryptographic quorum.
              </h1>

              {/* Element 3: Subtext (Strictly <= 20 words) */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-[54ch]">
                Eliminate single points of failure in TLS certificates using Monad native precompiles and independent validator consensus.
              </p>

              {/* Element 4: Action CTAs */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={onLaunchConsole}
                  className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://testnet.monadscan.com/address/${CERT_REGISTRY_ADDR}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-xl bg-white hover:bg-amber-50/50 border border-slate-200/90 text-slate-700 font-medium text-sm inline-flex items-center gap-2 shadow-card transition-all duration-150 active:scale-[0.98]"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>MonadScan Verified</span>
                </a>
              </div>

              {/* Live Trust Metrics Strip */}
              <div className="mt-10 pt-8 border-t border-slate-200/80 w-full grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold font-mono text-slate-900">6,900</div>
                  <div className="text-xs text-slate-500 mt-0.5">Precompile Gas Cost</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-amber-700">5 Nodes</div>
                  <div className="text-xs text-slate-500 mt-0.5">Validator Quorum</div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono text-slate-900">0.8s</div>
                  <div className="text-xs text-slate-500 mt-0.5">Monad Block Time</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Live Interactive Asset */}
            <div className="lg:col-span-5">
              <div className="bg-white/95 rounded-2xl border border-amber-200/80 shadow-elevated p-6 relative overflow-hidden backdrop-blur-sm">
                {/* Header of interactive card */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">Live Trust Chain</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 bg-amber-50/60 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                    Chain ID 10143
                  </span>
                </div>

                {/* Certificate Topology Visual */}
                <div className="py-4 space-y-3.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        TLS
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">demo.lucent.id</div>
                        <div className="text-[11px] font-mono text-slate-500">NIST P-256 Curve Key</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                      Valid
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-800 flex items-center justify-center font-bold text-xs">
                        0x01
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">EIP-7951 Precompile</div>
                        <div className="text-[11px] font-mono text-slate-500">Address 0x0100 | 6,900 Gas</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                      Native
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        5/5
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-900">Validator Quorum Mesh</div>
                        <div className="text-[11px] font-mono text-slate-500">US, EU, AP, SG, BR</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                      Consensus
                    </span>
                  </div>
                </div>

                {/* Card footer with launch trigger */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">State: <span className="text-slate-800 font-medium">Fail-Closed Enforcement</span></div>
                  <button
                    onClick={onLaunchConsole}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open in Console</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE INCIDENT POST-MORTEM & HOW LUCENT SOLVES IT */}
      <section id="incident" className="py-16 md:py-24 border-b border-slate-200/80 bg-white scroll-mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-mono font-semibold mb-6">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>OCTOBER 2026 CASE STUDY</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 mb-5 leading-tight">
            The eMudhra Incident: Why Centralized CAs Failed
          </h2>

          {/* Narrative paragraphs */}
          <p className="text-slate-600 leading-relaxed text-base mb-4">
            In October 2026, security researchers disclosed that eight intermediate CA signing keys of eMudhra were generated with predictable, near-zero entropy. The root cause was a flawed pseudo-random number generator used during HSM key ceremonies — an operational error that destroyed cryptographic uniqueness and left private keys mathematically derivable by outside actors.
          </p>
          <p className="text-slate-600 leading-relaxed text-base mb-4">
            With derived CA keys in hand, attackers could sign authentic, browser-trusted TLS certificates for any domain in the world — Google, Apple, banking portals — without any consent from domain owners. The compromise operated invisibly across <strong className="text-slate-800">18 months and multiple compliance audit cycles</strong> because CA operations are opaque off-chain black boxes with no public, cryptographically verifiable state.
          </p>
          <p className="text-slate-600 leading-relaxed text-base mb-10">
            When the incident finally surfaced, standard revocation infrastructure failed to contain the damage. Browsers cache CRL and OCSP responses for up to 48 hours; when responders time out, they fail-open — silently ignoring compromised certificates and leaving users exposed to active man-in-the-middle interception.
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-400">How Lucent addresses each flaw</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Prose list of fixes */}
          <div className="space-y-7">
            {[
              {
                flaw: 'Solitary master signing key',
                fix: '3-of-5 Threshold Quorum',
                body: 'No single entity holds master signing power. Certificate issuance requires cryptographic agreement from at least three of five independent validator nodes distributed across Virginia, Frankfurt, Mumbai, Singapore, and Sao Paulo. Even with two keys stolen, forging a certificate is mathematically impossible.',
              },
              {
                flaw: '48-hour CRL propagation and fail-open browsers',
                fix: '0.8s On-Chain Revocation',
                body: 'Revocations are committed as Monad state transitions confirmed in under one second. Client verifiers read live blockchain state and enforce fail-closed logic — a certificate with an on-chain revocation record is rejected immediately, with no caching window for an attacker to exploit.',
              },
              {
                flaw: 'Zero domain-owner cryptographic consent',
                fix: 'Sovereign Proof-of-Possession',
                body: 'Issuance requires a valid NIST P-256 signature from the domain owner, verified on-chain via the Monad native precompile at address 0x0100 for exactly 6,900 gas. No CA can mint a certificate for your domain without a cryptographic proof that you authorized it.',
              },
              {
                flaw: '18 months of silent, unauditable compromise',
                fix: 'Public Ledger State',
                body: 'Every validator signature, certificate commitment, and key rotation is recorded as immutable Monad state. Any party — auditor, researcher, or end user — can independently verify the full trust chain without relying on a CA\'s self-reported compliance logs.',
              },
            ].map(({ flaw, fix, body }) => (
              <div key={flaw} className="flex gap-4">
                <div className="mt-1.5 w-5 h-5 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-mono mb-0.5 line-through">{flaw}</p>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{fix}</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. CORE ARCHITECTURAL PILLARS (Bento Grid Rhythm) */}
      <section id="pillars" className="py-16 md:py-24 border-b border-slate-200/80 scroll-mt-16 bg-gradient-to-b from-[#FAFAFA] via-amber-50/15 to-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-3">
              Engineered for Deterministic Trust
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Three architectural breakthroughs establish a decentralized trust layer that runs directly on the Monad high-throughput blockchain.
            </p>
          </div>

          {/* Bento Grid: 1 Wide Spotlight + 2 Symmetrical Anchors */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Spotlight 1: Monad Native Precompile 0x0100 (EIP-7951) */}
            <div className="lg:col-span-12 p-8 rounded-2xl bg-white border border-amber-200/80 shadow-card">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-200 flex items-center justify-center mb-4 font-bold text-sm">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-950 mb-3">
                    Monad EIP-7951 Native Precompile (0x0100)
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm mb-4">
                    Ethereum requires up to 350,000 gas to verify NIST P-256 signatures in smart contracts, rendering on-chain TLS validation cost-prohibitive. Monad includes a native assembly precompile at address 0x0100 that validates curve secp256r1 in just 6,900 gas.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600">
                    <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">Curve: NIST P-256</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">Address: 0x0100</span>
                    <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded border border-amber-200 font-semibold">Cost: 6,900 Gas</span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-950 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                  <div className="text-slate-400 mb-2">// Staticcall into Monad 0x0100 Precompile</div>
                  <div className="text-amber-400">address constant PRECOMPILE = 0x0000...0100;</div>
                  <div className="text-slate-300 mt-2">bytes memory payload = abi.encodePacked(hash, r, s, qx, qy);</div>
                  <div className="text-sky-300 mt-2">(bool ok, bytes memory res) = PRECOMPILE.staticcall(payload);</div>
                  <div className="text-amber-300 mt-2">require(ok && res[31] == 1, "P256_VERIFICATION_FAILED");</div>
                </div>
              </div>
            </div>

            {/* Pillar 2: 3-of-5 Hardware Quorum */}
            <div className="lg:col-span-6 p-8 rounded-2xl bg-white border border-slate-200/90 shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center mb-4 font-bold text-sm">
                  <Network className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 mb-2">
                  Independent Validator Quorum Mesh
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Domain verification is distributed across five geographically isolated validator daemons. A certificate request is signed and finalized on Monad only when at least 3 distinct nodes submit cryptographic proofs.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="font-semibold text-slate-900">Distributed Mesh</div>
                  <div className="text-slate-500 mt-0.5">5 Global Regions</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="font-semibold text-slate-900">Byzantine Fault Tolerant</div>
                  <div className="text-slate-500 mt-0.5">Survives 2 rogue nodes</div>
                </div>
              </div>
            </div>

            {/* Pillar 3: Sub-Second On-Chain Revocation */}
            <div className="lg:col-span-6 p-8 rounded-2xl bg-white border border-slate-200/90 shadow-card flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center justify-center mb-4 font-bold text-sm">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-950 mb-2">
                  Sub-Second Fail-Closed Revocation
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Existing CRL and OCSP mechanisms take days to propagate revocations across global caches. Lucent updates state in 800ms directly in the Monad RevocationRegistry smart contract.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="font-semibold text-slate-900">Deterministic Block State</div>
                  <div className="text-slate-500 mt-0.5">Instant global propagation</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                  <div className="font-semibold text-slate-900">Client Engine Check</div>
                  <div className="text-slate-500 mt-0.5">No OCSP responder timeout</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE PRECOMPILE BENCHMARK (Interactive Gas Comparison Meter, 2nd Eyebrow Allowed) */}
      <section id="benchmark" className="py-16 md:py-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-amber-50/25 to-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-900 text-[11px] font-mono uppercase tracking-wider font-semibold mb-4">
              PRECOMPILE BENCHMARK
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-3">
              Cost & Throughput Comparison
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              Verify elliptic curve NIST P-256 signatures with 98% lower gas consumption using Monad specialized precompile architecture.
            </p>
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-amber-200/80 shadow-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <label className="text-sm font-semibold text-slate-900 block mb-1">
                  Certificates Verified in Batch
                </label>
                <div className="text-xs text-slate-500">
                  Simulate verification load on enterprise TLS infrastructures
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={benchmarkCertCount}
                  onChange={(e) => setBenchmarkCertCount(Number(e.target.value))}
                  className="w-48 accent-amber-500 cursor-pointer"
                />
                <span className="font-mono font-bold text-sm bg-amber-50 px-3 py-1 rounded-lg border border-amber-200 text-amber-950">
                  {benchmarkCertCount} certs
                </span>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Ethereum Legacy EVM */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ethereum EVM</div>
                <div className="text-2xl font-bold text-slate-900 font-mono">
                  {(ethGasPerVerify * benchmarkCertCount).toLocaleString()} <span className="text-xs text-slate-400 font-normal">gas</span>
                </div>
                <div className="mt-2 text-sm text-red-600 font-medium font-mono">
                  ${ethGasCostUsd} estimated cost
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                  12.0s block confirmation time
                </div>
              </div>

              {/* Monad Precompile 0x0100 */}
              <div className="bg-amber-50/70 p-5 rounded-xl border border-amber-300 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-bl">
                  98% SAVINGS
                </div>
                <div className="text-xs font-semibold text-amber-900 uppercase tracking-wide mb-1">Monad Native (0x0100)</div>
                <div className="text-2xl font-bold text-amber-900 font-mono">
                  {(monadGasPerVerify * benchmarkCertCount).toLocaleString()} <span className="text-xs text-amber-700/70 font-normal">gas</span>
                </div>
                <div className="mt-2 text-sm text-emerald-700 font-medium font-mono">
                  ${monadGasCostUsd} estimated cost
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs text-amber-800">
                  0.8s block confirmation time
                </div>
              </div>

              {/* Net Architecture Advantage */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/80">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Protocol Efficiency</div>
                <div className="text-2xl font-bold text-emerald-600 font-mono">
                  {gasSavingsPct}% <span className="text-xs text-slate-400 font-normal">reduction</span>
                </div>
                <div className="mt-2 text-sm text-slate-700 font-medium">
                  15x higher throughput
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                  Native asynchronous pipelining
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PROTOCOL WORKFLOW (Step Sequence with Code & Verification) */}
      <section id="workflow" className="py-16 md:py-24 border-b border-slate-200/80 scroll-mt-16 bg-gradient-to-b from-[#FAFAFA] via-amber-50/20 to-[#FAFAFA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-3">
              How Lucent Works
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              From DNS challenge generation to browser client handshake: four transparent, verifiable stages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step navigation selectors */}
            <div className="lg:col-span-5 space-y-3">
              {steps.map((st, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                    activeStep === i
                      ? 'bg-white border-amber-400 shadow-card text-slate-900 ring-1 ring-amber-300'
                      : 'bg-transparent border-slate-200/80 text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                      activeStep === i ? 'text-amber-800' : 'text-slate-400'
                    }`}>
                      {st.tag}
                    </span>
                    {activeStep === i && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-slate-900">{st.title}</div>
                </button>
              ))}
            </div>

            {/* Step display container */}
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-2xl border border-amber-200/80 shadow-card">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <span className="text-xs font-mono font-bold text-amber-800 uppercase tracking-wider">
                  {steps[activeStep].tag} Execution Details
                </span>
                <span className="text-xs text-slate-400">Automated Protocol Verification</span>
              </div>

              <h4 className="text-lg font-bold text-slate-900 mb-2">
                {steps[activeStep].title}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {steps[activeStep].desc}
              </p>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                <pre>{steps[activeStep].codeSnippet}</pre>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">Ready to test this lifecycle live?</div>
                <button
                  onClick={onLaunchConsole}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERIFIED SMART CONTRACTS (Monad Testnet #10143) */}
      <section id="contracts" className="py-16 md:py-24 border-b border-slate-200/80 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 mb-3">
              Verified On-Chain Contracts
            </h2>
            <p className="text-slate-600 text-base leading-relaxed">
              All state transitions and issuance registries are deployed, verified, and accessible on Monad Testnet (Chain ID 10143).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contract 1: CertRegistry */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-mono font-bold text-xs">
                    01
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">CertRegistry.sol</h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Stores authoritative certificate commitments, domain mappings, and owner public key hashes.
                </p>
              </div>

              <div>
                <div className="font-mono text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between mb-3">
                  <span className="truncate">{CERT_REGISTRY_ADDR.slice(0, 10)}...{CERT_REGISTRY_ADDR.slice(-8)}</span>
                  <button
                    onClick={() => handleCopy(CERT_REGISTRY_ADDR, 'cert')}
                    className="text-slate-400 hover:text-slate-700 ml-2"
                  >
                    {copiedAddress === 'cert' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <a
                  href={`https://testnet.monadscan.com/address/${CERT_REGISTRY_ADDR}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>MonadScan</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Contract 2: ValidatorRegistry */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-yellow-100 text-yellow-900 flex items-center justify-center font-mono font-bold text-xs">
                    02
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">ValidatorRegistry.sol</h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Manages active validator nodes, geographic metadata, public signing keys, and quorum thresholds.
                </p>
              </div>

              <div>
                <div className="font-mono text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between mb-3">
                  <span className="truncate">{VALIDATOR_REGISTRY_ADDR.slice(0, 10)}...{VALIDATOR_REGISTRY_ADDR.slice(-8)}</span>
                  <button
                    onClick={() => handleCopy(VALIDATOR_REGISTRY_ADDR, 'val')}
                    className="text-slate-400 hover:text-slate-700 ml-2"
                  >
                    {copiedAddress === 'val' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <a
                  href={`https://testnet.monadscan.com/address/${VALIDATOR_REGISTRY_ADDR}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>MonadScan</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Contract 3: Monad Precompile 0x0100 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-mono font-bold text-xs">
                    03
                  </div>
                  <span className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Native Precompile
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-1">Precompile (EIP-7951)</h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Hardware-accelerated P-256 elliptic curve signature verification directly in the Monad EVM.
                </p>
              </div>

              <div>
                <div className="font-mono text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between mb-3">
                  <span className="truncate">0x0000...000100</span>
                  <button
                    onClick={() => handleCopy(MONAD_PRECOMPILE_ADDR, 'prec')}
                    className="text-slate-400 hover:text-slate-700 ml-2"
                  >
                    {copiedAddress === 'prec' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="w-full py-2 rounded-lg bg-slate-100 border border-slate-200/60 text-xs font-semibold text-slate-600 text-center">
                  6,900 Gas Standard
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-gradient-to-b from-amber-50/40 via-amber-100/20 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 mb-4">
            Test Decentralized Certificate Issuance
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mb-8 leading-relaxed">
            Generate domain keypairs, collect validator threshold signatures, and verify certificates against Monad Testnet contracts in real time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onLaunchConsole}
              className="px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-semibold text-sm inline-flex items-center gap-2 shadow-sm transition-all duration-150 active:scale-[0.98] cursor-pointer"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={`https://testnet.monadscan.com/address/${CERT_REGISTRY_ADDR}`}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-amber-50/50 border border-slate-300 text-slate-800 font-medium text-sm inline-flex items-center gap-2 shadow-card transition-all duration-150 active:scale-[0.98]"
            >
              <span>View On-Chain Registry</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-slate-900 text-sm">Lucent</span>
            <span>-</span>
            <span>dPKI on Monad Testnet Chain ID 10143</span>
          </div>

          <div className="flex items-center gap-6 text-slate-600">
            <button onClick={onLaunchConsole} className="hover:text-amber-800 cursor-pointer">Launch App</button>
            <a href={`https://testnet.monadscan.com/address/${CERT_REGISTRY_ADDR}`} target="_blank" rel="noreferrer" className="hover:text-amber-800">CertRegistry</a>
            <a href={`https://testnet.monadscan.com/address/${VALIDATOR_REGISTRY_ADDR}`} target="_blank" rel="noreferrer" className="hover:text-amber-800">ValidatorRegistry</a>
            <a href="https://docs.monad.xyz" target="_blank" rel="noreferrer" className="hover:text-amber-800">Monad Docs</a>
          </div>

          <div>
            Built with Monad native 0x0100 precompiles
          </div>
        </div>
      </footer>
    </div>
  )
}
