# Dokimos Flow - Interactive Prototype

A working React prototype of the Dokimos identity verification flow with animation sequence.

## What's Included

- **Animation Sequence (3 states):**
  - 01A: Problem state ("Again?") with dark navy background
  - 01B: Transition state ("Meet Dokimos.")
  - 01C: Final CTA with bottom sheet

- **App Flow (5 screens):**
  - 02: Upload your ID
  - 03: Vault Dashboard
  - 04: Share approval modal
  - 05: Verification receipt
  - 06: History/Activity log

## Running the Prototype

The dev server is already running at **http://localhost:3000**

If you need to restart it:

```bash
npm run dev
```

## Features

- Full animation sequence with Framer Motion
- Scrolling pill animations across all states
- Interactive navigation (Back/Next buttons on the side for testing)
- All 8 screens with proper transitions
- Exact styling from your Pencil designs
- Instrument Serif for headlines, Instrument Sans for body text

## How to Use

1. Open http://localhost:3000 in your browser
2. Watch the animation sequence play automatically
3. Click "Sign up" to enter the main flow
4. Use the navigation controls on the right to move between screens
5. Click "Share" on "Age Over 21" in Screen 3 to trigger the approval modal

## Demo Flow for Gaj/Soubhik

1. Load the page → animation plays automatically
2. Click "Sign up" → enters upload flow
3. Select document type → upload simulation
4. View vault dashboard → shows verified attributes
5. Click "Share" → approval modal appears
6. Approve → shows verification receipt with Etherscan/EigenCloud links

## Tech Stack

- Next.js 14 (React 18)
- TypeScript
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)

## Deploy to Vercel

To deploy and share with Gaj/Soubhik:

1. Push to GitHub
2. Import to Vercel
3. Deploy → get instant live URL

You'll have a real URL like `dokimos-demo.vercel.app` to share.
