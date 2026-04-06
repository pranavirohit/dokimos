# Dokimos App v2 (`dokimos-app-v2`)

Beautiful **mobile-first** identity verification UI: a **Next.js 14** app that talks to the **Fastify TEE backend** in the parent repo. The browser only talks to this Next.js origin; server-side **API routes** proxy to `TEE_ENDPOINT` so the TEE URL and keys stay off the client.

## What’s in this folder

| Area | Purpose |
|------|--------|
| `src/app/page.tsx` | Home: **marketing landing** (`DokimosLanding`). |
| `src/components/DokimosFlow.tsx` | Consumer flow: intro, ID upload, liveness sim, vault, share/receipt, request history (used from `/onboarding`, `/app/vault`, etc.). |
| `src/app/business/page.tsx` | Business / verifier demo dashboard (offline demo data, no login). |
| `src/app/integration/page.tsx` | Integration / developer-oriented page. |
| `src/app/api/*` | BFF routes: forward to Fastify (`/verify`, auth, requests, etc.). |
| `src/lib/authOptions.ts` | NextAuth (Google); on sign-in, registers the user with the TEE `/api/auth/user/signup`. |

## Stack

- **Next.js** (App Router), **React 18**, **TypeScript**
- **Tailwind CSS**, **Framer Motion** (screen transitions)
- **NextAuth** + Google OAuth (end-user sign-in)
- **Axios** for API calls from route handlers and client to same-origin `/api/*`

## Quick start

```bash
cd dokimos-app-v2
npm install
npm run dev
```

Dev server: **http://localhost:8081** (`next dev -p 8081`).

Run the **TEE API** from the **repository root** (not this folder):

```bash
cd ..   # dokimos-tee root
npm run dev
```

Default TEE URL: **http://localhost:8080** (`PORT` in Fastify, see `src/index.ts` in the root).

Copy `.env.example` → `.env.local` and set `TEE_ENDPOINT` to match your running Fastify instance.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TEE_ENDPOINT` | Yes (for real flows) | Base URL of the Fastify backend (e.g. `http://localhost:8080`). |
| `NEXTAUTH_URL` | Production | Public URL of this Next app (e.g. `http://localhost:8081` locally). |
| `NEXTAUTH_SECRET` | Production | Secret for NextAuth session encryption. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For Google sign-in | OAuth credentials from Google Cloud Console. |
| `EIGEN_APP_ID` | Optional | Overrides default Eigen app id for `/api/verify-attestation`. |

See `.env.example` for copy-paste templates.

## Routes (pages)

| Path | Audience |
|------|----------|
| `/` | **Marketing** — landing page (Plaid-style hero, product sections). |
| `/onboarding` | **End users** — start identity onboarding (leads into upload / liveness / vault). |
| `/app/vault`, `/app/requests`, … | **Signed-in / demo app shell** — vault, activity, settings. |
| `/business` | Business verifier dashboard demo (Overview, Verifications, Programs). |
| `/integration` | Integration / product docs style page. |

## API routes (BFF → TEE)

Client code calls **same-origin** `/api/...`; route handlers use `TEE_ENDPOINT` to reach Fastify.

| Next.js route | Role |
|---------------|------|
| `POST /api/verify` | ID image → TEE verification / attestation. |
| `POST /api/request-verification` | Create a verification request (user ↔ verifier). |
| `POST /api/approve-request` | Approve or deny a pending request. |
| `GET /api/requests/user/[email]` | List requests for a user. |
| `GET /api/requests/verifier/[id]` | List requests for a verifier. |
| `POST /api/auth/verifier/login` / `.../signup` | Verifier auth against TEE. |
| `POST /api/verify-attestation` | Attestation verification helper (uses shared logic + optional `EIGEN_APP_ID`). |
| `GET/POST /api/auth/[...nextauth]` | NextAuth (Google). |

## User flow (high level)

1. **`/`** — Marketing landing; CTAs go to **`/onboarding`** (individuals) or **`/business`** (verifier demo).
2. **Onboarding (`/onboarding`)** — Linear flow: intro screens → upload → liveness → TEE verify → **`/app/vault`**.
3. **Google sign-in** — Optional; authenticated users may skip parts of intro depending on session.
4. **Vault / requests** — `POST /api/verify` to the TEE; pending requests from `GET /api/requests/user/...`; approve/deny via `POST /api/approve-request`.

Some **DokimosFlow** screens still use a **phone-sized frame** on desktop in certain paths; the **app shell** under `/app/*` is full-width responsive.

## Deploy (e.g. Vercel)

```bash
vercel --prod
```

Set **`TEE_ENDPOINT`** and **NextAuth** / **Google** secrets in the hosting project’s environment. Do not expose the TEE URL to the client as a public build-time variable unless you intend to; the app is designed to call the TEE **only from server routes**.

## Troubleshooting

**500s or “Cannot find module” after pulls:** clear the Next cache and restart.

```bash
# Unix
rm -rf .next && npm run dev
```

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force .next; npm run dev
```

## Features (summary)

- 9-screen animated end-user flow  
- TEE-backed verification and attestation display  
- File upload validation (JPG/PNG/WebP, size limits)  
- Liveness simulation  
- Verifier dashboard and verification wizard  
- Responsive: mobile viewport + desktop mockup frame  
