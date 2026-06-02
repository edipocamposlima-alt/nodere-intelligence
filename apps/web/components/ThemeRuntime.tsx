"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nodere_settings";

const themePresets: Record<string, { primary: string; cyan: string; panel: string; ink: string; line: string }> = {
  "Nodere Azul": { primary: "#1E6FDB", cyan: "#42D7FF", panel: "#0B1220", ink: "#050914", line: "#18243A" },
  "Azul executivo": { primary: "#2563EB", cyan: "#06B6D4", panel: "#0D1B2A", ink: "#050A14", line: "#1D3557" },
  "Executivo Escuro": { primary: "#2DD4BF", cyan: "#38BDF8", panel: "#0D1624", ink: "#040812", line: "#223047" },
  "Verde Performance": { primary: "#16C784", cyan: "#22D3EE", panel: "#071B18", ink: "#04100E", line: "#174239" },
  "Verde comercial": { primary: "#10B981", cyan: "#2DD4BF", panel: "#06251F", ink: "#03110E", line: "#14532D" },
  "Roxo SaaS": { primary: "#8B5CF6", cyan: "#38BDF8", panel: "#111029", ink: "#070716", line: "#2B2852" },
  "Roxo tecnológico": { primary: "#A855F7", cyan: "#60A5FA", panel: "#17102A", ink: "#080512", line: "#3B2463" },
  "Laranja performance": { primary: "#F97316", cyan: "#22D3EE", panel: "#1F1307", ink: "#0F0803", line: "#7C2D12" },
  "Vermelho conversão": { primary: "#EF4444", cyan: "#F97316", panel: "#220A0A", ink: "#100303", line: "#7F1D1D" },
  "Magenta premium": { primary: "#EC4899", cyan: "#A78BFA", panel: "#201020", ink: "#100712", line: "#831843" },
  "Ciano neon": { primary: "#06B6D4", cyan: "#67E8F9", panel: "#061D24", ink: "#031014", line: "#155E75" },
  "Grafite claro": { primary: "#334155", cyan: "#2563EB", panel: "#FFFFFF", ink: "#F1F5F9", line: "#CBD5E1" },
  "Alto contraste": { primary: "#FACC15", cyan: "#00E5FF", panel: "#000000", ink: "#000000", line: "#FFFFFF" }
};

type StoredSettings = {
  theme?: string;
  colorPrimary?: string;
  mode?: "dark" | "light";
  fontFamily?: string;
  layoutDensity?: "compact" | "comfortable" | "executive" | "large";
  cardStyle?: "cards" | "list" | "glass" | "solid";
};

function applyStoredTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const settings = saved ? (JSON.parse(saved) as StoredSettings) : {};
  const preset = themePresets[settings.theme || "Nodere Azul"] || themePresets["Nodere Azul"];
  const root = document.documentElement;

  root.style.setProperty("--nodere-primary", settings.colorPrimary || preset.primary);
  root.style.setProperty("--color-cyan", preset.cyan);
  root.style.setProperty("--color-panel", settings.mode === "light" ? "#FFFFFF" : preset.panel);
  root.style.setProperty("--color-ink", settings.mode === "light" ? "#F6F8FC" : preset.ink);
  root.style.setProperty("--color-line", settings.mode === "light" ? "#D9E2EF" : preset.line);
  root.dataset.theme = settings.mode || "dark";
  root.dataset.density = settings.layoutDensity || "compact";
  root.dataset.cardStyle = settings.cardStyle || "cards";
  const font = settings.fontFamily === "System default" ? "system-ui" : settings.fontFamily || "Inter";
  document.body.style.fontFamily = `${font}, Inter, system-ui, sans-serif`;
}

export function ThemeRuntime() {
  useEffect(() => {
    try {
      applyStoredTheme();
      window.addEventListener("storage", applyStoredTheme);
      window.addEventListener("nodere:theme-change", applyStoredTheme);
      return () => {
        window.removeEventListener("storage", applyStoredTheme);
        window.removeEventListener("nodere:theme-change", applyStoredTheme);
      };
    } catch {
      return undefined;
    }
  }, []);

  return null;
}
