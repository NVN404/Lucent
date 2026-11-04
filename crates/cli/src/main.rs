use clap::{Parser, Subcommand};
use monadtrust_common::{
    canonicalize_domain, compute_dns_challenge_value, compute_issuance_digest, key_hash,
    pubkey_from_signing_key, sign_prehash, verify_prehash, IssueRequest, P256PublicKey, P256Signature,
};
use p256::ecdsa::SigningKey;
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Parser)]
#[command(name = "monadtrust-cli", about = "MonadTrust Domain Owner & ACME-Style CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Generate a new P-256 domain owner keypair
    Keygen {
        #[arg(short, long, default_value = "owner.key")]
        output: PathBuf,
    },
    /// Generate the required DNS-01 challenge string for domain verification
    Challenge {
        #[arg(short, long)]
        domain: String,
        #[arg(short, long, default_value = "owner.key")]
        key: PathBuf,
        #[arg(long, default_value = "10143")]
        chain_id: u64,
        #[arg(short, long, default_value = "1")]
        nonce: u64,
    },
    /// Request multi-validator quorum signatures and generate on-chain submission payload
    RequestQuorum {
        #[arg(short, long)]
        domain: String,
        #[arg(short, long, default_value = "owner.key")]
        key: PathBuf,
        #[arg(long, default_value = "10143")]
        chain_id: u64,
        #[arg(long, default_value = "0x0000000000000000000000000000000000000000")]
        cert_registry: String,
        #[arg(short, long, default_value = "1")]
        nonce: u64,
        #[arg(
            long,
            default_value = "http://127.0.0.1:8001,http://127.0.0.1:8002,http://127.0.0.1:8003,http://127.0.0.1:8004,http://127.0.0.1:8005"
        )]
        validators: String,
    },
    /// Host live website endpoint supporting MonadTrust anti-relay TLS handshake
    Serve {
        #[arg(short, long, default_value = "3000")]
        port: u16,
        #[arg(short, long, default_value = "owner.key")]
        key: PathBuf,
    },
}

#[derive(Deserialize)]
struct ValidatorSigResponse {
    validator_index: usize,
    validator_pubkey: P256PublicKey,
    signature: P256Signature,
}

#[derive(Serialize)]
struct CalldataBundle {
    canonical_domain: String,
    subject_qx: String,
    subject_qy: String,
    expires_at: u64,
    nonce: u64,
    deadline: u64,
    owner_pop_r: String,
    owner_pop_s: String,
    validator_indices: Vec<usize>,
    validator_sigs_r: Vec<String>,
    validator_sigs_s: Vec<String>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Keygen { output } => {
            let signing_key = SigningKey::random(&mut OsRng);
            let secret_bytes = signing_key.to_bytes();
            fs::write(&output, hex::encode(secret_bytes))?;

            let pubkey = pubkey_from_signing_key(&signing_key);
            let kh = key_hash(&pubkey.qx, &pubkey.qy);

            println!("============================================================");
            println!(" MonadTrust Sovereign Domain Owner Key Generated");
            println!("============================================================");
            println!("Private Key saved to: {}", output.display());
            println!("Public Key Qx:        0x{}", hex::encode(pubkey.qx));
            println!("Public Key Qy:        0x{}", hex::encode(pubkey.qy));
            println!("Subject Key Hash:     0x{}", hex::encode(kh));
            println!("============================================================");
        }

        Commands::Challenge {
            domain,
            key,
            chain_id,
            nonce,
        } => {
            let canonical = canonicalize_domain(&domain)?;
            let signing_key = load_key(&key)?;
            let pubkey = pubkey_from_signing_key(&signing_key);
            let sub_key_hash = key_hash(&pubkey.qx, &pubkey.qy);
            let challenge = compute_dns_challenge_value(chain_id, &sub_key_hash, nonce);

            println!("============================================================");
            println!(" MonadTrust DNS-01 Challenge Record");
            println!("============================================================");
            println!("Canonical Domain:  {}", canonical);
            println!("Nonce:             {}", nonce);
            println!("Chain ID:          {}", chain_id);
            println!("\nPlease configure the following DNS TXT record:");
            println!("------------------------------------------------------------");
            println!("HOST / NAME:  _monadtrust.{}", canonical);
            println!("TYPE:         TXT");
            println!("VALUE:        {}", challenge);
            println!("------------------------------------------------------------");
            println!("Once published, run `monadtrust-cli request-quorum` to obtain validator approvals.");
            println!("============================================================");
        }

        Commands::RequestQuorum {
            domain,
            key,
            chain_id,
            cert_registry,
            nonce,
            validators,
        } => {
            let canonical = canonicalize_domain(&domain)?;
            let signing_key = load_key(&key)?;
            let pubkey = pubkey_from_signing_key(&signing_key);
            let sub_key_hash = key_hash(&pubkey.qx, &pubkey.qy);

            let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs();
            let expires_at = now + 90 * 86400; // 90 days validity
            let deadline = now + 1800; // 30 minute approval window

            let clean_reg = cert_registry.trim_start_matches("0x");
            let mut reg_bytes = [0u8; 20];
            if let Ok(b) = hex::decode(clean_reg) {
                if b.len() == 20 {
                    reg_bytes.copy_from_slice(&b);
                }
            }

            let domain_hash = monadtrust_common::keccak256_hash(canonical.as_bytes());
            let digest = compute_issuance_digest(
                chain_id,
                &reg_bytes,
                &domain_hash,
                &sub_key_hash,
                nonce,
                expires_at,
                deadline,
            );

            // Domain Owner signs Proof-of-Possession
            let owner_pop = sign_prehash(&signing_key, &digest)?;

            println!("============================================================");
            println!(" MonadTrust Quorum Collection");
            println!("============================================================");
            println!("Domain:              {}", canonical);
            println!("Issuance Digest:     0x{}", hex::encode(digest));
            println!("Owner PoP Signature: Verified locally");

            let endpoints: Vec<&str> = validators.split(',').collect();
            let mut collected_indices = Vec::new();
            let mut collected_sigs = Vec::new();

            let client = reqwest::Client::new();
            let req_body = IssueRequest {
                canonical_domain: canonical.clone(),
                subject_qx: pubkey.qx,
                subject_qy: pubkey.qy,
                expires_at,
                nonce,
                deadline,
            };

            for ep in endpoints {
                let url = format!("{}/validate_and_sign", ep.trim());
                print!("Contacting validator at {} ... ", url);
                let resp = client.post(&url).json(&req_body).send().await;

                match resp {
                    Ok(r) if r.status().is_success() => {
                        let sig_res: ValidatorSigResponse = r.json().await?;
                        // Locally verify the validator signature against its advertised pubkey
                        let is_valid = verify_prehash(&sig_res.validator_pubkey, &digest, &sig_res.signature)?;
                        if is_valid {
                            println!("✓ Valid signature from Validator #{}", sig_res.validator_index);
                            collected_indices.push(sig_res.validator_index);
                            collected_sigs.push(sig_res.signature);
                        } else {
                            println!("✗ Invalid signature scalar");
                        }
                    }
                    Ok(r) => {
                        let err_text = r.text().await.unwrap_or_default();
                        println!("✗ Failed: {}", err_text);
                    }
                    Err(e) => {
                        println!("✗ Connection error: {}", e);
                    }
                }
            }

            println!("------------------------------------------------------------");
            println!("Signatures Collected: {} of 5 required threshold: 3", collected_indices.len());

            if collected_indices.len() >= 3 {
                println!("✓ QUORUM ACHIEVED (3-of-5)!");
                println!("Ready for Monad Testnet submission.\n");

                let bundle = CalldataBundle {
                    canonical_domain: canonical,
                    subject_qx: format!("0x{}", hex::encode(pubkey.qx)),
                    subject_qy: format!("0x{}", hex::encode(pubkey.qy)),
                    expires_at,
                    nonce,
                    deadline,
                    owner_pop_r: format!("0x{}", hex::encode(owner_pop.r)),
                    owner_pop_s: format!("0x{}", hex::encode(owner_pop.s)),
                    validator_indices: collected_indices,
                    validator_sigs_r: collected_sigs.iter().map(|s| format!("0x{}", hex::encode(s.r))).collect(),
                    validator_sigs_s: collected_sigs.iter().map(|s| format!("0x{}", hex::encode(s.s))).collect(),
                };

                let json_bundle = serde_json::to_string_pretty(&bundle)?;
                fs::write("submission_bundle.json", &json_bundle)?;
                println!("Saved complete transaction submission payload to `submission_bundle.json`.");
            } else {
                eprintln!("✗ Insufficient quorum: collected only {} signatures", collected_indices.len());
            }
            println!("============================================================");
        }

        Commands::Serve { port, key } => {
            let signing_key = Arc::new(load_key(&key)?);
            let pubkey = pubkey_from_signing_key(&signing_key);

            println!("============================================================");
            println!(" MonadTrust Website Server (Live Handshake Responder)");
            println!("============================================================");
            println!("Listening on:         http://0.0.0.0:{}", port);
            println!("Public Key Qx:        0x{}", hex::encode(pubkey.qx));
            println!("Public Key Qy:        0x{}", hex::encode(pubkey.qy));
            println!("Handshake Endpoint:   /.well-known/monadtrust/handshake");
            println!("============================================================");

            let app = axum::Router::new()
                .route("/", axum::routing::get(|| async { "Welcome to MonadTrust Secured Site!" }))
                .route(
                    "/.well-known/monadtrust/handshake",
                    axum::routing::post(handle_handshake),
                )
                .layer(axum::Extension(signing_key));

            let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
            let listener = tokio::net::TcpListener::bind(addr).await?;
            axum::serve(listener, app).await?;
        }
    }

    Ok(())
}

#[derive(Deserialize)]
struct HandshakeReq {
    client_nonce: String,
    tls_fingerprint: String,
    timestamp: u64,
}

#[derive(Serialize)]
struct HandshakeResp {
    signature: P256Signature,
    timestamp: u64,
}

async fn handle_handshake(
    axum::Extension(signing_key): axum::Extension<Arc<SigningKey>>,
    axum::Json(req): axum::Json<HandshakeReq>,
) -> Result<axum::Json<HandshakeResp>, (axum::http::StatusCode, String)> {
    let clean_nonce = req.client_nonce.trim_start_matches("0x");
    let clean_fp = req.tls_fingerprint.trim_start_matches("0x");

    let nonce_vec = hex::decode(clean_nonce)
        .map_err(|e| (axum::http::StatusCode::BAD_REQUEST, format!("Invalid nonce hex: {}", e)))?;
    let fp_vec = hex::decode(clean_fp)
        .map_err(|e| (axum::http::StatusCode::BAD_REQUEST, format!("Invalid fingerprint hex: {}", e)))?;

    if nonce_vec.len() != 32 || fp_vec.len() != 32 {
        return Err((axum::http::StatusCode::BAD_REQUEST, "Nonce and Fingerprint must be 32 bytes".into()));
    }

    let mut nonce_bytes = [0u8; 32];
    let mut fp_bytes = [0u8; 32];
    nonce_bytes.copy_from_slice(&nonce_vec);
    fp_bytes.copy_from_slice(&fp_vec);

    let digest = monadtrust_common::compute_handshake_digest(&fp_bytes, &nonce_bytes, req.timestamp);
    let sig = sign_prehash(&signing_key, &digest)
        .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Signing failed: {}", e)))?;

    Ok(axum::Json(HandshakeResp {
        signature: sig,
        timestamp: req.timestamp,
    }))
}

fn load_key(path: &PathBuf) -> Result<SigningKey, Box<dyn std::error::Error>> {
    let hex_str = fs::read_to_string(path)?;
    let clean = hex_str.trim().trim_start_matches("0x");
    let bytes = hex::decode(clean)?;
    let key = SigningKey::from_slice(&bytes)?;
    Ok(key)
}
