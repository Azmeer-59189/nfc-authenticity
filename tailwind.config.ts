import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",
        paper: "#F6F5F1",
        panel: "#1B2327",
        verify: "#1F7A5C",
        "verify-soft": "#E4F0EA",
        alert: "#B3432B",
        "alert-soft": "#F6E7E2",
        foil: "#9AA5A1",
        gold: "#B8965A",
        line: "#DAD5C9",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        seal: "0 0 0 1px rgba(184,150,90,0.35), 0 12px 30px -12px rgba(18,24,27,0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
