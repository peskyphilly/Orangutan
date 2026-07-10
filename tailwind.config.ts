import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#0D0E0D",
        panel: "#131513",
        white: "#F8F7F4",
        card: "#FFFFFF",
        gold: "#B18F55",
        "gold-soft": "#C6A76E",
        ink: "#181917",
        grey: "#6B6962",
        "light-line": "#E6E3DB",
        "dark-line": "rgba(248,247,244,0.10)",
        dim: "#A3A096",
      },
      fontFamily: {
        display: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        body: ["var(--font-figtree)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 420ms cubic-bezier(0.2, 0.6, 0.2, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
