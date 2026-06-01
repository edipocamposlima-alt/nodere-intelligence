"use client";

import { useEffect } from "react";

const STORAGE_KEY = "nodere_settings";

const themePresets: Record<string, { primary: string; cyan: string; panel: string; ink: string; line: string }> = {
  "Nodere Azul": { primary: "#1E6FDB", cyan: "#42D7FF", panel: "#0B1220", ink: "#050914", line: "#18243A" },
  "Executivo Escuro": { primary: "#2DD4BF", cyan: "#38BDF8", panel: "#0D1624", ink: "#040812", line: "#223047" },
  "Verde Performance": { primary: "#16C784", cyan: "#22D3EE", panel: "#071B18", ink: "#04100E", line: "#174239" },
  "Roxo SaaS": { primary: "#8B5CF6", cyan: "#38BDF8", panel: "#111029", ink: "#070716", line: "#2B2852" }
};

type StoredSettings = {
  theme?: string;
  colorPrimary?: string;
  mode?: "dark" | "light";
  fontFamily?: string;
  layoutDensity?: "compact" | "comfortable";
  cardStyle?: "cards" | "list";
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
  document.body.style.fontFamily = `${settings.fontFamily || "Inter"}, Inter, system-ui, sans-serif`;
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
