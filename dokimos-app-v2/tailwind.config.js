/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dokimos: {
          navy: "#0F1B4C",
          /** Consumer canvas — warm gray */
          canvas: "#F9FAFB",
          /** Shared core black */
          core: "#1A1A1A",
          /** Verifier shell */
          verifierCanvas: "#F5F5F5",
          verifierCode: "#F8F9FA",
          /** Technical accent (links, status, focus) */
          verifierAccent: "#6366F1",
          verifierAccentHover: "#4F46E5",
          /** Consumer vs verifier success greens */
          successWarm: "#059669",
          successCool: "#10B981",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-geist-mono)",
          "ui-monospace",
          "monospace",
        ],
        serif: [
          "var(--font-instrument-serif)",
          "Instrument Serif",
          "Georgia",
          "serif",
        ],
      },
    },
  },
  plugins: [],
}
