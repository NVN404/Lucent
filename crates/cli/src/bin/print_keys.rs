use p256::ecdsa::SigningKey;
use sha2::{Digest, Sha256};

fn main() {
    for i in 0..5 {
        let seed = format!("validator_seed_{}", i);
        let hash = Sha256::digest(seed.as_bytes());
        let key = SigningKey::from_slice(&hash).unwrap();
        let pubkey = monadtrust_common::pubkey_from_signing_key(&key);
        println!("VAL_{}_QX = 0x{};", i, hex::encode(pubkey.qx));
        println!("VAL_{}_QY = 0x{};", i, hex::encode(pubkey.qy));
    }
}

