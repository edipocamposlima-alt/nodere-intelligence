import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#03624C",
          hover: "#0A7A5F",
          active: "#024A39",
          mid: "#2A9D6A",
          glow: "#00DF82",
          "glow-soft": "#19F5A1",
          black: "#050D14"
        },
        "bg-main": "var(--bg-main)",
        "bg-sidebar": "var(--bg-sidebar)",
        "bg-card": "var(--bg-card)",
        "bg-modal": "var(--bg-modal)",
        "bg-hover": "var(--bg-hover)",
        "border-default": "var(--border)",
        "text-pri": "var(--text-primary)",
        "text-sec": "var(--text-secondary)",
        "text-mut": "var(--text-muted)",
        ink: "var(--color-ink)",
        panel: "var(--color-panel)",
        line: "var(--color-line)",
        electric: "var(--nodere-primary)",
        cyan: "var(--color-cyan)",
        success: "#16c784",
        warning: "#f4b740",
        danger: "#ff5a6a"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"]
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "20px",
        "2xl": "28px"
      },
      boxShadow: {
        card: "0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.25)",
        modal: "0 8px 48px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(0,223,130,0.20)",
        "glow-sm": "0 0 12px rgba(0,223,130,0.15)",
        brand: "0 4px 16px rgba(3,98,76,0.30)"
      },
      animation: {
        "fade-in": "fadeIn 200ms ease",
        "slide-up": "slideUp 200ms ease",
        "ai-pulse": "ai-pulse 2s ease infinite",
        "spin-fast": "spin 0.6s linear infinite"
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "ai-pulse": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.4" } }
      }
    }
  },
  plugins: []
};

export default config;
