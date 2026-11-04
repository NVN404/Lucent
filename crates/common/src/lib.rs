use p256::elliptic_curve::sec1::ToEncodedPoint;
use p256::ecdsa::{signature::hazmat::PrehashSigner, signature::hazmat::PrehashVerifier, Signature, SigningKey, VerifyingKey};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;
use tiny_keccak::{Hasher, Keccak};

#[derive(Error, Debug)]
pub enum CommonError {
    #[error("Invalid domain format: {0}")]
    InvalidDomain(String),
    #[error("Cryptographic error: {0}")]
    CryptoError(String),
    #[error("Hex decode error: {0}")]
    HexError(#[from] hex::FromHexError),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct P256PublicKey {
    #[serde(with = "hex_bytes32")]
    pub qx: [u8; 32],
    #[serde(with = "hex_bytes32")]
    pub qy: [u8; 32],
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct P256Signature {
    #[serde(with = "hex_bytes32")]
    pub r: [u8; 32],
    #[serde(with = "hex_bytes32")]
    pub s: [u8; 32],
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueRequest {
    pub canonical_domain: String,
    pub subject_qx: [u8; 32],
    pub subject_qy: [u8; 32],
    pub expires_at: u64,
    pub nonce: u64,
    pub deadline: u64,
}

pub mod hex_bytes32 {
    use serde::{self, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &[u8; 32], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&format!("0x{}", hex::encode(bytes)))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<[u8; 32], D::Error>
    where
        D: Deserializer<'de>,
    {
        let s: String = serde::Deserialize::deserialize(deserializer)?;
        let clean = s.trim_start_matches("0x");
        let vec = hex::decode(clean).map_err(serde::de::Error::custom)?;
        if vec.len() != 32 {
            return Err(serde::de::Error::custom("expected 32 bytes"));
        }
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&vec);
        Ok(arr)
    }
}

/// Normalizes domain name per RFC 1035 / RFC 5891
pub fn canonicalize_domain(domain: &str) -> Result<String, CommonError> {
    let trimmed = domain.trim();
    if trimmed.is_empty() || trimmed.len() > 253 {
        return Err(CommonError::InvalidDomain("length out of bounds".into()));
    }
    if trimmed.starts_with('.') || trimmed.ends_with('.') {
        return Err(CommonError::InvalidDomain("leading or trailing dot".into()));
    }
    for c in trimmed.chars() {
        if c.is_ascii_uppercase() {
            return Err(CommonError::InvalidDomain("contains uppercase".into()));
        }
        if c.is_whitespace() || c.is_ascii_control() {
            return Err(CommonError::InvalidDomain("contains whitespace or control".into()));
        }
    }
    Ok(trimmed.to_lowercase())
}

pub fn keccak256_hash(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(data);
    hasher.finalize(&mut output);
    output
}

pub fn key_hash(qx: &[u8; 32], qy: &[u8; 32]) -> [u8; 32] {
    let mut packed = Vec::with_capacity(64);
    packed.extend_from_slice(qx);
    packed.extend_from_slice(qy);
    keccak256_hash(&packed)
}

/// Computes the exact 32-byte SHA-256 digest signed by validators and domain owner (PoP)
/// Matches Solidity abi.encodePacked in CertRegistry.sol
pub fn compute_issuance_digest(
    chain_id: u64,
    cert_registry: &[u8; 20],
    domain_hash: &[u8; 32],
    subject_key_hash: &[u8; 32],
    nonce: u64,
    expires_at: u64,
    deadline: u64,
) -> [u8; 32] {
    let mut packed = Vec::new();
    packed.extend_from_slice(b"MONADTRUST_CERT_V1");
    // uint256 chainid (32 bytes big-endian)
    let mut chain_bytes = [0u8; 32];
    chain_bytes[24..32].copy_from_slice(&chain_id.to_be_bytes());
    packed.extend_from_slice(&chain_bytes);
    // address certRegistry (20 bytes)
    packed.extend_from_slice(cert_registry);
    // bytes32 domainHash (32 bytes)
    packed.extend_from_slice(domain_hash);
    // bytes32 subjectKeyHash (32 bytes)
    packed.extend_from_slice(subject_key_hash);
    // uint64 nonce (8 bytes big-endian)
    packed.extend_from_slice(&nonce.to_be_bytes());
    // uint64 expiresAt (8 bytes big-endian)
    packed.extend_from_slice(&expires_at.to_be_bytes());
    // uint64 deadline (8 bytes big-endian)
    packed.extend_from_slice(&deadline.to_be_bytes());

    let mut hasher = Sha256::new();
    hasher.update(&packed);
    let result = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result);
    out
}

/// Computes the deterministic DNS challenge string:
/// "monadtrust-verify=" + hex(sha256("MONADTRUST_DNS_CHALLENGE_V1" || chain_id || subject_key_hash || nonce))
pub fn compute_dns_challenge_value(
    chain_id: u64,
    subject_key_hash: &[u8; 32],
    nonce: u64,
) -> String {
    let mut packed = Vec::new();
    packed.extend_from_slice(b"MONADTRUST_DNS_CHALLENGE_V1");
    let mut chain_bytes = [0u8; 32];
    chain_bytes[24..32].copy_from_slice(&chain_id.to_be_bytes());
    packed.extend_from_slice(&chain_bytes);
    packed.extend_from_slice(subject_key_hash);
    packed.extend_from_slice(&nonce.to_be_bytes());

    let mut hasher = Sha256::new();
    hasher.update(&packed);
    let hash = hasher.finalize();
    format!("monadtrust-verify={}", hex::encode(hash))
}

/// Computes the live web server TLS connection handshake digest:
/// sha256("MONADTRUST_HANDSHAKE_V1" || tls_fingerprint || client_nonce || timestamp)
pub fn compute_handshake_digest(
    tls_fingerprint: &[u8; 32],
    client_nonce: &[u8; 32],
    timestamp: u64,
) -> [u8; 32] {
    let mut packed = Vec::new();
    packed.extend_from_slice(b"MONADTRUST_HANDSHAKE_V1");
    packed.extend_from_slice(tls_fingerprint);
    packed.extend_from_slice(client_nonce);
    packed.extend_from_slice(&timestamp.to_be_bytes());

    let mut hasher = Sha256::new();
    hasher.update(&packed);
    let mut out = [0u8; 32];
    out.copy_from_slice(&hasher.finalize());
    out
}

/// Pre-hashed P-256 signing (avoids double hashing the 32-byte digest)
pub fn sign_prehash(signing_key: &SigningKey, digest: &[u8; 32]) -> Result<P256Signature, CommonError> {
    let (signature, _) = signing_key
        .sign_prehash(digest)
        .map_err(|e| CommonError::CryptoError(format!("Signing failed: {}", e)))?;

    // Normalize to low-s
    let normalized = signature.normalize_s().unwrap_or(signature);
    let r_bytes = normalized.r().to_bytes();
    let s_bytes = normalized.s().to_bytes();

    let mut r = [0u8; 32];
    let mut s = [0u8; 32];
    r.copy_from_slice(&r_bytes);
    s.copy_from_slice(&s_bytes);

    Ok(P256Signature { r, s })
}

/// Pre-hashed P-256 verification
pub fn verify_prehash(
    pubkey: &P256PublicKey,
    digest: &[u8; 32],
    sig: &P256Signature,
) -> Result<bool, CommonError> {
    // Construct Sec1 uncompressed point 0x04 || qx || qy
    let mut sec1 = Vec::with_capacity(65);
    sec1.push(0x04);
    sec1.extend_from_slice(&pubkey.qx);
    sec1.extend_from_slice(&pubkey.qy);

    let verifying_key = VerifyingKey::from_sec1_bytes(&sec1)
        .map_err(|e| CommonError::CryptoError(format!("Invalid public key coordinates: {}", e)))?;

    let signature = Signature::from_scalars(sig.r, sig.s)
        .map_err(|e| CommonError::CryptoError(format!("Invalid signature scalars: {}", e)))?;

    Ok(verifying_key.verify_prehash(digest, &signature).is_ok())
}

pub fn pubkey_from_signing_key(signing_key: &SigningKey) -> P256PublicKey {
    let verifying_key = signing_key.verifying_key();
    let encoded = verifying_key.to_encoded_point(false);
    let mut qx = [0u8; 32];
    let mut qy = [0u8; 32];
    qx.copy_from_slice(encoded.x().unwrap());
    qy.copy_from_slice(encoded.y().unwrap());
    P256PublicKey { qx, qy }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_canonicalize_domain() {
        assert_eq!(canonicalize_domain("example.com").unwrap(), "example.com");
        assert!(canonicalize_domain("EXAMPLE.COM").is_err());
        assert!(canonicalize_domain("example.com.").is_err());
        assert!(canonicalize_domain(".example.com").is_err());
        assert!(canonicalize_domain("exam ple.com").is_err());
    }

    #[test]
    fn test_prehash_sign_verify() {
        let key = SigningKey::from_slice(&[42u8; 32]).expect("key creation");
        let pk = pubkey_from_signing_key(&key);
        let digest = [7u8; 32];

        let sig = sign_prehash(&key, &digest).expect("sign failed");
        let valid = verify_prehash(&pk, &digest, &sig).expect("verify failed");
        assert!(valid);
    }
}
