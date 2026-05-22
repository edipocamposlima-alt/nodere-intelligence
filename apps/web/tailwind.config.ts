import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050914",
        panel: "#0b1220",
        line: "#18243a",
        electric: "#1d7cff",
        cyan: "#42d7ff",
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
