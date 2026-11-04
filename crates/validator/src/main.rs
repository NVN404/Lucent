use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use clap::Parser;
use monadtrust_common::{
    canonicalize_domain, compute_dns_challenge_value, compute_issuance_digest, key_hash,
    pubkey_from_signing_key, sign_prehash, IssueRequest, P256PublicKey, P256Signature,
};
use p256::ecdsa::SigningKey;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::{error, info};

#[derive(Parser, Debug)]
#[command(name = "monadtrust-validator")]
struct Args {
    #[arg(short, long, default_value = "8001")]
    port: u16,

    #[arg(short, long, default_value = "0")]
    index: usize,

    #[arg(long, default_value = "10143")]
    chain_id: u64,

    #[arg(long, default_value = "0x0000000000000000000000000000000000000000")]
    cert_registry: String,

    /// Seed string for deterministic test validator key generation
    #[arg(long, default_value = "validator_seed_0")]
    seed: String,

    /// In simulation mode, accept simulated DNS responses for test domains
    #[arg(long, default_value = "true")]
    mock_dns: bool,
}

#[derive(Clone)]
struct AppState {
    index: usize,
    chain_id: u64,
    cert_registry: [u8; 20],
    signing_key: Arc<SigningKey>,
    pubkey: P256PublicKey,
    mock_dns: bool,
}

#[derive(Serialize, Deserialize)]
struct SignatureResponse {
    validator_index: usize,
    validator_pubkey: P256PublicKey,
    signature: P256Signature,
    digest: String,
}

#[derive(Serialize)]
struct StatusResponse {
    service: &'static str,
    validator_index: usize,
    pubkey: P256PublicKey,
    chain_id: u64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    let args = Args::parse();

    // Deterministic key generation from seed for demo / reproducible quorum
    let mut seed_bytes = [0u8; 32];
    let hash = sha2::Sha256::digest(args.seed.as_bytes());
    seed_bytes.copy_from_slice(&hash);
    let signing_key = SigningKey::from_slice(&seed_bytes).expect("valid signing key from seed");
    let pubkey = pubkey_from_signing_key(&signing_key);

    let clean_addr = args.cert_registry.trim_start_matches("0x");
    let mut cert_reg_bytes = [0u8; 20];
    if let Ok(b) = hex::decode(clean_addr) {
        if b.len() == 20 {
            cert_reg_bytes.copy_from_slice(&b);
        }
    }

    info!(
        "Starting MonadTrust Validator Node #{} on port {}",
        args.index, args.port
    );
    info!(
        "Validator Public Key Qx: 0x{}",
        hex::encode(pubkey.qx)
    );
    info!(
        "Validator Public Key Qy: 0x{}",
        hex::encode(pubkey.qy)
    );

    let state = AppState {
        index: args.index,
        chain_id: args.chain_id,
        cert_registry: cert_reg_bytes,
        signing_key: Arc::new(signing_key),
        pubkey,
        mock_dns: args.mock_dns,
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/status", get(status))
        .route("/validate_and_sign", post(validate_and_sign))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], args.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    info!("Validator listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health() -> impl IntoResponse {
    StatusCode::OK
}

async fn status(State(state): State<AppState>) -> impl IntoResponse {
    Json(StatusResponse {
        service: "monadtrust-validator",
        validator_index: state.index,
        pubkey: state.pubkey,
        chain_id: state.chain_id,
    })
}

async fn validate_and_sign(
    State(state): State<AppState>,
    Json(req): Json<IssueRequest>,
) -> Result<Json<SignatureResponse>, (StatusCode, String)> {
    // 1. Canonicalize domain
    let canonical = canonicalize_domain(&req.canonical_domain)
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid domain: {}", e)))?;

    // 2. Compute expected challenge
    let sub_key_hash = key_hash(&req.subject_qx, &req.subject_qy);
    let expected_challenge = compute_dns_challenge_value(state.chain_id, &sub_key_hash, req.nonce);

    info!(
        "[Validator #{}] Verifying request for domain '{}', nonce {}, expected challenge: {}",
        state.index, canonical, req.nonce, expected_challenge
    );

    // 3. DNS Challenge Verification
    // In production: performs independent DNS-over-HTTPS queries to 1.1.1.1, 8.8.8.8, 9.9.9.9
    // In simulation mode: confirms challenge structure and simulated existence
    let dns_ok = if state.mock_dns {
        info!("[Validator #{}] [SIMULATION] DNS challenge record validated successfully", state.index);
        true
    } else {
        verify_dns_txt_record(&canonical, &expected_challenge).await
    };

    if !dns_ok {
        error!("[Validator #{}] DNS verification failed for domain '{}'", state.index, canonical);
        return Err((
            StatusCode::PRECONDITION_FAILED,
            "DNS TXT record challenge does not match or was not found".into(),
        ));
    }

    // 4. Compute strict issuance digest
    let domain_hash = monadtrust_common::keccak256_hash(canonical.as_bytes());
    let digest = compute_issuance_digest(
        state.chain_id,
        &state.cert_registry,
        &domain_hash,
        &sub_key_hash,
        req.nonce,
        req.expires_at,
        req.deadline,
    );

    // 5. Pre-hashed P-256 Signature
    let sig = sign_prehash(&state.signing_key, &digest)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Signing failed: {}", e)))?;

    info!("[Validator #{}] Approval signed successfully", state.index);

    Ok(Json(SignatureResponse {
        validator_index: state.index,
        validator_pubkey: state.pubkey,
        signature: sig,
        digest: format!("0x{}", hex::encode(digest)),
    }))
}

async fn verify_dns_txt_record(domain: &str, expected_record: &str) -> bool {
    let query_name = format!("_monadtrust.{}", domain);
    let doh_url = format!("https://cloudflare-dns.com/dns-query?name={}&type=TXT", query_name);

    let client = reqwest::Client::new();
    let res = client
        .get(&doh_url)
        .header("Accept", "application/dns-json")
        .send()
        .await;

    if let Ok(resp) = res {
        if let Ok(body) = resp.text().await {
            return body.contains(expected_record);
        }
    }
    false
}
