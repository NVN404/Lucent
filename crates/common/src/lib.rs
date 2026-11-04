use p256::elliptic_curve::sec1::ToEncodedPoint;
use p256::ecdsa::{signature::hazmat::PrehashSigner, signature::hazmat::PrehashVerifier, Signature, SigningKey, VerifyingKey    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
};
use serde::{Deserialize, Serialize    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
};
use sha2::{Digest, Sha256    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
};
use thiserror::Error;
use tiny_keccak::{Hasher, Keccak    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
};

#[derive(Error, Debug)]
pub enum CommonError {
    #[error("Invalid domain format: {0    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}")]
    InvalidDomain(String),
    #[error("Cryptographic error: {0    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}")]
    CryptoError(String),
    #[error("Hex decode error: {0    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}")]
    HexError(#[from] hex::FromHexError),
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct P256PublicKey {
    #[serde(with = "hex_bytes32")]
    pub qx: [u8; 32],
    #[serde(with = "hex_bytes32")]
    pub qy: [u8; 32],
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct P256Signature {
    #[serde(with = "hex_bytes32")]
    pub r: [u8; 32],
    #[serde(with = "hex_bytes32")]
    pub s: [u8; 32],
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IssueRequest {
    pub canonical_domain: String,
    pub subject_qx: [u8; 32],
    pub subject_qy: [u8; 32],
    pub expires_at: u64,
    pub nonce: u64,
    pub deadline: u64,
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

pub mod hex_bytes32 {
    use serde::{self, Deserializer, Serializer    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
};

    pub fn serialize<S>(bytes: &[u8; 32], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&format!("0x{    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}", hex::encode(bytes)))
        #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
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
            #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
        let mut arr = [0u8; 32];
        arr.copy_from_slice(&vec);
        Ok(arr)
        #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

/// Normalizes domain name per RFC 1035 / RFC 5891
pub fn canonicalize_domain(domain: &str) -> Result<String, CommonError> {
    let trimmed = domain.trim();
    if trimmed.is_empty() || trimmed.len() > 253 {
        return Err(CommonError::InvalidDomain("length out of bounds".into()));
        #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
    if trimmed.starts_with('.') || trimmed.ends_with('.') {
        return Err(CommonError::InvalidDomain("leading or trailing dot".into()));
        #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
    for c in trimmed.chars() {
        if c.is_ascii_uppercase() {
            return Err(CommonError::InvalidDomain("contains uppercase".into()));
            #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
        if c.is_whitespace() || c.is_ascii_control() {
            return Err(CommonError::InvalidDomain("contains whitespace or control".into()));
            #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
        #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
    Ok(trimmed.to_lowercase())
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

pub fn keccak256_hash(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak::v256();
    let mut output = [0u8; 32];
    hasher.update(data);
    hasher.finalize(&mut output);
    output
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

pub fn key_hash(qx: &[u8; 32], qy: &[u8; 32]) -> [u8; 32] {
    let mut packed = Vec::with_capacity(64);
    packed.extend_from_slice(qx);
    packed.extend_from_slice(qy);
    keccak256_hash(&packed)
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
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
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
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
    format!("monadtrust-verify={    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}", hex::encode(hash))
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
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
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

/// Pre-hashed P-256 signing (avoids double hashing the 32-byte digest)
pub fn sign_prehash(signing_key: &SigningKey, digest: &[u8; 32]) -> Result<P256Signature, CommonError> {
    let (signature, _) = signing_key
        .sign_prehash(digest)
        .map_err(|e| CommonError::CryptoError(format!("Signing failed: {    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}", e)))?;

    // Normalize to low-s
    let normalized = signature.normalize_s().unwrap_or(signature);
    let r_bytes = normalized.r().to_bytes();
    let s_bytes = normalized.s().to_bytes();

    let mut r = [0u8; 32];
    let mut s = [0u8; 32];
    r.copy_from_slice(&r_bytes);
    s.copy_from_slice(&s_bytes);

    Ok(P256Signature { r, s     #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
})
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
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
        .map_err(|e| CommonError::CryptoError(format!("Invalid public key coordinates: {    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}", e)))?;

    let signature = Signature::from_scalars(sig.r, sig.s)
        .map_err(|e| CommonError::CryptoError(format!("Invalid signature scalars: {    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}", e)))?;

    Ok(verifying_key.verify_prehash(digest, &signature).is_ok())
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}

pub fn pubkey_from_signing_key(signing_key: &SigningKey) -> P256PublicKey {
    let verifying_key = signing_key.verifying_key();
    let encoded = verifying_key.to_encoded_point(false);
    let mut qx = [0u8; 32];
    let mut qy = [0u8; 32];
    qx.copy_from_slice(encoded.x().unwrap());
    qy.copy_from_slice(encoded.y().unwrap());
    P256PublicKey { qx, qy     #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
    #[test]
    fn print_5_validators() {
        for i in 0..5 {
            let seed = format!("validator_seed_{}", i);
            let hash = sha2::Sha256::digest(seed.as_bytes());
            let mut seed_bytes = [0u8; 32];
            seed_bytes.copy_from_slice(&hash);
            let key = SigningKey::from_slice(&seed_bytes).unwrap();
            let pk = pubkey_from_signing_key(&key);
            println!("VAL_{}_QX: 0x{}", i, hex::encode(pk.qx));
            println!("VAL_{}_QY: 0x{}", i, hex::encode(pk.qy));
        }
    }
}
