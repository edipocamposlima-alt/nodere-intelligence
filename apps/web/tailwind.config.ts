import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        panel: "var(--color-panel)",
        line: "var(--color-line)",
        electric: "var(--nodere-primary)",
        cyan: "var(--color-cyan)",
        success: "#16c784",
        warning: "#f4b740",
        danger: "#ff5a6a"
      },
      boxShadow: {
        glow: "0 0 38px rgba(29, 124, 255, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
