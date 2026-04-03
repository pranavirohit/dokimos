/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dokimos: {
          navy: "#0F1B4C",
          canvas: "#FAFAF9",
        },
        /** Linear dark marketing / app tokens (verifier dashboard) */
        vl: {
          canvas: "#08090a",
          surface: "#0f1011",
          elevated: "#1c1c1f",
          tertiary: "#232326",
          border: "#23252a",
          ink: "#f7f8f8",
          muted: "#d0d6e0",
          subtle: "#8a8f98",
          faint: "#62666d",
          accent: "#5e6ad2",
          "accent-hover": "#828fff",
          green: "#27a644",
          amber: "#f0bf00",
          red: "#eb5757",
          panel: "#141516",
        },
      },
      boxShadow: {
        "vl-card": "0 2px 4px 0 rgba(0, 0, 0, 0.4)",
        "vl-low": "0px 2px 4px rgba(0, 0, 0, 0.1)",
        "vl-high": "0px 7px 32px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        sans: ["Instrument Sans", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        verifier: ["var(--font-verifier-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
