# Dokimos Frontend

Beautiful mobile-first identity verification interface connected to TEE backend.

## Quick Start

```bash
cd dokimos-app-v2
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

```
TEE_ENDPOINT=http://34.34.75.130:8080
```

## Features

- 9-screen animated flow
- Real TEE backend integration
- File upload with validation (JPG/PNG/WebP, max 10MB)
- Liveness check simulation
- Cryptographic attestation display
- Responsive design (mobile + desktop preview)

## Deploy to Vercel

```bash
vercel --prod
```

Set environment variable in Vercel dashboard:
- `TEE_ENDPOINT` = `http://34.34.75.130:8080`
