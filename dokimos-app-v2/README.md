# Dokimos Frontend

Beautiful mobile-first identity verification interface connected to TEE backend.

## Quick Start

```bash
cd dokimos-app-v2
npm install
npm run dev
```

The dev server runs on **port 8081** (see `package.json`).

- App home: [http://localhost:8081](http://localhost:8081)
- **Verifier login:** [http://localhost:8081/verifier/login](http://localhost:8081/verifier/login)
- **Verifier dashboard:** [http://localhost:8081/verifier/dashboard](http://localhost:8081/verifier/dashboard)

Run the Fastify API separately from the repo root (`npm run dev` in `dokimos-tee`, default **http://localhost:8080**). Point the frontend at it:

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```env
TEE_ENDPOINT=http://localhost:8080
```

Use your deployed API URL in production (example below is illustrative only):

```env
# TEE_ENDPOINT=https://your-api.example.com
```

## Troubleshooting

**Dev server errors / “Cannot find module” / 500 on every route:**  
Stale `.next` cache. From `dokimos-app-v2`:

```bash
rm -rf .next
npm run dev
```

On Windows PowerShell: `Remove-Item -Recurse -Force .next` then `npm run dev`.

## Features

- 9-screen animated flow
- Real TEE backend integration
- File upload with validation (JPG/PNG/WebP, max 10MB)
- Liveness check simulation
- Cryptographic attestation display
- Verifier dashboard + “Verify This Check” wizard
- Responsive design (mobile + desktop preview)

## Deploy to Vercel

```bash
vercel --prod
```

Set `TEE_ENDPOINT` (and other secrets) in the Vercel project settings.
