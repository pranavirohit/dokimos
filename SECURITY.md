# Security

This repository is a **demonstration / prototype**. Treat it as **unsafe for production** unless you complete the hardening steps below.

## Before making the repository public

1. **Never commit secrets**  
   Confirm tracked files contain no real mnemonics, API keys, OAuth client secrets, or `NEXTAUTH_SECRET` values:
   - `.env`, `.env.local`, and `*.pem` are listed in `.gitignore`.
   - Run `git ls-files` and search for accidental check-ins of env files or keys.

2. **Rotate anything that was ever exposed**  
   If a test mnemonic, Google OAuth secret, or JWT secret was committed or shared, **rotate** it before any mainnet or real user data.

3. **Backend signing key (`MNEMONIC`)**  
   The Fastify server derives an Ethereum signer from `MNEMONIC`. Protect this like a hot wallet key. Use a dedicated key for demos, not a funded personal wallet.

## Demo limitations (by design)

| Area | Risk | Notes |
|------|------|--------|
| **In-memory auth** | Passwords stored in plaintext in process memory | Replace with a real user store and password hashing (e.g. Argon2). |
| **Verifier dashboard** | Session is `localStorage`-only | Trivial to forge in devtools; not server-side auth. |
| **TEE quotes** | Mock / demo | Not verifiable against Intel DCAP or Eigen AVS until wired to real infrastructure. |
| **CORS** | Allowlist via `CORS_ORIGINS` | Defaults to common localhost ports; set explicitly for deployment. |
| **`/health`** | Does not expose the signer address by default | Set `EXPOSE_SIGNER_ADDRESS=true` only if you intend to publish it. |

## Environment variables

See `.env.example` (root) and `dokimos-app-v2/.env.example` for variables including:

- **`CORS_ORIGINS`** — Comma-separated list of browser origins allowed to call the Fastify API (cross-origin). Defaults are localhost-only.
- **`DEBUG_OCR`** — Set to `true` only when debugging; logs OCR-derived content and **must not** be enabled in production (PII).
- **`EXPOSE_SIGNER_ADDRESS`** — Set to `true` to include the wallet address in `GET /health`.
- **`NEXTAUTH_SECRET`** — Required for production NextAuth deployments; generate with `openssl rand -base64 32`.
- **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`** — Required for real Google sign-in; development uses non-functional placeholders when unset.

## Reporting issues

If you discover a security vulnerability, please report it responsibly (e.g. private channel to maintainers) rather than a public issue, until it can be addressed.
